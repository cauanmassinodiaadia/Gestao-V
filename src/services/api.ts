// ARQUIVO: src/services/api.ts

import axios from 'axios';

const api = axios.create({
  
  baseURL: 'http://10.12.3.9:5018/api', 
});

api.interceptors.request.use(async config => {
  if (config.headers.Authorization) { return config; }
  return config;
}, error => { Promise.reject(error); });

export const setAuthToken = (token: string | null) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

// Interfaces
export interface ApiPendingActivity {
  id: string;
  codigo_produto: number;
  descricao_produto: string; 
  data_criacao: string | null;
  tipo_atividade: string;
  cod_ean: string; 
}

export interface ApiProductDetails {
  DESCRICAO: string; 
  COD_EAN: string;
  CODPROD_CONSINCO: number;
}

export interface SubmitActivityData {
  usuario: string;
  ean: string;
  quantidade: number;
  data_validade: string;
  dt_lancamento: string;
  cod_filial: number;
  digitado?: boolean;
  atividade_id?: string;
}

// --- AJUDANTES DE DATA ---
const formatDateToISO = (dateStr: string): string => {
  if (dateStr.includes('-')) return dateStr;
  const numbers = dateStr.replace(/\D/g, '');
  if (numbers.length === 8) {
    const day = numbers.substring(0, 2);
    const month = numbers.substring(2, 4);
    const year = numbers.substring(4, 8);
    return `${year}-${month}-${day}`;
  }
  return dateStr;
};

// --- ROTAS DA API ---

export const getPendingActivities = async (filial: number): Promise<ApiPendingActivity[]> => {
  const response = await api.get(`/activities/pending/${filial}`);
  return response.data;
};

export const getActivityById = async (id: string): Promise<ApiPendingActivity> => {
  const response = await api.get(`/activities/${id}`);
  return response.data;
};

export const getProductDetails = async (productCode: string): Promise<ApiProductDetails> => {
  const response = await api.get(`/products/${productCode}`); 
  return response.data;
};

export const submitActivity = async (data: SubmitActivityData): Promise<any> => {
  if (data.atividade_id) {
    const patchPayload = {
      quantidade_realizacao: data.quantidade,
      usuario_realizacao: data.usuario,
      datavalidade_execucao: formatDateToISO(data.data_validade)
    };
    const response = await api.patch(`/activities/${data.atividade_id}`, patchPayload);
    return response.data;
  } else {
    const postPayload = {
      usuario: data.usuario,
      ean: data.ean,
      quantidade: data.quantidade,
      data_validade: formatDateToISO(data.data_validade), 
      dt_lancamento: formatDateToISO(data.dt_lancamento),
      cod_filial: data.cod_filial,
      batida_manual: !!data.digitado 
    };
    const response = await api.post('/batidas', postPayload);
    return response.data;
  }
};

// FUNÇÃO DE LOGOUT (PATCH)
export const logoutSession = async (matricula: string): Promise<void> => {
  if (!matricula) {
    console.warn("Tentativa de logout sem matrícula");
    return;
  }
  console.log(`🚪 Encerrando sessão para matrícula: ${matricula}`);
  // Rota conforme documentação: PATCH /api/sessions/
  await api.patch('/sessions/', { number_registration: matricula });
};

export default api;