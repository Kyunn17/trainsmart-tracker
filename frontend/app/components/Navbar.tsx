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
  Award 
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function Navbar() {
  const { user, logout, isLoading } = useAuth();
  const pathname = usePathname();

  const roleBadgeColor = {
    admin: "bg-rose-500/10 text-rose-400 border-rose-500/30",
    trainer: "bg-blue-500/10 text-blue-400 border-blue-500/30",
    client: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Brand / Logo */}
        <div className="flex items-center space-x-6">
          <Link href="/" className="flex items-center space-x-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-400 flex items-center justify-center text-zinc-950 shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
              <Dumbbell className="w-5 h-5 fill-zinc-950" />
            </div>
            <div className="flex flex-col">
              <span className="font-black text-base tracking-tight text-white flex items-center">
                TRAIN<span className="text-amber-400">SMART</span>
              </span>
              <span className="text-[10px] text-zinc-500 font-mono tracking-wider -mt-1">
                HYPERTROPHY OS
              </span>
            </div>
          </Link>

          {/* Navigation Links based on role */}
          <nav className="hidden md:flex items-center space-x-1 text-xs font-semibold">
            <Link
              href="/"
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                pathname === "/" ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-white"
              }`}
            >
              Dashboard
            </Link>

            {user?.role === "admin" && (
              <Link
                href="/admin"
                className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-colors ${
                  pathname === "/admin" ? "bg-rose-950/60 text-rose-300 border border-rose-500/30" : "text-zinc-400 hover:text-rose-400"
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Admin Panel</span>
              </Link>
            )}

            {user?.role === "trainer" && (
              <Link
                href="/trainer"
                className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-colors ${
                  pathname === "/trainer" ? "bg-blue-950/60 text-blue-300 border border-blue-500/30" : "text-zinc-400 hover:text-blue-400"
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Klien Saya ({user.clients?.length || 0})</span>
              </Link>
            )}

            {user?.role === "client" && (
              <>
                <Link
                  href="/client/trainer"
                  className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-colors ${
                    pathname === "/client/trainer" ? "bg-amber-950/60 text-amber-300 border border-amber-500/30" : "text-zinc-400 hover:text-amber-400"
                  }`}
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>Pilih Trainer {user.trainer ? `(${user.trainer.name.split(" ")[0]})` : ""}</span>
                </Link>
                <Link
                  href="/client/progress"
                  className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-colors ${
                    pathname === "/client/progress" ? "bg-emerald-950/60 text-emerald-300 border border-emerald-500/30" : "text-zinc-400 hover:text-emerald-400"
                  }`}
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Progres Saya</span>
                </Link>
              </>
            )}
          </nav>
        </div>

        {/* Right side: User Profile / Auth buttons */}
        <div className="flex items-center space-x-3">
          {user ? (
            <div className="flex items-center space-x-2">
              <div className="flex flex-col text-right">
                <span className="text-xs font-bold text-white leading-tight">{user.name}</span>
                <span
                  className={`text-[9px] uppercase font-mono font-bold px-1.5 py-0.2 rounded border self-end mt-0.5 ${
                    roleBadgeColor[user.role]
                  }`}
                >
                  {user.role}
                </span>
              </div>

              <button
                onClick={logout}
                className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-950/30 rounded-xl transition-colors"
                title="Keluar / Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Link
                href="/login"
                className="px-3.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 rounded-xl text-xs font-bold text-white flex items-center space-x-1.5 transition-colors"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Masuk</span>
              </Link>
              <Link
                href="/register"
                className="px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 rounded-xl text-xs font-black transition-all shadow-md shadow-amber-500/20"
              >
                Daftar
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
