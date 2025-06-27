import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Image, FlatList } from 'react-native';
import { Text, Card, Button, Searchbar, Chip } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { spacing, theme } from '@/constants/theme';
import { MapPin, Star, Clock } from 'lucide-react-native';

interface Service {
  id: string;
  title: string;
  description: string;
  price_from: number;
  price_to?: number;
  duration_hours: number;
  max_guests: number;
  location: string;
  images: string[];
  professional_id: string;
  profiles?: {
    full_name: string;
    avatar_url?: string;
  };
}

export default function ClientHomeScreen() {
  const { profile } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { key: 'all', label: 'Todos' },
    { key: 'traditional', label: 'Tradicional' },
    { key: 'premium', label: 'Premium' },
    { key: 'vegetarian', label: 'Vegetariano' },
  ];

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select(`
          *,
          profiles (
            full_name,
            avatar_url
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading services:', error);
      } else {
        setServices(data || []);
      }
    } catch (error) {
      console.error('Error loading services:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (priceFrom: number, priceTo?: number) => {
    if (priceTo && priceTo > priceFrom) {
      return `R$ ${priceFrom} - ${priceTo}`;
    }
    return `A partir de R$ ${priceFrom}`;
  };

  const renderServiceCard = ({ item }: { item: Service }) => (
    <Card style={styles.serviceCard} onPress={() => router.push(`/service/${item.id}`)}>
      <Image
        source={{ 
          uri: item.images?.[0] || 'https://images.pexels.com/photos/1459339/pexels-photo-1459339.jpeg?auto=compress&cs=tinysrgb&w=400'
        }}
        style={styles.serviceImage}
      />
      <Card.Content style={styles.serviceContent}>
        <Text variant="titleMedium" style={styles.serviceTitle}>
          {item.title}
        </Text>
        <Text variant="bodySmall" style={styles.serviceDescription} numberOfLines={2}>
          {item.description}
        </Text>
        
        <View style={styles.serviceInfo}>
          <View style={styles.infoRow}>
            <MapPin size={16} color={theme.colors.onSurfaceVariant} />
            <Text variant="bodySmall" style={styles.infoText}>
              {item.location}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Clock size={16} color={theme.colors.onSurfaceVariant} />
            <Text variant="bodySmall" style={styles.infoText}>
              {item.duration_hours}h • até {item.max_guests} pessoas
            </Text>
          </View>
        </View>

        <View style={styles.serviceFooter}>
          <Text variant="titleMedium" style={styles.servicePrice}>
            {formatPrice(item.price_from, item.price_to)}
          </Text>
          <View style={styles.professionalInfo}>
            <Text variant="bodySmall" style={styles.professionalName}>
              {item.profiles?.full_name}
            </Text>
            <View style={styles.rating}>
              <Star size={14} color={theme.colors.tertiary} />
              <Text variant="bodySmall" style={styles.ratingText}>4.8</Text>
            </View>
          </View>
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text variant="headlineMedium" style={styles.greeting}>
            Olá, {profile?.full_name?.split(' ')[0]}! 👋
          </Text>
          <Text variant="bodyLarge" style={styles.subGreeting}>
            Que tal um churrasco hoje?
          </Text>
        </View>

        {/* Search */}
        <Searchbar
          placeholder="Buscar churrasqueiros..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
        />

        {/* Categories */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesContainer}>
          {categories.map((category) => (
            <Chip
              key={category.key}
              selected={selectedCategory === category.key}
              onPress={() => setSelectedCategory(category.key)}
              style={styles.categoryChip}
            >
              {category.label}
            </Chip>
          ))}
        </ScrollView>

        {/* Featured Section */}
        <View style={styles.section}>
          <Text variant="titleLarge" style={styles.sectionTitle}>
            Churrasqueiros em destaque
          </Text>
          
          {loading ? (
            <Text>Carregando...</Text>
          ) : (
            <FlatList
              data={services}
              renderItem={renderServiceCard}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              scrollEnabled={false}
            />
          )}
        </View>
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
  greeting: {
    fontWeight: 'bold',
    color: theme.colors.onBackground,
    marginBottom: spacing.xs,
  },
  subGreeting: {
    color: theme.colors.onSurfaceVariant,
  },
  searchbar: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  categoriesContainer: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  categoryChip: {
    marginRight: spacing.sm,
  },
  section: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: spacing.md,
    color: theme.colors.onBackground,
  },
  serviceCard: {
    marginBottom: spacing.md,
    elevation: 2,
  },
  serviceImage: {
    width: '100%',
    height: 200,
  },
  serviceContent: {
    padding: spacing.md,
  },
  serviceTitle: {
    fontWeight: 'bold',
    marginBottom: spacing.xs,
    color: theme.colors.onSurface,
  },
  serviceDescription: {
    color: theme.colors.onSurfaceVariant,
    marginBottom: spacing.md,
  },
  serviceInfo: {
    marginBottom: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  infoText: {
    marginLeft: spacing.xs,
    color: theme.colors.onSurfaceVariant,
  },
  serviceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  servicePrice: {
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  professionalInfo: {
    alignItems: 'flex-end',
  },
  professionalName: {
    color: theme.colors.onSurfaceVariant,
    marginBottom: spacing.xs,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    marginLeft: spacing.xs,
    color: theme.colors.onSurfaceVariant,
  },
});