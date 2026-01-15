// ARQUIVO: App.tsx

import React from 'react';
// Navegação
import AppNavigator from './src/navigation/AppNavigator';

// Importação dos Contextos (Sessão e Tema)
import { SessionProvider } from './src/context/SessionContext';
import { ThemeProvider } from './src/context/ThemeContext';

const App: React.FC = () => {
  return (
    // 1. O Provedor de Sessão guarda o login do usuário
    <SessionProvider>
      
      {/* 2. O Provedor de Tema guarda as cores (Dark/Light) */}
      <ThemeProvider>
        
        {/* 3. O Navegador gerencia as telas */}
        <AppNavigator />
        
      </ThemeProvider>
      
    </SessionProvider>
  );
};

export default App;