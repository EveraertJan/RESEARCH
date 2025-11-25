import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

const API_BASE_URL = Constants.expoConfig?.extra?.apiUrl || 'https://api.tastbaar.studio';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
apiClient.interceptors.response.use(
  (response) => {
    if (response.data && response.data.status === 'success') {
      return { ...response, data: response.data.data };
    }
    return response;
  },
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired, clear storage
      await SecureStore.deleteItemAsync('token');
      await SecureStore.deleteItemAsync('user');
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: async (email, password) => {
    const response = await apiClient.post('/users/login', { email, password });
    return response.data;
  },
  register: async (email, password, name) => {
    const response = await apiClient.post('/users/register', { email, password, name });
    return response.data;
  },
  logout: async () => {
    await SecureStore.deleteItemAsync('token');
    await SecureStore.deleteItemAsync('user');
  },
};

// Projects API
export const projectsAPI = {
  getAll: async () => {
    const response = await apiClient.get('/projects');
    return response.data;
  },
  getById: async (id) => {
    const response = await apiClient.get(`/projects/${id}`);
    return response.data;
  },
  create: async (projectData) => {
    const response = await apiClient.post('/projects', projectData);
    return response.data;
  },
  update: async (id, projectData) => {
    const response = await apiClient.put(`/projects/${id}`, projectData);
    return response.data;
  },
  delete: async (id) => {
    const response = await apiClient.delete(`/projects/${id}`);
    return response.data;
  },
};

// Chat API
export const chatAPI = {
  getMessages: async (projectId, stackId) => {
    const response = await apiClient.get(`/projects/${projectId}/stacks/${stackId}/messages`);
    return response.data;
  },
  sendMessage: async (projectId, stackId, message) => {
    const response = await apiClient.post(`/projects/${projectId}/stacks/${stackId}/messages`, {
      content: message,
    });
    return response.data;
  },
};

// Images API
export const imagesAPI = {
  getAll: async (projectId) => {
    const response = await apiClient.get(`/projects/${projectId}/images`);
    return response.data;
  },
  upload: async (projectId, formData) => {
    const response = await apiClient.post(`/projects/${projectId}/images`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  delete: async (projectId, imageId) => {
    const response = await apiClient.delete(`/projects/${projectId}/images/${imageId}`);
    return response.data;
  },
};

export default apiClient;
