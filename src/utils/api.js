const API_BASE = "https://mypropai-server.onrender.com/api";

// Helper: get auth header
const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  console.log("Auth token being sent:", token); // ✅ DEBUG LINE
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
};


// Create Investment
export const createInvestment = async (data) => {
  const res = await fetch(`${API_BASE}/investments`, {
    method: "POST",
    headers: getAuthHeaders(),
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
    headers: getAuthHeaders(),
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
  // Optional: call backend to invalidate token (if implemented)
};
