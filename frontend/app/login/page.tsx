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
    <main className="flex-1 flex items-center justify-center p-4 sm:p-6 bg-[#F5F6F3] text-[#141916]">
      <div className="max-w-md w-full bg-white border border-[#DCE1D8] p-7 sm:p-8 rounded-2xl shadow-xs">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-[#FFF1EA] border border-[#F4C4AC] rounded-xl flex items-center justify-center mx-auto mb-3.5 text-[#C84B11]">
            <Dumbbell className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-[#141916] tracking-tight">
            Masuk ke TrainSmart
          </h1>
          <p className="text-sm text-[#48524C] mt-1.5">
            Akses program latihan, progressive overload, dan bimbingan personal trainer.
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-5 p-3.5 bg-[#FFF1F2] border border-[#FECDD3] rounded-xl text-[#BE123C] text-xs font-medium flex items-center gap-2.5"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="login-email"
              className="block text-sm font-semibold text-[#141916] mb-1.5"
            >
              Alamat Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#626E67] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                placeholder="nama@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-11 pl-10 pr-4 bg-white border border-[#C5CCC0] rounded-xl text-sm text-[#141916] placeholder:text-[#626E67] outline-none focus:border-[#C84B11] transition-colors"
                required
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="login-password"
              className="block text-sm font-semibold text-[#141916] mb-1.5"
            >
              Kata Sandi
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#626E67] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="login-password"
                type="password"
                autoComplete="current-password"
                placeholder="Masukkan kata sandi"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-11 pl-10 pr-4 bg-white border border-[#C5CCC0] rounded-xl text-sm text-[#141916] placeholder:text-[#626E67] outline-none focus:border-[#C84B11] transition-colors"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-11 bg-[#C84B11] hover:bg-[#A83D0B] disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            <span>{isLoading ? "Memproses..." : "Masuk"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-[#DCE1D8] text-center text-sm text-[#48524C]">
          Belum punya akun?{" "}
          <Link
            href="/register"
            className="text-[#C84B11] font-semibold hover:underline"
          >
            Daftar Sekarang
          </Link>
        </div>
      </div>
    </main>
  );
}
