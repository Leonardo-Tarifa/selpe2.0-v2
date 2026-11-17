const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3333";

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  status: number;
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("selpe_token");
}

export function setToken(token: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem("selpe_token", token);
  }
}

export function setAuth(token: string, user?: any) {
  if (typeof window !== "undefined") {
    localStorage.setItem("selpe_token", token);
    if (user) {
      localStorage.setItem("selpe_usuario", JSON.stringify(user));
      if (user.role) {
        localStorage.setItem("selpe_tipo_usuario", user.role);
      }
    }
  }
}

export function clearAuth() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("selpe_token");
    localStorage.removeItem("selpe_usuario");
    localStorage.removeItem("selpe_tipo_usuario");
  }
}

async function request<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = getToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return {
        error: data.message || data.error || "Ocorreu um erro na requisição.",
        status: res.status,
      };
    }

    return {
      data,
      status: res.status,
    };
  } catch (err: any) {
    return {
      error: "Não foi possível conectar ao servidor. Verifique sua conexão.",
      status: 0,
    };
  }
}

export const api = {
  get: <T = any>(endpoint: string) => request<T>(endpoint, { method: "GET" }),
  post: <T = any>(endpoint: string, body: any) =>
    request<T>(endpoint, { method: "POST", body: JSON.stringify(body) }),
  put: <T = any>(endpoint: string, body: any) =>
    request<T>(endpoint, { method: "PUT", body: JSON.stringify(body) }),
  delete: <T = any>(endpoint: string) => request<T>(endpoint, { method: "DELETE" }),
};
