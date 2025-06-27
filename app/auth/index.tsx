import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Button, Text, TextInput, Card } from 'react-native-paper';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { spacing, theme } from '@/constants/theme';
import { ArrowLeft } from 'lucide-react-native';

type UserType = 'client' | 'professional';

export default function AuthScreen() {
  const { userType } = useLocalSearchParams<{ userType: UserType }>();
  const { signIn, signUp, loading } = useAuth();
  
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos obrigatórios');
      return;
    }

    if (!isLogin && !fullName) {
      Alert.alert('Erro', 'Por favor, informe seu nome completo');
      return;
    }

    setIsLoading(true);
    
    try {
      if (isLogin) {
        await signIn(email, password);
      } else {
        await signUp(email, password, {
          user_type: userType || 'client',
          full_name: fullName,
          phone,
        });
      }
      
      // Redirect based on user type
      if (userType === 'professional') {
        router.replace('/(professional)');
      } else {
        router.replace('/(client)');
      }
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Erro ao realizar autenticação');
    } finally {
      setIsLoading(false);
    }
  };

  const getUserTypeTitle = () => {
    return userType === 'professional' ? 'Churrasqueiro' : 'Cliente';
  };

  return (
    <LinearGradient
      colors={[theme.colors.primary, theme.colors.secondary]}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <Button
            mode="text"
            onPress={() => router.back()}
            style={styles.backButton}
            labelStyle={styles.backButtonLabel}
            icon={({ size, color }) => <ArrowLeft size={size} color={color} />}
          >
            Voltar
          </Button>

          <View style={styles.header}>
            <Text variant="headlineMedium" style={styles.title}>
              {isLogin ? 'Entrar' : 'Criar conta'}
            </Text>
            <Text variant="titleMedium" style={styles.subtitle}>
              {getUserTypeTitle()}
            </Text>
          </View>

          <Card style={styles.formCard}>
            <Card.Content style={styles.formContent}>
              {!isLogin && (
                <TextInput
                  label="Nome completo"
                  value={fullName}
                  onChangeText={setFullName}
                  style={styles.input}
                  mode="outlined"
                />
              )}

              <TextInput
                label="E-mail"
                value={email}
                onChangeText={setEmail}
                style={styles.input}
                mode="outlined"
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <TextInput
                label="Senha"
                value={password}
                onChangeText={setPassword}
                style={styles.input}
                mode="outlined"
                secureTextEntry
              />

              {!isLogin && (
                <TextInput
                  label="Telefone (opcional)"
                  value={phone}
                  onChangeText={setPhone}
                  style={styles.input}
                  mode="outlined"
                  keyboardType="phone-pad"
                />
              )}

              <Button
                mode="contained"
                onPress={handleAuth}
                loading={isLoading}
                disabled={isLoading}
                style={styles.authButton}
              >
                {isLogin ? 'Entrar' : 'Criar conta'}
              </Button>

              <Button
                mode="text"
                onPress={() => setIsLogin(!isLogin)}
                style={styles.toggleButton}
              >
                {isLogin ? 'Não tem conta? Criar conta' : 'Já tem conta? Entrar'}
              </Button>
            </Card.Content>
          </Card>
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
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginTop: spacing.md,
  },
  backButtonLabel: {
    color: 'white',
  },
  header: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
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
  formCard: {
    flex: 1,
    marginBottom: spacing.xl,
  },
  formContent: {
    padding: spacing.lg,
  },
  input: {
    marginBottom: spacing.md,
  },
  authButton: {
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  toggleButton: {
    marginTop: spacing.sm,
  },
});