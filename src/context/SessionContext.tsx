// ARQUIVO: src/context/SessionContext.tsx

import React, { createContext, useContext, useState, ReactNode } from 'react';

// Interface para dados de sessão
interface SessionData {
  userName: string;
  userFilial: number;
  accessToken: string;
  userMatricula: string; 
}

// Interface para dados do scanner
interface ScannedData {
  code: string;
  timestamp: number; 
}

// Interface para o contexto
interface SessionContextType {
  sessionData: SessionData;
  setSessionData: (data: SessionData) => void;
  updateSessionData: (partial: Partial<SessionData>) => void;
  scannedData: ScannedData | null;
  setScannedData: (data: ScannedData | null) => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [sessionData, setSessionData] = useState<SessionData>({
    userName: '',
    userFilial: 0,
    accessToken: '',
    userMatricula: '', // Inicializa vazio
  });

  const [scannedData, setScannedData] = useState<ScannedData | null>(null);

  const updateSessionData = (partial: Partial<SessionData>) => {
    setSessionData(prev => ({
      ...prev,
      ...partial,
    }));
    console.log('🔄 SessionContext atualizado:', partial);
  };

  return (
    <SessionContext.Provider value={{ sessionData, setSessionData, updateSessionData, scannedData, setScannedData }}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession deve ser usado dentro de SessionProvider');
  }
  return context;
};