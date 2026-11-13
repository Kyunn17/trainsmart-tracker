"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Dumbbell, Lock, Mail, ArrowRight, AlertCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password.trim()) {
      setError("Silakan lengkapi email dan kata sandi.");
      return;
    }

    setIsLoading(true);
    const res = await login(email, password);
    setIsLoading(false);

    if (res.success) {
      router.push("/");
    } else {
      setError(res.message || "Email atau kata sandi tidak cocok.");
    }
  };

  return (
    <main className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4 bg-zinc-950 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full bg-zinc-900/90 border border-zinc-800 p-8 rounded-3xl shadow-2xl backdrop-blur-xl relative z-10">
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-center mx-auto mb-3 text-amber-400 shadow-lg shadow-amber-500/10">
            <Dumbbell className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Masuk ke TrainSmart</h1>
          <p className="text-xs text-zinc-400 mt-1">
            Akses program latihan, progressive overload & bimbingan personal trainer.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-950/50 border border-red-500/50 rounded-xl text-red-300 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Alamat Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                placeholder="nama@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-zinc-950 border border-zinc-700/80 rounded-xl text-sm text-white placeholder:text-zinc-600 outline-none focus:border-amber-400 transition-colors"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Kata Sandi</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-zinc-950 border border-zinc-700/80 rounded-xl text-sm text-white placeholder:text-zinc-600 outline-none focus:border-amber-400 transition-colors"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 text-zinc-950 font-black rounded-xl text-sm transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center space-x-2"
          >
            <span>{isLoading ? "Memproses..." : "Masuk"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-zinc-400">
          Belum punya akun?{" "}
          <Link href="/register" className="text-amber-400 font-bold hover:underline">
            Daftar Sekarang
          </Link>
        </div>
      </div>
    </main>
  );
}
