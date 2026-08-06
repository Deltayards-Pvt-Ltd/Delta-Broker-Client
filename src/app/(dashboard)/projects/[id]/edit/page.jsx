"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { isSuperAdminRole } from "@/lib/roles";
import ProjectForm from "@/app/component/projects/ProjectForm";

export default function EditProjectPage() {
  const { id } = useParams();
  const { user, loading } = useAuth();
  const router = useRouter();
  const canWrite = isSuperAdminRole(user?.role);
  const projectId = Array.isArray(id) ? id[0] : id;

  useEffect(() => {
    if (!loading && !canWrite) router.replace("/projects");
  }, [loading, canWrite, router]);

  if (loading || !canWrite) {
    return <p style={{ color: "var(--ink-muted)" }}>Loading…</p>;
  }

  return <ProjectForm mode="edit" projectId={projectId} />;
}
