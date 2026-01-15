// ARQUIVO: src/screens/DoActivitiesScreen.tsx

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform, KeyboardTypeOptions,
  BackHandler, StatusBar, SafeAreaView, Image
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Barcode, Calendar, Hash, CheckCircle, Package, ArrowLeft, Clock, WarningCircle } from 'phosphor-react-native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { TabParamList } from '../navigation/AppNavigator';
import { getProductDetails, setAuthToken, submitActivity, getActivityById } from '../services/api';
import { useSession } from '../context/SessionContext';
import { useTheme } from '../context/ThemeContext';

const imgLogo = require('../assets/images/DDBranco.png');

type DoActivitiesScreenProps = BottomTabScreenProps<TabParamList, 'DoActivities'>;

// --- AJUDANTES ---

const formatDateMask = (text: string) => {
  const cleaned = text.replace(/\D/g, '');
  if (cleaned.length <= 2) return cleaned;
  if (cleaned.length <= 4) return `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
  return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}/${cleaned.slice(4, 8)}`;
};

const getTodayDate = () => {
  const date = new Date();
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

// Componente Input Atualizado (Com suporte a Suffix para mostrar KG)
const FormInput: React.FC<any> = ({ icon, label, placeholder, value, onChangeText, keyboardType = 'default', editable = true, maxLength, theme, isDark, suffix }) => (
  <View style={styles.inputGroup}>
    <Text style={[styles.label, { color: theme.textSec }]}>{label}</Text>
    <View style={[
        styles.inputContainer, 
        { backgroundColor: theme.surface, borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)' },
        !editable && { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', opacity: 0.8 }
    ]}>
      <View style={[styles.inputIcon, { borderRightColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]}>{icon}</View>
      <TextInput 
        style={[styles.input, { color: !editable ? theme.textSec : theme.text }]} 
        placeholder={placeholder} 
        placeholderTextColor={isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)'} 
        value={value} 
        onChangeText={onChangeText} 
        keyboardType={keyboardType} 
        editable={editable}
        maxLength={maxLength} 
      />
      {/* Exibe a unidade (kg/g) se houver */}
      {suffix && (
        <View style={styles.suffixContainer}>
            <Text style={[styles.suffixText, { color: theme.accent }]}>{suffix}</Text>
        </View>
      )}
    </View>
  </View>
);

const DoActivitiesScreen: React.FC<DoActivitiesScreenProps> = ({ route, navigation }) => {
  const { theme, isDark } = useTheme(); 

  const [productCode, setProductCode] = useState('');
  const [productDescription, setProductDescription] = useState('');
  const [quantity, setQuantity] = useState('');
  
  const [creationDate, setCreationDate] = useState(getTodayDate());
  const [validityDate, setValidityDate] = useState('');
  
  // Controles
  const [isEanEditable, setIsEanEditable] = useState(false);
  
  // Novos estados para controle de PESO
  const [isQuantityLocked, setIsQuantityLocked] = useState(false); // Trava o campo
  const [quantityUnit, setQuantityUnit] = useState(''); // Exibe kg ou g
  
  const [fromManualInput, setFromManualInput] = useState(false);
  const [isFromPendente, setIsFromPendente] = useState(false);
  const [originalEAN, setOriginalEAN] = useState('');
  const [activityId, setActivityId] = useState<string | null>(null);
  
  // Estados para Dupla Validação
  const [eaValidationStatus, setEanValidationStatus] = useState<'pending' | 'matched' | 'mismatch'>('pending'); // pending: esperando validação, matched: OK, mismatch: divergência
  const [scannedEAN, setScannedEAN] = useState(''); // Armazena o EAN escaneado para comparação
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scanAttempts, setScanAttempts] = useState(0); 

  const isOpeningScanner = useRef(false);
  const loadedProductRef = useRef<string | null>(null);
  const processedScanRef = useRef<number | null>(null);

  const { sessionData, scannedData, setScannedData } = useSession(); 
  const { accessToken, userName, userFilial } = sessionData;

  useEffect(() => { if (accessToken) setAuthToken(accessToken); }, [accessToken]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (accessToken) setAuthToken(accessToken);
    });
    return unsubscribe;
  }, [navigation, accessToken]);

  const clearFields = useCallback(() => {
    console.log('🧹 Limpando campos...');
    setProductCode(''); setProductDescription(''); setQuantity(''); 
    setCreationDate(getTodayDate());
    setValidityDate('');
    
    // Reseta travas de peso
    setIsQuantityLocked(false);
    setQuantityUnit('');

    setIsFromPendente(false); setOriginalEAN(''); setActivityId(null); setIsEanEditable(false); setFromManualInput(false);
    
    // Reseta validação dupla
    setEanValidationStatus('pending');
    setScannedEAN('');
    
    loadedProductRef.current = null; processedScanRef.current = null;
    navigation.setParams({ scannedCode: undefined, product: undefined, enableManualInput: undefined });
  }, [navigation]);

  const navigateToHomeSecurely = useCallback(() => { (navigation as any).jumpTo('Home'); }, [navigation]);

  // Lógica de Carregamento (Pendência)
  useEffect(() => {
    if (route.params?.enableManualInput === true) {
      if (!isEanEditable) { 
        setIsEanEditable(true); 
        setFromManualInput(true);
        if (!route.params?.product) {
           setProductCode(''); 
        }
      }
    }

    const p = route.params?.product;
    if (p) {
      setIsFromPendente(true);
      setActivityId(p.id);
      if (!originalEAN) setOriginalEAN(p.productEAN);

      if (p.productEAN !== loadedProductRef.current) {
        console.log('📌 Carregando Pendente (Novo):', p.productEAN);
        loadedProductRef.current = p.productEAN;

        setOriginalEAN(p.productEAN);
        setProductCode(p.productEAN);
        setProductDescription(p.productName);
        if (p.creationDate) setCreationDate(p.creationDate.split(' ')[0]);
        setQuantity(''); 
        setValidityDate('');
        
        // Reseta travas ao carregar novo produto
        setIsQuantityLocked(false);
        setQuantityUnit('');
        
        // Reseta validação ao carregar novo produto pendente
        setEanValidationStatus('pending');
        setScannedEAN('');
        
        getActivityById(p.id).then(details => { 
            if (details?.cod_ean) { 
                setOriginalEAN(details.cod_ean); 
                setProductCode(details.cod_ean); 
            } 
        }).catch(err => console.log('Erro update detalhes:', err.message));
      }
    }
  }, [route.params, isEanEditable, originalEAN, activityId]);

  // LÓGICA DO SCANNER + PESO
  useEffect(() => {
    if (!scannedData) return;
    if (scannedData.timestamp === processedScanRef.current) return;
    processedScanRef.current = scannedData.timestamp;
    
    const rawCode = scannedData.code;
    console.log('📡 Scanner leu:', rawCode);
    setScannedData(null);

    let finalCode = rawCode;
    let autoQuantity = '';
    let isWeighted = false; // Flag local para saber se é pesável

    //  LÓGICA PARA PRODUTOS PESÁVEIS (> 13 DÍGITOS)
    if (rawCode.length > 13) {
        try {
            // Extrai código interno
            const extractedCode = rawCode.substring(1, 7);
            
            // Extrai peso e converte
            const weightRaw = rawCode.substring(8, 12);
            const weightValue = parseFloat(weightRaw) / 1000;

            console.log(`⚖️ Peso detectado: ${weightValue} kg`);

            finalCode = extractedCode; 
            // Formata para string com ponto ou vírgula dependendo do locale, aqui forçamos ponto para state
            autoQuantity = weightValue.toFixed(3); 
            
            isWeighted = true;
            Alert.alert('Produto de Peso', `Peso identificado: ${weightValue} kg`);

        } catch (err) {
            console.log('Erro ao processar código pesável:', err);
        }
    }

    //  DUPLA VALIDAÇÃO: Se veio de pendente, valida o EAN escaneado
    if (isFromPendente && originalEAN) {
      const codeToCompare = finalCode.trim();
      const cleanOriginal = originalEAN.toString().trim();
      
      console.log(`🔍 Comparando: Escaneado="${codeToCompare}" vs Original="${cleanOriginal}"`);
      
      if (codeToCompare !== cleanOriginal) {
        console.log('❌ Produtos divergem!');
        setEanValidationStatus('mismatch');
        setScannedEAN(finalCode); // Armazena o código escaneado para mostrar no erro
        Alert.alert('⚠️ Produto Incorreto', `O código escaneado (${codeToCompare}) é diferente do produto selecionado (${cleanOriginal}).\n\nBipar o produto correto.`);
        return; 
      }
      
      // Match! Validação passou
      console.log('✅ Produtos coincidem!');
      setEanValidationStatus('matched');
      setScannedEAN(finalCode);
    }
    
    // Atualiza Código
    setProductCode(finalCode);
    
    
    if (isWeighted) {
        setQuantity(autoQuantity);
        setIsQuantityLocked(true); 
        setQuantityUnit('kg');     
    } else {
        // Se for produto normal, destrava (caso estivesse travado antes)
        setIsQuantityLocked(false);
        setQuantityUnit('');
    }

    handleFetchProductDetails(finalCode);

  }, [scannedData, isFromPendente, originalEAN, setScannedData]); 

  const handleScanBarcode = () => {
    isOpeningScanner.current = true;
    navigation.navigate('BarcodeScanner' as any, { accessToken, userName, userFilial, scanAttempts, isFromPendente } as any);
  };

  const handleFetchProductDetails = async (code: string) => {
    if (!code) return;
    setIsLoading(true);
    if (!isFromPendente) setProductDescription(''); 
    try {
      setAuthToken(accessToken);
      const details = await getProductDetails(code);
      if (details?.DESCRICAO) {
        setProductDescription(details.DESCRICAO);
      } else {
        if (!isFromPendente) { Alert.alert('Aviso', 'Produto sem descrição.'); setIsEanEditable(true); }
      }
    } catch (error: any) {
      if (!isFromPendente) Alert.alert('Erro', 'Produto não encontrado.');
    } finally {
      setIsLoading(false);
    }
  };

  const validateDate = (dateStr: string, fieldName: string) => {
      if (dateStr.length !== 10) return false;
      const parts = dateStr.split('/');
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10);
      const year = parseInt(parts[2], 10);
      if (month < 1 || month > 12 || day < 1 || day > 31 || year < 2000 || year > 2100) return false;
      return true;
  };

  const handleSubmit = async () => {
    
    if (isFromPendente) {
        if (eaValidationStatus === 'pending') {
            Alert.alert('Validação Pendente', 'Você precisa escanear o código do produto em mãos para confirmar a batida.');
            return;
        }
        if (eaValidationStatus === 'mismatch') {
            Alert.alert('Produto Não Validado', 'O código escaneado diverge do produto selecionado. Bipar o produto correto.');
            return;
        }
    }
    
    if (isFromPendente) {
        if (!activityId) { Alert.alert('Erro', 'ID da atividade perdido.'); return; }
        if (productCode && originalEAN && productCode !== originalEAN) { 
            Alert.alert('Erro', 'O código do produto difere da pendência selecionada.'); return; 
        }
    }
    if (!validateDate(validityDate, 'Validade')) { Alert.alert('Data Inválida', 'Preencha a Data de Validade corretamente (DD/MM/AAAA).'); return; }
    if (!validateDate(creationDate, 'Criação')) { Alert.alert('Data Inválida', 'Erro na Data de Criação.'); return; }
    if (!productCode || !quantity) { Alert.alert('Aviso', 'Preencha todos os campos.'); return; }
    
    // Trata vírgula como ponto para float
    const qty = parseFloat(quantity.toString().replace(',', '.')); 
    if (qty <= 0 || isNaN(qty)) { Alert.alert('Aviso', 'Quantidade inválida.'); return; }

    setIsSubmitting(true);
    try {
        const data = {
            usuario: userName, 
            ean: productCode, 
            quantidade: qty, 
            data_validade: validityDate,
            dt_lancamento: new Date().toISOString(), 
            cod_filial: userFilial, 
            digitado: isEanEditable, 
            atividade_id: isFromPendente ? activityId || undefined : undefined
        };
        
        await submitActivity(data);
        
        Alert.alert('Sucesso', 'Batida realizada com sucesso!', [
            { text: 'OK', onPress: () => { clearFields(); if(isFromPendente) { navigation.navigate('PendingActivities', { accessToken, userFilial, userName }); } else { navigateToHomeSecurely(); } } }
        ]);
    } catch (e: any) { Alert.alert('Erro', e.response?.data?.message || e.message || 'Falha ao salvar.'); } finally { setIsSubmitting(false); }
  };

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        const hasData = (productCode && !isFromPendente) || quantity;
        if (!hasData) { clearFields(); navigateToHomeSecurely(); return true; }
        Alert.alert('Sair?', 'Dados serão perdidos', [{ text: 'Ficar', style: 'cancel' }, { text: 'Sair', onPress: () => { clearFields(); navigateToHomeSecurely(); } }]);
        return true;
    });
    return () => sub.remove();
  }, [productCode, quantity, navigateToHomeSecurely, clearFields, isFromPendente]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('blur', () => {
      if (isOpeningScanner.current) { isOpeningScanner.current = false; return; }
      clearFields();
    });
    return unsubscribe;
  }, [navigation, clearFields]);

  const iconColor = isDark ? "#FFF" : theme.text;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor="transparent" translucent />
      <LinearGradient colors={theme.gradient} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => { clearFields(); navigateToHomeSecurely(); }} style={styles.backButton}>
             <ArrowLeft color={isDark ? '#FFF' : theme.text} size={24} weight="bold" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Image source={imgLogo} style={[styles.headerLogo, !isDark && { tintColor: theme.text }]} resizeMode="contain" />
            <Text style={[styles.headerSubtitle, { color: theme.accent }]}>{isFromPendente ? 'Resolver Pendência' : 'Nova Coleta'}</Text>
          </View>
          <View style={{ width: 40 }} /> 
        </View>

        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
            
            <View style={[styles.scanCard, { backgroundColor: theme.surface, borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]}>
              <View style={styles.scanHeaderRow}>
                <Text style={[styles.scanLabel, { color: theme.textSec }]}>CÓDIGO DO PRODUTO (EAN)</Text>
                {isFromPendente && <View style={styles.badgePendente}><Text style={styles.badgeText}>PENDENTE</Text></View>}
              </View>
              <View style={styles.scanInputRow}>
                <TextInput 
                  style={[styles.eanInput, { backgroundColor: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.5)', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', color: theme.text }, !isEanEditable && { color: theme.textSec }]} 
                  placeholder="0000000000000" placeholderTextColor={isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)'}
                  value={productCode} onChangeText={setProductCode} keyboardType="numeric" editable={isEanEditable} onSubmitEditing={() => handleFetchProductDetails(productCode)}
                />
                <TouchableOpacity style={[styles.scanButton, { backgroundColor: theme.accent, borderColor: theme.accent }]} onPress={handleScanBarcode}>
                  <Barcode size={28} color="#FFF" weight="fill" />
                </TouchableOpacity>
              </View>
              
              {/* INDICADOR DE STATUS DA VALIDAÇÃO */}
              {isFromPendente && (
                <View style={[styles.validationStatusContainer, {
                  borderTopColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                  backgroundColor: eaValidationStatus === 'matched' ? 'rgba(16, 185, 129, 0.1)' : 
                                    eaValidationStatus === 'mismatch' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.1)'
                }]}>
                  <View style={{flexDirection: 'row', alignItems: 'center'}}>
                    {eaValidationStatus === 'pending' && (
                      <>
                        <Clock size={16} color="#3B82F6" style={{marginRight: 8}} />
                        <Text style={[styles.validationStatusText, {color: '#3B82F6'}]}>Aguardando validação...</Text>
                      </>
                    )}
                    {eaValidationStatus === 'matched' && (
                      <>
                        <CheckCircle size={16} color="#10B981" weight="fill" style={{marginRight: 8}} />
                        <Text style={[styles.validationStatusText, {color: '#10B981'}]}>Produto validado com sucesso!</Text>
                      </>
                    )}
                    {eaValidationStatus === 'mismatch' && (
                      <>
                        <WarningCircle size={16} color="#EF4444" weight="fill" style={{marginRight: 8}} />
                        <Text style={[styles.validationStatusText, {color: '#EF4444'}]}>Produto não corresponde!</Text>
                      </>
                    )}
                  </View>
                </View>
              )}
            </View>

            {isLoading ? (
              <View style={styles.loadingContainer}><ActivityIndicator color={theme.accent} size="large" /><Text style={[styles.loadingText, { color: theme.text }]}>Buscando produto...</Text></View>
            ) : (
              productDescription ? (
                <View style={styles.productCard}>
                  <View style={styles.productIconContainer}><Package size={32} color="#4B6DCC" weight="duotone" /></View>
                  <View style={styles.productInfo}><Text style={styles.productLabel}>PRODUTO IDENTIFICADO</Text><Text style={styles.productName}>{productDescription}</Text></View>
                  <CheckCircle size={24} color="#10B981" weight="fill" style={{marginTop: 5}}/>
                </View>
              ) : (
                <View style={[styles.productCard, styles.productCardEmpty, { backgroundColor: theme.surface, borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]}><Text style={[styles.emptyText, { color: theme.textSec }]}>Nenhum produto selecionado</Text></View>
              )
            )}

            <View style={styles.formSection}>
              {/*  CAMPO QUANTIDADE: Recebe 'editable' baseado no travamento e 'suffix' para kg */}
              <FormInput 
                icon={<Hash size={20} color={iconColor} />} 
                label="QUANTIDADE" 
                placeholder="Ex: 10" 
                value={quantity} 
                onChangeText={setQuantity} 
                keyboardType="numeric" 
                theme={theme} 
                isDark={isDark} 
                editable={!isQuantityLocked} // Bloqueia se for pesável
                suffix={quantityUnit}        // Mostra "kg" se tiver unidade
              />
              
              <View style={styles.row}>
                <View style={styles.halfCol}>
                  <FormInput icon={<Calendar size={20} color={iconColor} />} label="VALIDADE" placeholder="DD/MM/AAAA" value={validityDate} onChangeText={(text: string) => setValidityDate(formatDateMask(text))} keyboardType="numeric" maxLength={10} theme={theme} isDark={isDark} />
                </View>
                <View style={{width: 15}} />
                <View style={styles.halfCol}>
                  <FormInput icon={<Calendar size={20} color={iconColor} />} label="LANÇAMENTO" placeholder="DD/MM/AAAA" value={creationDate} onChangeText={(text: string) => setCreationDate(formatDateMask(text))} keyboardType="numeric" maxLength={10} theme={theme} isDark={isDark} editable={false} />
                </View>
              </View>
            </View>

            <TouchableOpacity 
              style={[
                styles.submitButton, 
                (isSubmitting || (isFromPendente && eaValidationStatus !== 'matched')) && styles.submitButtonDisabled
              ]} 
              onPress={handleSubmit} 
              disabled={isSubmitting || (isFromPendente && eaValidationStatus !== 'matched')} 
              activeOpacity={0.8}
            >
              <LinearGradient colors={['#10B981', '#059669']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.submitGradient}>
                {isSubmitting ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <>
                    <CheckCircle size={24} color="#FFF" weight="bold" style={{marginRight: 10}} />
                    <Text style={styles.submitButtonText}>
                      {isFromPendente && eaValidationStatus === 'pending' ? 'ESCANEAR PARA VALIDAR' : 'CONFIRMAR BATIDA'}
                    </Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
            <View style={{height: 100}} /> 
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, paddingTop: Platform.OS === 'android' ? 40 : 20 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 20 },
  headerCenter: { alignItems: 'center' },
  headerLogo: { width: 130, height: 40 },
  headerSubtitle: { fontSize: 12, fontWeight: 'bold', textAlign: 'center', letterSpacing: 1, marginTop: 0 },
  backButton: { padding: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12 },
  scrollContainer: { paddingHorizontal: 20 },
  scanCard: { borderRadius: 16, padding: 16, borderWidth: 1, marginBottom: 16 },
  scanHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  scanLabel: { fontSize: 11, fontWeight: 'bold', letterSpacing: 1 },
  badgePendente: { backgroundColor: 'rgba(245, 158, 11, 0.2)', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 4, borderWidth: 1, borderColor: 'rgba(245, 158, 11, 0.5)' },
  badgeText: { color: '#FBBF24', fontSize: 10, fontWeight: 'bold' },
  scanInputRow: { flexDirection: 'row', alignItems: 'center' },
  eanInput: { flex: 1, height: 55, borderTopLeftRadius: 12, borderBottomLeftRadius: 12, paddingHorizontal: 16, fontSize: 18, fontWeight: 'bold', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', borderWidth: 1, borderRightWidth: 0 },
  scanButton: { height: 55, width: 60, borderTopRightRadius: 12, borderBottomRightRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  
  // Estilos para Status de Validação
  validationStatusContainer: { marginTop: 12, borderTopWidth: 1, paddingTop: 12, paddingBottom: 8, paddingHorizontal: 0, borderRadius: 8 },
  validationStatusText: { fontSize: 13, fontWeight: '600', marginLeft: 0 },
  loadingContainer: { height: 80, justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  loadingText: { marginTop: 8, fontSize: 12 },
  productCard: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, alignItems: 'flex-start', marginBottom: 24, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 5 },
  productCardEmpty: { justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderStyle: 'dashed' },
  emptyText: { fontSize: 14, fontStyle: 'italic' },
  productIconContainer: { width: 48, height: 48, backgroundColor: 'rgba(75, 109, 204, 0.1)', borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  productInfo: { flex: 1 },
  productLabel: { color: '#64748B', fontSize: 10, fontWeight: 'bold', letterSpacing: 1, marginBottom: 4 },
  productName: { color: '#1E293B', fontSize: 16, fontWeight: 'bold', lineHeight: 22 },
  formSection: { marginBottom: 24 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 12, fontWeight: 'bold', marginBottom: 8, marginLeft: 4 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1, height: 56 },
  inputIcon: { width: 50, justifyContent: 'center', alignItems: 'center', borderRightWidth: 1, height: '100%' },
  input: { flex: 1, fontSize: 16, paddingHorizontal: 16, fontWeight: '500' },
  
  // Estilo para o Sufixo (Unidade KG/G)
  suffixContainer: { height: '100%', justifyContent: 'center', paddingRight: 16, borderLeftWidth: 1, borderLeftColor: 'rgba(0,0,0,0.05)' },
  suffixText: { fontSize: 14, fontWeight: 'bold' },

  row: { flexDirection: 'row', justifyContent: 'space-between' },
  halfCol: { flex: 1 },
  submitButton: { shadowColor: '#10B981', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 },
  submitButtonDisabled: { opacity: 0.7 },
  submitGradient: { height: 60, borderRadius: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  submitButtonText: { color: '#FFF', fontSize: 18, fontWeight: '900', letterSpacing: 1 },
});

export default DoActivitiesScreen;