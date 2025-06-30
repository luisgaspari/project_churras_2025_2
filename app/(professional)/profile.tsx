import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import {
  Text,
  Card,
  Button,
  List,
  Avatar,
  Chip,
  ActivityIndicator,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { spacing, theme } from '@/constants/theme';
import {
  ChefHat,
  Phone,
  Mail,
  MapPin,
  Settings,
  LogOut,
  Camera,
  Plus,
  Star,
  Trash2,
} from 'lucide-react-native';

interface Photo {
  id: string;
  url: string;
  path: string;
}

export default function ProfessionalProfileScreen() {
  const { profile, signOut, session, refreshProfile } = useAuth();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    if (profile?.id) {
      fetchPhotos();
    }
  }, [profile?.id]);

  const fetchPhotos = async () => {
    if (!profile?.id) return;

    const { data, error } = await supabase
      .from('professional_photos')
      .select('id, photo_url')
      .eq('professional_id', profile.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar fotos:', error);
      Alert.alert('Erro', 'Não foi possível carregar as fotos.');
    } else {
      const formattedPhotos = data.map((p) => {
        const url = `${p.photo_url}?t=${new Date().getTime()}`;
        const path = p.photo_url.substring(p.photo_url.lastIndexOf('/') + 1);
        return { id: p.id, url, path };
      });
      setPhotos(formattedPhotos);
    }
  };

  const handleAddPhoto = async (source: 'camera' | 'gallery') => {
    let result;
    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    };

    try {
      if (source === 'camera') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            'Permissão necessária',
            'É necessário permitir o acesso à câmera para tirar uma foto.'
          );
          return;
        }
        result = await ImagePicker.launchCameraAsync(options);
      } else {
        const { status } =
          await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            'Permissão necessária',
            'É necessário permitir o acesso à galeria para escolher uma foto.'
          );
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync(options);
      }

      if (result.canceled) {
        return;
      }

      const asset = result.assets[0];
      const fileSize = asset.fileSize || 0;

      if (fileSize > 50 * 1024 * 1024) {
        Alert.alert(
          'Arquivo muito grande',
          'O tamanho da imagem não pode exceder 50MB.'
        );
        return;
      }

      await uploadPhoto(asset.uri);
    } catch (error) {
      console.error('Erro ao selecionar imagem:', error);
      Alert.alert('Erro', 'Não foi possível selecionar a imagem.');
    }
  };

  const showAddPhotoOptions = () => {
    Alert.alert(
      'Adicionar Foto',
      'Escolha uma opção para adicionar uma nova foto:',
      [
        {
          text: 'Tirar foto',
          onPress: () => handleAddPhoto('camera'),
        },
        {
          text: 'Escolher da Galeria',
          onPress: () => handleAddPhoto('gallery'),
        },
        {
          text: 'Cancelar',
          style: 'cancel',
        },
      ]
    );
  };

  const uploadPhoto = async (uri: string) => {
    if (!session?.user) return;
    setUploading(true);

    try {
      const fileExt = uri.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${session.user.id}/${new Date().getTime()}.${fileExt}`;

      const formData = new FormData();
      formData.append('file', {
        uri,
        name: fileName,
        type: `image/${fileExt}`,
      } as any);

      const { error: uploadError } = await supabase.storage
        .from('professional_photos')
        .upload(fileName, formData, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data: publicUrlData } = supabase.storage
        .from('professional_photos')
        .getPublicUrl(fileName);

      if (!publicUrlData) {
        throw new Error('Não foi possível obter a URL da foto.');
      }

      const { error: dbError } = await supabase
        .from('professional_photos')
        .insert({
          professional_id: session.user.id,
          photo_url: publicUrlData.publicUrl,
        });

      if (dbError) {
        throw dbError;
      }

      Alert.alert('Sucesso', 'Foto adicionada!');
      fetchPhotos();
    } catch (error: any) {
      console.error('Erro ao enviar foto:', error);
      Alert.alert('Erro', error.message || 'Não foi possível enviar a foto.');
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePhoto = async (photo: Photo) => {
    Alert.alert(
      'Excluir Foto',
      'Tem certeza que deseja excluir esta foto? Esta ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              // Delete from storage
              const photoPath = photo.url.split('/professional_photos/')[1].split('?')[0];

              // Delete from storage
              const { error: storageError } = await supabase.storage
                .from('professional_photos')
                .remove([photoPath]);

              if (storageError) {
                throw storageError;
              }

              // Delete from database
              const { error: dbError } = await supabase
                .from('professional_photos')
                .delete()
                .eq('id', photo.id);

              if (dbError) {
                throw dbError;
              }

              Alert.alert('Sucesso', 'Foto excluída!');
              setPhotos(photos.filter((p) => p.id !== photo.id));
            } catch (error: any) {
              console.error('Erro ao excluir foto:', error);
              Alert.alert(
                'Erro',
                error.message || 'Não foi possível excluir a foto.'
              );
            }
          },
        },
      ]
    );
  };

  const handleUpdateAvatar = async (source: 'camera' | 'gallery') => {
    let result;
    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    };

    try {
      if (source === 'camera') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            'Permissão necessária',
            'É necessário permitir o acesso à câmera para tirar uma foto.'
          );
          return;
        }
        result = await ImagePicker.launchCameraAsync(options);
      } else {
        const { status } =
          await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            'Permissão necessária',
            'É necessário permitir o acesso à galeria para escolher uma foto.'
          );
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync(options);
      }

      if (result.canceled) {
        return;
      }

      const asset = result.assets[0];
      const fileSize = asset.fileSize || 0;

      if (fileSize > 50 * 1024 * 1024) {
        Alert.alert(
          'Arquivo muito grande',
          'O tamanho da imagem não pode exceder 50MB.'
        );
        return;
      }

      await uploadAvatar(asset.uri);
    } catch (error) {
      console.error('Erro ao selecionar imagem:', error);
      Alert.alert('Erro', 'Não foi possível selecionar a imagem.');
    }
  };

  const uploadAvatar = async (uri: string) => {
    if (!session?.user) return;
    setUploadingAvatar(true);

    try {
      const fileExt = uri.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${session.user.id}.${fileExt}`;

      const formData = new FormData();
      formData.append('file', {
        uri,
        name: fileName,
        type: `image/${fileExt}`,
      } as any);

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, formData, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) {
        throw uploadError;
      }

      // We need to wait a bit for the CDN to update
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const { data: publicUrlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      if (!publicUrlData) {
        throw new Error('Não foi possível obter a URL pública do avatar.');
      }

      const finalUrl = `${publicUrlData.publicUrl}?t=${new Date().getTime()}`;

      const { error: dbError } = await supabase
        .from('profiles')
        .update({ avatar_url: finalUrl })
        .eq('id', session.user.id);

      if (dbError) {
        throw dbError;
      }

      await refreshProfile();
      Alert.alert('Sucesso', 'Avatar atualizado com sucesso!');
    } catch (error: any) {
      console.error('Erro ao fazer upload do avatar:', error);
      Alert.alert(
        'Erro',
        error.message || 'Não foi possível atualizar o avatar.'
      );
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleAvatarPress = () => {
    Alert.alert(
      'Alterar foto do perfil',
      'Escolha uma opção para alterar seu avatar:',
      [
        {
          text: 'Tirar foto',
          onPress: () => handleUpdateAvatar('camera'),
        },
        {
          text: 'Escolher da Galeria',
          onPress: () => handleUpdateAvatar('gallery'),
        },
        {
          text: 'Cancelar',
          style: 'cancel',
        },
      ]
    );
  };

  const handleSignOut = async () => {
    Alert.alert('Sair da conta', 'Tem certeza que deseja sair?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut();
            router.replace('/');
          } catch (error) {
            Alert.alert('Erro', 'Não foi possível sair da conta');
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text variant="headlineMedium" style={styles.title}>
            Meu Perfil
          </Text>
        </View>

        {/* Profile Info */}
        <Card style={styles.profileCard}>
          <Card.Content style={styles.profileContent}>
            <TouchableOpacity
              onPress={handleAvatarPress}
              disabled={uploadingAvatar}
            >
              {profile?.avatar_url ? (
                <Avatar.Image
                  size={80}
                  source={{ uri: profile.avatar_url }}
                  style={styles.avatar}
                />
              ) : (
                <Avatar.Text
                  size={80}
                  label={profile?.full_name?.charAt(0).toUpperCase() || 'C'}
                  style={styles.avatar}
                />
              )}
              <View style={styles.avatarEditContainer}>
                {uploadingAvatar ? (
                  <ActivityIndicator color={theme.colors.onPrimary} />
                ) : (
                  <Camera
                    size={16}
                    color={theme.colors.onPrimary}
                    style={styles.avatarEditIcon}
                  />
                )}
              </View>
            </TouchableOpacity>
            <View style={styles.profileInfo}>
              <Text variant="headlineSmall" style={styles.userName}>
                {profile?.full_name || 'Churrasqueiro'}
              </Text>
              <View style={styles.userTypeContainer}>
                <ChefHat size={16} color={theme.colors.primary} />
                <Text variant="bodyMedium" style={styles.userType}>
                  Churrasqueiro Profissional
                </Text>
              </View>
              <View style={styles.ratingContainer}>
                <Star size={16} color={theme.colors.tertiary} />
                <Text variant="bodyMedium" style={styles.rating}>
                  4.8 • 124 avaliações
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <Card style={styles.statCard}>
            <Card.Content style={styles.statContent}>
              <Text variant="bodySmall" style={styles.statLabel}>
                {' '}
              </Text>
              <Text variant="headlineMedium" style={styles.statNumber}>
                87
              </Text>
              <Text variant="bodySmall" style={styles.statLabel}>
                Churrascos
              </Text>
            </Card.Content>
          </Card>

          <Card style={styles.statCard}>
            <Card.Content style={styles.statContent}>
              <Text variant="bodySmall" style={styles.statLabel}>
                R$
              </Text>
              <Text variant="headlineMedium" style={styles.statNumber}>
                12.5k
              </Text>
              <Text variant="bodySmall" style={styles.statLabel}>
                Faturamento
              </Text>
            </Card.Content>
          </Card>

          <Card style={styles.statCard}>
            <Card.Content style={styles.statContent}>
              <Text variant="bodySmall" style={styles.statLabel}>
                {' '}
              </Text>
              <Text variant="headlineMedium" style={styles.statNumber}>
                98%
              </Text>
              <Text variant="bodySmall" style={styles.statLabel}>
                Satisfação
              </Text>
            </Card.Content>
          </Card>
        </View>

        {/* Photos */}
        <Card style={styles.photosCard}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Minhas Fotos
              </Text>
              <Button
                mode="text"
                icon={() => <Plus size={16} color={theme.colors.primary} />}
                onPress={showAddPhotoOptions}
                loading={uploading}
                disabled={uploading}
              >
                Adicionar
              </Button>
            </View>
            {photos.length > 0 ? (
              <FlatList
                data={photos}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <View style={styles.photoContainer}>
                    <Image source={{ uri: item.url }} style={styles.photo} />
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDeletePhoto(item)}
                    >
                      <Trash2 size={18} color={theme.colors.onError} />
                    </TouchableOpacity>
                  </View>
                )}
                contentContainerStyle={styles.photosGrid}
              />
            ) : (
              <View style={styles.emptyPhotosContainer}>
                <Camera
                  size={48}
                  color={theme.colors.onSurfaceDisabled}
                  style={styles.emptyPhotosIcon}
                />
                <Text variant="bodyMedium" style={styles.emptyPhotosText}>
                  Nenhuma foto adicionada ainda.
                </Text>
                <Text variant="bodySmall" style={styles.emptyPhotosSubtext}>
                  Adicione fotos para mostrar seu trabalho!
                </Text>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Services */}
        <Card style={styles.servicesCard}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Meus Serviços
              </Text>
              <Button
                mode="text"
                icon={() => <Plus size={16} color={theme.colors.primary} />}
                onPress={() => {}}
              >
                Adicionar
              </Button>
            </View>

            <View style={styles.servicesGrid}>
              <Chip style={styles.serviceChip}>Churrasco Tradicional</Chip>
              <Chip style={styles.serviceChip}>Churrasco Premium</Chip>
              <Chip style={styles.serviceChip}>Espetinhos</Chip>
            </View>

            <Button
              mode="outlined"
              style={styles.manageButton}
              onPress={() => {}}
            >
              Gerenciar Serviços
            </Button>
          </Card.Content>
        </Card>

        {/* Personal Information */}
        <Card style={styles.infoCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Informações Pessoais
            </Text>

            <View style={styles.infoItem}>
              <Mail size={20} color={theme.colors.onSurfaceVariant} />
              <View style={styles.infoContent}>
                <Text variant="bodySmall" style={styles.infoLabel}>
                  E-mail
                </Text>
                <Text variant="bodyMedium" style={styles.infoValue}>
                  {profile?.email || 'Não informado'}
                </Text>
              </View>
            </View>

            {profile?.phone && (
              <View style={styles.infoItem}>
                <Phone size={20} color={theme.colors.onSurfaceVariant} />
                <View style={styles.infoContent}>
                  <Text variant="bodySmall" style={styles.infoLabel}>
                    Telefone
                  </Text>
                  <Text variant="bodyMedium" style={styles.infoValue}>
                    {profile.phone}
                  </Text>
                </View>
              </View>
            )}

            {profile?.location && (
              <View style={styles.infoItem}>
                <MapPin size={20} color={theme.colors.onSurfaceVariant} />
                <View style={styles.infoContent}>
                  <Text variant="bodySmall" style={styles.infoLabel}>
                    Localização
                  </Text>
                  <Text variant="bodyMedium" style={styles.infoValue}>
                    {profile.location}
                  </Text>
                </View>
              </View>
            )}

            <View style={styles.profileButtons}>
              <Button
                mode="outlined"
                style={styles.profileButton}
                icon={() => <Camera size={16} color={theme.colors.primary} />}
                onPress={showAddPhotoOptions}
                loading={uploading}
                disabled={uploading}
              >
                Adicionar Fotos
              </Button>
              <Button
                mode="contained"
                style={styles.profileButton}
                onPress={() => {}}
              >
                Editar Perfil
              </Button>
            </View>
          </Card.Content>
        </Card>

        {/* Menu Options */}
        <Card style={styles.menuCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Configurações
            </Text>

            <List.Item
              title="Configurações da conta"
              description="Privacidade, notificações e preferências"
              left={(props) => (
                <Settings {...props} color={theme.colors.onSurface} />
              )}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => {}}
              style={styles.menuItem}
            />

            <List.Item
              title="Sair da conta"
              description="Fazer logout do aplicativo"
              left={(props) => <LogOut {...props} color={theme.colors.error} />}
              onPress={handleSignOut}
              style={styles.menuItem}
              titleStyle={{ color: theme.colors.error }}
            />
          </Card.Content>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
  },
  header: {
    padding: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: {
    fontWeight: 'bold',
    color: theme.colors.onBackground,
  },
  profileCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    elevation: 2,
  },
  profileContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
  },
  avatar: {
    backgroundColor: theme.colors.primary,
  },
  avatarEditContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    padding: spacing.xs,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarEditIcon: {},
  profileInfo: {
    marginLeft: spacing.lg,
    flex: 1,
  },
  userName: {
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    marginBottom: spacing.xs,
  },
  userTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  userType: {
    marginLeft: spacing.xs,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    marginLeft: spacing.xs,
    color: theme.colors.onSurfaceVariant,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    elevation: 2,
  },
  statContent: {
    alignItems: 'center',
    padding: spacing.md,
  },
  statNumber: {
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: spacing.xs,
  },
  statLabel: {
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
  },
  photosCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    elevation: 2,
  },
  photosGrid: {
    gap: spacing.sm,
  },
  photoContainer: {
    position: 'relative',
  },
  photo: {
    width: 120,
    height: 90,
    borderRadius: theme.roundness,
    backgroundColor: theme.colors.surfaceVariant,
  },
  deleteButton: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: spacing.xs,
    borderRadius: 20,
  },
  emptyPhotosContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: theme.roundness,
  },
  emptyPhotosIcon: {
    marginBottom: spacing.md,
  },
  emptyPhotosText: {
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    marginBottom: spacing.xs,
  },
  emptyPhotosSubtext: {
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
  },
  servicesCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontWeight: 'bold',
    color: theme.colors.onSurface,
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  serviceChip: {
    backgroundColor: theme.colors.primaryContainer,
  },
  manageButton: {
    marginTop: spacing.sm,
  },
  infoCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    elevation: 2,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  infoContent: {
    marginLeft: spacing.md,
    flex: 1,
  },
  infoLabel: {
    color: theme.colors.onSurfaceVariant,
    marginBottom: spacing.xs,
  },
  infoValue: {
    color: theme.colors.onSurface,
  },
  profileButtons: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  profileButton: {
    flex: 1,
  },
  menuCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    elevation: 2,
  },
  menuItem: {
    paddingVertical: spacing.sm,
  },
});
