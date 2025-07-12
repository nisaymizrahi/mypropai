import { API_BASE_URL } from '../config';

// ✅ NEW: A flexible function for getting auth headers.
// It handles both JSON and FormData requests.
export const getAuthHeaders = (isFormData = false) => {
  const token = localStorage.getItem("token");
  const headers = {};

  // Do NOT set Content-Type for FormData, the browser does it.
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
    headers: getAuthHeaders(), // Use new function
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error((await res.json()).message || "Failed to save investment");
  return res.json();
};

export const getInvestments = async () => {
  const res = await fetch(`${API_BASE_URL}/investments`, {
    method: "GET",
    headers: getAuthHeaders(), // Use new function
  });
  if (!res.ok) throw new Error((await res.json()).message || "Failed to load investments");
  return res.json();
};

export const getInvestment = async (id) => {
  const res = await fetch(`${API_BASE_URL}/investments/${id}`, {
    method: "GET",
    headers: getAuthHeaders(), // Use new function
  });
  if (!res.ok) throw new Error((await res.json()).message || "Failed to fetch investment");
  return res.json();
};

export const deleteInvestment = async (id) => {
    const res = await fetch(`${API_BASE_URL}/investments/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(), // Use new function
    });
    if (!res.ok) throw new Error((await res.json()).message || "Failed to delete investment");
    return res.json();
};

// --- Budget Functions ---
export const addBudgetLine = async (investmentId, line) => {
  const res = await fetch(`${API_BASE_URL}/investments/${investmentId}/budget`, {
    method: "POST",
    headers: getAuthHeaders(), // Use new function
    body: JSON.stringify(line),
  });
  if (!res.ok) throw new Error((await res.json()).message || "Failed to add budget line");
  return res.json();
};

export const updateBudgetLine = async (investmentId, index, updates) => {
  const res = await fetch(`${API_BASE_URL}/investments/${investmentId}/budget/${index}`, {
    method: "PATCH",
    headers: getAuthHeaders(), // Use new function
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error((await res.json()).message || "Failed to update budget line");
  return res.json();
};

export const deleteBudgetLine = async (investmentId, index) => {
  const res = await fetch(`${API_BASE_URL}/investments/${investmentId}/budget/${index}`, {
    method: "DELETE",
    headers: getAuthHeaders(), // Use new function
  });
  if (!res.ok) throw new Error((await res.json()).message || "Failed to delete budget line");
  return res.json();
};

// --- Expense Functions ---
export const addExpense = async (investmentId, expense) => {
  const res = await fetch(`${API_BASE_URL}/investments/${investmentId}/expenses`, {
    method: "POST",
    headers: getAuthHeaders(), // Use new function
    body: JSON.stringify(expense),
  });
  if (!res.ok) throw new Error((await res.json()).message || "Failed to add expense");
  return res.json();
};

export const updateExpense = async (investmentId, index, updates) => {
  const res = await fetch(`${API_BASE_URL}/investments/${investmentId}/expenses/${index}`, {
    method: "PATCH",
    headers: getAuthHeaders(), // Use new function
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error((await res.json()).message || "Failed to update expense");
  return res.json();
};

export const deleteExpense = async (investmentId, index) => {
  const res = await fetch(`${API_BASE_URL}/investments/${investmentId}/expenses/${index}`, {
    method: "DELETE",
    headers: getAuthHeaders(), // Use new function
  });
  if (!res.ok) throw new Error((await res.json()).message || "Failed to delete expense");
  return res.json();
};

// --- File Upload Function ---
export const uploadReceipt = async (file) => {
    const formData = new FormData();
    formData.append('receipt', file);

    const res = await fetch(`${API_BASE_URL}/uploads/receipt`, {
        method: 'POST',
        headers: getAuthHeaders(true), // Use new function for FormData
        body: formData,
    });

    if (!res.ok) throw new Error((await res.json()).message || "File upload failed");
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
    headers: getAuthHeaders() // Use new function
  });
  if (!res.ok) throw new Error((await res.json()).msg || 'Failed to run recurring charges');
  return res.json();
};
