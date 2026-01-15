// ARQUIVO: src/screens/HomeScreen.tsx

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  SafeAreaView, View, Text, StyleSheet, StatusBar,
  Platform, Pressable, Animated, Image, ImageSourcePropType, 
  Dimensions, Switch, Alert, TouchableOpacity
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { TabParamList } from '../navigation/AppNavigator';
import { useSession } from '../context/SessionContext';
import { logoutSession, getPendingActivities, setAuthToken } from '../services/api';
import { useTheme } from '../context/ThemeContext'; 

// --- IMPORTAÇÃO DE ÍCONES ---
const imgAtividades = require('../assets/images/AtividadesPendentesIcon.png');
const imgRealizar = require('../assets/images/RealizarAtividadeIcon.png');
const imgOpcoes = require('../assets/images/opçoesIcon.png');

// AS DUAS LOGOS
const imgLogoCenter = require('../assets/images/DDBranco.png');
const imgLogoSide = require('../assets/images/LOGO3DNV.png');

type HomeScreenProps = BottomTabScreenProps<TabParamList, 'Home'>;
const { width } = Dimensions.get('window');

// --- COMPONENTE DO CARTÃO (Semi-Transparente "Glass" Limpo) ---
interface ActionCardProps {
  icon: ImageSourcePropType;
  title: string;
  subtitle: string;
  onPress: () => void;
  delay?: number;
  theme: any; 
  badgeCount?: number;
  isDark: boolean;
}

const ActionCard: React.FC<ActionCardProps> = ({ icon, title, subtitle, onPress, delay = 0, theme, badgeCount, isDark }) => {
  const slideAnim = useRef(new Animated.Value(50)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, delay, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, friction: 6, tension: 50, delay, useNativeDriver: true })
    ]).start();
  }, []);

  // --- ESTILO VIDRO (GLASSMORPHISM) SEM "SUJEIRA" ---
  const glassStyle = isDark 
    ? {
        // DARK MODE: Vidro Escuro
 
        backgroundColor: 'rgba(30, 41, 59, 0.39)', 
        
        // Borda fina branca quase invisível para dar o contorno do vidro
        borderWidth: 0.1,
        borderColor: 'rgba(255, 255, 255, 1)',
        

        shadowColor: '#000000ff',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 0, // Remove elevação nativa no Android para evitar fundo preto sólido
      }
    : {

        backgroundColor: 'rgba(255,255,255,0.85)', 
        

        shadowColor: '#4B6DCC', 
        shadowOffset: { width: 0, height: 8 }, 
        shadowOpacity: 0.15, // Bem suave
        shadowRadius: 12, 
        elevation: 0, // Sem elevation nativa para controlar transparência
        

        borderWidth: 1,
        borderColor: '#FFFFFF',
      };

  const textStyle = { color: theme.text };
  const subTextStyle = { color: theme.textSec };
  
  // Ícone com fundo bem suave
  const iconBg = { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(75, 109, 204, 0.05)' };
  const iconTintColor = isDark ? '#FFF' : theme.accent; 

  return (
    <Animated.View style={[styles.cardWrapper, { opacity: fadeAnim, transform: [{ translateX: slideAnim }] }]}>
      <Pressable 
        onPress={onPress} 
        style={({ pressed }) => [
          styles.cardBody, 
          glassStyle, 
          pressed && styles.cardPressed,
        ]}
      >
        <View style={[styles.iconContainer, iconBg]}>
          <Image source={icon} style={[styles.cardIcon, { tintColor: iconTintColor }]} />
          
          {/* BADGE */}
          {badgeCount !== undefined && badgeCount > 0 && (
            <View style={styles.badgeContainer}>
              <Text style={styles.badgeText}>
                {badgeCount > 99 ? '99+' : badgeCount}
              </Text>
            </View>
          )}
        </View>
        
        <View style={{flex: 1}}>
          <Text style={[styles.cardTitle, textStyle]}>{title}</Text>
          <Text style={[styles.cardSubtitle, subTextStyle]}>{subtitle} <Text style={{fontWeight:'bold', color: theme.accent}}>»</Text></Text>
        </View>
      </Pressable>
    </Animated.View>
  );
};

// --- TELA PRINCIPAL ---
const HomeScreen: React.FC<HomeScreenProps> = ({ navigation, route }) => {
  
  const rootNavigation = useNavigation<NativeStackNavigationProp<any>>();
  const { sessionData, setSessionData, updateSessionData } = useSession();
  const { theme, isDark, toggleTheme } = useTheme(); 

  const bgAnim = useRef(new Animated.Value(0)).current;
  const [menuVisible, setMenuVisible] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  const fetchPendingCount = useCallback(async () => {
    if (!sessionData.accessToken || !sessionData.userFilial) return;
    try {
      setAuthToken(sessionData.accessToken);
      const data = await getPendingActivities(sessionData.userFilial);
      if (data && Array.isArray(data)) {
        setPendingCount(data.length);
      } else {
        setPendingCount(0);
      }
    } catch (error) {
      console.log('Erro badge:', error);
    }
  }, [sessionData.accessToken, sessionData.userFilial]);

  useFocusEffect(
    useCallback(() => {
      fetchPendingCount();
    }, [fetchPendingCount])
  );

  useEffect(() => {
    // @ts-ignore
    const matriculaParam = route.params?.userMatricula;
    if (matriculaParam && matriculaParam !== sessionData.userMatricula) {
      updateSessionData({ userMatricula: matriculaParam });
    }
  }, [route.params]);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(bgAnim, { toValue: 10, duration: 2000, useNativeDriver: true }),
        Animated.timing(bgAnim, { toValue: 0, duration: 2000, useNativeDriver: true })
      ])
    ).start();
  }, []);

  useEffect(() => {
    if (menuVisible) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, friction: 5, useNativeDriver: true })
      ]).start();
    } else {
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start();
      scaleAnim.setValue(0.9);
    }
  }, [menuVisible]);

  const handleLogout = () => {
    setMenuVisible(false);
    Alert.alert("Desconectar", "Tem certeza que deseja encerrar a sessão?", [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Sair", style: 'destructive',
          onPress: async () => {
            setIsLoggingOut(true);
            try {
              if (sessionData.userMatricula) await logoutSession(sessionData.userMatricula);
              setSessionData({ accessToken: '', userName: '', userFilial: 0, userMatricula: '' });
              rootNavigation.replace('Login' as any);
            } catch (error) {
              setSessionData({ accessToken: '', userName: '', userFilial: 0, userMatricula: '' });
              rootNavigation.replace('Login' as any);
            } finally { setIsLoggingOut(false); }
          } 
        }
      ]
    );
  };

  const textColor = { color: theme.text };
  const textSecColor = { color: theme.textSec };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar 
        barStyle={isDark ? "light-content" : "dark-content"} 
        backgroundColor="transparent" 
        translucent 
      />

      {/* GRADIENTE DE FUNDO LIMPO (Sem elementos decorativos atrás) */}
      <LinearGradient
        colors={theme.gradient} 
        locations={[0, 0.6, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* REMOVIDO: speedBackground (quadrados) para garantir fundo limpo */}

      <SafeAreaView style={styles.safeArea}>
        
        <View style={styles.headerContainer}>
          <View style={styles.logoCenterContainer}>
             <Image 
                source={imgLogoCenter} 
                style={[styles.headerLogoCenter, !isDark && { tintColor: theme.accent }]} 
                resizeMode="contain" 
             />
          </View>

          <View style={styles.headerInfoRow}>
            <View style={styles.leftColumn}>
              <Text style={[styles.greetingTitle, textColor]} numberOfLines={1} adjustsFontSizeToFit={true} minimumFontScale={0.6}>
                Bem-vindo ao Gestão V,
              </Text>

              <Text style={[styles.userName, textColor]} numberOfLines={1} adjustsFontSizeToFit={true} minimumFontScale={0.6}>
                {sessionData.userName || 'Usuário'}
              </Text>
              
              <View style={styles.filialRow}>
                 <Text style={[styles.filialLabel, textSecColor]}>FILIAL:</Text>
                 <Text style={[styles.filialNumber, textColor]}>{sessionData.userFilial}</Text>
              </View>

              <View style={styles.statusBadge}>
                <View style={[styles.pulseDot, { backgroundColor: theme.statusDot }]} />
                <Text style={[styles.statusText, { color: theme.statusDot }]}>SISTEMA ONLINE</Text>
              </View>
            </View>

            <View style={styles.rightColumn}>
               <Image source={imgLogoSide} style={styles.headerLogoSide} resizeMode="contain" />
            </View>
          </View>
        </View>

        <View style={styles.content}>
          <Text style={[styles.sectionTitle, textSecColor]}>
            ACESSO RÁPIDO <Text style={{ opacity: 0.3 }}>////////////////</Text>
          </Text>

          <View style={styles.cardsContainer}>
            <ActionCard
              icon={imgAtividades}
              title="PENDÊNCIAS"
              subtitle="Resolver agora"
              onPress={() => navigation.navigate('PendingActivities', { accessToken: sessionData.accessToken, userFilial: sessionData.userFilial, userName: sessionData.userName })}
              theme={theme}
              isDark={isDark}
              badgeCount={pendingCount}
            />

            <ActionCard
              icon={imgRealizar}
              title="NOVA BATIDA"
              subtitle="Iniciar Scanner"
              onPress={() => navigation.navigate('DoActivities', { accessToken: sessionData.accessToken, userName: sessionData.userName, userFilial: sessionData.userFilial })}
              theme={theme}
              isDark={isDark}
            />

            <ActionCard
              icon={imgOpcoes}
              title="AJUSTES"
              subtitle="Configurações"
              onPress={() => setMenuVisible(true)}
              theme={theme}
              isDark={isDark}
            />
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, textColor]}>GESTÃO<Text style={{fontWeight:'900'}}>V</Text> • PERFORMANCE MODE</Text>
        </View>

      </SafeAreaView>

      {/* --- MENU OVERLAY --- */}
      {menuVisible && (
        <View style={StyleSheet.absoluteFill}>
          <Pressable style={styles.backdrop} onPress={() => setMenuVisible(false)}>
            <Animated.View style={[styles.backdropTint, { opacity: fadeAnim }]} />
          </Pressable>

          <Animated.View 
            style={[
              styles.floatingMenu, 
              { 
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
                backgroundColor: isDark ? 'rgba(30, 41, 59, 0.95)' : '#FFFFFF',
                borderColor: theme.accent
              }
            ]}
          >
            <View style={styles.menuHeader}>
              <Text style={[styles.menuTitle, { color: theme.accent }]}>CONFIGURAÇÕES</Text>
              <View style={[styles.menuIndicator, { backgroundColor: theme.accent }]} />
            </View>

            <View style={styles.menuRow}>
              <View>
                <Text style={[styles.menuLabel, { color: isDark ? '#FFF' : '#333' }]}>Modo Escuro</Text>
                <Text style={[styles.menuSubLabel, { color: isDark ? '#94A3B8' : '#666' }]}>Interface de alto contraste</Text>
              </View>
              <Switch
                trackColor={{ false: "#767577", true: theme.accent }}
                thumbColor={isDark ? "#fff" : "#f4f3f4"}
                onValueChange={toggleTheme}
                value={isDark}
              />
            </View>

            <View style={[styles.menuDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]} />

            <TouchableOpacity style={styles.menuButtonExit} onPress={handleLogout}>
              <Text style={styles.menuButtonText}>SAIR DO SISTEMA</Text>
            </TouchableOpacity>

          </Animated.View>
        </View>
      )}

    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, paddingHorizontal: 25, paddingTop: Platform.OS === 'android' ? 25 : 10 },
  
  // --- HEADER ---
  headerContainer: { marginTop: 10, marginBottom: 20 },
  logoCenterContainer: { alignItems: 'center', marginBottom: 20, height: 60, justifyContent: 'center' },
  headerLogoCenter: { width: 160, height: 55 },
  headerInfoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative' },

  leftColumn: { width: '100%', justifyContent: 'center', marginTop: 20, paddingRight: 80 },
  
  greetingTitle: { fontSize: 20, marginBottom: 0, width: '100%', fontWeight: '800' },
  userName: { fontWeight: '900', fontSize: 28, fontStyle: 'italic', marginBottom: 6, width: '100%' },

  filialRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 2, marginBottom: 10 },
  filialLabel: { fontSize: 14, fontWeight: 'bold', marginRight: 6 },
  filialNumber: { fontSize: 22, fontWeight: '900', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', letterSpacing: 1 },
  
  statusBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.1)', paddingVertical: 5, paddingHorizontal: 10, borderRadius: 4, alignSelf: 'flex-start' },
  pulseDot: { width: 7, height: 7, borderRadius: 3.5, marginRight: 6 },
  statusText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },

  rightColumn: { position: 'absolute', right: -130, top: 10, justifyContent: 'center', alignItems: 'flex-end' },
  headerLogoSide: { width: 340, height: 120 },

  // --- CONTENT ---
  content: { flex: 1, justifyContent: 'center' },
  sectionTitle: { fontSize: 12, fontWeight: 'bold', letterSpacing: 1, marginBottom: 20, opacity: 0.8 },
  cardsContainer: { gap: 16 },
  cardWrapper: { width: '100%', height: 90 },
  
  // ✅ BASE DO CARD
  cardBody: { flex: 1, flexDirection: 'row', alignItems: 'center', borderRadius: 16, paddingHorizontal: 20 },
  cardPressed: { opacity: 0.95, transform: [{ scale: 0.98 }] },
  
  iconContainer: { width: 50, height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 20, position: 'relative' },
  cardIcon: { width: 28, height: 28, resizeMode: 'contain' },
  cardTitle: { fontSize: 16, fontWeight: '900', letterSpacing: 0.5, textTransform: 'uppercase' },
  cardSubtitle: { fontSize: 12, marginTop: 2 },
  
  // BADGE
  badgeContainer: {
    position: 'absolute', top: -5, right: -5, backgroundColor: '#ef9144ff', 
    borderRadius: 10, minWidth: 20, height: 20,
    justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 4, borderWidth: 1.5, borderColor: '#FFFFFF',
    zIndex: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 2, elevation: 3,
  },
  badgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: 'bold', textAlign: 'center' },

  footer: { alignItems: 'center', marginBottom: 20, opacity: 0.8 },
  footerText: { fontSize: 10, letterSpacing: 2, opacity: 0.6 },

  // --- MENU ---
  backdrop: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', zIndex: 1 },
  backdropTint: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15, 23, 42, 0.6)' },
  floatingMenu: {
    position: 'absolute', bottom: 100, alignSelf: 'center', width: width * 0.85,
    borderRadius: 20, borderWidth: 1.5,
    padding: 20, zIndex: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.5, shadowRadius: 20, elevation: 25,
  },
  menuHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  menuTitle: { fontSize: 12, fontWeight: '900', letterSpacing: 1.5 },
  menuIndicator: { width: 30, height: 3, borderRadius: 2 },
  menuRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  menuLabel: { fontSize: 16, fontWeight: 'bold' },
  menuSubLabel: { fontSize: 12, marginTop: 2 },
  menuDivider: { height: 1, marginVertical: 15 },
  menuButtonExit: { backgroundColor: 'rgba(239, 68, 68, 0.15)', paddingVertical: 14, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.5)' },
  menuButtonText: { color: '#e91717ff', fontWeight: '900', fontSize: 14, letterSpacing: 1 },
});

export default HomeScreen;