import { API_URL } from "@/lib/auth";

export function isValidPhone(phone) {
  return /^\d{10}$/.test(String(phone || "").trim());
}

export function isValidAdminPin(pin) {
  return /^\d{4}$/.test(String(pin || "").trim());
}

export async function loginCheckPhone(phone) {
  const res = await fetch(`${API_URL}/api/auth/login/check-phone`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone: phone.trim() }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to check phone");
  return data;
}

export async function loginSendOtp(phone) {
  const res = await fetch(`${API_URL}/api/auth/login/send-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone: phone.trim() }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to send OTP");
  return data;
}

export async function loginPassword(phone, password) {
  const res = await fetch(`${API_URL}/api/auth/login/password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      phone: String(phone).trim(),
      password: String(password).trim(),
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Login failed");
  return data;
}

export async function changeMyPassword({
  currentPassword,
  newPassword,
  confirmPassword,
  token,
}) {
  const res = await fetch(`${API_URL}/api/auth/me/password`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      currentPassword,
      newPassword,
      confirmPassword,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to update password");
  return data;
}

export async function skipPasswordReset(token) {
  const res = await fetch(`${API_URL}/api/auth/me/password-reset/skip`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to skip");
  return data;
}
