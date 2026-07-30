import { Suspense } from "react";
import LoginPage from "../pages/login";

function LoginFallback() {
  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "grid",
        placeItems: "center",
        background: "transparent",
        color: "var(--ink-muted)",
      }}
    >
      Loading…
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginPage />
    </Suspense>
  );
}
