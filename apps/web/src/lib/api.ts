import axios from 'axios';

export const api = axios.create({
  baseURL: 'http://localhost:3333',
});

// Interceptor para incluir o token JWT em requisições autenticadas
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('saas_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});