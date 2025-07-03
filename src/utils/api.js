// src/utils/api.js

const API_BASE = "https://mypropai-server.onrender.com/api"; // ✅ Use your live backend URL

// Create Investment
export const createInvestment = async (data) => {
  const res = await fetch(`${API_BASE}/investments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include", // ✅ Needed for cookie-based sessions
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Failed to save investment");
  }

  return res.json();
};

// Get All Investments
export const getInvestments = async () => {
  const res = await fetch(`${API_BASE}/investments`, {
    method: "GET",
    credentials: "include", // ✅ Include cookie in request
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Failed to load investments");
  }

  return res.json();
};

// Logout
export const logoutUser = async () => {
  await fetch(`${API_BASE}/auth/logout`, {
    method: "POST",
    credentials: "include", // ✅ Send cookie for logout
  });
};
