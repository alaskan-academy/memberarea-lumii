"use client";

import dynamic from "next/dynamic";

// @dnd-kit (core+sortable+utilities) só é necessário aqui — carrega sob
// demanda em vez de entrar no bundle inicial da página de curso do admin.
const CourseContentManager = dynamic(() => import("./CourseContentManager"), {
  ssr: false,
  loading: () => (
    <div className="space-y-3">
      <div className="h-16 bg-muted animate-pulse rounded-xl" />
      <div className="h-16 bg-muted animate-pulse rounded-xl" />
      <div className="h-16 bg-muted animate-pulse rounded-xl" />
    </div>
  ),
});

export default CourseContentManager;
