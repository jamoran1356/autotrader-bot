const AUTH_TOKEN_KEY = "autotrader_auth_token";
const AUTH_USER_KEY = "autotrader_auth_user";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export type AuthUser = {
  id: string;
  email: string;
  displayName: string;
  role: string;
  walletAddress?: string | null;
};

type AuthPayload = {
  status: string;
  data: {
    token: string;
    user: AuthUser;
  };
};

export function getAuthToken() {
  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function isLoggedIn() {
  return Boolean(getAuthToken());
}

export function getAuthUser(): AuthUser | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = localStorage.getItem(AUTH_USER_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setAuthSession(token: string, user: AuthUser) {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  window.dispatchEvent(new Event("autotrader-auth-change"));
}

export function clearAuthSession() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
  window.dispatchEvent(new Event("autotrader-auth-change"));
}

async function postAuth(path: "/auth/login" | "/auth/register", body: Record<string, string>) {
  const response = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(payload.error || "Authentication failed");
  }

  return (await response.json()) as AuthPayload;
}

export async function loginWithPassword(email: string, password: string) {
  const payload = await postAuth("/auth/login", { email, password });
  setAuthSession(payload.data.token, payload.data.user);
  return payload.data.user;
}

export async function registerWithPassword(displayName: string, email: string, password: string) {
  const payload = await postAuth("/auth/register", { displayName, email, password });
  setAuthSession(payload.data.token, payload.data.user);
  return payload.data.user;
}

export async function fetchCurrentUser() {
  const token = getAuthToken();
  if (!token) {
    return null;
  }

  const response = await fetch(`${API_URL}/users/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as { data: AuthUser };
  const currentToken = getAuthToken();
  if (currentToken) {
    setAuthSession(currentToken, payload.data);
  }

  return payload.data;
}

export async function updateWalletAddress(walletAddress: string) {
  const token = getAuthToken();
  if (!token) {
    throw new Error("Missing auth token");
  }

  const response = await fetch(`${API_URL}/users/wallet`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ walletAddress }),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(payload.error || "Wallet update failed");
  }

  const payload = (await response.json()) as { data: AuthUser };
  setAuthSession(token, payload.data);
  return payload.data;
}
