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

// =========== USER MANAGEMENT API ===========

// Get all users with filters and pagination
export const getAllUsers = async (params = {}) => {
  const queryParams = new URLSearchParams();
  
  if (params.role) queryParams.append('role', params.role);
  if (params.isActive !== undefined) queryParams.append('isActive', params.isActive);
  if (params.search) queryParams.append('search', params.search);
  if (params.page) queryParams.append('page', params.page);
  if (params.limit) queryParams.append('limit', params.limit);

  const response = await fetch(`${API_URL}/api/users?${queryParams.toString()}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/signin';
    }
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch users');
  }

  const data = await response.json();
  return data.data || data;
};

// Get single user by ID
export const getUserById = async (id) => {
  const response = await fetch(`${API_URL}/api/users/${id}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/signin';
    }
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch user');
  }

  const data = await response.json();
  return data.data?.user || data.user || data.data || data;
};

// Create new user
export const createUser = async (userData) => {
  const response = await fetch(`${API_URL}/api/users`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(userData),
  });

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/signin';
    }
    const error = await response.json();
    throw new Error(error.message || 'Failed to create user');
  }

  const data = await response.json();
  return data;
};

// Update user
export const updateUser = async (id, userData) => {
  const response = await fetch(`${API_URL}/api/users/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(userData),
  });

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/signin';
    }
    const error = await response.json();
    throw new Error(error.message || 'Failed to update user');
  }

  const data = await response.json();
  return data;
};

// Delete user
export const deleteUser = async (id) => {
  const response = await fetch(`${API_URL}/api/users/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/signin';
    }
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete user');
  }

  const data = await response.json();
  return data;
};

// Toggle user active status
export const toggleUserStatus = async (id) => {
  const response = await fetch(`${API_URL}/api/users/${id}/toggle-status`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/signin';
    }
    const error = await response.json();
    throw new Error(error.message || 'Failed to toggle user status');
  }

  const data = await response.json();
  return data;
};

// Get users by role
export const getUsersByRole = async (role) => {
  const response = await fetch(`${API_URL}/api/users/role/${role}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/signin';
    }
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch users by role');
  }

  const data = await response.json();
  return data.data || data;
};

// Get user statistics
export const getUserStats = async () => {
  const response = await fetch(`${API_URL}/api/users/stats/counts`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/signin';
    }
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch user statistics');
  }

  const data = await response.json();
  return data.data || data;
};
