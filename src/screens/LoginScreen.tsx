// ARQUIVO: src/screens/LoginScreen.tsx

import React, { useState, useEffect, useRef } from 'react';
import {
  SafeAreaView, View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, StatusBar,
  ActivityIndicator, Image, ScrollView, Animated, Easing, Dimensions
} from 'react-native';
import axios from 'axios';
import LinearGradient from 'react-native-linear-gradient';
import { Eye, EyeSlash, User, IdentificationCard, Scan, Lightning } from 'phosphor-react-native'; 
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useTheme } from '../context/ThemeContext';

// ✅ IMPORTAÇÃO DAS IMAGENS
const imgDiaDia = require('../assets/images/Logo_Branca.png'); 
const imgAppLogo = require('../assets/images/LOGO3DNV.png'); 

const { height } = Dimensions.get('window');

type LoginScreenProps = NativeStackScreenProps<RootStackParamList, 'Login'>;

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const { theme, isDark } = useTheme();

  // Estados
  const [cpf, setCpf] = useState<string>('');
  const [matricula, setMatricula] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [showCpf, setShowCpf] = useState<boolean>(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Animações
  const scannerAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideForm = useRef(new Animated.Value(50)).current;

  // 1. Animação do Scanner (Loop)
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scannerAnim, {
          toValue: height + 100,
          duration: 2500,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(scannerAnim, {
          toValue: -100,
          duration: 0,
          useNativeDriver: true,
        })
      ])
    ).start();

    // 2. Entrada Suave
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.spring(slideForm, { toValue: 0, friction: 6, useNativeDriver: true })
    ]).start();
  }, []);

  const handleLogin = async (): Promise<void> => {
    setError('');
    if (!cpf || !matricula) {
      setError('IDENTIFICAÇÃO NECESSÁRIA.');
      return;
    }
    setLoading(true);
    
    try {
      const apiUrl = 'http://10.12.3.9:5018/api/auth/login'; 
      const requestBody = { cpf, matricula };
      const response = await axios.post(apiUrl, requestBody);

      if (response.status === 200 && response.data.accessToken) {
        const { accessToken, nome, filial } = response.data;
        navigation.replace('MainTabs', {
          accessToken, userName: nome, userFilial: filial,
          // @ts-ignore
          userMatricula: matricula 
        });
      } else {
        setError(response.data.message || 'FALHA NA AUTENTICAÇÃO.');
      }
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        setError(err.response.data.message || 'CREDENCIAIS INVÁLIDAS.');
      } else {
        setError('SERVIDOR OFF-LINE.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Definições visuais
  const glassBg = isDark ? 'rgba(20, 25, 40, 0.7)' : 'rgba(255, 255, 255, 0.7)';
  const borderColor = isDark ? 'rgba(255, 255, 255, 0)' : 'rgba(75, 109, 204, 0.2)'; 
  const activeBorder = theme.accent; 

  const beamColors = isDark 
    ? ['transparent', theme.statusDot, 'transparent'] 
    : ['transparent', '#4B6DCC', '#4A53BB', 'transparent'];

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#0F172A' : '#F8FAFC' }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor="transparent" translucent />
      
      {/* 1. FUNDO COM GRADIENTE SUTIL */}
      <LinearGradient
        colors={isDark ? ['#2f4a92ff', '#343b8aff', '#16235cff'] : ['#F1F5F9', '#E2E8F0', '#CBD5E1']}
        style={StyleSheet.absoluteFill}
      />
      
      {/* Grid Tecnológico */}
      <View style={styles.gridContainer}>
         <View style={[styles.gridLineVertical, { left: '20%', backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)' }]} />
         <View style={[styles.gridLineVertical, { right: '20%', backgroundColor: isDark ? 'rgba(189, 16, 16, 0.03)' : 'rgba(0,0,0,0.03)' }]} />
      </View>

      {/* 2. SCANNER BEAM (LASER) */}
      <Animated.View 
        style={[
          styles.scannerBeam, 
          { 
            transform: [{ translateY: scannerAnim }],
            opacity: isDark ? 0.5 : 0.8 
          }
        ]}
      >
        <LinearGradient
          colors={beamColors}
          start={{x: 0, y: 0}} end={{x: 1, y: 0}}
          style={{ width: '100%', height: 3 }}
        />
        <LinearGradient
          colors={beamColors}
          start={{x: 0, y: 0}} end={{x: 0, y: 1}}
          style={{ width: '100%', height: 60, opacity: 0.2 }}
        />
      </Animated.View>

      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            
            {/* LOGO DA EMPRESA (TOPO) */}
            <View style={styles.topHeader}>
                <Image 
                  source={imgDiaDia} 
                  style={[
                    styles.logoDiaDia, 
                    !isDark && { tintColor: '#475569' } 
                  ]} 
                  resizeMode="contain" 
                />
            </View>

            <Animated.View style={[styles.contentWrapper, { opacity: fadeAnim, transform: [{ translateY: slideForm }] }]}>
              
              {/* LOGO DO APP (CENTRAL E GIGANTE) */}
              <View style={styles.appLogoContainer}>
                {/*  LOGO  */}
                <Image 
                  source={imgAppLogo} 
                  style={styles.logoApp} 
                  resizeMode="contain" 
                />
                

              </View>

              {/* CARD DE LOGIN (HUD) */}
              <View style={[styles.hudCard, { backgroundColor: glassBg, borderColor: borderColor }]}>
                
                {/* MATRÍCULA */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: theme.textSec }]}>ID OPERADOR (MATRÍCULA)</Text>
                  <View style={[
                    styles.inputWrapper, 
                    { 
                      backgroundColor: isDark ? 'rgba(0,0,0,0.3)' : '#FFF',
                      borderColor: focusedField === 'matricula' ? activeBorder : borderColor 
                    }
                  ]}>
                    <User color={focusedField === 'matricula' ? activeBorder : theme.textSec} size={22} weight="duotone" />
                    <TextInput
                      style={[styles.input, { color: theme.text }]}
                      placeholder="000000"
                      placeholderTextColor={isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'}
                      value={matricula}
                      onChangeText={setMatricula}
                      keyboardType="numeric"
                      returnKeyType="next"
                      onFocus={() => setFocusedField('matricula')}
                      onBlur={() => setFocusedField(null)}
                    />
                    {matricula.length > 0 && <View style={[styles.indicator, { backgroundColor: activeBorder }]} />}
                  </View>
                </View>

                {/* CPF */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: theme.textSec }]}>CHAVE DE ACESSO (CPF)</Text>
                  <View style={[
                    styles.inputWrapper, 
                    { 
                      backgroundColor: isDark ? 'rgba(0,0,0,0.3)' : '#FFF',
                      borderColor: focusedField === 'cpf' ? activeBorder : borderColor 
                    }
                  ]}>
                    <IdentificationCard color={focusedField === 'cpf' ? activeBorder : theme.textSec} size={22} weight="duotone" />
                    <TextInput
                      style={[styles.input, { color: theme.text }]}
                      placeholder="•••••••••••"
                      placeholderTextColor={isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'}
                      value={cpf}
                      onChangeText={setCpf}
                      keyboardType="numeric"
                      returnKeyType="done"
                      maxLength={14}
                      secureTextEntry={!showCpf}
                      onFocus={() => setFocusedField('cpf')}
                      onBlur={() => setFocusedField(null)}
                    />
                    <TouchableOpacity onPress={() => setShowCpf(!showCpf)} style={styles.eyeIcon}>
                      {showCpf ? <EyeSlash color={theme.textSec} size={22} /> : <Eye color={theme.textSec} size={22} />}
                    </TouchableOpacity>
                  </View>
                </View>

                {error ? (
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>⚠ {error}</Text>
                  </View>
                ) : null}

                {/* BOTÃO IMPACTANTE */}
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={handleLogin}
                  disabled={loading}
                  style={styles.buttonContainer}
                >
                  <LinearGradient
                    colors={loading ? ['#4b5563', '#374151'] : [theme.accent, theme.accent]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.buttonGradient}
                  >
                    {loading ? (
                      <ActivityIndicator color="#FFF" />
                    ) : (
                      <View style={styles.btnContent}>
                        <Lightning size={3} color="#ffffff" style={{ marginRight: 0.1 }} />
                        <Text style={styles.buttonText}>ENTRAR</Text>
                      </View>
                    )}
                  </LinearGradient>
                  {!loading && <View style={[styles.buttonGlow, { shadowColor: theme.accent }]} />}
                </TouchableOpacity>

              </View>

              <TouchableOpacity style={styles.forgotPasswordButton}>
                <Text style={[styles.forgotPasswordText, { color: theme.textSec }]}>Esqueceu suas credenciais?</Text> 
              </TouchableOpacity>

            </Animated.View>

          </ScrollView>

          <View style={styles.footer}>
            <Text style={[styles.versionText, { color: theme.textSec }]}>
              GESTÃO<Text style={{fontWeight:'900', color: theme.accent}}>V</Text> O • APP DE VALIDADE DO DIA A DIA
            </Text>
          </View>

        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  
  gridContainer: { ...StyleSheet.absoluteFillObject },
  gridLineVertical: { position: 'absolute', top: 0, bottom: 0, width: 1 },
  scannerBeam: { position: 'absolute', width: '100%', zIndex: 0 },

  scrollContent: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingBottom: 40 },
  contentWrapper: { width: '100%', zIndex: 10 },
  
  // LOGO SUPERIOR (Dia a Dia)
  topHeader: { alignItems: 'center', marginBottom: 30, marginTop: 40 },
  logoDiaDia: { width: 130, height: 45, opacity: 0.9 },

  // LOGO APP 
  appLogoContainer: { alignItems: 'center', marginBottom: 25 },
  
  logoApp: { width: 380, height: 180, marginBottom: 5 }, 
  taglineBox: { flexDirection: 'row', alignItems: 'center', opacity: 0.8, backgroundColor: 'rgba(0,0,0,0.05)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  subtitle: { fontSize: 10, letterSpacing: 2, fontWeight: '800', textTransform: 'uppercase' },

  // HUD
  hudCard: {
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },

  inputGroup: { marginBottom: 20 },
  label: { fontSize: 10, fontWeight: '900', letterSpacing: 1, marginBottom: 8, textTransform: 'uppercase', marginLeft: 4 },
  inputWrapper: {
    height: 60,
    borderWidth: 1,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    overflow: 'hidden',
  },
  input: { flex: 1, fontSize: 18, height: '100%', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', fontWeight: '600', marginLeft: 10 },
  eyeIcon: { padding: 10 },
  indicator: { width: 6, height: 6, borderRadius: 3, position: 'absolute', right: 16 },

  errorContainer: { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderWidth: 1, borderColor: '#EF4444', padding: 12, marginBottom: 20, borderRadius: 12, alignItems: 'center' },
  errorText: { color: '#EF4444', fontSize: 12, fontWeight: 'bold', letterSpacing: 0.5 },

  buttonContainer: { marginTop: 10, position: 'relative' },
  buttonGradient: { height: 64, borderRadius: 18, alignItems: 'center', justifyContent: 'center', zIndex: 2 },
  btnContent: { flexDirection: 'row', alignItems: 'center' },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '900', letterSpacing: 1.5, textTransform: 'uppercase' },
  buttonGlow: {
    position: 'absolute', top: 10, left: 10, right: 10, bottom: -10,
    backgroundColor: 'transparent', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.5, shadowRadius: 15, elevation: 15, zIndex: 1
  },
  
  forgotPasswordButton: { marginTop: 30, alignItems: 'center' },
  forgotPasswordText: { fontSize: 12, opacity: 0.7, fontWeight: '500' },
  
  footer: { alignItems: 'center', marginBottom: 30 },
  versionText: { fontSize: 10, letterSpacing: 2 },
});

export default LoginScreen;