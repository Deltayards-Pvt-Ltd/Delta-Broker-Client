"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import ProjectForm from "@/app/component/projects/ProjectForm";

export default function EditProjectPage() {
  const { id } = useParams();
  const { user, loading } = useAuth();
  const router = useRouter();
  const isAdmin = user?.role === "admin";
  const projectId = Array.isArray(id) ? id[0] : id;

  useEffect(() => {
    if (!loading && !isAdmin) router.replace("/projects");
  }, [loading, isAdmin, router]);

  if (loading || !isAdmin) {
    return <p style={{ color: "var(--ink-muted)" }}>Loading…</p>;
  }

  return <ProjectForm mode="edit" projectId={projectId} />;
}
