"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getPostLoginPath } from "@/lib/auth";
import { isValidPhone, loginCheckPhone, loginSendOtp } from "@/lib/loginApi";
import styles from "./authForm.module.css";

const OTP_MS = 2 * 60 * 1000;

function formatTimer(ms) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}

export default function AuthForm() {
  const router = useRouter();
  const { loginWithOtp } = useAuth();

  const [phone, setPhone] = useState("");
  const [phoneStatus, setPhoneStatus] = useState(null);
  const [checking, setChecking] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [demoOtp, setDemoOtp] = useState(null);
  const [otpUntil, setOtpUntil] = useState(0);
  const [now, setNow] = useState(Date.now());
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!otpUntil) return undefined;
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, [otpUntil]);

  const resetFlow = () => {
    setPhoneStatus(null);
    setOtpSent(false);
    setOtp("");
    setDemoOtp(null);
    setOtpUntil(0);
    setError("");
  };

  const handlePhoneChange = (value) => {
    const digits = value.replace(/\D/g, "").slice(0, 10);
    setPhone(digits);
    resetFlow();
  };

  const handleCheckPhone = async () => {
    setError("");
    if (!isValidPhone(phone)) {
      setError("Enter a valid 10-digit mobile number");
      return;
    }

    setChecking(true);
    try {
      const data = await loginCheckPhone(phone);
      setPhoneStatus(data);
      if (!data.canLogin) {
        setError(data.message || "Cannot sign in with this number");
      }
    } catch (err) {
      setPhoneStatus(null);
      setError(err.message || "Failed to check number");
    } finally {
      setChecking(false);
    }
  };

  const handleSendOtp = async () => {
    setError("");
    setSending(true);
    try {
      const data = await loginSendOtp(phone);
      setOtpSent(true);
      setOtp("");
      setDemoOtp(data.demoOtp || null);
      setOtpUntil(Date.now() + OTP_MS);
    } catch (err) {
      setError(err.message || "Failed to send OTP");
    } finally {
      setSending(false);
    }
  };

  const handleBrokerLogin = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const data = await loginWithOtp(phone, otp);
      router.replace(getPostLoginPath(data.user));
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setSubmitting(false);
    }
  };

  const canSendOtp = phoneStatus?.canLogin === true;
  const otpLeft = otpUntil - now;
  const canResend = otpSent && otpLeft <= 0;

  return (
    <form className={styles.form} onSubmit={handleBrokerLogin} noValidate>
      <div className={styles.field}>
        <label htmlFor="phone">Mobile number</label>
        <input
          id="phone"
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          value={phone}
          onChange={(e) => handlePhoneChange(e.target.value)}
          placeholder="10-digit mobile"
          required
        />
      </div>

      {!otpSent ? (
        <>
          {!canSendOtp ? (
            <button
              type="button"
              className={styles.submit}
              disabled={checking || !isValidPhone(phone)}
              onClick={handleCheckPhone}
            >
              {checking ? "Checking…" : "Continue"}
            </button>
          ) : (
            <>
              <p className={styles.fieldOk}>
                Number registered. Send OTP to sign in.
              </p>
              <button
                type="button"
                className={styles.submit}
                disabled={sending}
                onClick={handleSendOtp}
              >
                {sending ? "Sending…" : "Send OTP"}
              </button>
            </>
          )}
        </>
      ) : (
        <>
          <div className={styles.otpBlock}>
            {demoOtp ? (
              <p className={styles.otpHint}>
                Demo OTP: <strong>{demoOtp}</strong>
              </p>
            ) : (
              <p className={styles.otpHint}>OTP sent to +91 {phone}</p>
            )}

            <div className={styles.field}>
              <label htmlFor="otp">OTP</label>
              <input
                id="otp"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={otp}
                onChange={(e) =>
                  setOtp(e.target.value.replace(/\D/g, "").slice(0, 4))
                }
                placeholder="4-digit OTP"
                className={styles.otpInputWide}
                required
              />
            </div>

            <div className={styles.otpMeta}>
              {otpLeft > 0 ? (
                <span className={styles.timer}>
                  Resend in {formatTimer(otpLeft)}
                </span>
              ) : (
                <button
                  type="button"
                  className={styles.linkBtn}
                  disabled={sending || !canResend}
                  onClick={handleSendOtp}
                >
                  {sending ? "Sending…" : "Resend OTP"}
                </button>
              )}
              <button
                type="button"
                className={styles.linkBtn}
                onClick={() => {
                  setOtpSent(false);
                  setOtp("");
                  setDemoOtp(null);
                  setOtpUntil(0);
                  setError("");
                }}
              >
                Change number
              </button>
            </div>
          </div>

          <button
            type="submit"
            className={styles.submit}
            disabled={submitting || otp.length !== 4}
          >
            {submitting ? "Signing in…" : "Sign in"}
          </button>
        </>
      )}

      {error ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : null}

      <p className={styles.footerNote}>
        New partner? <Link href="/register">Register</Link>
      </p>
    </form>
  );
}
