"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Lock,
  Mail,
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      const target =
        user.role === "admin"
          ? "/admin"
          : user.role === "trainer"
          ? "/trainer"
          : "/";
      router.replace(target);
    }
  }, [user, authLoading, router]);

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
      const role = res.user?.role;
      router.push(
        role === "admin" ? "/admin" : role === "trainer" ? "/trainer" : "/"
      );
    } else {
      setError(res.message || "Email atau kata sandi tidak cocok.");
    }
  };

  return (
    <main className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-[#F5F6F3] text-[#141916]">
      {/* Left Column: Back button + Login Form */}
      <div className="flex flex-col justify-between p-6 sm:p-10 lg:p-14 bg-white lg:border-r lg:border-[#DCE1D8]">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#48524C] hover:text-[#141916] min-h-[44px] px-4 rounded-xl border border-[#DCE1D8] bg-[#F5F6F3] hover:bg-[#ECEFE9] transition-colors w-fit"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Beranda</span>
          </Link>
        </div>

        <div className="my-auto w-full max-w-md mx-auto py-8">
          <div className="mb-7">
            <div className="inline-flex items-center gap-2.5 mb-5">
              <div className="w-10 h-10 bg-[#ECEFE9] rounded-xl flex items-center justify-center p-1.5 border border-[#DCE1D8] shadow-xs">
                <Image
                  src="/icon.png"
                  alt="TrainSmart"
                  width={32}
                  height={32}
                  className="w-full h-full object-contain"
                  priority
                />
              </div>
              <span className="font-bold text-lg tracking-tight text-[#141916]">
                TrainSmart
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-[#141916] tracking-tight">
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
                  className="w-full h-11 pl-10 pr-4 bg-white border border-[#8E9891] rounded-xl text-sm text-[#141916] placeholder:text-[#626E67] focus:border-[#C84B11] transition-colors"
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
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Masukkan kata sandi"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-11 pl-10 pr-12 bg-white border border-[#8E9891] rounded-xl text-sm text-[#141916] placeholder:text-[#626E67] focus:border-[#C84B11] transition-colors"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-0 top-0 h-11 w-11 flex items-center justify-center text-[#48524C] hover:text-[#141916] rounded-r-xl cursor-pointer"
                  aria-label={
                    showPassword
                      ? "Sembunyikan kata sandi"
                      : "Tampilkan kata sandi"
                  }
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
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
              className="text-[#A83D0B] font-semibold hover:underline"
            >
              Daftar Sekarang
            </Link>
          </div>
        </div>

        <p className="text-xs text-[#626E67]">
          © {new Date().getFullYear()} TrainSmart — Panduan Latihan & Hipertrofi
        </p>
      </div>

      {/* Right Column: Visual Showcase */}
      <div className="relative hidden lg:block bg-[#141916] overflow-hidden">
        <Image
          src="/login.png"
          alt="Ilustrasi latihan gym TrainSmart"
          fill
          priority
          sizes="50vw"
          className="object-cover object-center"
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-[#141916]/85 via-[#141916]/25 to-transparent"
          aria-hidden="true"
        />
        <div className="absolute bottom-10 left-10 right-10 z-10 max-w-md space-y-2">
          <h2 className="text-2xl font-bold text-white leading-snug">
            Lanjutkan progres set, beban, dan RIR Anda hari ini.
          </h2>
          <p className="text-sm text-[#D1D7CD] leading-relaxed">
            Pantau jadwal mingguan dan evaluasi hipertrofi secara objektif di setiap sesi latihan.
          </p>
        </div>
      </div>
    </main>
  );
}
