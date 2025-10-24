import axios from 'axios';

// Acessa a variável de ambiente definida no .env (Vite requer o prefixo VITE_)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL; 

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Exemplo de uso: apiClient.get('/pedidos')