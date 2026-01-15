// ARQUIVO: src/context/AuthContext.tsx
import React, { createContext, useState, useContext } from 'react';

// Define o formato dos dados que vamos guardar
interface AuthData {
  token: string;
  userName: string;
  userFilial: number;
}

interface AuthContextData {
  authData: AuthData | null;
  signIn: (data: AuthData) => void;
  signOut: () => void;
}

// Cria o contexto
const AuthContext = createContext<AuthContextData>({} as AuthContextData);


export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authData, setAuthData] = useState<AuthData | null>(null);

  const signIn = (data: AuthData) => {
    setAuthData(data);
    console.log('Sessão iniciada no Contexto:', data);
  };

  const signOut = () => {
    setAuthData(null);
  };

  return (
    <AuthContext.Provider value={{ authData, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

// Um Hook simples para usar os dados em qualquer ecrã
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};