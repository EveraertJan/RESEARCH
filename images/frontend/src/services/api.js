import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL;

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => {
    if (response.data && response.data.status === 'success') {
      return { ...response, data: response.data.data };
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    const errorMessage = error.response?.data?.message || 'An error occurred';
    return Promise.reject(new Error(errorMessage));
  }
);

export default apiClient;

export const authAPI = {
  login: (credentials) => apiClient.post('/users/login', credentials),
  register: (userData) => apiClient.post('/users/register', userData),
  getProfile: () => apiClient.get('/users/profile'),
  updateProfile: (data) => apiClient.put('/users/profile', data),
  changePassword: (data) => apiClient.put('/users/password', data)
};

export const projectAPI = {
  getAll: () => apiClient.get('/projects'),
  getById: (id) => apiClient.get(`/projects/${id}`),
  create: (data) => apiClient.post('/projects', data),
  update: (id, data) => apiClient.put(`/projects/${id}`, data),
  delete: (id) => apiClient.delete(`/projects/${id}`),
  getCollaborators: (projectId) => apiClient.get(`/projects/${projectId}/collaborators`),
  addCollaborator: (projectId, email) => apiClient.post(`/projects/${projectId}/collaborators`, { email }),
  removeCollaborator: (projectId, collaboratorId) =>
    apiClient.delete(`/projects/${projectId}/collaborators/${collaboratorId}`)
};

export const stackAPI = {
  getByProject: (projectId) => apiClient.get(`/stacks/project/${projectId}`),
  getById: (stackId) => apiClient.get(`/stacks/${stackId}`)
};

export const insightAPI = {
  getByStack: (stackId, params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.tagIds && params.tagIds.length > 0) {
      params.tagIds.forEach(id => queryParams.append('tagIds', id));
    }
    if (params.search) {
      queryParams.append('search', params.search);
    }
    const queryString = queryParams.toString();
    return apiClient.get(`/insights/stack/${stackId}${queryString ? '?' + queryString : ''}`);
  },
  search: (stackId, query) => apiClient.get(`/insights/stack/${stackId}/search?q=${encodeURIComponent(query)}`),
  update: (insightId, content) => apiClient.put(`/insights/${insightId}`, { content }),
  delete: (insightId) => apiClient.delete(`/insights/${insightId}`),
  linkDocument: (insightId, documentId) => apiClient.post(`/insights/${insightId}/documents/${documentId}`),
  unlinkDocument: (insightId, documentId) => apiClient.delete(`/insights/${insightId}/documents/${documentId}`),
  getDocuments: (insightId) => apiClient.get(`/insights/${insightId}/documents`)
};

export const tagAPI = {
  getByProject: (projectId) => apiClient.get(`/tags/project/${projectId}`),
  create: (projectId, data) => apiClient.post(`/tags/project/${projectId}`, data),
  update: (tagId, data) => apiClient.put(`/tags/${tagId}`, data),
  delete: (tagId) => apiClient.delete(`/tags/${tagId}`),
  addToInsight: (insightId, tagId) => apiClient.post(`/tags/insight/${insightId}/tag/${tagId}`),
  removeFromInsight: (insightId, tagId) => apiClient.delete(`/tags/insight/${insightId}/tag/${tagId}`)
};

export const imageAPI = {
  getByStack: (stackId, params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.tagIds && params.tagIds.length > 0) {
      params.tagIds.forEach(id => queryParams.append('tagIds', id));
    }
    const queryString = queryParams.toString();
    return apiClient.get(`/images/stack/${stackId}${queryString ? '?' + queryString : ''}`);
  },
  upload: (stackId, formData) => {
    return axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    }).post(`/images/stack/${stackId}`, formData);
  },
  getFileUrl: (filename) => `${API_BASE_URL}/uploads/images/${filename}`,
  delete: (imageId) => apiClient.delete(`/images/${imageId}`),
  addTag: (imageId, tagId) => apiClient.post(`/images/${imageId}/tags/${tagId}`),
  removeTag: (imageId, tagId) => apiClient.delete(`/images/${imageId}/tags/${tagId}`)
};

export const documentAPI = {
  getByStack: (stackId, params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.tagIds && params.tagIds.length > 0) {
      params.tagIds.forEach(id => queryParams.append('tagIds', id));
    }
    const queryString = queryParams.toString();
    return apiClient.get(`/documents/stack/${stackId}${queryString ? '?' + queryString : ''}`);
  },
  getByProject: (projectId, params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.tagIds && params.tagIds.length > 0) {
      params.tagIds.forEach(id => queryParams.append('tagIds', id));
    }
    const queryString = queryParams.toString();
    return apiClient.get(`/documents/project/${projectId}${queryString ? '?' + queryString : ''}`);
  },
  getAll: (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.tagIds && params.tagIds.length > 0) {
      params.tagIds.forEach(id => queryParams.append('tagIds', id));
    }
    const queryString = queryParams.toString();
    return apiClient.get(`/documents/all${queryString ? '?' + queryString : ''}`);
  },
  getById: (documentId) => apiClient.get(`/documents/${documentId}`),
  upload: (stackId, formData) => {
    return axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    }).post(`/documents/stack/${stackId}`, formData);
  },
  uploadStandalone: (formData) => {
    return axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    }).post(`/documents/upload`, formData);
  },
  getFileUrl: (filename) => `${API_BASE_URL}/uploads/documents/${filename}`,
  update: (documentId, data) => apiClient.put(`/documents/${documentId}`, data),
  delete: (documentId) => apiClient.delete(`/documents/${documentId}`),
  addReference: (documentId, projectId, stackId = null) =>
    apiClient.post(`/documents/${documentId}/references`, { projectId, stackId }),
  removeReference: (documentId, projectId, stackId = null) =>
    apiClient.delete(`/documents/${documentId}/references`, { data: { projectId, stackId } }),
  getReferences: (documentId) => apiClient.get(`/documents/${documentId}/references`),
  addTag: (documentId, tagId) => apiClient.post(`/documents/${documentId}/tags/${tagId}`),
  removeTag: (documentId, tagId) => apiClient.delete(`/documents/${documentId}/tags/${tagId}`)
};

export const chatAPI = {
  getMessages: (projectId, stackId = null) => {
    const url = stackId
      ? `/chat/project/${projectId}?stackId=${stackId}`
      : `/chat/project/${projectId}`;
    return apiClient.get(url);
  },
  sendMessage: (projectId, message, stackId = null) =>
    apiClient.post(`/chat/project/${projectId}`, { message, stackId })
};
