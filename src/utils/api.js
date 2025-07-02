const API_BASE = "http://localhost:5001/api";

export const createInvestment = async (data) => {
  const res = await fetch(`${API_BASE}/investments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Failed to save investment");
  }

  return res.json();
};
