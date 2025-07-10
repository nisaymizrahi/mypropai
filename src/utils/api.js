import { API_BASE_URL } from '../config'; // NEW: Import from our central config file

// Get token-based headers
export const getTokenHeader = () => {
  const token = localStorage.getItem("token");
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
};

// All functions now use the guaranteed correct API_BASE_URL
export const createInvestment = async (data) => {
  const res = await fetch(`${API_BASE_URL}/investments`, {
    method: "POST",
    headers: getTokenHeader(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error((await res.json()).message || "Failed to save investment");
  return res.json();
};

export const getInvestments = async () => {
  const res = await fetch(`${API_BASE_URL}/investments`, {
    method: "GET",
    headers: getTokenHeader(),
  });
  if (!res.ok) throw new Error((await res.json()).message || "Failed to load investments");
  return res.json();
};

export const getInvestment = async (id) => {
  const res = await fetch(`${API_BASE_URL}/investments/${id}`, {
    method: "GET",
    headers: getTokenHeader(),
  });
  if (!res.ok) throw new Error((await res.json()).message || "Failed to fetch investment");
  return res.json();
};

export const deleteInvestment = async (id) => {
    const res = await fetch(`${API_BASE_URL}/investments/${id}`, {
        method: "DELETE",
        headers: getTokenHeader(),
    });
    if (!res.ok) throw new Error((await res.json()).message || "Failed to delete investment");
    return res.json();
};

export const addBudgetLine = async (investmentId, line) => {
  const res = await fetch(`${API_BASE_URL}/investments/${investmentId}/budget`, {
    method: "POST",
    headers: getTokenHeader(),
    body: JSON.stringify(line),
  });
  if (!res.ok) throw new Error((await res.json()).message || "Failed to add budget line");
  return res.json();
};

export const updateBudgetLine = async (investmentId, index, updates) => {
  const res = await fetch(`${API_BASE_URL}/investments/${investmentId}/budget/${index}`, {
    method: "PATCH",
    headers: getTokenHeader(),
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error((await res.json()).message || "Failed to update budget line");
  return res.json();
};

export const addExpense = async (investmentId, expense) => {
  const res = await fetch(`${API_BASE_URL}/investments/${investmentId}/expenses`, {
    method: "POST",
    headers: getTokenHeader(),
    body: JSON.stringify(expense),
  });
  if (!res.ok) throw new Error((await res.json()).message || "Failed to add expense");
  return res.json();
};

export const updateExpense = async (investmentId, index, updates) => {
  const res = await fetch(`${API_BASE_URL}/investments/${investmentId}/expenses/${index}`, {
    method: "PATCH",
    headers: getTokenHeader(),
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error((await res.json()).message || "Failed to update expense");
  return res.json();
};

export const deleteExpense = async (investmentId, index) => {
  const res = await fetch(`${API_BASE_URL}/investments/${investmentId}/expenses/${index}`, {
    method: "DELETE",
    headers: getTokenHeader(),
  });
  if (!res.ok) throw new Error((await res.json()).message || "Failed to delete expense");
  return res.json();
};

export const logoutUser = () => {
  localStorage.removeItem("token");
};
