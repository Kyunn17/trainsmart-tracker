"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Dumbbell,
  Lock,
  Mail,
  User,
  Phone,
  Award,
  Users,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getTrainers } from "@/lib/api";
import { User as UserType } from "@/types/workout";

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();

  const [role, setRole] = useState<"client" | "trainer">("client");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [phone, setPhone] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [trainerId, setTrainerId] = useState<number | null>(null);

  const [availableTrainers, setAvailableTrainers] = useState<UserType[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    getTrainers().then(setAvailableTrainers);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== passwordConfirmation) {
      setError("Konfirmasi kata sandi tidak cocok.");
      return;
    }

    if (password.length < 6) {
      setError("Kata sandi minimal 6 karakter.");
      return;
    }

    setIsLoading(true);
    const res = await register({
      name,
      email,
      password,
      password_confirmation: passwordConfirmation,
      role,
      phone,
      specialization: role === "trainer" ? specialization : undefined,
      trainer_id: role === "client" ? trainerId : undefined,
    });
    setIsLoading(false);

    if (res.success) {
      router.push("/");
    } else {
      setError(res.message || "Gagal melakukan registrasi.");
    }
  };

  return (
    <main className="flex-1 flex items-center justify-center p-4 sm:p-6 bg-[#F5F6F3] text-[#141916] py-8 sm:py-10">
      <div className="max-w-lg w-full bg-white border border-[#DCE1D8] p-7 sm:p-8 rounded-2xl shadow-xs">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-[#FFF1EA] border border-[#F4C4AC] rounded-xl flex items-center justify-center mx-auto mb-3.5 text-[#C84B11]">
            <Dumbbell className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-[#141916] tracking-tight">
            Daftar Akun Baru
          </h1>
          <p className="text-sm text-[#48524C] mt-1.5">
            Pilih peran Anda untuk mulai mencatat progres latihan hipertrofi.
          </p>
        </div>

        {/* Role Selection Tabs */}
        <div
          className="grid grid-cols-2 gap-1.5 p-1.5 bg-[#ECEFE9] border border-[#DCE1D8] rounded-xl mb-6"
          role="tablist"
          aria-label="Pilih peran akun"
        >
          <button
            type="button"
            role="tab"
            aria-selected={role === "client"}
            onClick={() => setRole("client")}
            className={`h-10 rounded-lg text-xs sm:text-sm font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
              role === "client"
                ? "bg-[#C84B11] text-white shadow-xs"
                : "text-[#48524C] hover:text-[#141916]"
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Member Gym</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={role === "trainer"}
            onClick={() => setRole("trainer")}
            className={`h-10 rounded-lg text-xs sm:text-sm font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
              role === "trainer"
                ? "bg-[#1D4ED8] text-white shadow-xs"
                : "text-[#48524C] hover:text-[#141916]"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Personal Trainer</span>
          </button>
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
              htmlFor="reg-name"
              className="block text-sm font-semibold text-[#141916] mb-1.5"
            >
              Nama Lengkap
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-[#626E67] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="reg-name"
                type="text"
                autoComplete="name"
                placeholder="Budi Santoso"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full h-11 pl-10 pr-4 bg-white border border-[#C5CCC0] rounded-xl text-sm text-[#141916] placeholder:text-[#626E67] outline-none focus:border-[#C84B11]"
                required
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="reg-email"
              className="block text-sm font-semibold text-[#141916] mb-1.5"
            >
              Alamat Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#626E67] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="reg-email"
                type="email"
                autoComplete="email"
                placeholder="budi@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-11 pl-10 pr-4 bg-white border border-[#C5CCC0] rounded-xl text-sm text-[#141916] placeholder:text-[#626E67] outline-none focus:border-[#C84B11]"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label
                htmlFor="reg-password"
                className="block text-sm font-semibold text-[#141916] mb-1.5"
              >
                Kata Sandi
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#626E67] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="reg-password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Min. 6 karakter"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-11 pl-10 pr-3 bg-white border border-[#C5CCC0] rounded-xl text-sm text-[#141916] placeholder:text-[#626E67] outline-none focus:border-[#C84B11]"
                  required
                />
              </div>
            </div>
            <div>
              <label
                htmlFor="reg-password-confirm"
                className="block text-sm font-semibold text-[#141916] mb-1.5"
              >
                Konfirmasi Sandi
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#626E67] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="reg-password-confirm"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Ulangi sandi"
                  value={passwordConfirmation}
                  onChange={(e) => setPasswordConfirmation(e.target.value)}
                  className="w-full h-11 pl-10 pr-3 bg-white border border-[#C5CCC0] rounded-xl text-sm text-[#141916] placeholder:text-[#626E67] outline-none focus:border-[#C84B11]"
                  required
                />
              </div>
            </div>
          </div>

          <div>
            <label
              htmlFor="reg-phone"
              className="block text-sm font-semibold text-[#141916] mb-1.5"
            >
              Nomor WhatsApp / HP (Opsional)
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-[#626E67] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="reg-phone"
                type="tel"
                autoComplete="tel"
                placeholder="+62 812..."
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full h-11 pl-10 pr-4 bg-white border border-[#C5CCC0] rounded-xl text-sm text-[#141916] placeholder:text-[#626E67] outline-none focus:border-[#C84B11]"
              />
            </div>
          </div>

          {/* Role-specific fields */}
          {role === "trainer" ? (
            <div className="p-4 bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl">
              <label
                htmlFor="reg-specialization"
                className="block text-sm font-semibold text-[#1D4ED8] mb-1.5"
              >
                Spesialisasi Pelatih
              </label>
              <input
                id="reg-specialization"
                type="text"
                placeholder="Contoh: Hypertrophy & Chest Specialist, Powerlifting"
                value={specialization}
                onChange={(e) => setSpecialization(e.target.value)}
                className="w-full h-11 px-3.5 bg-white border border-[#BFDBFE] rounded-xl text-sm text-[#141916] placeholder:text-[#626E67] outline-none focus:border-[#1D4ED8]"
              />
            </div>
          ) : (
            <div className="p-4 bg-[#F5F6F3] border border-[#DCE1D8] rounded-xl">
              <label
                htmlFor="reg-trainer"
                className="block text-sm font-semibold text-[#141916] mb-1.5"
              >
                Pilih Personal Trainer Pendamping (Opsional)
              </label>
              <select
                id="reg-trainer"
                value={trainerId ?? ""}
                onChange={(e) =>
                  setTrainerId(
                    e.target.value ? parseInt(e.target.value, 10) : null
                  )
                }
                className="w-full h-11 px-3.5 bg-white border border-[#C5CCC0] rounded-xl text-sm text-[#141916] outline-none focus:border-[#C84B11]"
              >
                <option value="">-- Tanpa Trainer (Latihan Mandiri) --</option>
                {availableTrainers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.specialization || "Coach"})
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full h-11 font-semibold rounded-xl text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer mt-2 text-white ${
              role === "trainer"
                ? "bg-[#1D4ED8] hover:bg-[#1E40AF] disabled:opacity-50"
                : "bg-[#C84B11] hover:bg-[#A83D0B] disabled:opacity-50"
            }`}
          >
            <span>{isLoading ? "Mendaftarkan Akun..." : "Buat Akun & Mulai"}</span>
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-[#DCE1D8] text-center text-sm text-[#48524C]">
          Sudah punya akun?{" "}
          <Link
            href="/login"
            className="text-[#C84B11] font-semibold hover:underline"
          >
            Masuk di Sini
          </Link>
        </div>
      </div>
    </main>
  );
}
