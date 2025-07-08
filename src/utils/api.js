// src/utils/api.js
const API_BASE = "https://mypropai-server.onrender.com/api";

// Get token-based headers
export const getTokenHeader = () => {
  const token = localStorage.getItem("token");
  console.log("Auth token being sent:", token);

  const headers = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
};

// ✅ Create a new investment
export const createInvestment = async (data) => {
  const res = await fetch(`${API_BASE}/investments`, {
    method: "POST",
    headers: getTokenHeader(),
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Failed to save investment");
  }

  return res.json();
};

// ✅ Get all investments
export const getInvestments = async () => {
  const res = await fetch(`${API_BASE}/investments`, {
    method: "GET",
    headers: getTokenHeader(),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Failed to load investments");
  }

  return res.json();
};

// ✅ Get a single investment by ID
export const getInvestment = async (id) => {
  const res = await fetch(`${API_BASE}/investments/${id}`, {
    method: "GET",
    headers: getTokenHeader(),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Failed to fetch investment");
  }

  return res.json();
};

// ✅ Add a new budget line
export const addBudgetLine = async (investmentId, line) => {
  const res = await fetch(`${API_BASE}/investments/${investmentId}`, {
    method: "PATCH",
    headers: getTokenHeader(),
    body: JSON.stringify({ $push: { budget: line } }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Failed to add budget line");
  }

  return res.json();
};

// ✅ Add a new expense (linked to budget category)
export const addExpense = async (investmentId, expense) => {
  const res = await fetch(`${API_BASE}/investments/${investmentId}`, {
    method: "PATCH",
    headers: getTokenHeader(),
    body: JSON.stringify({ $push: { expenses: expense } }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Failed to add expense");
  }

  return res.json();
};

// ✅ Logout
export const logoutUser = async () => {
  localStorage.removeItem("token");
};
