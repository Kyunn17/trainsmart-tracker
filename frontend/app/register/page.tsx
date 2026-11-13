"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Dumbbell, Lock, Mail, User, Phone, Award, Users, AlertCircle, CheckCircle2 } from "lucide-react";
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
    <main className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4 bg-zinc-950 relative overflow-hidden py-10">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full bg-zinc-900/90 border border-zinc-800 p-8 rounded-3xl shadow-2xl backdrop-blur-xl relative z-10">
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-center mx-auto mb-3 text-amber-400">
            <Dumbbell className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Daftar Akun Baru</h1>
          <p className="text-xs text-zinc-400 mt-1">
            Pilih peran Anda dan mulai transformasi progres hipertrofi.
          </p>
        </div>

        {/* Role Selection Tabs */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-zinc-950 border border-zinc-800 rounded-2xl mb-6">
          <button
            type="button"
            onClick={() => setRole("client")}
            className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
              role === "client"
                ? "bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Member Gym (Client)</span>
          </button>
          <button
            type="button"
            onClick={() => setRole("trainer")}
            className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
              role === "trainer"
                ? "bg-blue-500 text-white shadow-md shadow-blue-500/20"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Personal Trainer (PT)</span>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-950/50 border border-red-500/50 rounded-xl text-red-300 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">Nama Lengkap</label>
            <div className="relative">
              <User className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Budi Santoso"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-zinc-950 border border-zinc-700/80 rounded-xl text-xs text-white placeholder:text-zinc-600 outline-none focus:border-amber-400"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                placeholder="budi@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-zinc-950 border border-zinc-700/80 rounded-xl text-xs text-white placeholder:text-zinc-600 outline-none focus:border-amber-400"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Kata Sandi</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  placeholder="Min. 6 char"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-2 py-2 bg-zinc-950 border border-zinc-700/80 rounded-xl text-xs text-white placeholder:text-zinc-600 outline-none focus:border-amber-400"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Konfirmasi Sandi</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  placeholder="Ulangi Sandi"
                  value={passwordConfirmation}
                  onChange={(e) => setPasswordConfirmation(e.target.value)}
                  className="w-full pl-9 pr-2 py-2 bg-zinc-950 border border-zinc-700/80 rounded-xl text-xs text-white placeholder:text-zinc-600 outline-none focus:border-amber-400"
                  required
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">Nomor WhatsApp / HP (Opsional)</label>
            <div className="relative">
              <Phone className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="tel"
                placeholder="+62 812..."
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-zinc-950 border border-zinc-700/80 rounded-xl text-xs text-white placeholder:text-zinc-600 outline-none focus:border-amber-400"
              />
            </div>
          </div>

          {/* Role-specific fields */}
          {role === "trainer" ? (
            <div>
              <label className="block text-xs font-semibold text-blue-400 mb-1">Spesialisasi Pelatih</label>
              <input
                type="text"
                placeholder="Contoh: Hypertrophy & Chest Specialist, Powerlifting"
                value={specialization}
                onChange={(e) => setSpecialization(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-950 border border-blue-500/40 rounded-xl text-xs text-white placeholder:text-zinc-600 outline-none focus:border-blue-400"
              />
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-amber-400 mb-1">
                Pilih Personal Trainer Pendamping (Opsional)
              </label>
              <select
                value={trainerId ?? ""}
                onChange={(e) => setTrainerId(e.target.value ? parseInt(e.target.value) : null)}
                className="w-full px-3 py-2 bg-zinc-950 border border-amber-500/40 rounded-xl text-xs text-white outline-none focus:border-amber-400"
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
            className={`w-full py-3 font-black rounded-xl text-xs transition-all shadow-lg flex items-center justify-center space-x-2 mt-4 ${
              role === "trainer"
                ? "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20"
                : "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 shadow-amber-500/20"
            }`}
          >
            <span>{isLoading ? "Mendaftarkan Akun..." : "Buat Akun & Mulai"}</span>
          </button>
        </form>

        <div className="mt-5 text-center text-xs text-zinc-400">
          Sudah punya akun?{" "}
          <Link href="/login" className="text-amber-400 font-bold hover:underline">
            Masuk di Sini
          </Link>
        </div>
      </div>
    </main>
  );
}
