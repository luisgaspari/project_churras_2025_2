import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, Card, Button, Chip, FAB } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { spacing, theme } from '@/constants/theme';
import { Calendar, Clock, MapPin, User, Phone, Plus } from 'lucide-react-native';

interface Booking {
  id: string;
  event_date: string;
  event_time: string;
  guests_count: number;
  location: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  total_price: number;
  notes?: string;
  services?: {
    title: string;
    duration_hours: number;
  };
  profiles?: {
    full_name: string;
    phone?: string;
    email: string;
  };
}

export default function ProfessionalBookingsScreen() {
  const { profile } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'confirmed' | 'all'>('pending');

  useEffect(() => {
    if (profile) {
      loadBookings();
    }
  }, [profile]);

  const loadBookings = async () => {
    if (!profile) return;

    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          services (
            title,
            duration_hours
          ),
          profiles!bookings_client_id_fkey (
            full_name,
            phone,
            email
          )
        `)
        .eq('professional_id', profile.id)
        .order('event_date', { ascending: true });

      if (error) {
        console.error('Error loading bookings:', error);
      } else {
        setBookings(data || []);
      }
    } catch (error) {
      console.error('Error loading bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateBookingStatus = async (bookingId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', bookingId);

      if (error) {
        console.error('Error updating booking:', error);
      } else {
        // Refresh bookings
        loadBookings();
      }
    } catch (error) {
      console.error('Error updating booking:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return theme.colors.tertiary;
      case 'pending':
        return theme.colors.secondary;
      case 'cancelled':
        return theme.colors.error;
      case 'completed':
        return theme.colors.primary;
      default:
        return theme.colors.onSurfaceVariant;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'Confirmado';
      case 'pending':
        return 'Pendente';
      case 'cancelled':
        return 'Cancelado';
      case 'completed':
        return 'Concluído';
      default:
        return status;
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatTime = (time: string) => {
    return time.substring(0, 5);
  };

  const filteredBookings = bookings.filter(booking => {
    if (activeTab === 'all') return true;
    return booking.status === activeTab;
  });

  const renderBookingCard = ({ item }: { item: Booking }) => (
    <Card style={styles.bookingCard}>
      <Card.Content>
        <View style={styles.bookingHeader}>
          <Text variant="titleMedium" style={styles.clientName}>
            {item.profiles?.full_name}
          </Text>
          <Chip
            style={[styles.statusChip, { backgroundColor: getStatusColor(item.status) + '20' }]}
            textStyle={{ color: getStatusColor(item.status) }}
          >
            {getStatusLabel(item.status)}
          </Chip>
        </View>

        <Text variant="titleSmall" style={styles.serviceTitle}>
          {item.services?.title || 'Serviço de Churrasco'}
        </Text>

        <View style={styles.bookingInfo}>
          <View style={styles.infoRow}>
            <Calendar size={16} color={theme.colors.onSurfaceVariant} />
            <Text variant="bodyMedium" style={styles.infoText}>
              {formatDate(item.event_date)}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Clock size={16} color={theme.colors.onSurfaceVariant} />
            <Text variant="bodyMedium" style={styles.infoText}>
              {formatTime(item.event_time)} • {item.services?.duration_hours || 4}h
            </Text>
          </View>

          <View style={styles.infoRow}>
            <MapPin size={16} color={theme.colors.onSurfaceVariant} />
            <Text variant="bodyMedium" style={styles.infoText}>
              {item.location}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <User size={16} color={theme.colors.onSurfaceVariant} />
            <Text variant="bodyMedium" style={styles.infoText}>
              {item.guests_count} pessoas
            </Text>
          </View>

          {item.profiles?.phone && (
            <View style={styles.infoRow}>
              <Phone size={16} color={theme.colors.onSurfaceVariant} />
              <Text variant="bodyMedium" style={styles.infoText}>
                {item.profiles.phone}
              </Text>
            </View>
          )}
        </View>

        {item.notes && (
          <View style={styles.notesSection}>
            <Text variant="bodySmall" style={styles.notesLabel}>
              Observações do cliente:
            </Text>
            <Text variant="bodyMedium" style={styles.notes}>
              {item.notes}
            </Text>
          </View>
        )}

        <View style={styles.bookingFooter}>
          <Text variant="titleMedium" style={styles.totalPrice}>
            Total: R$ {item.total_price}
          </Text>
          
          {item.status === 'pending' && (
            <View style={styles.actions}>
              <Button 
                mode="outlined" 
                style={styles.actionButton}
                onPress={() => updateBookingStatus(item.id, 'cancelled')}
              >
                Recusar
              </Button>
              <Button 
                mode="contained" 
                style={styles.actionButton}
                onPress={() => updateBookingStatus(item.id, 'confirmed')}
              >
                Aceitar
              </Button>
            </View>
          )}

          {item.status === 'confirmed' && (
            <View style={styles.actions}>
              <Button 
                mode="contained" 
                style={styles.actionButton}
                onPress={() => updateBookingStatus(item.id, 'completed')}
              >
                Finalizar
              </Button>
            </View>
          )}
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.title}>
          Agendamentos
        </Text>
      </View>

      <View style={styles.tabsContainer}>
        <Button
          mode={activeTab === 'pending' ? 'contained' : 'outlined'}
          onPress={() => setActiveTab('pending')}
          style={styles.tabButton}
        >
          Pendentes
        </Button>
        <Button
          mode={activeTab === 'confirmed' ? 'contained' : 'outlined'}
          onPress={() => setActiveTab('confirmed')}
          style={styles.tabButton}
        >
          Confirmados
        </Button>
        <Button
          mode={activeTab === 'all' ? 'contained' : 'outlined'}
          onPress={() => setActiveTab('all')}
          style={styles.tabButton}
        >
          Todos
        </Button>
      </View>

      <View style={styles.content}>
        {filteredBookings.length === 0 ? (
          <View style={styles.emptyState}>
            <Calendar size={64} color={theme.colors.onSurfaceVariant} />
            <Text variant="titleMedium" style={styles.emptyTitle}>
              Nenhum agendamento encontrado
            </Text>
            <Text variant="bodyMedium" style={styles.emptyDescription}>
              {activeTab === 'pending' 
                ? 'Quando você receber novas solicitações, elas aparecerão aqui.'
                : `Nenhum agendamento ${activeTab === 'confirmed' ? 'confirmado' : ''} no momento.`
              }
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredBookings}
            renderItem={renderBookingCard}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            refreshing={loading}
            onRefresh={loadBookings}
          />
        )}
      </View>

      <FAB
        icon={() => <Plus size={24} color="white" />}
        style={styles.fab}
        onPress={() => {}}
      />
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
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  tabButton: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  bookingCard: {
    marginBottom: spacing.md,
    elevation: 2,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  clientName: {
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    flex: 1,
  },
  statusChip: {
    marginLeft: spacing.sm,
  },
  serviceTitle: {
    color: theme.colors.onSurfaceVariant,
    marginBottom: spacing.md,
  },
  bookingInfo: {
    marginBottom: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  infoText: {
    marginLeft: spacing.sm,
    color: theme.colors.onSurface,
  },
  notesSection: {
    marginBottom: spacing.md,
    padding: spacing.sm,
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: spacing.sm,
  },
  notesLabel: {
    fontWeight: 'bold',
    marginBottom: spacing.xs,
    color: theme.colors.onSurfaceVariant,
  },
  notes: {
    color: theme.colors.onSurface,
  },
  bookingFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalPrice: {
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    minWidth: 80,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    textAlign: 'center',
    color: theme.colors.onSurface,
  },
  emptyDescription: {
    textAlign: 'center',
    color: theme.colors.onSurfaceVariant,
  },
  fab: {
    position: 'absolute',
    margin: spacing.lg,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.primary,
  },
});