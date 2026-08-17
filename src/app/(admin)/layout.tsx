import { createServiceClient } from "@/lib/supabase/service";
import UpdatePrompt from "@/components/pwa/UpdatePrompt";
import InstallPrompt from "@/components/pwa/InstallPrompt";
import BackButtonGuard from "@/components/pwa/BackButtonGuard";
import AdminNav from "@/components/admin/AdminNav";
import ScrollToTop from "@/components/layout/ScrollToTop";
import { getCurrentAdmin } from "@/lib/auth/current-admin";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await getCurrentAdmin();

  const service = createServiceClient();
  const [
    { count: pendingForumCount },
    { count: pendingInspCommentsCount },
  ] = await Promise.all([
    service.from("forum_posts").select("*", { count: "exact", head: true }).eq("approved", false),
    service.from("inspiration_comments").select("*", { count: "exact", head: true }).eq("approved", false),
  ]);

  return (
    <div className="min-h-screen bg-lumii-bg overflow-x-hidden">
      <ScrollToTop />
      <AdminNav
        pendingForumCount={pendingForumCount ?? 0}
        pendingInspCommentsCount={pendingInspCommentsCount ?? 0}
      >
        <main className="px-4 sm:px-6 md:px-8 py-6 md:py-8 min-w-0">
          {children}
        </main>
      </AdminNav>
      <BackButtonGuard />
      <UpdatePrompt />
      <InstallPrompt />
    </div>
  );
}
