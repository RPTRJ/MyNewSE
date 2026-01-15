const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export type AuthUser = {
  id: string | number;
  type_id: number;
  email: string;
  profile_completed?: boolean;
  pdpa_consent?: boolean;
  [key: string]: unknown;
};

export type LoginResponse = {
  token: string;
  user: AuthUser;
};

export type RegisterPayload = {
  email: string;
  password: string;
  type_id: number;
  // Optional fields - will be filled during onboarding
  phone?: string;
  first_name_th?: string;
  last_name_th?: string;
  first_name_en?: string;
  last_name_en?: string;
  birthday?: string;
  id_type?: number;
  pdpa_consent?: boolean;
};

export async function loginService(
  email: string,
  password: string
): Promise<LoginResponse> {
  const response = await fetch(`${API_URL}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Login failed");
  }

  return data as LoginResponse;
}

export async function registerService(payload: RegisterPayload) {
  const response = await fetch(`${API_URL}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Registration failed");
  return data;
}
