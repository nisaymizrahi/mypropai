import { API_BASE_URL } from "../config";
import { getAuthHeaders } from "./api";

const getQuoteRequestErrorMessage = async (res, fallbackMessage) => {
  try {
    const payload = await res.json();
    return payload?.msg || payload?.message || fallbackMessage;
  } catch (error) {
    return fallbackMessage;
  }
};

export const getQuoteRequestsForLead = async (leadId) => {
  const res = await fetch(`${API_BASE_URL}/quote-requests/lead/${leadId}`, {
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    throw new Error(await getQuoteRequestErrorMessage(res, "Failed to load quote requests"));
  }

  return res.json();
};

export const getQuoteRequestsForProject = async (investmentId) => {
  const res = await fetch(`${API_BASE_URL}/quote-requests/project/${investmentId}`, {
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    throw new Error(await getQuoteRequestErrorMessage(res, "Failed to load quote requests"));
  }

  return res.json();
};

export const createQuoteRequest = async (payload) => {
  const res = await fetch(`${API_BASE_URL}/quote-requests`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(await getQuoteRequestErrorMessage(res, "Failed to create quote request"));
  }

  return res.json();
};

export const updateQuoteRequest = async (requestId, payload) => {
  const res = await fetch(`${API_BASE_URL}/quote-requests/${requestId}`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(await getQuoteRequestErrorMessage(res, "Failed to update quote request"));
  }

  return res.json();
};

export const attachQuoteToRequest = async (requestId, payload) => {
  const res = await fetch(`${API_BASE_URL}/quote-requests/${requestId}/attach-bid`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(await getQuoteRequestErrorMessage(res, "Failed to attach quote"));
  }

  return res.json();
};
