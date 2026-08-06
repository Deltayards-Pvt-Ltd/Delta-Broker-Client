"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { changeMyPassword, isValidAdminPin } from "@/lib/loginApi";
import { isStaffRole } from "@/lib/roles";
import formStyles from "@/app/component/authForm.module.css";

/**
 * Shared change-password form.
 * theme="app" → light app form styles (auth shells)
 * theme="default" → inherits CSS vars from surrounding chrome
 */
export default function ChangePasswordForm({
  forced = false,
  theme = "default",
  backHref = null,
  successHref = null,
}) {
  const router = useRouter();
  const { user, token, updateUser } = useAuth();
  const isApp = theme === "app";

  const needsCurrent = useMemo(
    () => !forced && !user?.passwordResetBySuperAdmin,
    [forced, user?.passwordResetBySuperAdmin]
  );

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!isStaffRole(user?.role)) {
    return (
      <p className={formStyles.otpHint}>
        Only admins can change a password here.
      </p>
    );
  }

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setOk("");

    if (!isValidAdminPin(newPassword)) {
      setError("New password must be exactly 4 digits");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (needsCurrent && !isValidAdminPin(currentPassword)) {
      setError("Enter your current 4-digit password");
      return;
    }

    setSubmitting(true);
    try {
      const data = await changeMyPassword({
        token,
        currentPassword: needsCurrent ? currentPassword : undefined,
        newPassword,
        confirmPassword,
      });
      updateUser({
        ...(data.user || {}),
        passwordResetBySuperAdmin: false,
      });
      setOk("Password updated");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      if (successHref) {
        router.replace(successHref);
      } else if (forced) {
        router.replace("/dashboard");
      }
    } catch (err) {
      setError(err.message || "Failed to update password");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      className={`${formStyles.form} ${isApp ? formStyles.app : ""}`}
      onSubmit={onSubmit}
      noValidate
    >
      {needsCurrent ? (
        <div className={formStyles.field}>
          <label htmlFor="current">Current password</label>
          <input
            id="current"
            type="password"
            inputMode="numeric"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) =>
              setCurrentPassword(e.target.value.replace(/\D/g, "").slice(0, 4))
            }
            placeholder="4 digits"
            required
          />
        </div>
      ) : null}

      <div className={formStyles.field}>
        <label htmlFor="new">New password</label>
        <input
          id="new"
          type="password"
          inputMode="numeric"
          autoComplete="new-password"
          value={newPassword}
          onChange={(e) =>
            setNewPassword(e.target.value.replace(/\D/g, "").slice(0, 4))
          }
          placeholder="4 digits"
          required
        />
      </div>

      <div className={formStyles.field}>
        <label htmlFor="confirm">Confirm new password</label>
        <input
          id="confirm"
          type="password"
          inputMode="numeric"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) =>
            setConfirmPassword(e.target.value.replace(/\D/g, "").slice(0, 4))
          }
          placeholder="4 digits"
          required
        />
      </div>

      {error ? (
        <p className={formStyles.error} role="alert">
          {error}
        </p>
      ) : null}
      {ok ? <p className={formStyles.fieldOk}>{ok}</p> : null}

      <button
        type="submit"
        className={formStyles.submit}
        disabled={submitting}
      >
        {submitting ? "Saving…" : "Update password →"}
      </button>

      {backHref ? (
        <button
          type="button"
          className={formStyles.linkBtn}
          onClick={() => router.push(backHref)}
          style={{ textAlign: "center", width: "100%" }}
        >
          Back
        </button>
      ) : null}

      {isApp ? (
        <p className={formStyles.secureHint}>
          <span className={formStyles.secureHintIcon} aria-hidden>
            ✓
          </span>
          Secure access · 4-digit PIN
        </p>
      ) : null}
    </form>
  );
}
