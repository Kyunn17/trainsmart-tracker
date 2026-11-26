"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Dumbbell,
  LogOut,
  LogIn,
  ShieldAlert,
  Users,
  LayoutGrid,
  BookOpen,
  BarChart3,
  Menu,
  X,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface AppShellProps {
  children: React.ReactNode;
}

const PUBLIC_PATHS = ["/", "/login", "/register"];

export default function AppShell({ children }: AppShellProps) {
  const { user, isLoading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isPublicPath = PUBLIC_PATHS.includes(pathname);
  const isAuthPage = pathname === "/login" || pathname === "/register";
  const isProtectedBlocked = !isPublicPath && !user;
  const showSidebar = Boolean(user) && !isAuthPage;

  useEffect(() => {
    if (!isLoading && !user && !isPublicPath) {
      router.replace("/");
    }
  }, [isLoading, user, isPublicPath, router]);

  const roleBadgeColor = {
    admin: "bg-[#FFF1F2] text-[#BE123C] border-[#FECDD3]",
    trainer: "bg-[#EFF6FF] text-[#1D4ED8] border-[#BFDBFE]",
    client: "bg-[#ECFDF5] text-[#047857] border-[#A7F3D0]",
  };

  const roleLabel = {
    admin: "Admin",
    trainer: "Trainer",
    client: "Member",
  };

  const navItems: Array<{
    href: string;
    label: string;
    icon: React.ReactNode;
    activeClass: string;
  }> = [];

  if (showSidebar && user) {
    navItems.push(
      {
        href: "/",
        label: "Latihan",
        icon: <LayoutGrid className="w-4 h-4 shrink-0" />,
        activeClass: "bg-[#FFF1EA] text-[#C84B11] border-[#F4C4AC]",
      },
      {
        href: "/exercises",
        label: "Gerakan",
        icon: <BookOpen className="w-4 h-4 shrink-0" />,
        activeClass: "bg-[#FFF1EA] text-[#C84B11] border-[#F4C4AC]",
      }
    );

    if (user.role === "client") {
      navItems.push({
        href: "/evaluation",
        label: "Evaluasi",
        icon: <BarChart3 className="w-4 h-4 shrink-0" />,
        activeClass: "bg-[#FFF1EA] text-[#C84B11] border-[#F4C4AC]",
      });
    }

    if (user.role === "trainer") {
      navItems.push({
        href: "/trainer",
        label: `Klien Saya (${user.clients?.length || 0})`,
        icon: <Users className="w-4 h-4 shrink-0" />,
        activeClass: "bg-[#EFF6FF] text-[#1D4ED8] border-[#BFDBFE]",
      });
    }

    if (user.role === "admin") {
      navItems.push({
        href: "/admin",
        label: "Admin Panel",
        icon: <ShieldAlert className="w-4 h-4 shrink-0" />,
        activeClass: "bg-[#FFF1F2] text-[#BE123C] border-[#FECDD3]",
      });
    }
  }

  const isNavActive = (href: string) =>
    pathname === href ||
    (href === "/exercises" && pathname === "/my-exercises");

  // Block protected routes immediately until authenticated (redirects guests to /)
  if (isProtectedBlocked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F6F3] text-[#48524C] text-sm">
        {isLoading
          ? "Memeriksa sesi login..."
          : "Mengalihkan ke halaman utama..."}
      </div>
    );
  }

  // Guest / Auth Page Layout (minimal top header, no sidebar)
  if (!showSidebar) {
    if (isAuthPage) {
      return (
        <div className="min-h-screen flex flex-col bg-[#F5F6F3] text-[#141916]">
          {children}
        </div>
      );
    }

    const isHome = pathname === "/";
    const headerClass = isHome
      ? isScrolled
        ? "bg-[#141916]/90 backdrop-blur-md border-b border-white/10 text-white shadow-md"
        : "bg-transparent border-b border-white/10 text-white"
      : "bg-white/80 backdrop-blur-md border-b border-[#DCE1D8] text-[#141916]";

    return (
      <div className="min-h-screen flex flex-col bg-[#F5F6F3] text-[#141916]">
        <header
          className={`fixed top-0 left-0 right-0 z-40 w-full transition-all duration-200 ${headerClass}`}
        >
          <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-3 group shrink-0">
              <div className="w-10 h-10 rounded-xl bg-[#C84B11] group-hover:bg-[#A83D0B] flex items-center justify-center text-white transition-colors shadow-xs">
                <Dumbbell className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span
                  className={`font-bold text-base tracking-tight leading-tight transition-colors ${
                    isHome ? "text-white" : "text-[#141916]"
                  }`}
                >
                  TrainSmart
                </span>
                <span
                  className={`text-xs leading-tight hidden sm:block transition-colors ${
                    isHome ? "text-[#D1D7CD]" : "text-[#626E67]"
                  }`}
                >
                  Panduan Latihan & Hipertrofi
                </span>
              </div>
            </Link>

            {!user && (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className={`h-10 px-4 rounded-xl text-sm font-semibold flex items-center gap-1.5 border transition-all whitespace-nowrap ${
                    isHome
                      ? "bg-white/10 hover:bg-white/20 border-white/25 text-white backdrop-blur-sm"
                      : pathname === "/login"
                      ? "bg-[#ECEFE9] border-[#C5CCC0] text-[#141916]"
                      : "bg-white hover:bg-[#ECEFE9] border-[#C5CCC0] text-[#141916]"
                  }`}
                >
                  <LogIn
                    className={`w-4 h-4 ${
                      isHome ? "text-white" : "text-[#48524C]"
                    }`}
                  />
                  <span>Masuk</span>
                </Link>
                <Link
                  href="/register"
                  className="h-10 px-4 bg-[#C84B11] hover:bg-[#A83D0B] text-white rounded-xl text-sm font-semibold flex items-center transition-colors shadow-xs whitespace-nowrap"
                >
                  Daftar
                </Link>
              </div>
            )}
          </div>
        </header>

        <div className={`flex-1 flex flex-col ${isHome ? "" : "pt-16"}`}>
          {children}
        </div>
      </div>
    );
  }

  const renderSidebarContent = (onNavigate?: () => void) => (
    <div className="flex flex-col h-full justify-between">
      <div>
        {/* Brand */}
        <div className="px-5 h-16 border-b border-[#DCE1D8] flex items-center justify-between gap-3">
          <Link
            href="/"
            onClick={onNavigate}
            className="flex items-center gap-3 group min-w-0"
          >
            <div className="w-9 h-9 rounded-xl bg-[#C84B11] group-hover:bg-[#A83D0B] flex items-center justify-center text-white transition-colors shadow-xs shrink-0">
              <Dumbbell className="w-5 h-5" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-base tracking-tight text-[#141916] leading-tight truncate">
                TrainSmart
              </span>
              <span className="text-[11px] text-[#626E67] leading-tight truncate">
                Panduan Latihan
              </span>
            </div>
          </Link>

          {onNavigate && (
            <button
              type="button"
              onClick={onNavigate}
              className="lg:hidden h-9 w-9 rounded-xl bg-[#ECEFE9] text-[#48524C] flex items-center justify-center cursor-pointer"
              aria-label="Tutup menu navigasi"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Navigation Links */}
        <nav aria-label="Navigasi utama" className="p-3 space-y-1.5">
          {navItems.map((item) => {
            const active = isNavActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={`h-11 px-3.5 rounded-xl text-sm font-medium flex items-center gap-3 border transition-colors ${
                  active
                    ? `${item.activeClass} font-semibold`
                    : "border-transparent text-[#48524C] hover:text-[#141916] hover:bg-[#ECEFE9]"
                }`}
              >
                {item.icon}
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom User Card */}
      {user && (
        <div className="p-3 border-t border-[#DCE1D8] space-y-2.5 bg-[#F5F6F3]/60">
          <div className="px-2.5 py-2 rounded-xl bg-white border border-[#DCE1D8] flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p
                className="text-sm font-semibold text-[#141916] truncate"
                title={user.name}
              >
                {user.name}
              </p>
              <p className="text-[11px] text-[#626E67] truncate">{user.email}</p>
            </div>
            <span
              className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border shrink-0 ${
                roleBadgeColor[user.role]
              }`}
            >
              {roleLabel[user.role]}
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              onNavigate?.();
              logout();
            }}
            className="w-full h-10 px-3 text-xs font-semibold text-[#48524C] hover:text-[#BE123C] bg-white hover:bg-[#FFF1F2] border border-[#DCE1D8] hover:border-[#FECDD3] rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>Keluar</span>
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#F5F6F3] text-[#141916]">
      {/* Desktop Sticky Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:shrink-0 bg-white border-r border-[#DCE1D8] sticky top-0 h-screen">
        {renderSidebarContent()}
      </aside>

      {/* Mobile Compact Header */}
      <header className="lg:hidden sticky top-0 z-40 h-14 bg-white border-b border-[#DCE1D8] px-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={() => setIsMobileOpen(true)}
            className="h-10 w-10 rounded-xl bg-[#ECEFE9] hover:bg-[#DCE1D8] text-[#141916] flex items-center justify-center shrink-0 cursor-pointer"
            aria-label="Buka menu navigasi"
          >
            <Menu className="w-5 h-5" />
          </button>
          <Link href="/" className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[#C84B11] flex items-center justify-center text-white shrink-0">
              <Dumbbell className="w-4 h-4" />
            </div>
            <span className="font-bold text-sm text-[#141916] truncate">
              TrainSmart
            </span>
          </Link>
        </div>

        {user && (
          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded-lg border shrink-0 ${
              roleBadgeColor[user.role]
            }`}
          >
            {user.name.split(" ")[0]}
          </span>
        )}
      </header>

      {/* Mobile Slide-Over Sidebar Drawer */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 flex bg-[#141916]/60"
          role="dialog"
          aria-modal="true"
          aria-label="Menu navigasi"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsMobileOpen(false);
          }}
        >
          <aside className="w-72 max-w-[85vw] bg-white h-full border-r border-[#DCE1D8] shadow-xl">
            {renderSidebarContent(() => setIsMobileOpen(false))}
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col">{children}</div>
    </div>
  );
}
