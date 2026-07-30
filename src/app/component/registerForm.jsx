"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  checkEmailAvailability,
  checkPhoneAvailability,
  isValidEmail,
  isValidPhone,
  registerBroker,
  sendEmailOtp,
  sendMobileOtp,
  verifyEmailOtp,
  verifyMobileOtp,
} from "@/lib/registerApi";
import TermsReader from "@/app/component/TermsReader";
import styles from "./registerForm.module.css";

const emptyForm = {
  partnerType: "individual",
  name: "",
  firmName: "",
  email: "",
  phone: "",
  maharera: "",
};

const OTP_MS = 2 * 60 * 1000;

function formatRemain(ms) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function RegisterForm({
  step = 1,
  onStepChange,
  onPendingDone,
}) {
  const [form, setForm] = useState(emptyForm);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsRead, setTermsRead] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [pendingDone, setPendingDone] = useState(false);

  const [emailMsg, setEmailMsg] = useState("");
  const [phoneMsg, setPhoneMsg] = useState("");
  const [emailOk, setEmailOk] = useState(false);
  const [phoneOk, setPhoneOk] = useState(false);

  const [emailVerifiedFor, setEmailVerifiedFor] = useState("");
  const [phoneVerifiedFor, setPhoneVerifiedFor] = useState("");
  const [emailOtpFor, setEmailOtpFor] = useState("");
  const [phoneOtpFor, setPhoneOtpFor] = useState("");
  const [emailOtpUntil, setEmailOtpUntil] = useState(0);
  const [phoneOtpUntil, setPhoneOtpUntil] = useState(0);

  const [emailOtp, setEmailOtp] = useState("");
  const [phoneOtp, setPhoneOtp] = useState("");
  const [otpBusy, setOtpBusy] = useState("");
  const [now, setNow] = useState(Date.now());
  const [emailDemoOtp, setEmailDemoOtp] = useState("");
  const [phoneDemoOtp, setPhoneDemoOtp] = useState("");
  const [emailHint, setEmailHint] = useState("");
  const [phoneHint, setPhoneHint] = useState("");

  const isCompany = form.partnerType === "company";
  const currentEmail = form.email.trim().toLowerCase();
  const currentPhone = form.phone.trim();

  const emailVerified = Boolean(currentEmail && currentEmail === emailVerifiedFor);
  const phoneVerified = Boolean(currentPhone && currentPhone === phoneVerifiedFor);

  const emailOtpActive =
    Boolean(currentEmail) &&
    currentEmail === emailOtpFor &&
    emailOtpUntil > now &&
    !emailVerified;
  const phoneOtpActive =
    Boolean(currentPhone) &&
    currentPhone === phoneOtpFor &&
    phoneOtpUntil > now &&
    !phoneVerified;

  const emailOtpExpiredSame =
    Boolean(currentEmail) &&
    currentEmail === emailOtpFor &&
    emailOtpUntil > 0 &&
    emailOtpUntil <= now &&
    !emailVerified;
  const phoneOtpExpiredSame =
    Boolean(currentPhone) &&
    currentPhone === phoneOtpFor &&
    phoneOtpUntil > 0 &&
    phoneOtpUntil <= now &&
    !phoneVerified;

  const emailRemain = emailOtpActive ? emailOtpUntil - now : 0;
  const phoneRemain = phoneOtpActive ? phoneOtpUntil - now : 0;

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const applyEmailContact = (raw) => {
    const value = raw.trim().toLowerCase();
    if (value && (value === emailVerifiedFor || (value === emailOtpFor && emailOtpUntil > Date.now()))) {
      if (value === emailVerifiedFor) setEmailOtp("");
      return;
    }
    setEmailOtp("");
  };

  const applyPhoneContact = (raw) => {
    const value = raw.trim();
    if (value && (value === phoneVerifiedFor || (value === phoneOtpFor && phoneOtpUntil > Date.now()))) {
      if (value === phoneVerifiedFor) setPhoneOtp("");
      return;
    }
    setPhoneOtp("");
  };

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (key === "email") {
      setEmailOk(false);
      setEmailMsg("");
      setEmailDemoOtp("");
      setEmailHint("");
      applyEmailContact(value);
    }
    if (key === "phone") {
      setPhoneOk(false);
      setPhoneMsg("");
      setPhoneDemoOtp("");
      setPhoneHint("");
      applyPhoneContact(value);
    }
  };

  const handleEmailBlur = async () => {
    const value = form.email.trim().toLowerCase();
    if (!value) {
      setEmailMsg("");
      setEmailOk(false);
      return;
    }
    if (!isValidEmail(value)) {
      setEmailMsg("Enter a valid email address");
      setEmailOk(false);
      return;
    }
    try {
      const data = await checkEmailAvailability(value);
      if (!data.available) {
        setEmailMsg(data.message || "Email not available");
        setEmailOk(false);
        return;
      }
      setEmailMsg("");
      setEmailOk(true);
    } catch (err) {
      setEmailMsg(err.message || "Could not check email");
      setEmailOk(false);
    }
  };

  const handlePhoneBlur = async () => {
    const value = form.phone.trim();
    if (!value) {
      setPhoneMsg("");
      setPhoneOk(false);
      return;
    }
    if (!isValidPhone(value)) {
      setPhoneMsg("Mobile number must be 10 digits");
      setPhoneOk(false);
      return;
    }
    try {
      const data = await checkPhoneAvailability(value);
      if (!data.available) {
        setPhoneMsg(data.message || "Mobile not available");
        setPhoneOk(false);
        return;
      }
      setPhoneMsg("");
      setPhoneOk(true);
    } catch (err) {
      setPhoneMsg(err.message || "Could not check mobile");
      setPhoneOk(false);
    }
  };

  const handleSendEmailOtp = async () => {
    setError("");
    setEmailHint("");
    setOtpBusy("email-send");
    try {
      if (!emailOk) await handleEmailBlur();
      const value = form.email.trim().toLowerCase();
      if (!isValidEmail(value)) throw new Error("Enter a valid email first");
      const data = await sendEmailOtp(value);
      setEmailOtpFor(value);
      setEmailOtpUntil(Date.now() + OTP_MS);
      setEmailOtp("");
      setEmailDemoOtp(data.demoOtp || "");
      setEmailHint(
        data.demoOtp
          ? data.message || "OTP ready — use the code below (email provider issue)."
          : "OTP sent to your email. Valid for 2 minutes."
      );
      setNow(Date.now());
    } catch (err) {
      setError(err.message || "Failed to send email OTP");
    } finally {
      setOtpBusy("");
    }
  };

  const handleVerifyEmailOtp = async () => {
    setError("");
    setOtpBusy("email-verify");
    try {
      const value = form.email.trim().toLowerCase();
      await verifyEmailOtp(value, emailOtp);
      setEmailVerifiedFor(value);
      setEmailOtpFor("");
      setEmailOtpUntil(0);
      setEmailOtp("");
      setEmailDemoOtp("");
      setEmailHint("");
    } catch (err) {
      setError(err.message || "Invalid email OTP");
    } finally {
      setOtpBusy("");
    }
  };

  const handleSendPhoneOtp = async () => {
    setError("");
    setPhoneHint("");
    setOtpBusy("phone-send");
    try {
      if (!phoneOk) await handlePhoneBlur();
      const value = form.phone.trim();
      if (!isValidPhone(value)) throw new Error("Enter a valid 10-digit mobile");
      const data = await sendMobileOtp(value);
      setPhoneOtpFor(value);
      setPhoneOtpUntil(Date.now() + OTP_MS);
      setPhoneOtp("");
      setPhoneDemoOtp(data.demoOtp || "");
      setPhoneHint(
        data.demoOtp
          ? data.message || "OTP ready — use the code below."
          : "OTP sent to your mobile. Valid for 2 minutes."
      );
      setNow(Date.now());
    } catch (err) {
      setError(err.message || "Failed to send mobile OTP");
    } finally {
      setOtpBusy("");
    }
  };

  const handleVerifyPhoneOtp = async () => {
    setError("");
    setOtpBusy("phone-verify");
    try {
      const value = form.phone.trim();
      await verifyMobileOtp(value, phoneOtp);
      setPhoneVerifiedFor(value);
      setPhoneOtpFor("");
      setPhoneOtpUntil(0);
      setPhoneOtp("");
      setPhoneDemoOtp("");
      setPhoneHint("");
    } catch (err) {
      setError(err.message || "Invalid mobile OTP");
    } finally {
      setOtpBusy("");
    }
  };

  const canGoNext =
    form.name.trim() &&
    emailOk &&
    phoneOk &&
    emailVerified &&
    phoneVerified &&
    (!isCompany || form.firmName.trim());

  const goToTermsStep = (e) => {
    e.preventDefault();
    setError("");
    if (!canGoNext) {
      setError(
        isCompany && !form.firmName.trim()
          ? "Enter firm name for company registration"
          : "Complete details and verify email & mobile to continue"
      );
      return;
    }
    onStepChange?.(2);
    setTermsRead(false);
    setTermsAccepted(false);
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!termsRead) {
      setError("Scroll through the full terms before accepting");
      return;
    }
    if (!termsAccepted) {
      setError("Accept the terms to continue");
      return;
    }

    setSubmitting(true);
    try {
      await registerBroker({
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        maharera: form.maharera.trim() || undefined,
        partnerType: form.partnerType,
        firmName: isCompany ? form.firmName.trim() : undefined,
        tcAccepted: true,
      });
      setPendingDone(true);
      onPendingDone?.();
    } catch (err) {
      setError(err.message || "Registration failed");
    } finally {
      setSubmitting(false);
    }
  };

  const renderOtpBlock = ({
    canSend,
    verified,
    active,
    expiredSame,
    remain,
    otpValue,
    setOtpValue,
    onSend,
    onVerify,
    sendBusy,
    verifyBusy,
    sendLabel,
    verifyLabel,
    demoOtp,
    hint,
  }) => {
    if (verified) {
      return (
        <label className={styles.verifiedBox}>
          <input type="checkbox" checked readOnly tabIndex={-1} />
          <span>{verifyLabel.replace(/^Verify\s+/i, "")} verified</span>
        </label>
      );
    }

    const sent = active || expiredSame;

    // Before send — only Send OTP
    if (!sent) {
      return (
        <div className={styles.otpActions}>
          <button
            type="button"
            className={styles.sendBtn}
            onClick={onSend}
            disabled={sendBusy || !canSend}
          >
            {sendBusy ? "Sending…" : sendLabel}
          </button>
        </div>
      );
    }

    // After send — OTP input + Verify + timer/resend
    return (
      <div className={styles.otpBlock}>
        {hint ? <p className={styles.otpHint}>{hint}</p> : null}
        {demoOtp ? (
          <p className={styles.demoOtp}>
            Demo OTP: <strong>{demoOtp}</strong>
          </p>
        ) : null}

        <div className={styles.otpRow}>
          <input
            type="text"
            inputMode="numeric"
            maxLength={4}
            value={otpValue}
            onChange={(e) =>
              setOtpValue(e.target.value.replace(/\D/g, "").slice(0, 4))
            }
            placeholder="4-digit OTP"
            className={styles.otpInput}
            aria-label="OTP"
          />
          <button
            type="button"
            className={styles.verifyBtn}
            onClick={onVerify}
            disabled={verifyBusy || otpValue.length !== 4}
          >
            {verifyBusy ? "Verifying…" : verifyLabel}
          </button>
        </div>

        <div className={styles.otpMeta}>
          {active ? (
            <span className={styles.timer}>Resend in {formatRemain(remain)}</span>
          ) : (
            <button
              type="button"
              className={styles.sendBtn}
              onClick={onSend}
              disabled={sendBusy || !canSend}
            >
              {sendBusy ? "Sending…" : "Resend OTP"}
            </button>
          )}
        </div>
      </div>
    );
  };

  if (pendingDone) {
    return null;
  }

  return (
    <form
      className={`${styles.panel} ${step === 2 ? styles.panelWide : ""}`}
      onSubmit={step === 1 ? goToTermsStep : handleRegisterSubmit}
      noValidate
    >
      {step === 1 ? (
        <>
          <div className={styles.field}>
            <span className={styles.label}>Account type</span>
            <div className={styles.typeSwitch} role="group" aria-label="Account type">
              <button
                type="button"
                className={`${styles.typeBtn} ${
                  form.partnerType === "individual" ? styles.typeActive : ""
                }`}
                onClick={() => setField("partnerType", "individual")}
              >
                Individual
              </button>
              <button
                type="button"
                className={`${styles.typeBtn} ${
                  form.partnerType === "company" ? styles.typeActive : ""
                }`}
                onClick={() => setField("partnerType", "company")}
              >
                Company
              </button>
            </div>
          </div>

          <div className={styles.field}>
            <label htmlFor="name">Full name</label>
            <input
              id="name"
              type="text"
              autoComplete="name"
              value={form.name}
              onChange={(e) => setField("name", e.target.value)}
              placeholder="Your full name"
              required
            />
          </div>

          {isCompany ? (
            <div className={styles.field}>
              <label htmlFor="firmName">Firm name</label>
              <input
                id="firmName"
                type="text"
                autoComplete="organization"
                value={form.firmName}
                onChange={(e) => setField("firmName", e.target.value)}
                placeholder="Registered firm / company name"
                required
              />
            </div>
          ) : null}

          <div className={styles.field}>
            <label htmlFor="reg-email">Email ID</label>
            <input
              id="reg-email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={(e) => setField("email", e.target.value)}
              onBlur={handleEmailBlur}
              placeholder="name@email.com"
              required
              disabled={emailVerified}
            />
            {emailMsg ? <p className={styles.fieldError}>{emailMsg}</p> : null}
            {renderOtpBlock({
              canSend: emailOk || isValidEmail(form.email),
              verified: emailVerified,
              active: emailOtpActive,
              expiredSame: emailOtpExpiredSame,
              remain: emailRemain,
              otpValue: emailOtp,
              setOtpValue: setEmailOtp,
              onSend: handleSendEmailOtp,
              onVerify: handleVerifyEmailOtp,
              sendBusy: otpBusy === "email-send",
              verifyBusy: otpBusy === "email-verify",
              sendLabel: "Send email OTP",
              verifyLabel: "Verify email",
              demoOtp: emailDemoOtp,
              hint: emailHint,
            })}
          </div>

          <div className={styles.field}>
            <label htmlFor="phone">Mobile number</label>
            <input
              id="phone"
              type="tel"
              autoComplete="tel"
              value={form.phone}
              onChange={(e) =>
                setField("phone", e.target.value.replace(/\D/g, "").slice(0, 10))
              }
              onBlur={handlePhoneBlur}
              placeholder="98XXXXXXXX"
              required
              disabled={phoneVerified}
            />
            {phoneMsg ? <p className={styles.fieldError}>{phoneMsg}</p> : null}
            {renderOtpBlock({
              canSend: phoneOk || isValidPhone(form.phone),
              verified: phoneVerified,
              active: phoneOtpActive,
              expiredSame: phoneOtpExpiredSame,
              remain: phoneRemain,
              otpValue: phoneOtp,
              setOtpValue: setPhoneOtp,
              onSend: handleSendPhoneOtp,
              onVerify: handleVerifyPhoneOtp,
              sendBusy: otpBusy === "phone-send",
              verifyBusy: otpBusy === "phone-verify",
              sendLabel: "Send mobile OTP",
              verifyLabel: "Verify mobile",
              demoOtp: phoneDemoOtp,
              hint: phoneHint,
            })}
          </div>

          <div className={styles.field}>
            <label htmlFor="maharera">
              RERA number <span className={styles.optional}>(optional)</span>
            </label>
            <input
              id="maharera"
              type="text"
              value={form.maharera}
              onChange={(e) => setField("maharera", e.target.value.toUpperCase())}
              placeholder="A51800000000"
            />
          </div>
        </>
      ) : (
        <>
          <TermsReader
            onReachedEnd={() => {
              setTermsRead(true);
              setError("");
            }}
          />

          <div className={styles.termsFooter}>
            <label
              className={`${styles.termsCheck} ${
                !termsRead ? styles.termsCheckLocked : ""
              }`}
            >
              <input
                type="checkbox"
                checked={termsAccepted}
                disabled={!termsRead}
                onChange={(e) => setTermsAccepted(e.target.checked)}
              />
              <span>
                I have read and accept the Channel Partner terms &amp;
                conditions.
              </span>
            </label>

            {!termsRead ? (
              <p className={styles.termsLockHint}>
                Scroll to the end of the agreement to unlock this checkbox.
              </p>
            ) : null}

            <button
              type="button"
              className={styles.linkBtn}
              onClick={() => onStepChange?.(1)}
            >
              ← Back to details
            </button>
          </div>
        </>
      )}

      {error ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        className={styles.submit}
        disabled={
          submitting ||
          (step === 1 && !canGoNext) ||
          (step === 2 && (!termsRead || !termsAccepted))
        }
      >
        {submitting
          ? "Submitting…"
          : step === 1
            ? "Continue"
            : "Agree & submit registration →"}
      </button>

      {step === 1 ? (
        <p className={styles.footer}>
          Already registered? <Link href="/login">Sign in</Link>
        </p>
      ) : null}
    </form>
  );
}
