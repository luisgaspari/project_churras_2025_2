import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { spacing, theme } from '@/constants/theme';
import { ChartBar as BarChart3, DollarSign, Calendar, TrendingUp, Star, Users } from 'lucide-react-native';

interface AnalyticsData {
  totalRevenue: number;
  totalBookings: number;
  averageRating: number;
  completionRate: number;
  monthlyRevenue: number[];
  topServices: Array<{
    title: string;
    bookings: number;
    revenue: number;
  }>;
}

export default function AnalyticsScreen() {
  const { profile } = useAuth();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    totalRevenue: 0,
    totalBookings: 0,
    averageRating: 4.8,
    completionRate: 0,
    monthlyRevenue: [],
    topServices: [],
  });
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'month' | 'quarter' | 'year'>('month');

  useEffect(() => {
    if (profile) {
      loadAnalyticsData();
    }
  }, [profile, selectedPeriod]);

  const loadAnalyticsData = async () => {
    if (!profile) return;

    setLoading(true);
    try {
      // Load bookings for analytics
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select(`
          *,
          services (
            title
          )
        `)
        .eq('professional_id', profile.id);

      if (error) {
        console.error('Error loading analytics data:', error);
      } else {
        // Calculate analytics
        const totalBookings = bookings?.length || 0;
        const completedBookings = bookings?.filter(b => b.status === 'completed') || [];
        const totalRevenue = completedBookings.reduce((sum, b) => sum + b.total_price, 0);
        const completionRate = totalBookings > 0 ? (completedBookings.length / totalBookings) * 100 : 0;

        // Calculate monthly revenue for chart (last 6 months)
        const monthlyRevenue = Array(6).fill(0);
        const currentDate = new Date();
        
        completedBookings.forEach(booking => {
          const bookingDate = new Date(booking.event_date);
          const monthDiff = (currentDate.getFullYear() - bookingDate.getFullYear()) * 12 + 
                           (currentDate.getMonth() - bookingDate.getMonth());
          
          if (monthDiff >= 0 && monthDiff < 6) {
            monthlyRevenue[5 - monthDiff] += booking.total_price;
          }
        });

        // Calculate top services
        const serviceStats: { [key: string]: { bookings: number; revenue: number } } = {};
        completedBookings.forEach(booking => {
          const serviceTitle = booking.services?.title || 'Serviço de Churrasco';
          if (!serviceStats[serviceTitle]) {
            serviceStats[serviceTitle] = { bookings: 0, revenue: 0 };
          }
          serviceStats[serviceTitle].bookings++;
          serviceStats[serviceTitle].revenue += booking.total_price;
        });

        const topServices = Object.entries(serviceStats)
          .map(([title, stats]) => ({ title, ...stats }))
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 5);

        setAnalyticsData({
          totalRevenue,
          totalBookings,
          averageRating: 4.8, // Mock rating
          completionRate,
          monthlyRevenue,
          topServices,
        });
      }
    } catch (error) {
      console.error('Error loading analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getMonthName = (monthIndex: number) => {
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const currentMonth = new Date().getMonth();
    const targetMonth = (currentMonth - (5 - monthIndex) + 12) % 12;
    return months[targetMonth];
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text variant="headlineMedium" style={styles.title}>
            Relatórios
          </Text>
        </View>

        {/* Period Selector */}
        <View style={styles.periodSelector}>
          <Button
            mode={selectedPeriod === 'month' ? 'contained' : 'outlined'}
            onPress={() => setSelectedPeriod('month')}
            style={styles.periodButton}
          >
            Mês
          </Button>
          <Button
            mode={selectedPeriod === 'quarter' ? 'contained' : 'outlined'}
            onPress={() => setSelectedPeriod('quarter')}
            style={styles.periodButton}
          >
            Trimestre
          </Button>
          <Button
            mode={selectedPeriod === 'year' ? 'contained' : 'outlined'}
            onPress={() => setSelectedPeriod('year')}
            style={styles.periodButton}
          >
            Ano
          </Button>
        </View>

        {/* Key Metrics */}
        <View style={styles.metricsContainer}>
          <View style={styles.metricsRow}>
            <Card style={styles.metricCard}>
              <Card.Content style={styles.metricContent}>
                <View style={styles.metricHeader}>
                  <DollarSign size={24} color={theme.colors.primary} />
                  <Text variant="bodySmall" style={styles.metricLabel}>
                    Receita Total
                  </Text>
                </View>
                <Text variant="headlineSmall" style={styles.metricValue}>
                  {formatCurrency(analyticsData.totalRevenue)}
                </Text>
              </Card.Content>
            </Card>

            <Card style={styles.metricCard}>
              <Card.Content style={styles.metricContent}>
                <View style={styles.metricHeader}>
                  <Calendar size={24} color={theme.colors.secondary} />
                  <Text variant="bodySmall" style={styles.metricLabel}>
                    Agendamentos
                  </Text>
                </View>
                <Text variant="headlineSmall" style={styles.metricValue}>
                  {analyticsData.totalBookings}
                </Text>
              </Card.Content>
            </Card>
          </View>

          <View style={styles.metricsRow}>
            <Card style={styles.metricCard}>
              <Card.Content style={styles.metricContent}>
                <View style={styles.metricHeader}>
                  <Star size={24} color={theme.colors.tertiary} />
                  <Text variant="bodySmall" style={styles.metricLabel}>
                    Avaliação Média
                  </Text>
                </View>
                <Text variant="headlineSmall" style={styles.metricValue}>
                  {analyticsData.averageRating.toFixed(1)}
                </Text>
              </Card.Content>
            </Card>

            <Card style={styles.metricCard}>
              <Card.Content style={styles.metricContent}>
                <View style={styles.metricHeader}>
                  <TrendingUp size={24} color={theme.colors.tertiary} />
                  <Text variant="bodySmall" style={styles.metricLabel}>
                    Taxa de Conclusão
                  </Text>
                </View>
                <Text variant="headlineSmall" style={styles.metricValue}>
                  {analyticsData.completionRate.toFixed(0)}%
                </Text>
              </Card.Content>
            </Card>
          </View>
        </View>

        {/* Revenue Chart */}
        <Card style={styles.chartCard}>
          <Card.Content>
            <View style={styles.chartHeader}>
              <BarChart3 size={24} color={theme.colors.primary} />
              <Text variant="titleMedium" style={styles.chartTitle}>
                Receita por Mês
              </Text>
            </View>
            
            <View style={styles.chart}>
              {analyticsData.monthlyRevenue.map((revenue, index) => {
                const maxRevenue = Math.max(...analyticsData.monthlyRevenue);
                const height = maxRevenue > 0 ? (revenue / maxRevenue) * 100 : 0;
                
                return (
                  <View key={index} style={styles.chartColumn}>
                    <View style={styles.chartBarContainer}>
                      <View 
                        style={[
                          styles.chartBar, 
                          { 
                            height: `${height}%`,
                            backgroundColor: theme.colors.primary,
                          }
                        ]} 
                      />
                    </View>
                    <Text variant="bodySmall" style={styles.chartLabel}>
                      {getMonthName(index)}
                    </Text>
                    <Text variant="bodySmall" style={styles.chartValue}>
                      R$ {revenue}
                    </Text>
                  </View>
                );
              })}
            </View>
          </Card.Content>
        </Card>

        {/* Top Services */}
        <Card style={styles.servicesCard}>
          <Card.Content>
            <View style={styles.servicesHeader}>
              <Users size={24} color={theme.colors.secondary} />
              <Text variant="titleMedium" style={styles.servicesTitle}>
                Serviços Mais Populares
              </Text>
            </View>

            {analyticsData.topServices.length === 0 ? (
              <Text variant="bodyMedium" style={styles.noDataText}>
                Nenhum dado disponível ainda
              </Text>
            ) : (
              analyticsData.topServices.map((service, index) => (
                <View key={index} style={styles.serviceItem}>
                  <View style={styles.serviceInfo}>
                    <Text variant="titleSmall" style={styles.serviceName}>
                      {service.title}
                    </Text>
                    <Text variant="bodySmall" style={styles.serviceStats}>
                      {service.bookings} agendamentos • {formatCurrency(service.revenue)}
                    </Text>
                  </View>
                  <View style={styles.serviceRank}>
                    <Text variant="titleMedium" style={styles.rankNumber}>
                      #{index + 1}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </Card.Content>
        </Card>

        {/* Insights */}
        <Card style={styles.insightsCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.insightsTitle}>
              Dicas para Melhorar
            </Text>
            
            <View style={styles.insightItem}>
              <Text variant="bodyMedium" style={styles.insightText}>
                • Mantenha seus preços competitivos para atrair mais clientes
              </Text>
            </View>
            
            <View style={styles.insightItem}>
              <Text variant="bodyMedium" style={styles.insightText}>
                • Responda rapidamente às solicitações para aumentar suas confirmações
              </Text>
            </View>
            
            <View style={styles.insightItem}>
              <Text variant="bodyMedium" style={styles.insightText}>
                • Adicione mais fotos aos seus serviços para atrair mais visualizações
              </Text>
            </View>
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
  periodSelector: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  periodButton: {
    flex: 1,
  },
  metricsContainer: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  metricCard: {
    flex: 1,
    elevation: 2,
  },
  metricContent: {
    padding: spacing.md,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  metricLabel: {
    marginLeft: spacing.sm,
    color: theme.colors.onSurfaceVariant,
  },
  metricValue: {
    fontWeight: 'bold',
    color: theme.colors.onSurface,
  },
  chartCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    elevation: 2,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  chartTitle: {
    marginLeft: spacing.sm,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
  },
  chart: {
    flexDirection: 'row',
    height: 200,
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  chartColumn: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 2,
  },
  chartBarContainer: {
    flex: 1,
    width: '80%',
    justifyContent: 'flex-end',
    marginBottom: spacing.sm,
  },
  chartBar: {
    width: '100%',
    borderRadius: 2,
    minHeight: 2,
  },
  chartLabel: {
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  chartValue: {
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    fontSize: 10,
  },
  servicesCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    elevation: 2,
  },
  servicesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  servicesTitle: {
    marginLeft: spacing.sm,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
  },
  noDataText: {
    textAlign: 'center',
    color: theme.colors.onSurfaceVariant,
    fontStyle: 'italic',
  },
  serviceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surfaceVariant,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    marginBottom: spacing.xs,
  },
  serviceStats: {
    color: theme.colors.onSurfaceVariant,
  },
  serviceRank: {
    alignItems: 'center',
  },
  rankNumber: {
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  insightsCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    elevation: 2,
  },
  insightsTitle: {
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    marginBottom: spacing.md,
  },
  insightItem: {
    marginBottom: spacing.sm,
  },
  insightText: {
    color: theme.colors.onSurface,
    lineHeight: 20,
  },
});