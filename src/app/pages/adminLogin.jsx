"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Legacy route — unified login is at /login */
export default function AdminLoginRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/login");
  }, [router]);
  return null;
}
