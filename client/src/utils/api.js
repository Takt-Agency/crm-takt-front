// API utility functions for authenticated requests

const API_URL = process.env.REACT_APP_API_URL || "";

// Get auth headers with token
const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

// Get current user
export const getMe = async () => {
  const token = localStorage.getItem("token");
  if (!token) {
    throw new Error("No token found");
  }

  const response = await fetch(`${API_URL}/api/auth/me`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/signin";
    }
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to fetch user data");
  }

  const data = await response.json();
  // Backend returns { success: true, data: { user: {...} } }
  return data.data?.user || data.user || data.data || data;
};

// Update user profile
export const updateProfile = async (data) => {
  const response = await fetch(`${API_URL}/api/auth/profile`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/signin";
    }
    const error = await response.json();
    throw new Error(error.message || "Failed to update profile");
  }

  const responseData = await response.json();
  // Backend returns { success: true, data: { user: {...} } }
  return (
    responseData.data?.user ||
    responseData.user ||
    responseData.data ||
    responseData
  );
};

// Logout
export const logout = () => {
  localStorage.removeItem("token");
  window.location.href = "/signin";
};

// =========== USER MANAGEMENT API ===========

// Get all users with filters and pagination
export const getAllUsers = async (params = {}) => {
  const queryParams = new URLSearchParams();

  if (params.role) queryParams.append("role", params.role);
  if (params.isActive !== undefined)
    queryParams.append("isActive", params.isActive);
  if (params.search) queryParams.append("search", params.search);
  if (params.page) queryParams.append("page", params.page);
  if (params.limit) queryParams.append("limit", params.limit);

  const response = await fetch(
    `${API_URL}/api/users?${queryParams.toString()}`,
    {
      method: "GET",
      headers: getAuthHeaders(),
    },
  );

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/signin";
    }
    const error = await response.json();
    throw new Error(error.message || "Failed to fetch users");
  }

  const data = await response.json();
  return data.data || data;
};

// Get single user by ID
export const getUserById = async (id) => {
  const response = await fetch(`${API_URL}/api/users/${id}`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/signin";
    }
    const error = await response.json();
    throw new Error(error.message || "Failed to fetch user");
  }

  const data = await response.json();
  return data.data?.user || data.user || data.data || data;
};

// Create new user
export const createUser = async (userData) => {
  const response = await fetch(`${API_URL}/api/users`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(userData),
  });

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/signin";
    }
    const error = await response.json();
    throw new Error(error.message || "Failed to create user");
  }

  const data = await response.json();
  return data;
};

// Update user
export const updateUser = async (id, userData) => {
  const response = await fetch(`${API_URL}/api/users/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(userData),
  });

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/signin";
    }
    const error = await response.json();
    throw new Error(error.message || "Failed to update user");
  }

  const data = await response.json();
  return data;
};

// Delete user
export const deleteUser = async (id) => {
  const response = await fetch(`${API_URL}/api/users/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/signin";
    }
    const error = await response.json();
    throw new Error(error.message || "Failed to delete user");
  }

  const data = await response.json();
  return data;
};

// Toggle user active status
export const toggleUserStatus = async (id) => {
  const response = await fetch(`${API_URL}/api/users/${id}/toggle-status`, {
    method: "PATCH",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/signin";
    }
    const error = await response.json();
    throw new Error(error.message || "Failed to toggle user status");
  }

  const data = await response.json();
  return data;
};

// Get users by role
export const getUsersByRole = async (role) => {
  const response = await fetch(`${API_URL}/api/users/role/${role}`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/signin";
    }
    const error = await response.json();
    throw new Error(error.message || "Failed to fetch users by role");
  }

  const data = await response.json();
  return data.data || data;
};

// Get user statistics
export const getUserStats = async () => {
  const response = await fetch(`${API_URL}/api/users/stats/counts`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/signin";
    }
    const error = await response.json();
    throw new Error(error.message || "Failed to fetch user statistics");
  }

  const data = await response.json();
  return data.data || data;
};

// =========== CLIENT MANAGEMENT API ===========

// Get all clients with filters and pagination
export const getAllClients = async (params = {}) => {
  const queryParams = new URLSearchParams();

  if (params.statut) queryParams.append("statut", params.statut);
  if (params.search) queryParams.append("search", params.search);
  if (params.page) queryParams.append("page", params.page);
  if (params.limit) queryParams.append("limit", params.limit);
  if (params.sortBy) queryParams.append("sortBy", params.sortBy);
  if (params.order) queryParams.append("order", params.order);

  const response = await fetch(
    `${API_URL}/api/clients?${queryParams.toString()}`,
    {
      method: "GET",
      headers: getAuthHeaders(),
    },
  );

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/signin";
    }
    const error = await response.json();
    throw new Error(error.message || "Failed to fetch clients");
  }

  const data = await response.json();
  return data.data || data;
};

// Get single client by ID
export const getClientById = async (id) => {
  const response = await fetch(`${API_URL}/api/clients/${id}`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/signin";
    }
    const error = await response.json();
    throw new Error(error.message || "Failed to fetch client");
  }

  const data = await response.json();
  return data.data?.client || data.client || data.data || data;
};

// Create new client
export const createClient = async (clientData) => {
  const response = await fetch(`${API_URL}/api/clients`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(clientData),
  });

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/signin";
    }
    const error = await response.json();
    throw new Error(error.message || "Failed to create client");
  }

  const data = await response.json();
  return data;
};

// Update client
export const updateClient = async (id, clientData) => {
  const response = await fetch(`${API_URL}/api/clients/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(clientData),
  });

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/signin";
    }
    const error = await response.json();
    throw new Error(error.message || "Failed to update client");
  }

  const data = await response.json();
  return data;
};

// Delete client
export const deleteClient = async (id) => {
  const response = await fetch(`${API_URL}/api/clients/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/signin";
    }
    const error = await response.json();
    throw new Error(error.message || "Failed to delete client");
  }

  const data = await response.json();
  return data;
};

// Get clients by status
export const getClientsByStatus = async (statut) => {
  const response = await fetch(`${API_URL}/api/clients/status/${statut}`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/signin";
    }
    const error = await response.json();
    throw new Error(error.message || "Failed to fetch clients by status");
  }

  const data = await response.json();
  return data.data || data;
};

// Get client statistics
export const getClientStats = async () => {
  const response = await fetch(`${API_URL}/api/clients/stats/counts`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/signin";
    }
    const error = await response.json();
    throw new Error(error.message || "Failed to fetch client statistics");
  }

  const data = await response.json();
  return data.data || data;
};

// Update last contact date
export const updateLastContact = async (id) => {
  const response = await fetch(`${API_URL}/api/clients/${id}/contact`, {
    method: "PATCH",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/signin";
    }
    const error = await response.json();
    throw new Error(error.message || "Failed to update last contact");
  }

  const data = await response.json();
  return data;
};

// =========== TWO-FACTOR AUTHENTICATION API ===========

// Setup 2FA - Generate secret and QR code
export const setupTwoFactor = async () => {
  const response = await fetch(`${API_URL}/api/2fa/setup`, {
    method: "POST",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/signin";
    }
    const error = await response.json();
    throw new Error(error.message || "Failed to setup 2FA");
  }

  const data = await response.json();
  return data.data || data;
};

// Verify and enable 2FA
export const verifyAndEnableTwoFactor = async (token) => {
  const response = await fetch(`${API_URL}/api/2fa/verify`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ token }),
  });

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/signin";
    }
    const error = await response.json();
    throw new Error(error.message || "Failed to verify 2FA");
  }

  const data = await response.json();
  return data;
};

// Disable 2FA
export const disableTwoFactor = async (password) => {
  const response = await fetch(`${API_URL}/api/2fa/disable`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ password }),
  });

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/signin";
    }
    const error = await response.json();
    throw new Error(error.message || "Failed to disable 2FA");
  }

  const data = await response.json();
  return data;
};

// Get 2FA status
export const getTwoFactorStatus = async () => {
  const response = await fetch(`${API_URL}/api/2fa/status`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/signin";
    }
    const error = await response.json();
    throw new Error(error.message || "Failed to get 2FA status");
  }

  const data = await response.json();
  return data.data || data;
};

// Verify 2FA during login
export const verifyTwoFactorLogin = async (userId, token) => {
  const response = await fetch(`${API_URL}/api/2fa/verify-login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ userId, token }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to verify 2FA token");
  }

  const data = await response.json();
  return data;
};

// Complete login after 2FA verification
export const completeTwoFactorLogin = async (userId) => {
  const response = await fetch(`${API_URL}/api/auth/verify-2fa-login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ userId }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to complete login");
  }

  const data = await response.json();
  return data.data || data;
};

// Regenerate backup codes
export const regenerateBackupCodes = async (password) => {
  const response = await fetch(`${API_URL}/api/2fa/regenerate-backup-codes`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ password }),
  });

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/signin";
    }
    const error = await response.json();
    throw new Error(error.message || "Failed to regenerate backup codes");
  }

  const data = await response.json();
  return data;
};

// =========== PASSWORD RESET API ===========

// Request password reset
export const forgotPassword = async (email) => {
  const response = await fetch(`${API_URL}/api/password-reset/forgot-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to request password reset");
  }

  const data = await response.json();
  return data;
};

// Verify reset token
export const verifyResetToken = async (token) => {
  const response = await fetch(`${API_URL}/api/password-reset/verify-token/${token}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Invalid or expired token");
  }

  const data = await response.json();
  return data;
};

// Reset password with token
export const resetPassword = async (token, newPassword) => {
  const response = await fetch(`${API_URL}/api/password-reset/reset-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ token, newPassword }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to reset password");
  }

  const data = await response.json();
  return data;
};
