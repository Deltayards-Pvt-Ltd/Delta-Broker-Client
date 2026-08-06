"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { isSuperAdminRole } from "@/lib/roles";
import ProjectForm from "@/app/component/projects/ProjectForm";

export default function NewProjectPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const canWrite = isSuperAdminRole(user?.role);

  useEffect(() => {
    if (!loading && !canWrite) router.replace("/projects");
  }, [loading, canWrite, router]);

  if (loading || !canWrite) {
    return <p style={{ color: "var(--ink-muted)" }}>Loading…</p>;
  }

  return <ProjectForm mode="create" />;
}
