// src/utils/api.js

// FIXED: The fallback URL now correctly includes the /api path.
const API_BASE = process.env.REACT_APP_API_BASE_URL || "https://mypropai-server.onrender.com/api";

// Get token-based headers
export const getTokenHeader = () => {
  const token = localStorage.getItem("token");
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
};

// Create a new investment
export const createInvestment = async (data) => {
  const res = await fetch(`${API_BASE}/investments`, {
    method: "POST",
    headers: getTokenHeader(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error((await res.json()).message || "Failed to save investment");
  return res.json();
};

// Get all investments
export const getInvestments = async () => {
  const res = await fetch(`${API_BASE}/investments`, {
    method: "GET",
    headers: getTokenHeader(),
  });
  if (!res.ok) throw new Error((await res.json()).message || "Failed to load investments");
  return res.json();
};

// Get a single investment by ID
export const getInvestment = async (id) => {
  const res = await fetch(`${API_BASE}/investments/${id}`, {
    method: "GET",
    headers: getTokenHeader(),
  });
  if (!res.ok) throw new Error((await res.json()).message || "Failed to fetch investment");
  return res.json();
};

// Delete an investment by ID
export const deleteInvestment = async (id) => {
    const res = await fetch(`${API_BASE}/investments/${id}`, {
        method: "DELETE",
        headers: getTokenHeader(),
    });
    if (!res.ok) throw new Error((await res.json()).message || "Failed to delete investment");
    return res.json();
};


// Add a new budget line
export const addBudgetLine = async (investmentId, line) => {
  const res = await fetch(`${API_BASE}/investments/${investmentId}/budget`, {
    method: "POST",
    headers: getTokenHeader(),
    body: JSON.stringify(line),
  });

  if (!res.ok) throw new Error((await res.json()).message || "Failed to add budget line");
  return res.json();
};

// Update a specific budget line
export const updateBudgetLine = async (investmentId, index, updates) => {
  const res = await fetch(`${API_BASE}/investments/${investmentId}/budget/${index}`, {
    method: "PATCH",
    headers: getTokenHeader(),
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error((await res.json()).message || "Failed to update budget line");
  return res.json();
};

// Add an expense
export const addExpense = async (investmentId, expense) => {
  const res = await fetch(`${API_BASE}/investments/${investmentId}/expenses`, {
    method: "POST",
    headers: getTokenHeader(),
    body: JSON.stringify(expense),
  });

  if (!res.ok) throw new Error((await res.json()).message || "Failed to add expense");
  return res.json();
};

// Update an expense by index using backend route
export const updateExpense = async (investmentId, index, updates) => {
  const res = await fetch(`${API_BASE}/investments/${investmentId}/expenses/${index}`, {
    method: "PATCH",
    headers: getTokenHeader(),
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error((await res.json()).message || "Failed to update expense");
  return res.json();
};

// Delete an expense by index using backend route
export const deleteExpense = async (investmentId, index) => {
  const res = await fetch(`${API_BASE}/investments/${investmentId}/expenses/${index}`, {
    method: "DELETE",
    headers: getTokenHeader(),
  });
  if (!res.ok) throw new Error((await res.json()).message || "Failed to delete expense");
  return res.json();
};

// Logout
export const logoutUser = async () => {
  localStorage.removeItem("token");
};
