// ARQUIVO: src/screens/PendingActivitiesScreen.tsx

import React, { useState, useRef, useCallback } from 'react';
import {
  SafeAreaView, View, Text, StyleSheet, FlatList, ActivityIndicator,
  Animated, TouchableOpacity, Platform, Alert, StatusBar, Image
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
// ✅ Importando o WarningCircle (Exclamação redonda)
import { ArrowLeft, Barcode, CheckCircle, Clock, Package, WarningCircle } from 'phosphor-react-native'; 
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { TabParamList } from '../navigation/AppNavigator';
import { useFocusEffect } from '@react-navigation/native';
import { getPendingActivities, setAuthToken, ApiPendingActivity } from '../services/api';
import { useSession } from '../context/SessionContext';
import { useTheme } from '../context/ThemeContext';

const imgLogo = require('../assets/images/DDBranco.png');

interface PendingActivity {
  id: string;
  productCode: number; 
  productName: string;
  creationDate: string;
  activityType: string;
  productEAN: string; 
}

type PendingActivitiesScreenProps = BottomTabScreenProps<TabParamList, 'PendingActivities'>;

// Componente de Item (Card)
const ActivityItem: React.FC<{ item: PendingActivity; onPressRealizar: (item: PendingActivity) => void; index: number; theme: any; isDark: boolean }> = ({ item, onPressRealizar, index, theme, isDark }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;
    
    React.useEffect(() => {
        Animated.parallel([ 
          Animated.timing(fadeAnim, { toValue: 1, duration: 500, delay: index * 100, useNativeDriver: true }), 
          Animated.spring(slideAnim, { toValue: 0, friction: 6, tension: 40, delay: index * 100, useNativeDriver: true }) 
        ]).start();
    }, []);

    const cardStyle = { 
        backgroundColor: theme.surface,
        borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'
    };
    const textColor = { color: theme.text };
    const textSecColor = { color: theme.textSec };

    return (
      <Animated.View style={[styles.cardContainer, cardStyle, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        
        <View style={styles.statusLine} />

        <View style={styles.cardContent}>
          
          <View style={styles.cardHeader}>
            <View style={styles.typeBadge}>
              <WarningCircle size={14} color="#F59E0B" weight="fill" style={{marginRight: 4}} />
              <Text style={styles.typeText}>{item.activityType}</Text>
            </View>
            <View style={styles.dateContainer}>
              <Clock size={14} color={isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.4)"} style={{marginRight: 4}}/>
              <Text style={[styles.dateText, textSecColor]}>{item.creationDate}</Text>
            </View>
          </View>

          <Text style={[styles.productName, textColor]} numberOfLines={2}>{item.productName}</Text>
          
          <View style={styles.techDataRow}>
            <Barcode size={16} color={theme.accent} style={{marginRight: 6}} />
            <Text style={[styles.eanText, { color: theme.accent }]}>{item.productEAN}</Text>
          </View>

        </View>

        <TouchableOpacity 
          activeOpacity={0.8} 
          onPress={() => onPressRealizar(item)}
          style={styles.resolveButtonContainer}
        >
          <LinearGradient
            colors={['#F59E0B', '#dbab0bff']} 
            style={styles.resolveButton}
          >
            {/* ✅ ÍCONE: WarningCircle (Exclamação circular, mais moderna) */}
            <WarningCircle size={28} color="#FFF" weight="bold" />
          </LinearGradient>
        </TouchableOpacity>

      </Animated.View>
    );
};

const PendingActivitiesScreen: React.FC<PendingActivitiesScreenProps> = ({ route, navigation }) => {
  const [activities, setActivities] = useState<PendingActivity[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  const { sessionData } = useSession();
  const { accessToken, userFilial, userName } = sessionData;
  const { theme, isDark } = useTheme();

  const fetchActivities = useCallback(async () => {
    if (!accessToken || !userFilial) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setAuthToken(accessToken); 
      const apiData: ApiPendingActivity[] = await getPendingActivities(userFilial);
      const formattedData: PendingActivity[] = apiData.map(item => ({
        id: item.id,
        productCode: item.codigo_produto,
        productName: item.descricao_produto,
        creationDate: item.data_criacao
          ? new Date(item.data_criacao).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric'}) 
          : 'N/A',
        activityType: item.tipo_atividade,
        productEAN: item.cod_ean || 'N/A',
      }));
      setActivities(formattedData);
    } catch (error: any) {
      console.error('Erro no refresh:', error);
    } finally {
      setLoading(false);
    }
  }, [accessToken, userFilial]);

  useFocusEffect(useCallback(() => { fetchActivities(); }, [fetchActivities]));

  const handleRealizarPress = (item: PendingActivity) => {
    navigation.navigate('DoActivities', {
      product: item,
      scannedCode: item.productEAN, 
      accessToken: accessToken,
      userName: userName,     
      userFilial: userFilial
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor="transparent" translucent />
      
      <LinearGradient
        colors={theme.gradient}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <SafeAreaView style={styles.safeArea}>
        
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.navigate('Home' as any)} style={styles.backButton}>
            <ArrowLeft color={isDark ? "#FFF" : theme.text} size={24} weight="bold" />
          </TouchableOpacity>
          
          <View style={styles.headerCenter}>
            <Image 
              source={imgLogo} 
              style={[styles.headerLogo, !isDark && { tintColor: theme.text }]} 
              resizeMode="contain" 
            />
            <Text style={[styles.headerSubtitle, { color: theme.accent }]}>{activities.length} Itens na fila</Text>
          </View>
          <View style={{width: 40}} /> 
        </View>

        {loading && activities.length === 0 ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={theme.accent} />
            <Text style={[styles.loadingText, { color: theme.textSec }]}>Sincronizando tarefas...</Text>
          </View>
        ) : (
          <FlatList
            data={activities}
            renderItem={({ item, index }) => (
                <ActivityItem item={item} onPressRealizar={handleRealizarPress} index={index} theme={theme} isDark={isDark} />
            )}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            refreshing={loading}
            onRefresh={fetchActivities}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Package size={64} color={theme.textSec} weight="duotone" />
                <Text style={[styles.emptyTitle, { color: theme.text }]}>Tudo Limpo!</Text>
                <Text style={[styles.emptySubtitle, { color: theme.textSec }]}>Não há atividades pendentes para esta filial.</Text>
              </View>
            }
          />
        )}
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, paddingTop: Platform.OS === 'android' ? 40 : 20 },
  
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 20 },
  backButton: { padding: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12 },
  headerCenter: { alignItems: 'center' },
  headerLogo: { width: 130, height: 40 },
  headerSubtitle: { fontSize: 12, fontWeight: 'bold', letterSpacing: 0.5, textAlign: 'center', marginTop: 0 },

  listContent: { paddingHorizontal: 20, paddingBottom: 100 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 14 },

  cardContainer: { flexDirection: 'row', borderRadius: 16, marginBottom: 16, borderWidth: 1, overflow: 'hidden', alignItems: 'center' },
  statusLine: { width: 4, height: '100%', backgroundColor: '#F59E0B' },
  cardContent: { flex: 1, padding: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  typeBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(245, 158, 11, 0.15)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  typeText: { color: '#F59E0B', fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },
  dateContainer: { flexDirection: 'row', alignItems: 'center' },
  dateText: { fontSize: 12, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  productName: { fontSize: 16, fontWeight: '700', lineHeight: 22, marginBottom: 8 },
  techDataRow: { flexDirection: 'row', alignItems: 'center' },
  eanText: { fontSize: 14, fontWeight: '500', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', letterSpacing: 1 },
  
  resolveButtonContainer: { paddingRight: 16 },
  resolveButton: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', shadowColor: '#10B981', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },

  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', marginTop: 16 },
  emptySubtitle: { fontSize: 14, textAlign: 'center', marginTop: 8, width: '70%' },
});

export default PendingActivitiesScreen;