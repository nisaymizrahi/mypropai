import { API_BASE_URL } from '../config';

// Handles auth headers for the property manager
export const getAuthHeaders = (isFormData = false) => {
  const token = localStorage.getItem("token");
  const headers = {};

  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  
  return headers;
};

// --- Investment Functions ---
export const createInvestment = async (data) => {
  const res = await fetch(`${API_BASE_URL}/investments`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error((await res.json()).message || "Failed to save investment");
  return res.json();
};

export const getInvestments = async () => {
  const res = await fetch(`${API_BASE_URL}/investments`, {
    method: "GET",
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error((await res.json()).message || "Failed to load investments");
  return res.json();
};

export const getInvestment = async (id) => {
  const res = await fetch(`${API_BASE_URL}/investments/${id}`, {
    method: "GET",
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error((await res.json()).message || "Failed to fetch investment");
  return res.json();
};

export const deleteInvestment = async (id) => {
    const res = await fetch(`${API_BASE_URL}/investments/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error((await res.json()).message || "Failed to delete investment");
    return res.json();
};


// --- Project Hub API Functions ---

// --- Budget Items ---
export const getBudgetItems = async (investmentId) => {
  const res = await fetch(`${API_BASE_URL}/budget-items/investment/${investmentId}`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Failed to fetch budget items');
  return res.json();
};

export const createBudgetItem = async (data) => {
  const res = await fetch(`${API_BASE_URL}/budget-items`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create budget item');
  return res.json();
};

export const updateBudgetItem = async (id, data) => {
  const res = await fetch(`${API_BASE_URL}/budget-items/${id}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update budget item');
  return res.json();
};

export const deleteBudgetItem = async (id) => {
  const res = await fetch(`${API_BASE_URL}/budget-items/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Failed to delete budget item');
  return res.json();
};

// --- Expenses ---
export const getExpenses = async (investmentId) => {
  const res = await fetch(`${API_BASE_URL}/expenses/investment/${investmentId}`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Failed to fetch expenses');
  return res.json();
};

export const createExpense = async (formData) => {
  const res = await fetch(`${API_BASE_URL}/expenses`, {
    method: 'POST',
    headers: getAuthHeaders(true),
    body: formData,
  });
  if (!res.ok) throw new Error('Failed to create expense');
  return res.json();
};

// ✅ ADDED
export const updateExpense = async (id, data) => {
    const res = await fetch(`${API_BASE_URL}/expenses/${id}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update expense');
    return res.json();
};

// ✅ ADDED
export const deleteExpense = async (id) => {
    const res = await fetch(`${API_BASE_URL}/expenses/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete expense');
    return res.json();
};

// --- Vendors ---
export const getVendors = async () => {
    const res = await fetch(`${API_BASE_URL}/vendors`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch vendors');
    return res.json();
};

export const createVendor = async (data) => {
    const res = await fetch(`${API_BASE_URL}/vendors`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create vendor');
    return res.json();
};

export const updateVendor = async (id, data) => {
    const res = await fetch(`${API_BASE_URL}/vendors/${id}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update vendor');
    return res.json();
};

export const deleteVendor = async (id) => {
    const res = await fetch(`${API_BASE_URL}/vendors/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete vendor');
    return res.json();
};


// --- Project Tasks ---
export const getProjectTasks = async (investmentId) => {
    const res = await fetch(`${API_BASE_URL}/project-tasks/investment/${investmentId}`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch project tasks');
    return res.json();
};

export const createProjectTask = async (data) => {
    const res = await fetch(`${API_BASE_URL}/project-tasks`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create project task');
    return res.json();
};

// --- Project Documents ---
export const getProjectDocuments = async (investmentId) => {
    const res = await fetch(`${API_BASE_URL}/documents/investment/${investmentId}`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch documents');
    return res.json();
};

export const uploadProjectDocument = async (formData) => {
    const res = await fetch(`${API_BASE_URL}/documents`, {
        method: 'POST',
        headers: getAuthHeaders(true),
        body: formData,
    });
    if (!res.ok) throw new Error('Failed to upload document');
    return res.json();
};

export const deleteProjectDocument = async (documentId) => {
    const res = await fetch(`${API_BASE_URL}/documents/${documentId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete document');
    return res.json();
};

// --- Auth Functions ---
export const logoutUser = () => {
  localStorage.removeItem("token");
};

// --- Recurring Charges ---
export const runRecurringCharges = async () => {
  const res = await fetch(`${API_BASE_URL}/management/recurring/run`, {
    method: 'POST',
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error((await res.json()).msg || 'Failed to run recurring charges');
  return res.json();
};


// --- Tenant Portal Functions ---
const getTenantAuthHeaders = (isFormData = false) => {
  const token = localStorage.getItem("tenantToken");
  const headers = {};

  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  
  return headers;
};

export const getTenantLeaseDetails = async () => {
  const res = await fetch(`${API_BASE_URL}/tenant/lease-details`, {
    headers: getTenantAuthHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch lease details');
  return res.json();
};

export const submitTenantCommunication = async (formData) => {
  const res = await fetch(`${API_BASE_URL}/tenant/communications`, {
    method: 'POST',
    headers: getTenantAuthHeaders(true),
    body: formData,
  });
  if (!res.ok) throw new Error('Failed to submit request');
  return res.json();
};

export const logoutTenant = () => {
  localStorage.removeItem("tenantToken");
};