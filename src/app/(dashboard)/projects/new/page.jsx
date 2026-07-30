"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import ProjectForm from "@/app/component/projects/ProjectForm";

export default function NewProjectPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const isAdmin = user?.role === "admin";

  useEffect(() => {
    if (!loading && !isAdmin) router.replace("/projects");
  }, [loading, isAdmin, router]);

  if (loading || !isAdmin) {
    return <p style={{ color: "var(--ink-muted)" }}>Loading…</p>;
  }

  return <ProjectForm mode="create" />;
}
