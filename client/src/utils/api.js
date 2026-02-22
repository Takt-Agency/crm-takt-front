// API utility functions for authenticated requests

const API_URL = process.env.REACT_APP_API_URL || '';

// Get auth headers with token
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

// Get current user
export const getMe = async () => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No token found');
  }

  const response = await fetch(`${API_URL}/api/auth/me`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/signin';
    }
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to fetch user data');
  }

  const data = await response.json();
  // Backend returns { success: true, data: { user: {...} } }
  return data.data?.user || data.user || data.data || data;
};

// Update user profile
export const updateProfile = async (data) => {
  const response = await fetch(`${API_URL}/api/auth/profile`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/signin';
    }
    const error = await response.json();
    throw new Error(error.message || 'Failed to update profile');
  }

  const responseData = await response.json();
  // Backend returns { success: true, data: { user: {...} } }
  return responseData.data?.user || responseData.user || responseData.data || responseData;
};

// Logout
export const logout = () => {
  localStorage.removeItem('token');
  window.location.href = '/signin';
};
