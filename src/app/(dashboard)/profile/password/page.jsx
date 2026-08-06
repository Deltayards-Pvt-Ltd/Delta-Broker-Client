"use client";

import { Suspense } from "react";
import ChangePasswordPage from "./ChangePasswordInner";

function Fallback() {
  return <p style={{ padding: "2rem", color: "var(--ink-muted)" }}>Loading…</p>;
}

export default function Page() {
  return (
    <Suspense fallback={<Fallback />}>
      <ChangePasswordPage />
    </Suspense>
  );
}
