import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { Button, Text, Card } from 'react-native-paper';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { spacing, theme } from '@/constants/theme';
import { ChefHat, Users } from 'lucide-react-native';

export default function WelcomeScreen() {
  const { profile, loading } = useAuth();

  // Redirect if user is already logged in
  React.useEffect(() => {
    if (!loading && profile) {
      if (profile.user_type === 'client') {
        router.replace('/(client)');
      } else {
        router.replace('/(professional)');
      }
    }
  }, [profile, loading]);

  const handleUserTypeSelection = (userType: 'client' | 'professional') => {
    router.push({
      pathname: '/auth',
      params: { userType },
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Carregando...</Text>
      </View>
    );
  }

  return (
    <LinearGradient
      colors={[theme.colors.primary, theme.colors.secondary]}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Image
              // source={{
              //   uri: 'https://images.pexels.com/photos/5175533/pexels-photo-5175533.jpeg?auto=compress&cs=tinysrgb&w=400',
              // }}
              // style={styles.heroImage}
              source={require('../assets/images/logo.png')}
              style={styles.image}
            />
            {/* <Text variant="headlineLarge" style={styles.title}>
              ChurrasJa
            </Text> */}
            <Text variant="titleMedium" style={styles.subtitle}>
              O melhor churrasco na palma da sua mão
            </Text>
          </View>

          {/* User Type Selection */}
          <View style={styles.selectionContainer}>
            <Text variant="headlineSmall" style={styles.selectionTitle}>
              Como você quer começar?
            </Text>

            <Card
              style={styles.userTypeCard}
              onPress={() => handleUserTypeSelection('client')}
            >
              <Card.Content style={styles.cardContent}>
                <Users size={48} color={theme.colors.primary} />
                <Text variant="headlineSmall" style={styles.cardTitle}>
                  Sou Cliente
                </Text>
                <Text variant="bodyMedium" style={styles.cardDescription}>
                  Quero contratar um churrasqueiro para meu evento
                </Text>
              </Card.Content>
            </Card>

            <Card
              style={styles.userTypeCard}
              onPress={() => handleUserTypeSelection('professional')}
            >
              <Card.Content style={styles.cardContent}>
                <ChefHat size={48} color={theme.colors.primary} />
                <Text variant="headlineSmall" style={styles.cardTitle}>
                  Sou Churrasqueiro
                </Text>
                <Text variant="bodyMedium" style={styles.cardDescription}>
                  Quero oferecer meus serviços de churrasco
                </Text>
              </Card.Content>
            </Card>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  header: {
    alignItems: 'center',
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xl,
  },
  heroImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: spacing.lg,
  },
  image: {
    width: 200,
    height: 200,
    marginBottom: 8,
  },
  title: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  selectionContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  selectionTitle: {
    color: 'white',
    textAlign: 'center',
    marginBottom: spacing.xl,
    fontWeight: 'bold',
  },
  userTypeCard: {
    marginBottom: spacing.lg,
    elevation: 4,
  },
  cardContent: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  cardTitle: {
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    color: theme.colors.onSurface,
    fontWeight: 'bold',
  },
  cardDescription: {
    textAlign: 'center',
    color: theme.colors.onSurfaceVariant,
  },
});
