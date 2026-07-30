"use client";

import ProjectListPage from "../ProjectListPage";

export default function ClosedProjectsPage() {
  return (
    <ProjectListPage
      title="Closed Projects"
      filter="inactive"
      emptyText="No inactive projects."
    />
  );
}
