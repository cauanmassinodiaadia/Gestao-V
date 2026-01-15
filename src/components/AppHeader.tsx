
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Platform,
  Alert,
} from 'react-native';
import { ArrowLeft } from 'phosphor-react-native';
import { COLORS } from '../theme/colors';


interface AppHeaderProps {
  title: string;
  navigation: any; 
  onClearFields?: () => void; // Função opcional para limpar campos
}

const AppHeader: React.FC<AppHeaderProps> = ({ title, navigation, onClearFields }) => {
  const handleGoBack = () => {
    // Verifica se está na tela de DoActivities
    const currentRoute = navigation.getState().routes[navigation.getState().index];
    
    if (currentRoute.name === 'DoActivities') {
      // Mostra alerta de confirmação
      Alert.alert(
        'Tem certeza que deseja sair?',
        'Isso limpará o progresso.',
        [
          {
            text: 'Ficar',
            style: 'cancel',
            onPress: () => {} 
          },
          {
            text: 'Sair',
            style: 'destructive',
            onPress: () => {
              // Limpa os campos se houver função
              if (onClearFields) {
                onClearFields();
              }

              console.log('📱 Voltando para Home via AppHeader...');
              (navigation as any).jumpTo('Home');
            }
          },
        ]
      );
    } else {
      // Para outras telas, comportamento padrão
      if (navigation.canGoBack()) {
        navigation.goBack();
      }
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Botão de Voltar (A Seta) */}
        {navigation.canGoBack() || navigation.getState().routes[navigation.getState().index].name === 'DoActivities' ? (
          <TouchableOpacity style={styles.button} onPress={handleGoBack}>
            <ArrowLeft size={24} color={COLORS.textDark} weight="bold" />
          </TouchableOpacity>
        ) : (
          <View style={styles.emptySpace} /> // Espaço vazio se não houver botão
        )}

        {/* Título */}
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>

        {/* Espaço vazio para manter o título centrado */}
        <View style={styles.emptySpace} />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: COLORS.background, // Assumindo COLORS.background
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray, // Assumindo COLORS.lightGray
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: Platform.OS === 'android' ? 60 : 50,
    paddingHorizontal: 16,
  },
  button: {
    padding: 8, // Aumenta a área de clique
    minWidth: 40, // Garante que o espaço vazio e o botão tenham o mesmo tamanho
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textDark, // Assumindo COLORS.textDark
    textAlign: 'center',
    flex: 1, 
    marginHorizontal: 8, 
  },
  emptySpace: {
    width: 40, // O mesmo tamanho do botão (ícone + padding)
  },
});

export default AppHeader;