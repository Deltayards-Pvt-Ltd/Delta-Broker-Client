"use client";

import ProjectListPage from "../ProjectListPage";

export default function ActiveProjectsPage() {
  return (
    <ProjectListPage
      title="Active Projects"
      filter="active"
      emptyText="No active projects."
    />
  );
}
