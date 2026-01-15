import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage'; // ✅ Importar AsyncStorage

// Definição das Cores
export const darkTheme = {
  gradient: ['#4B6DCC', '#4A53BB', '#2E357B'], // Gradiente Escuro
  background: '#2E357B',
  surface: 'rgba(255, 255, 255, 0.1)',
  text: '#FFFFFF',
  textSec: 'rgba(255,255,255,0.7)',
  accent: '#60A5FA',
  contrast: '#4A53BB',
  statusDot: '#00FF9D',
};

export const lightTheme = {
  gradient: ['#F8FAFC', '#E2E8F0', '#CBD5E1'], // Gradiente Claro
  background: '#F1F5F9',
  surface: '#FFFFFF',
  text: '#1E293B',
  textSec: '#64748B',
  accent: '#2563EB',
  contrast: '#FFFFFF',
  statusDot: '#059669',
};

type ThemeType = typeof darkTheme;

interface ThemeContextData {
  theme: ThemeType;
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextData>({} as ThemeContextData);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  // Estado inicial padrão (pode ser true ou false, vai ser atualizado logo em seguida)
  const [isDark, setIsDark] = useState(true);

  // 1. Carregar tema salvo ao iniciar o app
  useEffect(() => {
    async function loadTheme() {
      try {
        const savedTheme = await AsyncStorage.getItem('@gestaov:theme');
        if (savedTheme !== null) {
          // Se tiver algo salvo, usa o valor (se for 'dark', seta truee)
          setIsDark(savedTheme === 'dark');
        }
      } catch (error) {
        console.log('Erro ao carregar tema:', error);
      }
    }
    loadTheme();
  }, []);

  // 2. Função para alternar e SALVAR a escolha
  const toggleTheme = async () => {
    const newMode = !isDark;
    setIsDark(newMode);
    try {
      await AsyncStorage.setItem('@gestaov:theme', newMode ? 'dark' : 'light');
    } catch (error) {
      console.log('Erro ao salvar tema:', error);
    }
  };

  const theme = isDark ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);