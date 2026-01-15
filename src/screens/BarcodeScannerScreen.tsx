// ARQUIVO: BarcodeScannerScreen.tsx

import React, { useCallback, useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Platform,
  Alert,
  Linking,
  ActivityIndicator,
} from 'react-native';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  useCodeScanner,
  Code,
} from 'react-native-vision-camera';
import { useIsFocused } from '@react-navigation/native';
import { ArrowLeft, Keyboard } from 'phosphor-react-native';
import { COLORS } from '../theme/colors';
import { useSession } from '../context/SessionContext';

import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';

// --- Componente de Overlay para Permissão ---
const PermissionsOverlay: React.FC<{ requestPermission: () => Promise<boolean> }> = ({
  requestPermission,
}) => {
  const handleRequestPermission = useCallback(async () => {
    const granted = await requestPermission();
    if (!granted) {
      Alert.alert(
        'Permissão Negada',
        'Por favor, habilite a permissão da câmera nas configurações.',
        [
          { text: 'Cancelar' },
          { text: 'Abrir Configurações', onPress: () => Linking.openSettings() },
        ],
      );
    }
  }, [requestPermission]);

  return (
    <View style={styles.centerContainer}>
      <Text style={styles.permissionText}>
        O GestãoV precisa de acesso à câmera para ler códigos de barras.
      </Text>
      <TouchableOpacity style={styles.permissionButton} onPress={handleRequestPermission}>
        <Text style={styles.permissionButtonText}>Conceder Permissão</Text>
      </TouchableOpacity>
    </View>
  );
};

// --- Componente Principal ---
type BarcodeScannerScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'BarcodeScanner'
>;

const BarcodeScannerScreen: React.FC<BarcodeScannerScreenProps> = ({
  route,
  navigation,
}) => {
 
  const { sessionData, setScannedData } = useSession();
  
  
  const params = (route.params || {}) as any;
  
  const { 
    accessToken = sessionData.accessToken, 
    userName = sessionData.userName, 
    userFilial = sessionData.userFilial, 
    isFromPendente = false 
  } = params;

  // Hooks da Vision Camera
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('back');
  const isFocused = useIsFocused();
 
  const [isCodeRead, setIsCodeRead] = useState(false);

  // Hook do Leitor de Códigos
  const codeScanner = useCodeScanner({
    codeTypes: ['ean-13', 'qr', 'code-128'],
    onCodeScanned: (codes: Code[]) => {
      // Previne a navegação múltipla se vários códigos forem lidos
      if (isCodeRead || !isFocused) {
        return;
      }

      const code = codes[0]?.value;
      if (code) {
        setIsCodeRead(true);
        console.log('📸 Código lido:', code);
        console.log('📸 Enviando com dados:', { accessToken, userName, userFilial });
       
        setScannedData({
          code: code,
          timestamp: Date.now(),
        });

        // Volta para a tela anterior (DoActivities)
        navigation.goBack();
      }
    },
  });

  // Efeito para reativar o scanner
  useEffect(() => {
    if (isFocused) {
      setIsCodeRead(false);
    }
  }, [isFocused]);

  // --- Renderização ---

  // 1. A carregar permissão ou dispositivo
  if (!hasPermission) {
    return (
      <View style={styles.container}>
        <PermissionsOverlay requestPermission={requestPermission} />
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft size={28} color={COLORS.white} weight="bold" />
        </TouchableOpacity>
      </View>
    );
  }

  // 2. Sem dispositivo de câmara
  if (device == null) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.permissionText}>
          Nenhum dispositivo de câmera foi encontrado.
        </Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft size={28} color={COLORS.white} weight="bold" />
        </TouchableOpacity>
      </View>
    );
  }

  // 3. Câmera Pronta (mas a carregar)
  if (!isFocused) {
      return (
          <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color={COLORS.primaryBlue} />
          </View>
      );
  }

  // 4. Câmera Ativa
  return (
    <View style={styles.container}>
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={true}
        codeScanner={codeScanner}
        enableZoomGesture
      />

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <ArrowLeft size={28} color={COLORS.white} weight="bold" />
      </TouchableOpacity>

      <View style={styles.scanFrameContainer}>
        <View style={styles.scanFrame} />
      </View>

      <Text style={styles.scanHelpText}>
        Aponte a câmera para o código de barras
      </Text>

      {/* Botão de Digitação Manual - Oculto para Atividades Pendentes */}
      {!isFromPendente && (
        <TouchableOpacity
          style={styles.manualInputButton}
          onPress={() =>
            Alert.alert(
              'Confirmação',
              'Tem certeza que deseja inserir o código do produto manualmente? Essa ação será registrada como uma entrada manual.',
              [
                {
                  text: 'Cancelar',
                  style: 'cancel',
                },
                {
                  text: 'Confirmar',
                  onPress: () => {
                    // Navega para a tela de atividades, passando o parâmetro
                    // para habilitar a entrada manual.
                    navigation.navigate('MainTabs' as any, {
                      screen: 'DoActivities',
                      params: {
                        enableManualInput: true,
                        accessToken: accessToken,
                        userName: userName,
                        userFilial: userFilial,
                      },
                      merge: true,
                    });
                  },
                },
              ],
            )
          }
        >
          <Keyboard size={28} color={COLORS.white} weight="bold" />
          <Text style={styles.manualInputButtonText}>Digitar Código</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

// --- Estilos ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: 'black',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
    padding: 20,
  },
  permissionText: {
    color: 'white',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
  permissionButton: {
    backgroundColor: COLORS.primaryBlue,
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 10,
  },
  permissionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 20,
    zIndex: 10,
    padding: 10,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 25,
  },
  scanFrameContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  scanFrame: {
    width: '80%',
    height: '30%',
    borderColor: 'white',
    borderWidth: 2,
    borderRadius: 20,
  },
  scanHelpText: {
    position: 'absolute',
    bottom: '20%',
    width: '100%',
    textAlign: 'center',
    color: 'white',
    fontSize: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingVertical: 10,
    zIndex: 5,
  },
  manualInputButton: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryBlue,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    zIndex: 10,
  },
  manualInputButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
});

export default BarcodeScannerScreen;