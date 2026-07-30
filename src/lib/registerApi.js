import { API_URL } from "@/lib/auth";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email) {
  return EMAIL_RE.test(String(email || "").trim());
}

export function isValidPhone(phone) {
  return /^\d{10}$/.test(String(phone || "").trim());
}

export async function checkEmailAvailability(email) {
  const res = await fetch(`${API_URL}/api/auth/check-email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: email.trim().toLowerCase() }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to check email");
  return data;
}

export async function checkPhoneAvailability(phone) {
  const res = await fetch(`${API_URL}/api/auth/check-phone`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone: phone.trim() }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to check phone");
  return data;
}

export async function sendEmailOtp(contact) {
  const res = await fetch(`${API_URL}/api/otp/email/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contact }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to send email OTP");
  return data;
}

export async function verifyEmailOtp(contact, otp) {
  const res = await fetch(`${API_URL}/api/otp/email/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contact, otp }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Invalid email OTP");
  return data;
}

export async function sendMobileOtp(contact) {
  const res = await fetch(`${API_URL}/api/otp/mobile/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contact }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to send mobile OTP");
  return data;
}

export async function verifyMobileOtp(contact, otp) {
  const res = await fetch(`${API_URL}/api/otp/mobile/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contact, otp }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Invalid mobile OTP");
  return data;
}

export async function registerBroker(payload) {
  const res = await fetch(`${API_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Registration failed");
  return data;
}
