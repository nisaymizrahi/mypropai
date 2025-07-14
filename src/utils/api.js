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

// --- Dashboard Functions ---
export const getDashboardSummary = async () => {
    const res = await fetch(`${API_BASE_URL}/dashboard/summary`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch dashboard summary');
    return res.json();
};

// --- Investment Functions ---
export const createInvestment = async (data) => {
  const res = await fetch(`${API_BASE_URL}/investments`, { method: "POST", headers: getAuthHeaders(), body: JSON.stringify(data) });
  if (!res.ok) throw new Error((await res.json()).message || "Failed to save investment");
  return res.json();
};
export const getInvestments = async () => {
  const res = await fetch(`${API_BASE_URL}/investments`, { method: "GET", headers: getAuthHeaders() });
  if (!res.ok) throw new Error((await res.json()).message || "Failed to load investments");
  return res.json();
};
export const getInvestment = async (id) => {
  const res = await fetch(`${API_BASE_URL}/investments/${id}`, { method: "GET", headers: getAuthHeaders() });
  if (!res.ok) throw new Error((await res.json()).message || "Failed to fetch investment");
  return res.json();
};
export const deleteInvestment = async (id) => {
    const res = await fetch(`${API_BASE_URL}/investments/${id}`, { method: "DELETE", headers: getAuthHeaders() });
    if (!res.ok) throw new Error((await res.json()).message || "Failed to delete investment");
    return res.json();
};


// --- Project Hub API Functions ---
export const getBudgetItems = async (investmentId) => {
  const res = await fetch(`${API_BASE_URL}/budget-items/investment/${investmentId}`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Failed to fetch budget items');
  return res.json();
};
export const createBudgetItem = async (data) => {
  const res = await fetch(`${API_BASE_URL}/budget-items`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(data) });
  if (!res.ok) throw new Error('Failed to create budget item');
  return res.json();
};
export const updateBudgetItem = async (id, data) => {
  const res = await fetch(`${API_BASE_URL}/budget-items/${id}`, { method: 'PATCH', headers: getAuthHeaders(), body: JSON.stringify(data) });
  if (!res.ok) throw new Error('Failed to update budget item');
  return res.json();
};
export const deleteBudgetItem = async (id) => {
  const res = await fetch(`${API_BASE_URL}/budget-items/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Failed to delete budget item');
  return res.json();
};
export const getExpenses = async (investmentId) => {
  const res = await fetch(`${API_BASE_URL}/expenses/investment/${investmentId}`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Failed to fetch expenses');
  return res.json();
};
export const createExpense = async (formData) => {
  const res = await fetch(`${API_BASE_URL}/expenses`, { method: 'POST', headers: getAuthHeaders(true), body: formData });
  if (!res.ok) throw new Error('Failed to create expense');
  return res.json();
};
export const updateExpense = async (id, data) => {
    const res = await fetch(`${API_BASE_URL}/expenses/${id}`, { method: 'PATCH', headers: getAuthHeaders(), body: JSON.stringify(data) });
    if (!res.ok) throw new Error('Failed to update expense');
    return res.json();
};
export const deleteExpense = async (id) => {
    const res = await fetch(`${API_BASE_URL}/expenses/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to delete expense');
    return res.json();
};
export const getVendors = async () => {
    const res = await fetch(`${API_BASE_URL}/vendors`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch vendors');
    return res.json();
};
export const createVendor = async (data) => {
    const res = await fetch(`${API_BASE_URL}/vendors`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(data) });
    if (!res.ok) throw new Error('Failed to create vendor');
    return res.json();
};
export const updateVendor = async (id, data) => {
    const res = await fetch(`${API_BASE_URL}/vendors/${id}`, { method: 'PATCH', headers: getAuthHeaders(), body: JSON.stringify(data) });
    if (!res.ok) throw new Error('Failed to update vendor');
    return res.json();
};
export const deleteVendor = async (id) => {
    const res = await fetch(`${API_BASE_URL}/vendors/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to delete vendor');
    return res.json();
};
export const getProjectTasks = async (investmentId) => {
    const res = await fetch(`${API_BASE_URL}/project-tasks/investment/${investmentId}`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch project tasks');
    return res.json();
};
export const createProjectTask = async (data) => {
    const res = await fetch(`${API_BASE_URL}/project-tasks`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(data) });
    if (!res.ok) throw new Error('Failed to create project task');
    return res.json();
};
export const getProjectDocuments = async (investmentId) => {
    const res = await fetch(`${API_BASE_URL}/documents/investment/${investmentId}`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch documents');
    return res.json();
};
export const uploadProjectDocument = async (formData) => {
    const res = await fetch(`${API_BASE_URL}/documents`, { method: 'POST', headers: getAuthHeaders(true), body: formData });
    if (!res.ok) throw new Error('Failed to upload document');
    return res.json();
};
export const deleteProjectDocument = async (documentId) => {
    const res = await fetch(`${API_BASE_URL}/documents/${documentId}`, { method: 'DELETE', headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to delete document');
    return res.json();
};


// --- Auth Functions ---
export const loginUser = async (email, password) => {
    const res = await fetch(`${API_BASE_URL}/auth/login`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ email, password }) });
    if (!res.ok) throw new Error((await res.json()).message || "Failed to log in");
    return res.json();
};
export const logoutUser = async () => {
  try {
    await fetch(`${API_BASE_URL}/auth/logout`, { method: 'POST', headers: getAuthHeaders() });
  } catch (error) {
    console.error('Logout API call failed, proceeding with client-side logout.', error);
  } finally {
    localStorage.removeItem("token");
  }
};
export const updateUserProfile = async (profileData) => {
    const res = await fetch(`${API_BASE_URL}/auth/me/update`, { method: 'PATCH', headers: getAuthHeaders(), body: JSON.stringify(profileData) });
    if (!res.ok) throw new Error((await res.json()).message || "Failed to update profile");
    return res.json();
};
export const changePassword = async (passwordData) => {
    const res = await fetch(`${API_BASE_URL}/auth/change-password`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(passwordData) });
    if (!res.ok) throw new Error((await res.json()).message || "Failed to change password");
    return res.json();
};


// --- Property Management Functions ---
export const runRecurringCharges = async () => {
  const res = await fetch(`${API_BASE_URL}/management/recurring/run`, { method: 'POST', headers: getAuthHeaders() });
  if (!res.ok) throw new Error((await res.json()).msg || 'Failed to run recurring charges');
  return res.json();
};
export const getMaintenanceTickets = async (propertyId) => {
    const res = await fetch(`${API_BASE_URL}/maintenance/property/${propertyId}`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch maintenance tickets');
    return res.json();
};
export const createMaintenanceTicket = async (formData) => {
    const res = await fetch(`${API_BASE_URL}/maintenance`, { method: 'POST', headers: getAuthHeaders(true), body: formData });
    if (!res.ok) throw new Error('Failed to create maintenance ticket');
    return res.json();
};
export const updateMaintenanceTicket = async (ticketId, data) => {
    const res = await fetch(`${API_BASE_URL}/maintenance/${ticketId}`, { method: 'PATCH', headers: getAuthHeaders(), body: JSON.stringify(data) });
    if (!res.ok) throw new Error('Failed to update maintenance ticket');
    return res.json();
};
export const deleteMaintenanceTicket = async (ticketId) => {
    const res = await fetch(`${API_BASE_URL}/maintenance/${ticketId}`, { method: 'DELETE', headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to delete maintenance ticket');
    return res.json();
};
export const getOperatingExpenses = async (propertyId) => {
    const res = await fetch(`${API_BASE_URL}/operating-expenses/property/${propertyId}`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch operating expenses');
    return res.json();
};
export const createOperatingExpense = async (formData) => {
    const res = await fetch(`${API_BASE_URL}/operating-expenses`, { method: 'POST', headers: getAuthHeaders(true), body: formData });
    if (!res.ok) throw new Error('Failed to create operating expense');
    return res.json();
};
export const updateListingDetails = async (propertyId, data) => {
    const res = await fetch(`${API_BASE_URL}/management/${propertyId}/listing`, { method: 'PATCH', headers: getAuthHeaders(), body: JSON.stringify(data) });
    if (!res.ok) throw new Error('Failed to update listing details');
    return res.json();
};
export const addListingPhotos = async (propertyId, formData) => {
    const res = await fetch(`${API_BASE_URL}/management/${propertyId}/listing/photos`, { method: 'POST', headers: getAuthHeaders(true), body: formData });
    if (!res.ok) throw new Error('Failed to upload photos');
    return res.json();
};
export const deleteListingPhoto = async (propertyId, photoId) => {
    const res = await fetch(`${API_BASE_URL}/management/${propertyId}/listing/photos/${photoId}`, { method: 'DELETE', headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to delete photo');
    return res.json();
};


// --- AI Tool Functions ---
export const generateAIDescription = async (data) => {
    const res = await fetch(`${API_BASE_URL}/ai-tools/generate-description`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error((await res.json()).msg || 'Failed to generate AI description');
    return res.json();
};


// --- Tenant Portal Functions ---
const getTenantAuthHeaders = (isFormData = false) => {
  const token = localStorage.getItem("tenantToken");
  const headers = {};
  if (!isFormData) { headers["Content-Type"] = "application/json"; }
  if (token) { headers.Authorization = `Bearer ${token}`; }
  return headers;
};
export const getTenantLeaseDetails = async () => {
  const res = await fetch(`${API_BASE_URL}/tenant/lease-details`, { headers: getTenantAuthHeaders() });
  if (!res.ok) throw new Error('Failed to fetch lease details');
  return res.json();
};
export const submitTenantCommunication = async (formData) => {
  const res = await fetch(`${API_BASE_URL}/tenant/communications`, { method: 'POST', headers: getTenantAuthHeaders(true), body: formData });
  if (!res.ok) throw new Error('Failed to submit request');
  return res.json();
};
export const logoutTenant = () => {
  localStorage.removeItem("tenantToken");
};
