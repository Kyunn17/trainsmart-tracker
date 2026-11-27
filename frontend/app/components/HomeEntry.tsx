"use client";

import { useAuth } from "@/context/AuthContext";
import HomeLandingPage from "@/app/components/HomeLandingPage";
import MemberHomeDashboard from "@/app/components/MemberHomeDashboard";

export default function HomeEntry() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <main className="flex-1 bg-[#F5F6F3] text-[#141916]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-6 animate-pulse">
          <div className="h-56 bg-[#ECEFE9] rounded-2xl" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="h-28 bg-white border border-[#DCE1D8] rounded-2xl" />
            <div className="h-28 bg-white border border-[#DCE1D8] rounded-2xl" />
            <div className="h-28 bg-white border border-[#DCE1D8] rounded-2xl" />
            <div className="h-28 bg-white border border-[#DCE1D8] rounded-2xl" />
          </div>
        </div>
      </main>
    );
  }

  // Entry point for visitors: full Home / About / Features / Trainers landing page
  if (!user) {
    return <HomeLandingPage />;
  }

  // Logged-in Home Dashboard (distinct from operational Training Dashboard at /training)
  return <MemberHomeDashboard />;
}
