import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Multi-tenancy header interception (AD-002)
    const workspaceId = localStorage.getItem('active_workspace_id');
    if (workspaceId) {
      config.headers['X-Workspace-Id'] = workspaceId;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Enforce instant session clearance on 401 Unauthorized responses
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('active_workspace_id');
      window.location.href = '/login';
    }
    
    // Fail-closed notification for Redis database offline
    if (error.response?.status === 503) {
      console.error('Service temporarily unavailable (Redis connection down). Session check failed.');
    }

    // Attach friendly error messages centrally for better UX and error reporting
    let friendlyMessage = '';
    if (error.code === 'ERR_NETWORK' || !error.response) {
      friendlyMessage = 'Cannot connect to the server. Please verify the backend is running.';
    } else if (error.response.status >= 500) {
      friendlyMessage = `Cannot connect to the server. Please verify the backend is running. (Status: ${error.response.status})`;
    } else {
      friendlyMessage = error.response.data?.detail || error.response.data?.message || '';
    }
    
    error.friendlyMessage = friendlyMessage;
    
    return Promise.reject(error);
  }
);

export default apiClient;
