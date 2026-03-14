// client/src/utils/api.js
import { API_BASE_URL } from "../config";

const getErrorPayload = async (res) => {
  try {
    return await res.json();
  } catch (error) {
    return null;
  }
};

const getErrorMessage = async (res, fallbackMessage) => {
  const payload = await getErrorPayload(res);
  return payload?.msg || payload?.message || payload?.error || fallbackMessage;
};

/**
 * ==========================
 *   AUTH HEADER HELPERS
 * ==========================
 */
export const getAuthHeaders = (isFormData = false) => {
  const token = localStorage.getItem("token");
  const headers = {};
  if (!isFormData) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
};

const getTenantAuthHeaders = (isFormData = false) => {
  const token = localStorage.getItem("tenantToken");
  const headers = {};
  if (!isFormData) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
};

/**
 * ==========================
 *   OPTIONAL: GEOCODING (Mapbox)
 * ==========================
 */
export const geocodeAddress = async (address) => {
  const token = process.env.REACT_APP_MAPBOX_TOKEN;
  if (!token) throw new Error("Missing REACT_APP_MAPBOX_TOKEN");
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
    address
  )}.json?access_token=${token}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Geocoding failed");
  return res.json();
};

export const searchAddressSuggestions = async (query, signal) => {
  const token = process.env.REACT_APP_MAPBOX_TOKEN;
  if (!token) throw new Error("Missing REACT_APP_MAPBOX_TOKEN");
  if (!query?.trim()) return [];

  const url = new URL(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json`
  );
  url.searchParams.set("access_token", token);
  url.searchParams.set("autocomplete", "true");
  url.searchParams.set("limit", "5");
  url.searchParams.set("types", "address");
  url.searchParams.set("country", "us");

  const res = await fetch(url.toString(), { signal });
  if (!res.ok) throw new Error("Address search failed");

  const data = await res.json();
  return data.features || [];
};

/**
 * ==========================
 *   COMPS (BACKEND-DRIVEN)
 * ==========================
 */
export const fetchComps = async ({ lat, lng, radius = 1 }) => {
  const params = new URLSearchParams({ lat, lng, radius });
  const res = await fetch(`${API_BASE_URL}/comps?${params.toString()}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error("Failed to fetch comps");
  return res.json();
};

/**
 * ==========================
 *   DASHBOARD
 * ==========================
 */
export const getDashboardSummary = async () => {
  const res = await fetch(`${API_BASE_URL}/dashboard/summary`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error("Failed to fetch dashboard summary");
  return res.json();
};

/**
 * ==========================
 *   LEADS & BIDS
 * ==========================
 */
export const getLeads = async () => {
  const res = await fetch(`${API_BASE_URL}/leads`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error("Failed to fetch leads");
  return res.json();
};

export const createLead = async (data) => {
  const res = await fetch(`${API_BASE_URL}/leads`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error((await res.json()).msg || "Failed to create lead");
  return res.json();
};

export const previewLeadProperty = async (data) => {
  const res = await fetch(`${API_BASE_URL}/leads/preview-property`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error((await res.json()).msg || "Failed to preview property details");
  return res.json();
};

export const getLeadDetails = async (leadId) => {
  const res = await fetch(`${API_BASE_URL}/leads/${leadId}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error("Failed to fetch lead details");
  return res.json();
};

export const updateLead = async (id, data) => {
  const res = await fetch(`${API_BASE_URL}/leads/${id}`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update lead");
  return res.json();
};

export const deleteLead = async (id) => {
  const res = await fetch(`${API_BASE_URL}/leads/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error("Failed to delete lead");
  return res.json();
};

export const getLeadSummary = async () => {
  const res = await fetch(`${API_BASE_URL}/leads/summary`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error("Failed to fetch lead summary");
  return res.json();
};

export const getProperties = async () => {
  const res = await fetch(`${API_BASE_URL}/properties`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error(await getErrorMessage(res, "Failed to fetch properties"));
  return res.json();
};

export const createProperty = async (data) => {
  const res = await fetch(`${API_BASE_URL}/properties`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await getErrorMessage(res, "Failed to create property"));
  return res.json();
};

export const getPropertyWorkspace = async (propertyKey) => {
  const res = await fetch(`${API_BASE_URL}/properties/${encodeURIComponent(propertyKey)}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error(await getErrorMessage(res, "Failed to fetch property workspace"));
  return res.json();
};

export const updatePropertyWorkspace = async (propertyKey, data) => {
  const res = await fetch(`${API_BASE_URL}/properties/${encodeURIComponent(propertyKey)}`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await getErrorMessage(res, "Failed to update property"));
  return res.json();
};

export const createPropertyWorkspace = async (propertyKey, workspaceKey, data = {}) => {
  const res = await fetch(
    `${API_BASE_URL}/properties/${encodeURIComponent(propertyKey)}/workspaces/${workspaceKey}`,
    {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    }
  );
  if (!res.ok) throw new Error(await getErrorMessage(res, "Failed to create workspace"));
  return res.json();
};

export const analyzeLeadComps = async (leadId, filters) => {
  const res = await fetch(`${API_BASE_URL}/leads/${leadId}/analyze-comps`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(filters),
  });
  if (!res.ok) throw new Error(await getErrorMessage(res, "Failed to analyze comps"));
  return res.json();
};

export const analyzeStandaloneComps = async (subject, filters) => {
  const res = await fetch(`${API_BASE_URL}/comps/report`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ subject, ...filters }),
  });
  if (!res.ok) throw new Error(await getErrorMessage(res, "Failed to analyze comps"));
  return res.json();
};

export const analyzeFullPropertyReport = async (subject, filters = {}) => {
  const res = await fetch(`${API_BASE_URL}/comps/report/full`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ subject, ...filters }),
  });
  if (!res.ok) throw new Error(await getErrorMessage(res, "Failed to analyze property"));
  return res.json();
};

export const getBidsForLead = async (leadId) => {
  const res = await fetch(`${API_BASE_URL}/bids/lead/${leadId}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error("Failed to fetch bids");
  return res.json();
};

export const importBid = async (formData) => {
  const res = await fetch(`${API_BASE_URL}/bids/import`, {
    method: "POST",
    headers: getAuthHeaders(true),
    body: formData,
  });
  if (!res.ok) throw new Error((await res.json()).msg || "Failed to import bid");
  return res.json();
};

export const createBid = async (data) => {
  const res = await fetch(`${API_BASE_URL}/bids`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await getErrorMessage(res, "Failed to create bid"));
  return res.json();
};

export const updateBid = async (bidId, data) => {
  const res = await fetch(`${API_BASE_URL}/bids/${bidId}`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await getErrorMessage(res, "Failed to update bid"));
  return res.json();
};

export const deleteBid = async (bidId) => {
  const res = await fetch(`${API_BASE_URL}/bids/${bidId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error("Failed to delete bid");
  return res.json();
};

export const promoteLeadToProject = async (leadId) => {
  const res = await fetch(`${API_BASE_URL}/leads/${leadId}/promote-to-project`, {
    method: "POST",
    headers: getAuthHeaders(),
  });
  if (res.status === 404) {
    throw new Error(
      "The project promotion endpoint is not available on the server yet. Redeploy the backend and try again."
    );
  }
  if (!res.ok) throw new Error(await getErrorMessage(res, "Failed to create project"));
  return res.json();
};

/**
 * ==========================
 *   UNIVERSAL TASKS
 * ==========================
 */
export const getTaskList = async (params = {}) => {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, value);
    }
  });

  const path = query.toString()
    ? `${API_BASE_URL}/tasks?${query.toString()}`
    : `${API_BASE_URL}/tasks`;

  const res = await fetch(path, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error(await getErrorMessage(res, "Failed to fetch tasks"));
  return res.json();
};

export const createWorkspaceTask = async (data) => {
  const res = await fetch(`${API_BASE_URL}/tasks`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await getErrorMessage(res, "Failed to create task"));
  return res.json();
};

export const updateWorkspaceTask = async (taskId, data) => {
  const res = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await getErrorMessage(res, "Failed to update task"));
  return res.json();
};

export const deleteWorkspaceTask = async (taskId) => {
  const res = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error(await getErrorMessage(res, "Failed to delete task"));
  return res.json();
};

/**
 * ==========================
 *   INVESTMENTS
 * ==========================
 */
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

export const updateInvestment = async (id, data) => {
  const res = await fetch(`${API_BASE_URL}/investments/${id}`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error((await res.json()).message || "Failed to update investment");
  return res.json();
};

/**
 * ==========================
 *   PROJECT HUB: BUDGET / EXPENSES / DOCS / TASKS
 * ==========================
 */
export const getBudgetItems = async (investmentId) => {
  const res = await fetch(
    `${API_BASE_URL}/budget-items/investment/${investmentId}`,
    { headers: getAuthHeaders() }
  );
  if (!res.ok) throw new Error("Failed to fetch budget items");
  return res.json();
};

export const createBudgetItem = async (data) => {
  const res = await fetch(`${API_BASE_URL}/budget-items`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create budget item");
  return res.json();
};

export const updateBudgetItem = async (id, data) => {
  const res = await fetch(`${API_BASE_URL}/budget-items/${id}`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update budget item");
  return res.json();
};

export const addBudgetAward = async (budgetItemId, data) => {
  const res = await fetch(`${API_BASE_URL}/budget-items/${budgetItemId}/awards`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await getErrorMessage(res, "Failed to add vendor commitment"));
  return res.json();
};

export const updateBudgetAward = async (budgetItemId, awardId, data) => {
  const res = await fetch(`${API_BASE_URL}/budget-items/${budgetItemId}/awards/${awardId}`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await getErrorMessage(res, "Failed to update vendor commitment"));
  return res.json();
};

export const deleteBudgetAward = async (budgetItemId, awardId) => {
  const res = await fetch(`${API_BASE_URL}/budget-items/${budgetItemId}/awards/${awardId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error(await getErrorMessage(res, "Failed to delete vendor commitment"));
  return res.json();
};

export const deleteBudgetItem = async (id) => {
  const res = await fetch(`${API_BASE_URL}/budget-items/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error("Failed to delete budget item");
  return res.json();
};

export const getExpenses = async (investmentId) => {
  const res = await fetch(`${API_BASE_URL}/expenses/investment/${investmentId}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error("Failed to fetch expenses");
  return res.json();
};

export const createExpense = async (formData) => {
  const res = await fetch(`${API_BASE_URL}/expenses`, {
    method: "POST",
    headers: getAuthHeaders(true),
    body: formData,
  });
  if (!res.ok) throw new Error(await getErrorMessage(res, "Failed to create expense"));
  return res.json();
};

export const updateExpense = async (id, data) => {
  const res = await fetch(`${API_BASE_URL}/expenses/${id}`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await getErrorMessage(res, "Failed to update expense"));
  return res.json();
};

export const deleteExpense = async (id) => {
  const res = await fetch(`${API_BASE_URL}/expenses/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error(await getErrorMessage(res, "Failed to delete expense"));
  return res.json();
};

export const analyzeExpenseReceipt = async (formData) => {
  const res = await fetch(`${API_BASE_URL}/expenses/analyze-receipt`, {
    method: "POST",
    headers: getAuthHeaders(true),
    body: formData,
  });
  if (!res.ok) throw new Error(await getErrorMessage(res, "Failed to analyze receipt"));
  return res.json();
};

export const getVendors = async () => {
  const res = await fetch(`${API_BASE_URL}/vendors`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error(await getErrorMessage(res, "Failed to fetch vendors"));
  return res.json();
};

export const getVendor = async (id) => {
  const res = await fetch(`${API_BASE_URL}/vendors/${id}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error(await getErrorMessage(res, "Failed to fetch vendor"));
  return res.json();
};

export const createVendor = async (data) => {
  const res = await fetch(`${API_BASE_URL}/vendors`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await getErrorMessage(res, "Failed to create vendor"));
  return res.json();
};

export const updateVendor = async (id, data) => {
  const res = await fetch(`${API_BASE_URL}/vendors/${id}`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await getErrorMessage(res, "Failed to update vendor"));
  return res.json();
};

export const deleteVendor = async (id) => {
  const res = await fetch(`${API_BASE_URL}/vendors/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error(await getErrorMessage(res, "Failed to delete vendor"));
  return res.json();
};

export const uploadVendorDocument = async (vendorId, formData) => {
  const res = await fetch(`${API_BASE_URL}/vendors/${vendorId}/documents`, {
    method: "POST",
    headers: getAuthHeaders(true),
    body: formData,
  });
  if (!res.ok) throw new Error(await getErrorMessage(res, "Failed to upload vendor document"));
  return res.json();
};

export const deleteVendorDocument = async (vendorId, documentId) => {
  const res = await fetch(`${API_BASE_URL}/vendors/${vendorId}/documents/${documentId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error(await getErrorMessage(res, "Failed to delete vendor document"));
  return res.json();
};

export const getProjectTasks = async (investmentId) => {
  const res = await fetch(
    `${API_BASE_URL}/project-tasks/investment/${investmentId}`,
    { headers: getAuthHeaders() }
  );
  if (!res.ok) throw new Error("Failed to fetch project tasks");
  return res.json();
};

export const createProjectTask = async (data) => {
  const res = await fetch(`${API_BASE_URL}/project-tasks`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await getErrorMessage(res, "Failed to create project task"));
  return res.json();
};

export const updateProjectTask = async (taskId, updates) => {
  const res = await fetch(`${API_BASE_URL}/project-tasks/${taskId}`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error(await getErrorMessage(res, "Failed to update task"));
  return res.json();
};

// Backwards-compatible alias used by older components.
export const updateTask = updateProjectTask;

export const deleteProjectTask = async (taskId) => {
  const res = await fetch(`${API_BASE_URL}/project-tasks/${taskId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error(await getErrorMessage(res, "Failed to delete task"));
  return res.json();
};

export const getProjectDocuments = async (investmentId) => {
  const res = await fetch(`${API_BASE_URL}/documents/investment/${investmentId}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error(await getErrorMessage(res, "Failed to fetch documents"));
  return res.json();
};

export const uploadProjectDocument = async (formData) => {
  const res = await fetch(`${API_BASE_URL}/documents`, {
    method: "POST",
    headers: getAuthHeaders(true),
    body: formData,
  });
  if (!res.ok) throw new Error(await getErrorMessage(res, "Failed to upload document"));
  return res.json();
};

export const deleteProjectDocument = async (documentId) => {
  const res = await fetch(`${API_BASE_URL}/documents/${documentId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error(await getErrorMessage(res, "Failed to delete document"));
  return res.json();
};

const normalizeManagedDocumentFormData = (formData) => {
  const normalized = new FormData();
  const displayName = formData.get("displayName");
  const file = formData.get("document") || formData.get("file");

  if (displayName) normalized.append("displayName", displayName);
  if (file) normalized.append("document", file);

  return normalized;
};

const flattenPropertyDocuments = (data) => {
  if (Array.isArray(data)) return data;
  if (!data || typeof data !== "object") return [];

  const propertyWide = Array.isArray(data.propertyWide) ? data.propertyWide : [];
  const byUnit = data.byUnit && typeof data.byUnit === "object"
    ? Object.values(data.byUnit).flat()
    : [];

  return [...propertyWide, ...byUnit];
};

/**
 * ==========================
 *   MANAGED PROPERTY DOCUMENTS
 * ==========================
 */
export const getPropertyDocuments = async (propertyId) => {
  const res = await fetch(`${API_BASE_URL}/managed-documents/property/${propertyId}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error("Failed to fetch property documents");
  return flattenPropertyDocuments(await res.json());
};

export const uploadPropertyDocument = async (propertyId, formData) => {
  const res = await fetch(`${API_BASE_URL}/managed-documents/property/${propertyId}`, {
    method: "POST",
    headers: getAuthHeaders(true),
    body: normalizeManagedDocumentFormData(formData),
  });
  if (!res.ok) throw new Error("Failed to upload property document");
  return res.json();
};

export const deletePropertyDocument = async (documentId) => {
  const res = await fetch(`${API_BASE_URL}/managed-documents/${documentId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error("Failed to delete property document");
  return res.json();
};

export const getUnitDocuments = async (unitId) => {
  const res = await fetch(`${API_BASE_URL}/managed-documents/unit/${unitId}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error("Failed to fetch unit documents");
  return res.json();
};

export const uploadUnitDocument = async (unitId, formData) => {
  const res = await fetch(`${API_BASE_URL}/managed-documents/unit/${unitId}`, {
    method: "POST",
    headers: getAuthHeaders(true),
    body: normalizeManagedDocumentFormData(formData),
  });
  if (!res.ok) throw new Error("Failed to upload unit document");
  return res.json();
};

export const deleteUnitDocument = async (documentId) => {
  const res = await fetch(`${API_BASE_URL}/managed-documents/${documentId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error("Failed to delete unit document");
  return res.json();
};

/**
 * ==========================
 *   AUTH (MANAGER)
 * ==========================
 */
export const loginUser = async (email, password) => {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error((await res.json()).message || "Failed to log in");
  return res.json();
};

export const signupUser = async ({ name, email, password }) => {
  const res = await fetch(`${API_BASE_URL}/auth/signup`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ name, email, password }),
  });
  if (!res.ok) throw new Error((await res.json()).message || "Failed to sign up");
  return res.json();
};

export const getCurrentUser = async () => {
  const res = await fetch(`${API_BASE_URL}/auth/me`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error("Failed to fetch current user");
  return res.json();
};

export const logoutUser = async () => {
  try {
    await fetch(`${API_BASE_URL}/auth/logout`, {
      method: "POST",
      headers: getAuthHeaders(),
    });
  } catch (error) {
    console.error("Logout API call failed, proceeding with client-side logout.", error);
  } finally {
    localStorage.removeItem("token");
  }
};

export const updateUserProfile = async (profileData) => {
  const res = await fetch(`${API_BASE_URL}/auth/me/update`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify(profileData),
  });
  if (!res.ok) throw new Error((await res.json()).message || "Failed to update profile");
  return res.json();
};

export const changePassword = async (passwordData) => {
  const res = await fetch(`${API_BASE_URL}/auth/change-password`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(passwordData),
  });
  if (!res.ok) throw new Error((await res.json()).message || "Failed to change password");
  return res.json();
};

/**
 * ==========================
 *   STRIPE
 * ==========================
 */
export const createStripeConnectAccount = async () => {
  const res = await fetch(`${API_BASE_URL}/stripe/create-connect-account`, {
    method: "POST",
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error("Failed to create Stripe Connect account link");
  return res.json();
};

/**
 * ==========================
 *   PROPERTY MGMT (MANAGER)
 * ==========================
 */
export const getUnitDetails = async (unitId) => {
  const res = await fetch(`${API_BASE_URL}/management/units/${unitId}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error("Failed to fetch unit details");
  return res.json();
};

export const getManagedProperties = async () => {
  const res = await fetch(`${API_BASE_URL}/management`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error(await getErrorMessage(res, "Failed to fetch managed properties"));
  return res.json();
};

export const promoteInvestmentToManagement = async (investmentId) => {
  const res = await fetch(`${API_BASE_URL}/management/promote/${investmentId}`, {
    method: "POST",
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error(await getErrorMessage(res, "Failed to start management"));
  return res.json();
};

export const runRecurringCharges = async () => {
  const res = await fetch(`${API_BASE_URL}/management/recurring/run`, {
    method: "POST",
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error((await res.json()).msg || "Failed to run recurring charges");
  return res.json();
};

export const getMaintenanceTickets = async (propertyId) => {
  const res = await fetch(`${API_BASE_URL}/maintenance/property/${propertyId}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error("Failed to fetch maintenance tickets");
  return res.json();
};

export const createMaintenanceTicket = async (formData) => {
  const res = await fetch(`${API_BASE_URL}/maintenance`, {
    method: "POST",
    headers: getAuthHeaders(true),
    body: formData,
  });
  if (!res.ok) throw new Error("Failed to create maintenance ticket");
  return res.json();
};

export const updateMaintenanceTicket = async (ticketId, data) => {
  const res = await fetch(`${API_BASE_URL}/maintenance/${ticketId}`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update maintenance ticket");
  return res.json();
};

export const deleteMaintenanceTicket = async (ticketId) => {
  const res = await fetch(`${API_BASE_URL}/maintenance/${ticketId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error("Failed to delete maintenance ticket");
  return res.json();
};

export const getOperatingExpenses = async (propertyId) => {
  const res = await fetch(`${API_BASE_URL}/operating-expenses/property/${propertyId}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error("Failed to fetch operating expenses");
  return res.json();
};

export const createOperatingExpense = async (formData) => {
  const res = await fetch(`${API_BASE_URL}/operating-expenses`, {
    method: "POST",
    headers: getAuthHeaders(true),
    body: formData,
  });
  if (!res.ok) throw new Error("Failed to create operating expense");
  return res.json();
};

export const updateListingDetails = async (unitId, data) => {
  const res = await fetch(`${API_BASE_URL}/management/units/${unitId}/listing`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update listing details");
  return res.json();
};

export const addListingPhotos = async (unitId, formData) => {
  const res = await fetch(`${API_BASE_URL}/management/units/${unitId}/listing/photos`, {
    method: "POST",
    headers: getAuthHeaders(true),
    body: formData,
  });
  if (!res.ok) throw new Error("Failed to upload photos");
  return res.json();
};

export const deleteListingPhoto = async (unitId, photoId) => {
  const res = await fetch(
    `${API_BASE_URL}/management/units/${unitId}/listing/photos/${photoId}`,
    {
      method: "DELETE",
      headers: getAuthHeaders(),
    }
  );
  if (!res.ok) throw new Error("Failed to delete photo");
  return res.json();
};

export const archiveLease = async (leaseId) => {
  const res = await fetch(`${API_BASE_URL}/management/leases/${leaseId}/archive`, {
    method: "POST",
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error("Failed to archive lease");
  return res.json();
};

export const getArchivedLeases = async (propertyId) => {
  const res = await fetch(
    `${API_BASE_URL}/management/property/${propertyId}/archived-leases`,
    { headers: getAuthHeaders() }
  );
  if (!res.ok) throw new Error("Failed to fetch archived leases");
  return res.json();
};

export const getInspectionsForProperty = async (propertyId) => {
  const res = await fetch(`${API_BASE_URL}/inspections/property/${propertyId}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error("Failed to fetch inspections");
  return res.json();
};

export const createInspection = async (data) => {
  const res = await fetch(`${API_BASE_URL}/inspections`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create inspection");
  return res.json();
};

export const updateInspection = async (id, data) => {
  const res = await fetch(`${API_BASE_URL}/inspections/${id}`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update inspection");
  return res.json();
};

/**
 * ==========================
 *   AI TOOLS
 * ==========================
 */
export const generateAIDescription = async (data) => {
  const res = await fetch(`${API_BASE_URL}/ai-tools/generate-description`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error((await res.json()).msg || "Failed to generate AI description");
  return res.json();
};

export const generateBudgetLines = async (data) => {
  const res = await fetch(`${API_BASE_URL}/investments/generate-budget-lines`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error((await res.json()).msg || "Failed to generate budget lines");
  return res.json();
};

export const generateAIReport = async (investmentId) => {
  const res = await fetch(`${API_BASE_URL}/investments/generate-report/${investmentId}`, {
    method: "POST",
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error(await getErrorMessage(res, "Failed to generate AI report"));
  return res.json();
};

/**
 * ==========================
 *   BILLING
 * ==========================
 */
export const getBillingOverview = async () => {
  const res = await fetch(`${API_BASE_URL}/billing/overview`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error(await getErrorMessage(res, "Failed to load billing overview"));
  return res.json();
};

export const getBillingAccess = async (kind, resourceId) => {
  const params = new URLSearchParams({ kind });
  if (resourceId) {
    params.set("resourceId", resourceId);
  }
  const res = await fetch(`${API_BASE_URL}/billing/access?${params.toString()}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error(await getErrorMessage(res, "Failed to load billing access"));
  return res.json();
};

export const createSubscriptionCheckout = async (planKey = "pro") => {
  const res = await fetch(`${API_BASE_URL}/billing/checkout/subscription`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ planKey }),
  });
  if (!res.ok) throw new Error(await getErrorMessage(res, "Failed to start subscription checkout"));
  return res.json();
};

export const createOneTimeCheckout = async ({ kind, resourceId }) => {
  const res = await fetch(`${API_BASE_URL}/billing/checkout/one-time`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ kind, resourceId }),
  });
  if (!res.ok) throw new Error(await getErrorMessage(res, "Failed to start checkout"));
  return res.json();
};

export const createBillingPortalSession = async () => {
  const res = await fetch(`${API_BASE_URL}/billing/portal`, {
    method: "POST",
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error(await getErrorMessage(res, "Failed to open the billing portal"));
  return res.json();
};

export const syncBillingCheckoutSession = async (sessionId) => {
  const res = await fetch(`${API_BASE_URL}/billing/sync-session`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ sessionId }),
  });
  if (!res.ok) throw new Error(await getErrorMessage(res, "Failed to sync checkout session"));
  return res.json();
};

/**
 * ==========================
 *   PLATFORM MANAGER
 * ==========================
 */
export const getPlatformManagerUsers = async (query = "") => {
  const params = new URLSearchParams();
  if (query.trim()) {
    params.set("q", query.trim());
  }

  const suffix = params.toString() ? `?${params.toString()}` : "";
  const res = await fetch(`${API_BASE_URL}/platform-manager/users${suffix}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error(await getErrorMessage(res, "Failed to load platform users"));
  return res.json();
};

export const startPlatformManagerImpersonation = async (userId) => {
  const res = await fetch(`${API_BASE_URL}/platform-manager/users/${userId}/impersonate`, {
    method: "POST",
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error(await getErrorMessage(res, "Failed to start impersonation"));
  return res.json();
};

export const setPlatformManagerSubscriptionOverride = async (userId, overridePlan) => {
  const res = await fetch(`${API_BASE_URL}/platform-manager/users/${userId}/subscription-override`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify({ overridePlan }),
  });
  if (!res.ok) throw new Error(await getErrorMessage(res, "Failed to update user access"));
  return res.json();
};

export const setPlatformManagerAccountStatus = async (userId, status) => {
  const res = await fetch(`${API_BASE_URL}/platform-manager/users/${userId}/account-status`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error(await getErrorMessage(res, "Failed to update account status"));
  return res.json();
};

export const deletePlatformManagerUser = async (userId) => {
  const res = await fetch(`${API_BASE_URL}/platform-manager/users/${userId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error(await getErrorMessage(res, "Failed to delete user"));
  return res.json();
};

/**
 * ==========================
 *   TENANT PORTAL
 * ==========================
 */
export const getTenantLeaseDetails = async () => {
  const res = await fetch(`${API_BASE_URL}/tenant/lease-details`, {
    headers: getTenantAuthHeaders(),
  });
  if (!res.ok) throw new Error(await getErrorMessage(res, "Failed to fetch lease details"));
  return res.json();
};

export const submitTenantCommunication = async (formData) => {
  const res = await fetch(`${API_BASE_URL}/tenant/communications`, {
    method: "POST",
    headers: getTenantAuthHeaders(true),
    body: formData,
  });
  if (!res.ok) throw new Error(await getErrorMessage(res, "Failed to submit request"));
  return res.json();
};

export const logoutTenant = () => {
  localStorage.removeItem("tenantToken");
};

/**
 * ==========================
 *   APPLICATIONS
 * ==========================
 */
export const getApplicationDetails = async (applicationId) => {
  const res = await fetch(`${API_BASE_URL}/applications/${applicationId}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.msg || error.message || "Failed to fetch application details");
  }
  return res.json();
};

export const updateApplicationStatus = async (applicationId, status) => {
  const res = await fetch(`${API_BASE_URL}/applications/${applicationId}/status`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify({ status }),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.msg || error.message || "Failed to update application status");
  }
  return res.json();
};

export const initiateScreening = async (applicationId) => {
  const res = await fetch(
    `${API_BASE_URL}/applications/${applicationId}/initiate-screening`,
    {
      method: "POST",
      headers: getAuthHeaders(),
    }
  );
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.msg || error.message || "Failed to initiate screening");
  }
  return res.json();
};

export const submitApplication = async (data) => {
  const res = await fetch(`${API_BASE_URL}/applications/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.msg || error.message || "Failed to submit application");
  }
  return res.json();
};

export const createApplicationInvite = async (data) => {
  const res = await fetch(`${API_BASE_URL}/applications/invitations`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.msg || error.message || "Failed to create application invite");
  }
  return res.json();
};

export const createApplicationPaymentIntent = async (applicationId) => {
  const res = await fetch(
    `${API_BASE_URL}/applications/${applicationId}/create-payment-intent`,
    {
      method: "POST",
      headers: getAuthHeaders(),
    }
  );
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.msg || error.message || "Failed to create payment session");
  }
  return res.json();
};

export const confirmApplicationPayment = async (sessionId) => {
  const res = await fetch(`${API_BASE_URL}/applications/payment-session/${sessionId}`, {
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.msg || error.message || "Failed to confirm payment");
  }
  return res.json();
};

export const getPublicApplicationDetails = async (options) => {
  let url = `${API_BASE_URL}/applications/public`;

  if (typeof options === "string") {
    url = `${url}/${encodeURIComponent(options)}`;
  } else if (options?.inviteToken || options?.unitId) {
    const params = new URLSearchParams();
    if (options.inviteToken) {
      params.set("invite", options.inviteToken);
    }
    if (options.unitId) {
      params.set("unitId", options.unitId);
    }
    url = `${url}?${params.toString()}`;
  }

  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.msg || error.message || "Failed to fetch application details");
  }
  return res.json();
};

export const getApplications = async ({ propertyId } = {}) => {
  const query = propertyId
    ? `?${new URLSearchParams({ propertyId }).toString()}`
    : "";
  const res = await fetch(`${API_BASE_URL}/applications${query}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.msg || error.message || "Failed to fetch applications");
  }
  return res.json();
};

export const getApplicationsForProperty = async (propertyId) => getApplications({ propertyId });

/**
 * ==========================
 *   NOTIFICATIONS
 * ==========================
 */
export const getNotifications = async () => {
  const res = await fetch(`${API_BASE_URL}/notifications`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error("Failed to fetch notifications");
  return res.json();
};

export const markNotificationRead = async (id) => {
  const res = await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
    method: "PATCH",
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error("Failed to mark notification as read");
  return res.json();
};
