"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Dumbbell,
  LogOut,
  LogIn,
  ShieldAlert,
  Users,
  TrendingUp,
  Award,
  LayoutGrid,
  BookOpen,
  CalendarRange,
  BarChart3,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  const isAuthPage = pathname === "/login" || pathname === "/register";
  const showAppNav = Boolean(user) && !isAuthPage;

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

  if (showAppNav && user) {
    navItems.push(
      {
        href: "/",
        label: "Dashboard",
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

    if (user.role === "admin") {
      navItems.push({
        href: "/admin",
        label: "Admin Panel",
        icon: <ShieldAlert className="w-4 h-4 shrink-0" />,
        activeClass: "bg-[#FFF1F2] text-[#BE123C] border-[#FECDD3]",
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

    if (user.role === "client") {
      navItems.push(
        {
          href: "/onboarding",
          label: "Jadwal",
          icon: <CalendarRange className="w-4 h-4 shrink-0" />,
          activeClass: "bg-[#FFF1EA] text-[#C84B11] border-[#F4C4AC]",
        },
        {
          href: "/evaluation",
          label: "Evaluasi",
          icon: <BarChart3 className="w-4 h-4 shrink-0" />,
          activeClass: "bg-[#FFF1EA] text-[#C84B11] border-[#F4C4AC]",
        },
        {
          href: "/client/progress",
          label: "Progres",
          icon: <TrendingUp className="w-4 h-4 shrink-0" />,
          activeClass: "bg-[#ECFDF5] text-[#047857] border-[#A7F3D0]",
        },
        {
          href: "/client/trainer",
          label: "Trainer",
          icon: <Award className="w-4 h-4 shrink-0" />,
          activeClass: "bg-[#FFF1EA] text-[#C84B11] border-[#F4C4AC]",
        }
      );
    }
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#DCE1D8] bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-3 group shrink-0">
          <div className="w-10 h-10 rounded-xl bg-[#C84B11] group-hover:bg-[#A83D0B] flex items-center justify-center text-white transition-colors shadow-xs">
            <Dumbbell className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-base tracking-tight text-[#141916] leading-tight">
              TrainSmart
            </span>
            <span className="text-xs text-[#626E67] leading-tight hidden sm:block">
              Panduan Latihan & Hipertrofi
            </span>
          </div>
        </Link>

        {/* Desktop Navigation (xl+ only to prevent overlap with right user cluster) */}
        {showAppNav && (
          <nav
            aria-label="Navigasi utama"
            className="hidden xl:flex items-center justify-center gap-1 min-w-0 flex-1"
          >
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={`px-3 py-2 rounded-xl text-sm font-medium flex items-center gap-1.5 border whitespace-nowrap transition-colors ${
                    isActive
                      ? `${item.activeClass} font-semibold`
                      : "border-transparent text-[#48524C] hover:text-[#141916] hover:bg-[#ECEFE9]"
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        )}

        {/* User Profile / Auth Controls */}
        <div className="flex items-center gap-2.5 shrink-0">
          {user ? (
            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-2">
                <span
                  className="hidden sm:inline-block text-sm font-semibold text-[#141916] max-w-[130px] truncate"
                  title={user.name}
                >
                  {user.name}
                </span>
                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-lg border whitespace-nowrap ${
                    roleBadgeColor[user.role]
                  }`}
                >
                  {roleLabel[user.role]}
                </span>
              </div>

              <button
                type="button"
                onClick={logout}
                className="h-10 px-3 text-sm font-medium text-[#48524C] hover:text-[#BE123C] hover:bg-[#FFF1F2] border border-[#DCE1D8] hover:border-[#FECDD3] rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                aria-label="Keluar dari akun"
                title="Keluar"
              >
                <LogOut className="w-4 h-4 shrink-0" />
                <span className="hidden sm:inline">Keluar</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className={`h-10 px-4 rounded-xl text-sm font-semibold flex items-center gap-1.5 border transition-colors whitespace-nowrap ${
                  pathname === "/login"
                    ? "bg-[#ECEFE9] border-[#C5CCC0] text-[#141916]"
                    : "bg-white hover:bg-[#ECEFE9] border-[#C5CCC0] text-[#141916]"
                }`}
              >
                <LogIn className="w-4 h-4 text-[#48524C]" />
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
      </div>

      {/* Tablet & Mobile Navigation Strip (under 1280px, logged-in users only) */}
      {showAppNav && (
        <nav
          aria-label="Navigasi seluler"
          className="xl:hidden border-t border-[#DCE1D8] bg-[#F5F6F3] px-4 sm:px-6 py-2 flex items-center gap-2 overflow-x-auto"
        >
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 whitespace-nowrap border transition-colors shrink-0 ${
                  isActive
                    ? `${item.activeClass} font-semibold`
                    : "bg-white border-[#DCE1D8] text-[#48524C] hover:text-[#141916]"
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      )}
    </header>
  );
}
