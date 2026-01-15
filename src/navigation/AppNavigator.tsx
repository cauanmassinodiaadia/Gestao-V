// ARQUIVO: src/navigation/AppNavigator.tsx

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator, NativeStackScreenProps } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Alert } from 'react-native';

// Importa todos os ecrãs
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import PendingActivitiesScreen from '../screens/PendingActivitiesScreen';
import DoActivitiesScreen from '../screens/DoActivitiesScreen';
import BarcodeScannerScreen from '../screens/BarcodeScannerScreen';


import CustomTabBar from '../components/CustomTabBar'; 

import { SessionProvider, useSession } from '../context/SessionContext';

// --- DEFINIÇÃO DE TIPOS ---

// Tipagem para o navegador principal (Stack)
export type RootStackParamList = {
  Login: undefined;
  MainTabs: {
    accessToken: string;
    userName: string;
    userFilial: number; 
  };
  BarcodeScanner: {
    accessToken?: string;
    userName?: string;
    userFilial?: number;
    scanAttempts?: number;
  };
};

// Tipagem para o navegador de abas (Tabs)
export type TabParamList = {
  PendingActivities: {
    accessToken?: string;
    userFilial?: number;
    userName?: string;
  };
  Home: { 
    userName?: string;
    userFilial?: number;
    accessToken?: string;
  };
  DoActivities: { 
    scannedCode?: string;
    accessToken?: string; 
    userName?: string;
    userFilial?: number;
    
    enableManualInput?: boolean; 
    onDataChange?: (hasData: boolean) => void;
    scanAttempts?: number;
    product?: {
      id: string;
      productCode: number;
      productName: string;
      creationDate: string;
      activityType: string;
      productEAN: string; 
    };
  };
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

// Tipagem para as props do componente MainTabs
type MainTabsProps = NativeStackScreenProps<RootStackParamList, 'MainTabs'>;

// --- COMPONENTE DE ABAS (MainTabs) ---
const MainTabs: React.FC<MainTabsProps> = ({ route, navigation }) => {
  // Acessa o contexto de sessão
  const { sessionData, setSessionData } = useSession();
  
  // Recupera parâmetros da rota ou usa o fallback da sessão
  const routeParams = route.params || {};
  const userName = routeParams.userName || sessionData.userName;
  const userFilial = routeParams.userFilial || sessionData.userFilial;
  const accessToken = routeParams.accessToken || sessionData.accessToken;
  
  // Controle de estado local para navegação segura
  const [doActivitiesHasData, setDoActivitiesHasData] = React.useState(false);

  // Sincroniza a sessão se os parâmetros da rota mudarem
  React.useEffect(() => {
    if ((routeParams.accessToken && routeParams.accessToken !== sessionData.accessToken) || 
        (routeParams.userName && routeParams.userName !== sessionData.userName)) {
      
      console.log('💾 MainTabs atualizando sessão no contexto...');
      setSessionData({
        userName: userName,
        userFilial: userFilial,
        accessToken: accessToken,
        userMatricula: '' 
      });
    }
  }, [routeParams, setSessionData, sessionData]);

  return (
    <Tab.Navigator
      
      tabBar={props => <CustomTabBar {...props} />}
      screenOptions={{ 
        headerShown: false,
        // Oculta a tab bar quando o teclado abre (bom para Android)
        tabBarHideOnKeyboard: true, 
      }}
      // Lógica de proteção ao sair da aba
      screenListeners={({ navigation, route }) => ({
        tabPress: (e) => {
          // Se o usuário está na aba 'DoActivities', tem dados não salvos e tenta sair:
          if (route.name !== 'DoActivities' && doActivitiesHasData) {
            e.preventDefault(); // Impede a troca de aba
            
            Alert.alert(
              'Descartar alterações?',
              'Você tem dados não salvos. Se sair agora, o progresso será perdido.',
              [
                { text: 'Ficar', style: 'cancel' },
                {
                  text: 'Sair',
                  style: 'destructive',
                  onPress: () => {
                    // Reseta o estado e navega manualmente
                    setDoActivitiesHasData(false);
                    navigation.navigate(route.name, route.params);
                  }
                }
              ]
            );
          }
        },
      })}
    >
      <Tab.Screen
        name="PendingActivities"
        component={PendingActivitiesScreen}
        initialParams={{ accessToken, userFilial, userName }}
        options={{ tabBarLabel: 'Pendentes' }}
      />
      
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        initialParams={{ userName, userFilial, accessToken }}
        options={{ tabBarLabel: 'Início' }}
      />
      
      <Tab.Screen
        name="DoActivities"
        component={DoActivitiesScreen}
        initialParams={{ 
          accessToken, 
          userName, 
          userFilial,
          enableManualInput: false // Valor padrão
        }}
        options={{ 
          tabBarLabel: 'Realizar'
        }}
        listeners={({ navigation }) => ({
          tabPress: () => {
            setDoActivitiesHasData(false);
          },
          blur: () => {
            setDoActivitiesHasData(false);
          },
        })}
      />
    </Tab.Navigator>
  );
};

// --- NAVIGATOR PRINCIPAL (AppNavigator) ---
const AppNavigator: React.FC = () => {
  return (
    <SessionProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="MainTabs" component={MainTabs} />
          <Stack.Screen 
            name="BarcodeScanner" 
            component={BarcodeScannerScreen}
            options={{
              presentation: 'modal', // Abre como um modal (animação de baixo para cima)
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SessionProvider>
  );
};

export default AppNavigator;