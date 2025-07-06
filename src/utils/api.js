const API_BASE = "https://mypropai-server.onrender.com/api";

// ✅ Exported token header helper for use in all secured API calls
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

// Create Investment
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

// Get All Investments
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

// Logout
export const logoutUser = async () => {
  localStorage.removeItem("token");
};
