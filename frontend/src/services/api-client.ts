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
    const originalRequest = error.config;

    // Handle 401 Unauthorized by trying to refresh the access token
    if (error.response?.status === 401) {
      // If the refresh request itself failed with 401, clear session and redirect immediately
      if (originalRequest.url?.includes('/auth/refresh')) {
        localStorage.removeItem('token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        localStorage.removeItem('active_workspace_id');
        window.location.href = '/login';
        return Promise.reject(error);
      }

      if (
        !originalRequest._retry &&
        !originalRequest.url?.includes('/auth/login')
      ) {
        originalRequest._retry = true;
        const refreshToken = localStorage.getItem('refresh_token');

        if (refreshToken) {
          try {
            const baseURL = import.meta.env.VITE_API_URL || '/api';
            // Use plain axios instance to avoid infinite loop with the request interceptor
            const response = await axios.post(`${baseURL}/auth/refresh`, {
              refreshToken,
            });
            const { accessToken, refreshToken: newRefreshToken } =
              response.data;

            localStorage.setItem('token', accessToken);
            localStorage.setItem('refresh_token', newRefreshToken);

            originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;
            return apiClient(originalRequest);
          } catch (refreshError) {
            // If refresh fails, clear session immediately and redirect to login
            localStorage.removeItem('token');
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('user');
            localStorage.removeItem('active_workspace_id');
            window.location.href = '/login';
            return Promise.reject(refreshError);
          }
        } else {
          // No refresh token available, clear session, redirect and reject promise
          localStorage.removeItem('token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user');
          localStorage.removeItem('active_workspace_id');
          window.location.href = '/login';
          return Promise.reject(error);
        }
      }
    }

    // Fail-closed notification for Redis database offline
    if (error.response?.status === 503) {
      console.error(
        'Service temporarily unavailable (Redis connection down). Session check failed.'
      );
    }

    // Attach friendly error messages centrally for better UX and error reporting
    let friendlyMessage = '';
    if (error.code === 'ERR_NETWORK' || !error.response) {
      friendlyMessage =
        'Cannot connect to the server. Please verify the backend is running.';
    } else if (error.response.status >= 500) {
      friendlyMessage = `Cannot connect to the server. Please verify the backend is running. (Status: ${error.response.status})`;
    } else {
      friendlyMessage =
        error.response.data?.detail || error.response.data?.message || '';
    }

    error.friendlyMessage = friendlyMessage;

    return Promise.reject(error);
  }
);

export default apiClient;
