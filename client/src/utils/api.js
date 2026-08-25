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

// Chatbot
export const sendChatMessage = async (payload) => {
  const response = await fetch(`${API_URL}/api/chatbot/message`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Failed to send chatbot message");
  }

  const data = await response.json();
  return data.data || data;
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
  if (params.secteurActivite)
    queryParams.append("secteurActivite", params.secteurActivite);
  if (params.sourceLead) queryParams.append("sourceLead", params.sourceLead);
  if (params.minCA !== undefined) queryParams.append("minCA", params.minCA);
  if (params.maxCA !== undefined) queryParams.append("maxCA", params.maxCA);
  if (params.minScore !== undefined)
    queryParams.append("minScore", params.minScore);
  if (params.maxScore !== undefined)
    queryParams.append("maxScore", params.maxScore);
  if (params.tags && params.tags.length > 0)
    queryParams.append("tags", params.tags.join(","));

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
  return data.data?.client || data.client || data.data || data;
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

export const addClientInteraction = async (id, payload) => {
  const response = await fetch(`${API_URL}/api/clients/${id}/interactions`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/signin";
    }
    const error = await response.json();
    throw new Error(error.message || "Failed to add interaction");
  }

  const data = await response.json();
  return data.data || data;
};

export const exportClientsCsv = async (params = {}) => {
  const queryParams = new URLSearchParams();
  if (params.statut) queryParams.append("statut", params.statut);
  if (params.search) queryParams.append("search", params.search);
  const headers = getAuthHeaders();
  delete headers["Content-Type"];

  const response = await fetch(
    `${API_URL}/api/clients/export/csv?${queryParams.toString()}`,
    {
      method: "GET",
      headers,
    },
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Failed to export clients CSV");
  }

  return response.blob();
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
  const response = await fetch(
    `${API_URL}/api/password-reset/forgot-password`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    },
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to request password reset");
  }

  const data = await response.json();
  return data;
};

// Verify reset token
export const verifyResetToken = async (token) => {
  const response = await fetch(
    `${API_URL}/api/password-reset/verify-token/${token}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

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

// ==================== Deal/Prospects API ====================

// Get all deals
export const getAllDeals = async (params = {}) => {
  const queryParams = new URLSearchParams();

  if (params.stage) queryParams.append("stage", params.stage);
  if (params.assignedTo) queryParams.append("assignedTo", params.assignedTo);
  if (params.search) queryParams.append("search", params.search);
  if (params.priority) queryParams.append("priority", params.priority);
  if (params.source) queryParams.append("source", params.source);
  if (params.minAmount !== undefined)
    queryParams.append("minAmount", params.minAmount);
  if (params.maxAmount !== undefined)
    queryParams.append("maxAmount", params.maxAmount);
  if (params.minBant !== undefined)
    queryParams.append("minBant", params.minBant);
  if (params.page) queryParams.append("page", params.page);
  if (params.limit) queryParams.append("limit", params.limit);

  const response = await fetch(
    `${API_URL}/api/deals?${queryParams.toString()}`,
    {
      method: "GET",
      headers: getAuthHeaders(),
    },
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to fetch deals");
  }

  const data = await response.json();
  const payload = data.data || data;
  return Array.isArray(payload) ? payload : payload.deals || [];
};

// Get pipeline statistics
export const getPipelineStats = async () => {
  const response = await fetch(`${API_URL}/api/deals/stats`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to fetch pipeline stats");
  }

  const data = await response.json();
  return data.data;
};

export const getDealAlerts = async (params = {}) => {
  const queryParams = new URLSearchParams();
  if (params.daysAhead !== undefined)
    queryParams.append("daysAhead", params.daysAhead);
  if (params.staleDays !== undefined)
    queryParams.append("staleDays", params.staleDays);
  if (params.limit !== undefined) queryParams.append("limit", params.limit);

  const response = await fetch(
    `${API_URL}/api/deals/alerts?${queryParams.toString()}`,
    {
      method: "GET",
      headers: getAuthHeaders(),
    },
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to fetch deal alerts");
  }

  const data = await response.json();
  return data.data;
};

// Get a single deal by ID
export const getDealById = async (id) => {
  const response = await fetch(`${API_URL}/api/deals/${id}`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Deal not found");
  }

  const data = await response.json();
  return data.data;
};

// Create a new deal
export const createDeal = async (dealData) => {
  const response = await fetch(`${API_URL}/api/deals`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(dealData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to create deal");
  }

  const data = await response.json();
  return data.data;
};

// Update a deal
export const updateDeal = async (id, dealData) => {
  const response = await fetch(`${API_URL}/api/deals/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(dealData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to update deal");
  }

  const data = await response.json();
  return data.data;
};

// Update deal stage (for drag & drop)
export const updateDealStage = async (id, stage) => {
  const response = await fetch(`${API_URL}/api/deals/${id}/stage`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify({ stage }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to update deal stage");
  }

  const data = await response.json();
  return data.data;
};

// Delete a deal
export const deleteDeal = async (id) => {
  const response = await fetch(`${API_URL}/api/deals/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to delete deal");
  }

  const data = await response.json();
  return data;
};

// Add note to deal
export const addDealNote = async (id, content) => {
  const response = await fetch(`${API_URL}/api/deals/${id}/notes`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ content }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to add note");
  }

  const data = await response.json();
  return data.data;
};

export const updateDealNote = async (id, noteId, content) => {
  const response = await fetch(`${API_URL}/api/deals/${id}/notes/${noteId}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify({ content }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to update note");
  }

  const data = await response.json();
  return data.data;
};

export const deleteDealNote = async (id, noteId) => {
  const response = await fetch(`${API_URL}/api/deals/${id}/notes/${noteId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to delete note");
  }

  const data = await response.json();
  return data;
};

// Add activity to deal
export const addDealActivity = async (id, activityData) => {
  const response = await fetch(`${API_URL}/api/deals/${id}/activities`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(activityData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to add activity");
  }

  const data = await response.json();
  return data.data;
};

export const updateDealActivity = async (id, activityId, activityData) => {
  const response = await fetch(
    `${API_URL}/api/deals/${id}/activities/${activityId}`,
    {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(activityData),
    },
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to update activity");
  }

  const data = await response.json();
  return data.data;
};

export const deleteDealActivity = async (id, activityId) => {
  const response = await fetch(
    `${API_URL}/api/deals/${id}/activities/${activityId}`,
    {
      method: "DELETE",
      headers: getAuthHeaders(),
    },
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to delete activity");
  }

  const data = await response.json();
  return data;
};

export const convertDealToClient = async (id) => {
  const response = await fetch(`${API_URL}/api/deals/${id}/convert-to-client`, {
    method: "POST",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to convert deal to client");
  }

  const data = await response.json();
  return data.data || data;
};

// =========== TASK API ===========

// =========== PROJECT API ===========

export const getAllProjects = async (params = {}) => {
  const queryParams = new URLSearchParams();

  if (params.client) queryParams.append("client", params.client);
  if (params.deal) queryParams.append("deal", params.deal);
  if (params.status) queryParams.append("status", params.status);
  if (params.search) queryParams.append("search", params.search);
  if (params.page) queryParams.append("page", params.page);
  if (params.limit) queryParams.append("limit", params.limit);
  if (params.includeArchived)
    queryParams.append("includeArchived", params.includeArchived);

  const response = await fetch(
    `${API_URL}/api/projects?${queryParams.toString()}`,
    {
      method: "GET",
      headers: getAuthHeaders(),
    },
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to fetch projects");
  }

  const data = await response.json();
  return data;
};

export const createProject = async (projectData) => {
  const response = await fetch(`${API_URL}/api/projects`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(projectData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to create project");
  }

  const data = await response.json();
  return data;
};

export const updateProjectById = async (projectId, projectData) => {
  const response = await fetch(`${API_URL}/api/projects/${projectId}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(projectData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to update project");
  }

  const data = await response.json();
  return data;
};

export const deleteProjectById = async (projectId) => {
  const response = await fetch(`${API_URL}/api/projects/${projectId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to delete project");
  }

  const data = await response.json();
  return data;
};

// Get all tasks with filters
export const getAllTasks = async (params = {}) => {
  const queryParams = new URLSearchParams();

  if (params.status) queryParams.append("status", params.status);
  if (params.priority) queryParams.append("priority", params.priority);
  if (params.assignedTo) queryParams.append("assignedTo", params.assignedTo);
  if (params.client) queryParams.append("client", params.client);
  if (params.deal) queryParams.append("deal", params.deal);
  if (params.project) queryParams.append("project", params.project);
  if (params.search) queryParams.append("search", params.search);
  if (params.page) queryParams.append("page", params.page);
  if (params.limit) queryParams.append("limit", params.limit);

  const response = await fetch(
    `${API_URL}/api/tasks?${queryParams.toString()}`,
    {
      method: "GET",
      headers: getAuthHeaders(),
    },
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to fetch tasks");
  }

  const data = await response.json();
  return data;
};

// Get task statistics
export const getTaskStats = async (params = {}) => {
  const queryParams = new URLSearchParams();
  if (params.assignedTo) queryParams.append("assignedTo", params.assignedTo);

  const response = await fetch(
    `${API_URL}/api/tasks/stats?${queryParams.toString()}`,
    {
      method: "GET",
      headers: getAuthHeaders(),
    },
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to fetch task stats");
  }

  const data = await response.json();
  return data;
};

// Get task by ID
export const getTaskById = async (id) => {
  const response = await fetch(`${API_URL}/api/tasks/${id}`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to fetch task");
  }

  const data = await response.json();
  return data;
};

// Create task
export const createTask = async (taskData) => {
  const response = await fetch(`${API_URL}/api/tasks`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(taskData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to create task");
  }

  const data = await response.json();
  return data;
};

// Update task
export const updateTask = async (id, taskData) => {
  const response = await fetch(`${API_URL}/api/tasks/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(taskData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to update task");
  }

  const data = await response.json();
  return data;
};

// Delete task
export const deleteTask = async (id) => {
  const response = await fetch(`${API_URL}/api/tasks/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to delete task");
  }

  const data = await response.json();
  return data;
};

// Update task status
export const updateTaskStatus = async (id, status) => {
  const response = await fetch(`${API_URL}/api/tasks/${id}/status`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify({ status }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to update task status");
  }

  const data = await response.json();
  return data;
};

// Add checklist item
export const addChecklistItem = async (id, text) => {
  const response = await fetch(`${API_URL}/api/tasks/${id}/checklist`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to add checklist item");
  }

  const data = await response.json();
  return data;
};

export const updateChecklistItem = async (id, itemId, text) => {
  const response = await fetch(
    `${API_URL}/api/tasks/${id}/checklist/${itemId}`,
    {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify({ text }),
    },
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to update checklist item");
  }

  const data = await response.json();
  return data;
};

export const deleteChecklistItem = async (id, itemId) => {
  const response = await fetch(
    `${API_URL}/api/tasks/${id}/checklist/${itemId}`,
    {
      method: "DELETE",
      headers: getAuthHeaders(),
    },
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to delete checklist item");
  }

  const data = await response.json();
  return data;
};

export const getTaskStatuses = async () => {
  const response = await fetch(`${API_URL}/api/tasks/statuses`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to fetch task statuses");
  }

  const data = await response.json();
  return data.statuses || [];
};

export const createTaskStatus = async (statusData) => {
  const response = await fetch(`${API_URL}/api/tasks/statuses`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(statusData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to create task status");
  }

  const data = await response.json();
  return data;
};

export const updateTaskStatusDefinition = async (statusId, statusData) => {
  const response = await fetch(`${API_URL}/api/tasks/statuses/${statusId}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(statusData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to update task status");
  }

  const data = await response.json();
  return data;
};

export const deleteTaskStatusDefinition = async (statusId) => {
  const response = await fetch(`${API_URL}/api/tasks/statuses/${statusId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to delete task status");
  }

  const data = await response.json();
  return data;
};

export const addTaskComment = async (id, content) => {
  const response = await fetch(`${API_URL}/api/tasks/${id}/comments`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ content }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to add comment");
  }

  const data = await response.json();
  return data;
};

export const updateTaskComment = async (id, commentId, content) => {
  const response = await fetch(
    `${API_URL}/api/tasks/${id}/comments/${commentId}`,
    {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify({ content }),
    },
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to update comment");
  }

  const data = await response.json();
  return data;
};

export const deleteTaskComment = async (id, commentId) => {
  const response = await fetch(
    `${API_URL}/api/tasks/${id}/comments/${commentId}`,
    {
      method: "DELETE",
      headers: getAuthHeaders(),
    },
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to delete comment");
  }

  const data = await response.json();
  return data;
};

export const addTaskAttachment = async (id, attachmentData) => {
  const response = await fetch(`${API_URL}/api/tasks/${id}/attachments`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(attachmentData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to add attachment");
  }

  const data = await response.json();
  return data;
};

export const deleteTaskAttachment = async (id, attachmentId) => {
  const response = await fetch(
    `${API_URL}/api/tasks/${id}/attachments/${attachmentId}`,
    {
      method: "DELETE",
      headers: getAuthHeaders(),
    },
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to delete attachment");
  }

  const data = await response.json();
  return data;
};

export const getTaskAlerts = async (params = {}) => {
  const queryParams = new URLSearchParams();
  if (params.daysAhead) queryParams.append("daysAhead", params.daysAhead);
  if (params.limit) queryParams.append("limit", params.limit);

  const response = await fetch(
    `${API_URL}/api/tasks/alerts?${queryParams.toString()}`,
    {
      method: "GET",
      headers: getAuthHeaders(),
    },
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to fetch task alerts");
  }

  const data = await response.json();
  return data;
};

// Toggle checklist item
export const toggleChecklistItem = async (id, itemId) => {
  const response = await fetch(
    `${API_URL}/api/tasks/${id}/checklist/${itemId}`,
    {
      method: "PATCH",
      headers: getAuthHeaders(),
    },
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to toggle checklist item");
  }

  const data = await response.json();
  return data;
};

// ========================================
// Invoice API Functions
// ========================================

// Get all invoices with filters
export const getAllInvoices = async (params = {}) => {
  const queryParams = new URLSearchParams();

  if (params.type) queryParams.append("type", params.type);
  if (params.status) queryParams.append("status", params.status);
  if (params.client) queryParams.append("client", params.client);
  if (params.search) queryParams.append("search", params.search);
  if (params.page) queryParams.append("page", params.page);
  if (params.limit) queryParams.append("limit", params.limit);

  const response = await fetch(
    `${API_URL}/api/invoices?${queryParams.toString()}`,
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
    throw new Error(error.message || "Failed to fetch invoices");
  }

  const data = await response.json();
  return data;
};

// Get invoice statistics
export const getInvoiceStats = async () => {
  const response = await fetch(`${API_URL}/api/invoices/stats`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to fetch invoice stats");
  }

  const data = await response.json();
  return data;
};

// Get invoice by ID
export const getInvoiceById = async (id) => {
  const response = await fetch(`${API_URL}/api/invoices/${id}`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to fetch invoice");
  }

  const data = await response.json();
  return data;
};

// Create new invoice
export const createInvoice = async (invoiceData) => {
  const response = await fetch(`${API_URL}/api/invoices`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(invoiceData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to create invoice");
  }

  const data = await response.json();
  return data;
};

// Update invoice
export const updateInvoice = async (id, invoiceData) => {
  const response = await fetch(`${API_URL}/api/invoices/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(invoiceData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to update invoice");
  }

  const data = await response.json();
  return data;
};

// Delete invoice
export const deleteInvoice = async (id) => {
  const response = await fetch(`${API_URL}/api/invoices/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to delete invoice");
  }

  const data = await response.json();
  return data;
};

// Download invoice PDF
export const downloadInvoicePDF = async (id) => {
  const response = await fetch(`${API_URL}/api/invoices/${id}/pdf`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to download PDF");
  }

  // Create blob from response
  const blob = await response.blob();

  // Get filename from Content-Disposition header
  const contentDisposition = response.headers.get("Content-Disposition");
  let filename = "invoice.pdf";
  if (contentDisposition) {
    const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(
      contentDisposition,
    );
    if (matches != null && matches[1]) {
      filename = matches[1].replace(/['"]/g, "");
    }
  }

  // Create download link
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

export const convertQuoteToInvoice = async (id) => {
  const response = await fetch(
    `${API_URL}/api/invoices/${id}/convert-to-invoice`,
    {
      method: "POST",
      headers: getAuthHeaders(),
    },
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to convert quote to invoice");
  }

  return response.json();
};

export const sendQuoteToClient = async (id, payload = {}) => {
  const response = await fetch(`${API_URL}/api/invoices/${id}/send-to-client`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to send quote to client");
  }

  return response.json();
};

export const getPublicQuoteByToken = async (token) => {
  const response = await fetch(
    `${API_URL}/api/invoices/public/quote/${token}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to fetch quote");
  }

  return response.json();
};

export const acceptPublicQuoteByToken = async (token, payload = {}) => {
  const response = await fetch(
    `${API_URL}/api/invoices/public/quote/${token}/accept`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to accept quote");
  }

  return response.json();
};

export const rejectPublicQuoteByToken = async (token, payload = {}) => {
  const response = await fetch(
    `${API_URL}/api/invoices/public/quote/${token}/reject`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to reject quote");
  }

  return response.json();
};

export const exportAccountingInvoicesCsv = async () => {
  const response = await fetch(`${API_URL}/api/invoices/export/accounting`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to export accounting CSV");
  }

  const blob = await response.blob();
  const contentDisposition = response.headers.get("Content-Disposition");
  let filename = "export-comptable-factures.csv";
  if (contentDisposition) {
    const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(
      contentDisposition,
    );
    if (matches != null && matches[1]) {
      filename = matches[1].replace(/['"]/g, "");
    }
  }

  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

// ========================================
// Finance API Functions
// ========================================

export const getFinanceStats = async () => {
  const response = await fetch(`${API_URL}/api/finance/stats`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to fetch finance stats");
  }

  return response.json();
};

export const getAllBankAccounts = async (params = {}) => {
  const queryParams = new URLSearchParams();
  if (params.search) queryParams.append("search", params.search);
  if (params.isActive !== undefined)
    queryParams.append("isActive", params.isActive);

  const response = await fetch(
    `${API_URL}/api/finance/comptes-bancaires?${queryParams.toString()}`,
    {
      method: "GET",
      headers: getAuthHeaders(),
    },
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to fetch bank accounts");
  }

  return response.json();
};

export const createBankAccount = async (payload) => {
  const response = await fetch(`${API_URL}/api/finance/comptes-bancaires`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to create bank account");
  }

  return response.json();
};

export const updateBankAccount = async (id, payload) => {
  const response = await fetch(
    `${API_URL}/api/finance/comptes-bancaires/${id}`,
    {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to update bank account");
  }

  return response.json();
};

export const deleteBankAccount = async (id) => {
  const response = await fetch(
    `${API_URL}/api/finance/comptes-bancaires/${id}`,
    {
      method: "DELETE",
      headers: getAuthHeaders(),
    },
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to delete bank account");
  }

  return response.json();
};

export const getAllSuppliers = async (params = {}) => {
  const queryParams = new URLSearchParams();
  if (params.search) queryParams.append("search", params.search);
  if (params.isActive !== undefined)
    queryParams.append("isActive", params.isActive);

  const response = await fetch(
    `${API_URL}/api/finance/fournisseurs?${queryParams.toString()}`,
    {
      method: "GET",
      headers: getAuthHeaders(),
    },
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to fetch suppliers");
  }

  return response.json();
};

export const createSupplier = async (payload) => {
  const response = await fetch(`${API_URL}/api/finance/fournisseurs`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to create supplier");
  }

  return response.json();
};

export const updateSupplier = async (id, payload) => {
  const response = await fetch(`${API_URL}/api/finance/fournisseurs/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to update supplier");
  }

  return response.json();
};

export const deleteSupplier = async (id) => {
  const response = await fetch(`${API_URL}/api/finance/fournisseurs/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to delete supplier");
  }

  return response.json();
};

export const getAllSupplierOrders = async (params = {}) => {
  const queryParams = new URLSearchParams();
  if (params.search) queryParams.append("search", params.search);
  if (params.supplier) queryParams.append("supplier", params.supplier);
  if (params.status) queryParams.append("status", params.status);

  const response = await fetch(
    `${API_URL}/api/finance/commandes-fournisseurs?${queryParams.toString()}`,
    {
      method: "GET",
      headers: getAuthHeaders(),
    },
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to fetch supplier orders");
  }

  return response.json();
};

export const createSupplierOrder = async (payload) => {
  const response = await fetch(
    `${API_URL}/api/finance/commandes-fournisseurs`,
    {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to create supplier order");
  }

  return response.json();
};

export const updateSupplierOrder = async (id, payload) => {
  const response = await fetch(
    `${API_URL}/api/finance/commandes-fournisseurs/${id}`,
    {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to update supplier order");
  }

  return response.json();
};

export const deleteSupplierOrder = async (id) => {
  const response = await fetch(
    `${API_URL}/api/finance/commandes-fournisseurs/${id}`,
    {
      method: "DELETE",
      headers: getAuthHeaders(),
    },
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to delete supplier order");
  }

  return response.json();
};

export const getSupplierPaymentAlerts = async (params = {}) => {
  const queryParams = new URLSearchParams();
  if (params.daysAhead) queryParams.append("daysAhead", params.daysAhead);
  if (params.limit) queryParams.append("limit", params.limit);

  const response = await fetch(
    `${API_URL}/api/finance/alertes-paiements-fournisseurs?${queryParams.toString()}`,
    {
      method: "GET",
      headers: getAuthHeaders(),
    },
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to fetch supplier payment alerts");
  }

  return response.json();
};

export const getAllEncaissements = async (params = {}) => {
  const queryParams = new URLSearchParams();
  if (params.search) queryParams.append("search", params.search);
  if (params.compteBancaire)
    queryParams.append("compteBancaire", params.compteBancaire);
  if (params.client) queryParams.append("client", params.client);

  const response = await fetch(
    `${API_URL}/api/finance/encaissements?${queryParams.toString()}`,
    {
      method: "GET",
      headers: getAuthHeaders(),
    },
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to fetch encaissements");
  }

  return response.json();
};

export const createEncaissement = async (payload) => {
  const response = await fetch(`${API_URL}/api/finance/encaissements`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to create encaissement");
  }

  return response.json();
};

export const updateEncaissement = async (id, payload) => {
  const response = await fetch(`${API_URL}/api/finance/encaissements/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to update encaissement");
  }

  return response.json();
};

export const deleteEncaissement = async (id) => {
  const response = await fetch(`${API_URL}/api/finance/encaissements/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to delete encaissement");
  }

  return response.json();
};

export const getAllDecaissements = async (params = {}) => {
  const queryParams = new URLSearchParams();
  if (params.search) queryParams.append("search", params.search);
  if (params.compteBancaire)
    queryParams.append("compteBancaire", params.compteBancaire);
  if (params.fournisseur) queryParams.append("fournisseur", params.fournisseur);
  if (params.commandeFournisseur)
    queryParams.append("commandeFournisseur", params.commandeFournisseur);

  const response = await fetch(
    `${API_URL}/api/finance/decaissements?${queryParams.toString()}`,
    {
      method: "GET",
      headers: getAuthHeaders(),
    },
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to fetch decaissements");
  }

  return response.json();
};

export const createDecaissement = async (payload) => {
  const response = await fetch(`${API_URL}/api/finance/decaissements`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json();
    if (response.status === 403) {
      throw new Error(
        "Vous n'avez pas les droits pour créer un paiement fournisseur",
      );
    }
    throw new Error(error.message || "Failed to create decaissement");
  }

  return response.json();
};

export const updateDecaissement = async (id, payload) => {
  const response = await fetch(`${API_URL}/api/finance/decaissements/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json();
    if (response.status === 403) {
      throw new Error(
        "Vous n'avez pas les droits pour modifier un paiement fournisseur",
      );
    }
    throw new Error(error.message || "Failed to update decaissement");
  }

  return response.json();
};

export const deleteDecaissement = async (id) => {
  const response = await fetch(`${API_URL}/api/finance/decaissements/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.json();
    if (response.status === 403) {
      throw new Error(
        "Vous n'avez pas les droits pour supprimer un paiement fournisseur",
      );
    }
    throw new Error(error.message || "Failed to delete decaissement");
  }

  return response.json();
};

export const validateDecaissement = async (id, payload) => {
  const response = await fetch(
    `${API_URL}/api/finance/decaissements/${id}/validation`,
    {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to validate decaissement");
  }

  return response.json();
};

export const uploadDecaissementJustificatifs = async (id, files) => {
  const token = localStorage.getItem("token");
  const formData = new FormData();
  (files || []).forEach((file) => {
    formData.append("files", file);
  });

  const response = await fetch(
    `${API_URL}/api/finance/decaissements/${id}/justificatifs`,
    {
      method: "POST",
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    },
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to upload justificatifs");
  }

  return response.json();
};

export const getBankStatementLines = async (params = {}) => {
  const queryParams = new URLSearchParams();
  if (params.search) queryParams.append("search", params.search);
  if (params.bankAccount) queryParams.append("bankAccount", params.bankAccount);
  if (params.isReconciled !== undefined)
    queryParams.append("isReconciled", params.isReconciled);

  const response = await fetch(
    `${API_URL}/api/finance/rapprochement/lignes?${queryParams.toString()}`,
    {
      method: "GET",
      headers: getAuthHeaders(),
    },
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to fetch bank statement lines");
  }

  return response.json();
};

export const importBankStatementCsv = async ({ bankAccount, file }) => {
  const token = localStorage.getItem("token");
  const formData = new FormData();
  formData.append("bankAccount", bankAccount);
  formData.append("file", file);

  const response = await fetch(
    `${API_URL}/api/finance/rapprochement/import/csv`,
    {
      method: "POST",
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    },
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to import bank statement CSV");
  }

  return response.json();
};

export const importBankStatementOfx = async ({ bankAccount, file }) => {
  const token = localStorage.getItem("token");
  const formData = new FormData();
  formData.append("bankAccount", bankAccount);
  formData.append("file", file);

  const response = await fetch(
    `${API_URL}/api/finance/rapprochement/import/ofx`,
    {
      method: "POST",
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    },
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to import bank statement OFX");
  }

  return response.json();
};

export const reconcileBankStatementLine = async (id, payload) => {
  const response = await fetch(
    `${API_URL}/api/finance/rapprochement/lignes/${id}/reconcile`,
    {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to reconcile bank statement line");
  }

  return response.json();
};

export const clearBankStatementReconciliation = async (id) => {
  const response = await fetch(
    `${API_URL}/api/finance/rapprochement/lignes/${id}/clear`,
    {
      method: "PATCH",
      headers: getAuthHeaders(),
    },
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to clear reconciliation");
  }

  return response.json();
};

export const getAllTresorerieEntries = async (params = {}) => {
  const queryParams = new URLSearchParams();
  if (params.search) queryParams.append("search", params.search);
  if (params.type) queryParams.append("type", params.type);

  const response = await fetch(
    `${API_URL}/api/finance/tresorerie?${queryParams.toString()}`,
    {
      method: "GET",
      headers: getAuthHeaders(),
    },
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to fetch tresorerie entries");
  }

  return response.json();
};

export const createTresorerieEntry = async (payload) => {
  const response = await fetch(`${API_URL}/api/finance/tresorerie`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to create tresorerie entry");
  }

  return response.json();
};

export const updateTresorerieEntry = async (id, payload) => {
  const response = await fetch(`${API_URL}/api/finance/tresorerie/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to update tresorerie entry");
  }

  return response.json();
};

export const deleteTresorerieEntry = async (id) => {
  const response = await fetch(`${API_URL}/api/finance/tresorerie/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to delete tresorerie entry");
  }

  return response.json();
};

// ========================================
// HR API Functions
// ========================================

export const getHRStats = async () => {
  const response = await fetch(`${API_URL}/api/hr/stats`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to fetch HR stats");
  }

  const data = await response.json();
  return data.data || data;
};

export const getLeaveBalances = async (params = {}) => {
  const queryParams = new URLSearchParams();

  if (params.year) queryParams.append("year", params.year);

  const response = await fetch(
    `${API_URL}/api/hr/leave-balances?${queryParams.toString()}`,
    {
      method: "GET",
      headers: getAuthHeaders(),
    },
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to fetch leave balances");
  }

  const data = await response.json();
  return data.data || data;
};

export const getAllEmployees = async (params = {}) => {
  const queryParams = new URLSearchParams();

  if (params.search) queryParams.append("search", params.search);
  if (params.department) queryParams.append("department", params.department);
  if (params.status) queryParams.append("status", params.status);

  const response = await fetch(
    `${API_URL}/api/hr/employees?${queryParams.toString()}`,
    {
      method: "GET",
      headers: getAuthHeaders(),
    },
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to fetch employees");
  }

  const data = await response.json();
  return data.data || data;
};

export const createEmployee = async (payload) => {
  const response = await fetch(`${API_URL}/api/hr/employees`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to create employee");
  }

  return response.json();
};

export const updateEmployee = async (id, payload) => {
  const response = await fetch(`${API_URL}/api/hr/employees/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to update employee");
  }

  return response.json();
};

export const deleteEmployee = async (id) => {
  const response = await fetch(`${API_URL}/api/hr/employees/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to delete employee");
  }

  return response.json();
};

export const getAllLeaves = async (params = {}) => {
  const queryParams = new URLSearchParams();

  if (params.status) queryParams.append("status", params.status);
  if (params.employee) queryParams.append("employee", params.employee);
  if (params.type) queryParams.append("type", params.type);

  const response = await fetch(
    `${API_URL}/api/hr/leaves?${queryParams.toString()}`,
    {
      method: "GET",
      headers: getAuthHeaders(),
    },
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to fetch leaves");
  }

  const data = await response.json();
  return data.data || data;
};

export const createLeave = async (payload) => {
  const response = await fetch(`${API_URL}/api/hr/leaves`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to create leave");
  }

  return response.json();
};

export const updateLeaveStatus = async (id, payload) => {
  const response = await fetch(`${API_URL}/api/hr/leaves/${id}/status`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to update leave status");
  }

  return response.json();
};

export const getAllAttendance = async (params = {}) => {
  const queryParams = new URLSearchParams();

  if (params.employee) queryParams.append("employee", params.employee);
  if (params.status) queryParams.append("status", params.status);
  if (params.startDate) queryParams.append("startDate", params.startDate);
  if (params.endDate) queryParams.append("endDate", params.endDate);

  const response = await fetch(
    `${API_URL}/api/hr/attendance?${queryParams.toString()}`,
    {
      method: "GET",
      headers: getAuthHeaders(),
    },
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to fetch attendance");
  }

  const data = await response.json();
  return data.data || data;
};

// ========================================
// Payroll API Functions
// ========================================

export const getPayrollPeriods = async () => {
  const response = await fetch(`${API_URL}/api/payroll/periods`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to fetch payroll periods");
  }

  const data = await response.json();
  return data.data || data;
};

export const createPayrollPeriod = async (payload) => {
  const response = await fetch(`${API_URL}/api/payroll/periods`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to create payroll period");
  }

  const data = await response.json();
  return data.data || data;
};

export const generatePayrollSlips = async (payload) => {
  const response = await fetch(`${API_URL}/api/payroll/slips/generate`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to generate payroll slips");
  }

  const data = await response.json();
  return data.data || data;
};

export const getPayrollSlips = async (params = {}) => {
  const queryParams = new URLSearchParams();
  if (params.periodId) queryParams.append("periodId", params.periodId);
  if (params.employeeId) queryParams.append("employeeId", params.employeeId);

  const response = await fetch(
    `${API_URL}/api/payroll/slips?${queryParams.toString()}`,
    {
      method: "GET",
      headers: getAuthHeaders(),
    },
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to fetch payroll slips");
  }

  const data = await response.json();
  return data.data || data;
};

export const exportPayrollExcel = async (params = {}) => {
  const queryParams = new URLSearchParams();
  if (params.periodId) queryParams.append("periodId", params.periodId);
  if (params.employeeId) queryParams.append("employeeId", params.employeeId);

  const response = await fetch(
    `${API_URL}/api/payroll/slips/export/excel?${queryParams.toString()}`,
    {
      method: "GET",
      headers: getAuthHeaders(),
    },
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to export payroll (Excel)");
  }

  const blob = await response.blob();
  const filename = parseDownloadFilename(
    response.headers.get("Content-Disposition"),
    "paie.xlsx",
  );
  triggerBlobDownload(blob, filename);
};

export const exportPayrollPDF = async (params = {}) => {
  const queryParams = new URLSearchParams();
  if (params.periodId) queryParams.append("periodId", params.periodId);
  if (params.employeeId) queryParams.append("employeeId", params.employeeId);

  const response = await fetch(
    `${API_URL}/api/payroll/slips/export/pdf?${queryParams.toString()}`,
    {
      method: "GET",
      headers: getAuthHeaders(),
    },
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to export payroll (PDF)");
  }

  const blob = await response.blob();
  const filename = parseDownloadFilename(
    response.headers.get("Content-Disposition"),
    "paie.pdf",
  );
  triggerBlobDownload(blob, filename);
};

export const approvePayrollPeriod = async (id) => {
  const response = await fetch(`${API_URL}/api/payroll/periods/${id}/approve`, {
    method: "PATCH",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to approve payroll period");
  }

  const data = await response.json();
  return data.data || data;
};

export const markPayrollPeriodPaid = async (id) => {
  const response = await fetch(
    `${API_URL}/api/payroll/periods/${id}/mark-paid`,
    {
      method: "PATCH",
      headers: getAuthHeaders(),
    },
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to mark payroll period paid");
  }

  const data = await response.json();
  return data.data || data;
};

export const recordAttendance = async (payload) => {
  const response = await fetch(`${API_URL}/api/hr/attendance`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to record attendance");
  }

  return response.json();
};

const parseDownloadFilename = (contentDisposition, fallback) => {
  let filename = fallback;
  if (contentDisposition) {
    const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(
      contentDisposition,
    );
    if (matches != null && matches[1]) {
      filename = matches[1].replace(/['"]/g, "");
    }
  }
  return filename;
};

const triggerBlobDownload = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

export const exportLeavesExcel = async () => {
  const response = await fetch(`${API_URL}/api/hr/leaves/export/excel`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to export leaves (Excel)");
  }

  const blob = await response.blob();
  const filename = parseDownloadFilename(
    response.headers.get("Content-Disposition"),
    "conges.xlsx",
  );
  triggerBlobDownload(blob, filename);
};

export const exportLeavesPDF = async () => {
  const response = await fetch(`${API_URL}/api/hr/leaves/export/pdf`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to export leaves (PDF)");
  }

  const blob = await response.blob();
  const filename = parseDownloadFilename(
    response.headers.get("Content-Disposition"),
    "conges.pdf",
  );
  triggerBlobDownload(blob, filename);
};

export const exportAttendanceExcel = async () => {
  const response = await fetch(`${API_URL}/api/hr/attendance/export/excel`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to export attendance (Excel)");
  }

  const blob = await response.blob();
  const filename = parseDownloadFilename(
    response.headers.get("Content-Disposition"),
    "presences.xlsx",
  );
  triggerBlobDownload(blob, filename);
};

export const exportAttendancePDF = async () => {
  const response = await fetch(`${API_URL}/api/hr/attendance/export/pdf`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to export attendance (PDF)");
  }

  const blob = await response.blob();
  const filename = parseDownloadFilename(
    response.headers.get("Content-Disposition"),
    "presences.pdf",
  );
  triggerBlobDownload(blob, filename);
};

// =========== MARKETING API ===========

const marketingRequest = async (path, { method = "GET", body } = {}) => {
  const response = await fetch(`${API_URL}/api/marketing${path}`, {
    method,
    headers: getAuthHeaders(),
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Erreur lors de l'appel au module marketing");
  }

  return response.json();
};

export const getMarketingStats = async () => {
  const data = await marketingRequest("/stats");
  return data.data || data;
};

export const getAllCampaigns = async (params = {}) => {
  const query = new URLSearchParams();
  if (params.status) query.append("status", params.status);
  if (params.channel) query.append("channel", params.channel);
  if (params.search) query.append("search", params.search);
  if (params.page) query.append("page", params.page);
  if (params.limit) query.append("limit", params.limit);

  return marketingRequest(`/campaigns?${query.toString()}`);
};

export const getCampaignById = async (id) => {
  const data = await marketingRequest(`/campaigns/${id}`);
  return data.campaign || data;
};

export const createCampaign = async (payload) =>
  marketingRequest("/campaigns", { method: "POST", body: payload });

export const updateCampaign = async (id, payload) =>
  marketingRequest(`/campaigns/${id}`, { method: "PUT", body: payload });

export const deleteCampaign = async (id) =>
  marketingRequest(`/campaigns/${id}`, { method: "DELETE" });

export const previewCampaignAudience = async (audience) => {
  const data = await marketingRequest("/campaigns/audience-preview", {
    method: "POST",
    body: { audience },
  });
  return data.data || data;
};

export const sendCampaign = async (id) =>
  marketingRequest(`/campaigns/${id}/send`, { method: "POST" });

// =========== BILAN COMPTABLE ===========

export const getBilanComptable = async (params = {}) => {
  const query = new URLSearchParams();
  if (params.dateDebut) query.append("dateDebut", params.dateDebut);
  if (params.dateFin) query.append("dateFin", params.dateFin);

  const response = await fetch(
    `${API_URL}/api/finance/bilan?${query.toString()}`,
    { method: "GET", headers: getAuthHeaders() },
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Erreur lors du chargement du bilan");
  }

  return response.json();
};

// =========== AVANTAGES SOCIAUX : PRETS ET SOINS ===========

const hrRequest = async (path, { method = "GET", body } = {}) => {
  const response = await fetch(`${API_URL}/api/hr${path}`, {
    method,
    headers: getAuthHeaders(),
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Erreur lors de l'appel au module RH");
  }

  return response.json();
};

export const getBenefitsStats = async () => {
  const data = await hrRequest("/benefits/stats");
  return data.data || data;
};

// --- Prets au personnel ---
export const getStaffLoans = async (params = {}) => {
  const query = new URLSearchParams();
  if (params.statut) query.append("statut", params.statut);
  if (params.employee) query.append("employee", params.employee);
  const data = await hrRequest(`/loans?${query.toString()}`);
  return data.data?.loans || [];
};

export const createStaffLoan = async (payload) =>
  hrRequest("/loans", { method: "POST", body: payload });

export const updateStaffLoan = async (id, payload) =>
  hrRequest(`/loans/${id}`, { method: "PUT", body: payload });

export const recordLoanRepayment = async (id, payload) =>
  hrRequest(`/loans/${id}/repayments`, { method: "POST", body: payload });

export const deleteStaffLoan = async (id) =>
  hrRequest(`/loans/${id}`, { method: "DELETE" });

// --- Soins ---
export const getCareClaims = async (params = {}) => {
  const query = new URLSearchParams();
  if (params.statut) query.append("statut", params.statut);
  if (params.nature) query.append("nature", params.nature);
  if (params.employee) query.append("employee", params.employee);
  const data = await hrRequest(`/care?${query.toString()}`);
  return data.data?.claims || [];
};

export const createCareClaim = async (payload) =>
  hrRequest("/care", { method: "POST", body: payload });

export const updateCareClaimStatus = async (id, payload) =>
  hrRequest(`/care/${id}/status`, { method: "PATCH", body: payload });

export const deleteCareClaim = async (id) =>
  hrRequest(`/care/${id}`, { method: "DELETE" });

// --- Notifications ---
// La portee est intrinsequement limitee au destinataire cote serveur : aucun
// identifiant d'utilisateur n'est transmis ici.
const notificationRequest = async (path, { method = "GET" } = {}) => {
  const response = await fetch(`${API_URL}/api/notifications${path}`, {
    method,
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Erreur lors de l'appel aux notifications");
  }

  return response.json();
};

export const getNotifications = async (params = {}) => {
  const query = new URLSearchParams();
  if (params.lu !== undefined) query.append("lu", String(params.lu));
  if (params.type) query.append("type", params.type);
  if (params.limit) query.append("limit", String(params.limit));
  const data = await notificationRequest(`/?${query.toString()}`);
  return data.data || { notifications: [], nonLues: 0 };
};

export const getUnreadNotificationCount = async () => {
  const data = await notificationRequest("/unread-count");
  return data.data?.nonLues ?? 0;
};

export const markNotificationAsRead = async (id) =>
  notificationRequest(`/${id}/read`, { method: "PATCH" });

export const markAllNotificationsAsRead = async () =>
  notificationRequest("/read-all", { method: "PATCH" });

export const deleteNotification = async (id) =>
  notificationRequest(`/${id}`, { method: "DELETE" });

// --- Catalogue de services ---
const catalogRequest = async (path, { method = "GET", body } = {}) => {
  const response = await fetch(`${API_URL}/api/catalog${path}`, {
    method,
    headers: getAuthHeaders(),
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Erreur lors de l'appel au catalogue");
  }
  return response.json();
};

const versQuery = (params) => {
  const query = new URLSearchParams();
  Object.entries(params || {}).forEach(([cle, valeur]) => {
    if (valeur !== undefined && valeur !== null && valeur !== "") {
      query.append(cle, String(valeur));
    }
  });
  return query.toString();
};

export const getCatalogServices = async (params = {}) => {
  const data = await catalogRequest(`/?${versQuery(params)}`);
  return data.data || { services: [], categories: [], unites: [] };
};

export const getCatalogStats = async () => {
  const data = await catalogRequest("/stats");
  return data.data || {};
};

export const createCatalogService = async (payload) =>
  catalogRequest("/", { method: "POST", body: payload });

export const updateCatalogService = async (id, payload) =>
  catalogRequest(`/${id}`, { method: "PUT", body: payload });

export const deleteCatalogService = async (id) =>
  catalogRequest(`/${id}`, { method: "DELETE" });

// --- Avoirs ---
const creditNoteRequest = async (path, { method = "GET", body } = {}) => {
  const response = await fetch(`${API_URL}/api/credit-notes${path}`, {
    method,
    headers: getAuthHeaders(),
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Erreur lors de l'appel aux avoirs");
  }
  return response.json();
};

export const getCreditNotes = async (params = {}) => {
  const data = await creditNoteRequest(`/?${versQuery(params)}`);
  return data.data || { avoirs: [], totaux: {} };
};

export const getCreditNote = async (id) => {
  const data = await creditNoteRequest(`/${id}`);
  return data.data?.avoir;
};

export const createCreditNote = async (invoiceId, payload) =>
  creditNoteRequest(`/from-invoice/${invoiceId}`, {
    method: "POST",
    body: payload,
  });

export const updateCreditNote = async (id, payload) =>
  creditNoteRequest(`/${id}`, { method: "PUT", body: payload });

export const issueCreditNote = async (id) =>
  creditNoteRequest(`/${id}/issue`, { method: "PATCH" });

export const deleteCreditNote = async (id) =>
  creditNoteRequest(`/${id}`, { method: "DELETE" });

// --- Abonnements ---
const subscriptionRequest = async (path, { method = "GET", body } = {}) => {
  const response = await fetch(`${API_URL}/api/subscriptions${path}`, {
    method,
    headers: getAuthHeaders(),
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Erreur lors de l'appel aux abonnements");
  }
  return response.json();
};

export const getSubscriptions = async (params = {}) => {
  const data = await subscriptionRequest(`/?${versQuery(params)}`);
  return data.data || { abonnements: [], periodicites: [], statuts: [] };
};

export const getSubscriptionStats = async () => {
  const data = await subscriptionRequest("/stats");
  return data.data || {};
};

export const getSubscription = async (id) => {
  const data = await subscriptionRequest(`/${id}`);
  return data.data?.abonnement;
};

export const createSubscription = async (payload) =>
  subscriptionRequest("/", { method: "POST", body: payload });

export const updateSubscription = async (id, payload) =>
  subscriptionRequest(`/${id}`, { method: "PUT", body: payload });

export const generateSubscriptionInvoice = async (id) =>
  subscriptionRequest(`/${id}/generate`, { method: "POST" });

export const deleteSubscription = async (id) =>
  subscriptionRequest(`/${id}`, { method: "DELETE" });

// --- Documents clients ---
export const getClientDocuments = async (clientId) => {
  const response = await fetch(`${API_URL}/api/clients/${clientId}/documents`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Chargement des documents impossible");
  }
  const data = await response.json();
  return data.data || { documents: [], total: 0, tailleTotale: 0 };
};

/**
 * Le corps est un FormData : l'en-tete Content-Type doit etre laisse au
 * navigateur, qui seul connait la frontiere du multipart.
 */
export const uploadClientDocuments = async (clientId, formData) => {
  const token = localStorage.getItem("token");
  const response = await fetch(`${API_URL}/api/clients/${clientId}/documents`, {
    method: "POST",
    headers: { ...(token && { Authorization: `Bearer ${token}` }) },
    body: formData,
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Dépôt impossible");
  }
  return response.json();
};

export const updateClientDocument = async (clientId, docId, payload) => {
  const response = await fetch(
    `${API_URL}/api/clients/${clientId}/documents/${docId}`,
    { method: "PUT", headers: getAuthHeaders(), body: JSON.stringify(payload) },
  );
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Modification impossible");
  }
  return response.json();
};

export const deleteClientDocument = async (clientId, docId) => {
  const response = await fetch(
    `${API_URL}/api/clients/${clientId}/documents/${docId}`,
    { method: "DELETE", headers: getAuthHeaders() },
  );
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Suppression impossible");
  }
  return response.json();
};

/**
 * Le jeton voyage dans un en-tete : un lien direct ne peut pas le porter.
 * Le flux est donc recupere puis remis au navigateur sous forme de blob.
 */
const telechargerFlux = async (url, nomFichier) => {
  const token = localStorage.getItem("token");
  const response = await fetch(url, {
    headers: { ...(token && { Authorization: `Bearer ${token}` }) },
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Téléchargement impossible");
  }
  const blob = await response.blob();
  const lienUrl = window.URL.createObjectURL(blob);
  const lien = document.createElement("a");
  lien.href = lienUrl;
  lien.download = nomFichier || "document";
  document.body.appendChild(lien);
  lien.click();
  lien.remove();
  window.URL.revokeObjectURL(lienUrl);
};

export const downloadClientDocument = (clientId, docId, nomFichier) =>
  telechargerFlux(
    `${API_URL}/api/clients/${clientId}/documents/${docId}/download`,
    nomFichier,
  );

// --- Conformite RGPD ---
export const getErasurePreview = async (clientId) => {
  const response = await fetch(
    `${API_URL}/api/clients/${clientId}/rgpd/erasure-preview`,
    { headers: getAuthHeaders() },
  );
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Analyse impossible");
  }
  const data = await response.json();
  return data.data;
};

export const downloadClientDataExport = (clientId, nomClient) =>
  telechargerFlux(
    `${API_URL}/api/clients/${clientId}/rgpd/export`,
    `export-rgpd-${String(nomClient || "client").replace(/[^a-zA-Z0-9-_]/g, "-")}.json`,
  );

export const eraseClientData = async (clientId) => {
  const response = await fetch(`${API_URL}/api/clients/${clientId}/rgpd`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Effacement impossible");
  }
  return response.json();
};

// --- Devises et taux de change ---
const currencyRequest = async (path, { method = "GET", body } = {}) => {
  const response = await fetch(`${API_URL}/api/currencies${path}`, {
    method,
    headers: getAuthHeaders(),
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Erreur lors de l'appel aux devises");
  }
  return response.json();
};

export const getCurrencies = async (params = {}) => {
  const data = await currencyRequest(`/?${versQuery(params)}`);
  return data.data || { devises: [], deviseBase: "EUR" };
};

export const getCurrencyExposure = async () => {
  const data = await currencyRequest("/exposure");
  return data.data || { repartition: [], deviseBase: "EUR", totalBase: 0 };
};

export const createCurrency = async (payload) =>
  currencyRequest("/", { method: "POST", body: payload });

export const updateCurrency = async (id, payload) =>
  currencyRequest(`/${id}`, { method: "PUT", body: payload });

export const deleteCurrency = async (id) =>
  currencyRequest(`/${id}`, { method: "DELETE" });

export const seedCurrencies = async () =>
  currencyRequest("/seed", { method: "POST" });

/**
 * Formate un montant dans sa devise. Le nombre de decimales suit la devise :
 * le dinar en compte trois, l'euro deux.
 */
export const formatDevise = (montant, devise = "EUR", decimales) => {
  const code = String(devise || "EUR").toUpperCase();
  try {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: code,
      minimumFractionDigits: decimales ?? undefined,
      maximumFractionDigits: decimales ?? undefined,
    }).format(Number(montant || 0));
  } catch {
    // Un code inconnu d'Intl ne doit pas faire disparaitre le montant.
    return `${Number(montant || 0).toFixed(decimales ?? 2)} ${code}`;
  }
};

// --- Achats : demande d'achat -> demande de prix -> commande ---
const purchaseRequest = async (path, { method = "GET", body } = {}) => {
  const response = await fetch(`${API_URL}/api/purchases${path}`, {
    method,
    headers: getAuthHeaders(),
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Erreur lors de l'appel au module achats");
  }

  return response.json();
};

export const getPurchaseStats = async () => {
  const data = await purchaseRequest("/stats");
  return data.data || {};
};

// Demandes d'achat
export const getPurchaseRequests = async (params = {}) => {
  const query = new URLSearchParams();
  if (params.statut) query.append("statut", params.statut);
  if (params.departement) query.append("departement", params.departement);
  const data = await purchaseRequest(`/requests?${query.toString()}`);
  return data.data?.demandes || [];
};

export const createPurchaseRequest = async (payload) =>
  purchaseRequest("/requests", { method: "POST", body: payload });

export const updatePurchaseRequest = async (id, payload) =>
  purchaseRequest(`/requests/${id}`, { method: "PUT", body: payload });

export const submitPurchaseRequest = async (id) =>
  purchaseRequest(`/requests/${id}/submit`, { method: "PATCH" });

export const decidePurchaseRequest = async (id, payload) =>
  purchaseRequest(`/requests/${id}/decision`, { method: "PATCH", body: payload });

export const deletePurchaseRequest = async (id) =>
  purchaseRequest(`/requests/${id}`, { method: "DELETE" });

// Demandes de prix
export const getQuotations = async (params = {}) => {
  const query = new URLSearchParams();
  if (params.statut) query.append("statut", params.statut);
  if (params.demandeAchat) query.append("demandeAchat", params.demandeAchat);
  const data = await purchaseRequest(`/quotations?${query.toString()}`);
  return data.data?.consultations || [];
};

export const createQuotation = async (payload) =>
  purchaseRequest("/quotations", { method: "POST", body: payload });

export const sendQuotation = async (id) =>
  purchaseRequest(`/quotations/${id}/send`, { method: "PATCH" });

export const recordQuotationOffer = async (id, offreId, payload) =>
  purchaseRequest(`/quotations/${id}/offers/${offreId}`, {
    method: "PATCH",
    body: payload,
  });

export const awardQuotation = async (id, payload) =>
  purchaseRequest(`/quotations/${id}/award`, { method: "PATCH", body: payload });

// Commandes d'achat
export const getPurchaseOrders = async (params = {}) => {
  const query = new URLSearchParams();
  if (params.statut) query.append("statut", params.statut);
  if (params.reception) query.append("reception", params.reception);
  if (params.flux) query.append("flux", params.flux);
  const data = await purchaseRequest(`/orders?${query.toString()}`);
  return data.data?.commandes || [];
};

export const createOrderFromQuotation = async (id, payload = {}) =>
  purchaseRequest(`/quotations/${id}/order`, { method: "POST", body: payload });

export const validatePurchaseOrder = async (id) =>
  purchaseRequest(`/orders/${id}/validate`, { method: "PATCH" });

export const receivePurchaseOrder = async (id, payload = {}) =>
  purchaseRequest(`/orders/${id}/receive`, { method: "PATCH", body: payload });

// --- Départements et organisation ---
const departmentRequest = async (path, { method = "GET", body } = {}) => {
  const response = await fetch(`${API_URL}/api/departments${path}`, {
    method,
    headers: getAuthHeaders(),
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Erreur lors de l'appel aux départements");
  }

  return response.json();
};

export const getDepartments = async (params = {}) => {
  const query = new URLSearchParams();
  if (params.actif !== undefined) query.append("actif", String(params.actif));
  const data = await departmentRequest(`/?${query.toString()}`);
  return data.data?.departements || [];
};

export const getOrganisation = async () => {
  const data = await departmentRequest("/organisation");
  return data.data || { organisation: [], orphelins: [] };
};

export const createDepartment = async (payload) =>
  departmentRequest("/", { method: "POST", body: payload });

export const updateDepartment = async (id, payload) =>
  departmentRequest(`/${id}`, { method: "PUT", body: payload });

export const deleteDepartment = async (id) =>
  departmentRequest(`/${id}`, { method: "DELETE" });

export const assignEmployeeToDepartment = async (payload) =>
  departmentRequest("/assign", { method: "PATCH", body: payload });
