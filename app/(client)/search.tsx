import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, Searchbar, Card, Button, Chip } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { spacing, theme } from '@/constants/theme';
import { MapPin, Star, Filter } from 'lucide-react-native';

interface Service {
  id: string;
  title: string;
  description: string;
  price_from: number;
  price_to?: number;
  location: string;
  max_guests: number;
  profiles?: {
    full_name: string;
    avatar_url?: string;
  };
}

export default function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [services, setServices] = useState<Service[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);

  const filters = [
    { key: 'budget', label: 'Até R$ 500' },
    { key: 'premium', label: 'Premium' },
    { key: 'nearby', label: 'Próximo' },
    { key: 'available', label: 'Disponível hoje' },
  ];

  useEffect(() => {
    loadServices();
  }, []);

  useEffect(() => {
    filterServices();
  }, [searchQuery, services, selectedFilters]);

  const loadServices = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('services')
        .select(`
          *,
          profiles (
            full_name,
            avatar_url
          )
        `);

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

  const filterServices = () => {
    let filtered = services;

    // Text search
    if (searchQuery.trim()) {
      filtered = filtered.filter(service =>
        service.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.profiles?.full_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply filters
    if (selectedFilters.includes('budget')) {
      filtered = filtered.filter(service => service.price_from <= 500);
    }

    if (selectedFilters.includes('premium')) {
      filtered = filtered.filter(service => service.price_from >= 800);
    }

    setFilteredServices(filtered);
  };

  const toggleFilter = (filterKey: string) => {
    setSelectedFilters(prev => {
      if (prev.includes(filterKey)) {
        return prev.filter(f => f !== filterKey);
      } else {
        return [...prev, filterKey];
      }
    });
  };

  const formatPrice = (priceFrom: number, priceTo?: number) => {
    if (priceTo && priceTo > priceFrom) {
      return `R$ ${priceFrom} - ${priceTo}`;
    }
    return `A partir de R$ ${priceFrom}`;
  };

  const renderServiceCard = ({ item }: { item: Service }) => (
    <Card style={styles.serviceCard}>
      <Card.Content>
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
          <Text variant="bodySmall" style={styles.guestInfo}>
            Até {item.max_guests} pessoas
          </Text>
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

        <Button
          mode="contained"
          style={styles.contactButton}
          onPress={() => {}}
        >
          Ver detalhes
        </Button>
      </Card.Content>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.title}>
          Buscar Churrasqueiros
        </Text>
      </View>

      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Buscar por localização, especialidade..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
        />

        {/* Filters */}
        <View style={styles.filtersContainer}>
          <View style={styles.filtersHeader}>
            <Filter size={20} color={theme.colors.onSurface} />
            <Text variant="titleSmall" style={styles.filtersTitle}>
              Filtros
            </Text>
          </View>
          <View style={styles.filtersRow}>
            {filters.map((filter) => (
              <Chip
                key={filter.key}
                selected={selectedFilters.includes(filter.key)}
                onPress={() => toggleFilter(filter.key)}
                style={styles.filterChip}
              >
                {filter.label}
              </Chip>
            ))}
          </View>
        </View>
      </View>

      <View style={styles.resultsContainer}>
        <Text variant="titleMedium" style={styles.resultsTitle}>
          {filteredServices.length} churrasqueiro(s) encontrado(s)
        </Text>

        <FlatList
          data={filteredServices}
          renderItem={renderServiceCard}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          refreshing={loading}
          onRefresh={loadServices}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    padding: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: {
    fontWeight: 'bold',
    color: theme.colors.onBackground,
  },
  searchContainer: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  searchbar: {
    marginBottom: spacing.md,
  },
  filtersContainer: {
    marginBottom: spacing.md,
  },
  filtersHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  filtersTitle: {
    marginLeft: spacing.sm,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
  },
  filtersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  filterChip: {
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  resultsContainer: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  resultsTitle: {
    fontWeight: 'bold',
    marginBottom: spacing.md,
    color: theme.colors.onBackground,
  },
  serviceCard: {
    marginBottom: spacing.md,
    elevation: 2,
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
  guestInfo: {
    color: theme.colors.onSurfaceVariant,
  },
  serviceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: spacing.md,
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
  contactButton: {
    marginTop: spacing.sm,
  },
});