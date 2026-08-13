"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home, BookOpen, Users, Star,
  Image as ImageIcon, Bell, Mail, Newspaper,
  MessageSquare, Flag, BarChart3, Menu as MenuIcon, X, FileText,
  ChevronRight, ChevronLeft, PanelLeftClose, PanelLeftOpen,
  MessageCircle, Sparkles, PlusCircle, type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useModalBackGuard } from "@/hooks/useModalBackGuard";
import Logo from "@/components/brand/Logo";

type NavItem = { href: string; icon: LucideIcon; label: string; exact?: boolean; badgeKey?: string };
type NavGroup = { label?: string; items: NavItem[] };

const NAV_GROUPS: NavGroup[] = [
  {
    items: [
      { href: "/admin", icon: Home, label: "Início", exact: true },
    ],
  },
  {
    label: "Catálogo",
    items: [
      { href: "/admin/cursos", icon: BookOpen, label: "Cursos" },
    ],
  },
  {
    label: "Alunas",
    items: [
      { href: "/admin/alunos", icon: Users, label: "Alunas" },
    ],
  },
  {
    label: "Marketing",
    items: [
      { href: "/admin/banners",      icon: ImageIcon, label: "Banners" },
      { href: "/admin/notificacoes", icon: Bell,      label: "Notificações" },
      { href: "/admin/emails",       icon: Mail,      label: "E-mails" },
      { href: "/admin/plano-anual",  icon: Star,      label: "Plano Anual" },
    ],
  },
  {
    label: "Comunidade",
    items: [
      { href: "/admin/comunidade/feed",  icon: Newspaper,     label: "Avisos" },
      { href: "/admin/forums",           icon: MessageSquare, label: "Fóruns" },
      { href: "/admin/comunidade/forum", icon: Flag,          label: "Moderação do Fórum", badgeKey: "forum" },
    ],
  },
  {
    label: "Inspirações",
    items: [
      { href: "/admin/inspiracoes",             icon: Sparkles,      label: "Posts" },
      { href: "/admin/inspiracoes/novo",        icon: PlusCircle,    label: "Novo post" },
      { href: "/admin/inspiracoes/comentarios", icon: MessageCircle, label: "Comentários", badgeKey: "inspComments" },
    ],
  },
  {
    label: "Sistema",
    items: [
      { href: "/admin/menu",     icon: MenuIcon,  label: "Menu do Site" },
      { href: "/admin/paginas",  icon: FileText,  label: "Páginas Estáticas" },
      { href: "/admin/metricas", icon: BarChart3, label: "Métricas" },
    ],
  },
];

function matchActive(href: string, pathname: string, exact?: boolean) {
  return exact
    ? pathname === href
    : pathname === href || pathname.startsWith(href + "/");
}

function NavLinks({
  pathname,
  collapsed,
  onNavigate,
  pendingForumCount = 0,
  pendingInspCommentsCount = 0,
}: {
  pathname: string;
  collapsed: boolean;
  onNavigate?: () => void;
  pendingForumCount?: number;
  pendingInspCommentsCount?: number;
}) {
  const badgeCounts: Record<string, number> = {
    forum: pendingForumCount,
    inspComments: pendingInspCommentsCount,
  };

  return (
    <nav className={cn("py-3 px-2", collapsed ? "space-y-1" : "space-y-5")}>
      {NAV_GROUPS.map((group, gi) => (
        <div key={gi}>
          {group.label && !collapsed && (
            <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-white/25">
              {group.label}
            </p>
          )}
          {group.label && collapsed && (
            <div className="h-px bg-white/10 mx-2 my-1" />
          )}
          <div className="space-y-0.5">
            {group.items.map((item) => {
              const active = matchActive(item.href, pathname, item.exact);
              const badge = item.badgeKey ? (badgeCounts[item.badgeKey] ?? 0) : 0;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    "flex items-center rounded-lg text-sm font-medium transition-colors",
                    collapsed
                      ? "justify-center p-2.5 relative"
                      : "gap-3 px-3 py-2",
                    active
                      ? "text-[#f6614f] bg-[#f6614f]/15"
                      : "text-white/60 hover:text-white hover:bg-white/[0.08]"
                  )}
                >
                  <span className="relative shrink-0">
                    <item.icon className="w-4 h-4" />
                    {badge > 0 && collapsed && (
                      <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-[#f6614f] text-white text-[8px] font-bold flex items-center justify-center leading-none">
                        {badge > 9 ? "9+" : badge}
                      </span>
                    )}
                  </span>
                  {!collapsed && (
                    <>
                      <span className="flex-1">{item.label}</span>
                      {badge > 0 && (
                        <span className="ml-auto shrink-0 min-w-[18px] h-[18px] rounded-full bg-[#f6614f] text-white text-[10px] font-bold flex items-center justify-center px-1 leading-none">
                          {badge > 99 ? "99+" : badge}
                        </span>
                      )}
                    </>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

export default function AdminNav({
  children,
  pendingForumCount = 0,
  pendingInspCommentsCount = 0,
}: {
  children: React.ReactNode;
  pendingForumCount?: number;
  pendingInspCommentsCount?: number;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const markDrawerNavigating = useModalBackGuard(drawerOpen, () => setDrawerOpen(false));

  // Restaura preferência do utilizador
  useEffect(() => {
    const stored = localStorage.getItem("admin-sidebar-collapsed");
    if (stored !== null) setCollapsed(stored === "true");
  }, []);

  useEffect(() => {
    localStorage.setItem("admin-sidebar-collapsed", String(collapsed));
  }, [collapsed]);

  useEffect(() => { setDrawerOpen(false); }, [pathname]);

  const currentLabel = NAV_GROUPS
    .flatMap((g) => g.items)
    .find((i) => matchActive(i.href, pathname, i.exact))?.label;

  return (
    <>
      {/* ── Desktop sidebar ────────────────────────────── */}
      <aside
        className={cn(
          "hidden md:flex fixed inset-y-0 left-0 flex-col bg-lumii-navy z-40 border-r border-white/[0.06]",
          "transition-[width] duration-200 ease-in-out",
          collapsed ? "w-16" : "w-60"
        )}
      >
        {/* Logo */}
        <div
          className={cn(
            "border-b border-white/[0.06] shrink-0 flex items-center",
            collapsed ? "justify-center py-4 px-2" : "px-5 py-4"
          )}
        >
          {collapsed ? (
            <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center">
              <span className="text-primary font-black text-sm">L</span>
            </div>
          ) : (
            <div>
              <Logo size={22} />
              <p className="text-white/30 text-[10px] font-semibold uppercase tracking-widest mt-1.5">
                Painel Admin
              </p>
            </div>
          )}
        </div>

        {/* Nav */}
        <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <NavLinks pathname={pathname} collapsed={collapsed} pendingForumCount={pendingForumCount} pendingInspCommentsCount={pendingInspCommentsCount} />
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-white/[0.06] p-2 flex flex-col gap-1">
          {!collapsed && (
            <Link
              href="/dashboard"
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-white/40 hover:text-white hover:bg-white/[0.08] transition-colors"
            >
              <ChevronRight className="w-3.5 h-3.5 shrink-0" />
              Ver como aluna
            </Link>
          )}
          <button
            onClick={() => setCollapsed((v) => !v)}
            title={collapsed ? "Expandir menu" : "Recolher menu"}
            className={cn(
              "flex items-center rounded-lg text-xs text-white/40 hover:text-white hover:bg-white/[0.08] transition-colors",
              collapsed ? "justify-center p-2" : "gap-2 px-3 py-2 w-full"
            )}
          >
            {collapsed ? (
              <PanelLeftOpen className="w-4 h-4" />
            ) : (
              <>
                <PanelLeftClose className="w-4 h-4 shrink-0" />
                <span>Recolher menu</span>
              </>
            )}
          </button>
        </div>
      </aside>

      {/* ── Mobile header ──────────────────────────────── */}
      <header className="md:hidden bg-lumii-navy text-white sticky top-0 z-40">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={() => setDrawerOpen(true)}
            aria-label="Abrir menu"
            className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            <MenuIcon className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="font-bold text-sm">Lumii Admin</span>
            {currentLabel && currentLabel !== "Início" && (
              <>
                <span className="text-white/30 text-sm">/</span>
                <span className="text-sm text-white/60 truncate">{currentLabel}</span>
              </>
            )}
          </div>
          <Link
            href="/dashboard"
            className="text-xs text-white/40 hover:text-white transition-colors whitespace-nowrap shrink-0 flex items-center gap-1"
          >
            Site <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      </header>

      {/* ── Mobile drawer ──────────────────────────────── */}
      {drawerOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="md:hidden fixed inset-y-0 left-0 z-50 w-72 bg-lumii-navy shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06] shrink-0">
              <div>
                <Logo size={22} />
                <p className="text-white/30 text-[10px] font-semibold uppercase tracking-widest mt-1.5">
                  Painel Admin
                </p>
              </div>
              <button
                onClick={() => setDrawerOpen(false)}
                aria-label="Fechar menu"
                className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              <NavLinks
                pathname={pathname}
                collapsed={false}
                onNavigate={() => { markDrawerNavigating(); setDrawerOpen(false); }}
                pendingForumCount={pendingForumCount}
                pendingInspCommentsCount={pendingInspCommentsCount}
              />
            </div>
            <div className="shrink-0 border-t border-white/[0.06] p-3">
              <Link
                href="/dashboard"
                onClick={() => setDrawerOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-white/40 hover:text-white hover:bg-white/[0.08] transition-colors"
              >
                <ChevronRight className="w-3.5 h-3.5" />
                Ver como aluna
              </Link>
            </div>
          </div>
        </>
      )}

      {/* ── Conteúdo — margem dinâmica no desktop ──────── */}
      <div
        className={cn(
          "transition-[margin] duration-200 ease-in-out min-w-0 overflow-x-hidden",
          collapsed ? "md:ml-16" : "md:ml-60"
        )}
      >
        {children}
      </div>
    </>
  );
}
