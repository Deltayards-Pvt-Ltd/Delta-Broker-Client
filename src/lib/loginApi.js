import { API_URL } from "@/lib/auth";

export function isValidPhone(phone) {
  return /^\d{10}$/.test(String(phone || "").trim());
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
