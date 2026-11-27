import { DailySessionStatus } from "@/types/workout";

export const SESSION_STATUS_META: Record<
  DailySessionStatus,
  { label: string; badgeClass: string; dotClass: string }
> = {
  pending: {
    label: "Belum Selesai",
    badgeClass: "bg-[#FFF1EA] text-[#A83D0B] border-[#F4C4AC]",
    dotClass: "bg-[#C84B11]",
  },
  done: {
    label: "Selesai",
    badgeClass: "bg-[#ECFDF5] text-[#047857] border-[#A7F3D0]",
    dotClass: "bg-[#047857]",
  },
  skipped: {
    label: "Dilewati",
    badgeClass: "bg-[#FFF1F2] text-[#BE123C] border-[#FECDD3]",
    dotClass: "bg-[#BE123C]",
  },
  rest: {
    label: "Hari Istirahat",
    badgeClass: "bg-[#ECEFE9] text-[#48524C] border-[#DCE1D8]",
    dotClass: "bg-[#8E9891]",
  },
};

export function getRirZone(rir: number | null | undefined): {
  label: string;
  badgeClass: string;
} {
  if (rir === null || rir === undefined) {
    return {
      label: "Belum ada data",
      badgeClass: "bg-[#ECEFE9] text-[#48524C] border-[#DCE1D8]",
    };
  }
  if (rir >= 1 && rir <= 2) {
    return {
      label: "Optimal 1–2",
      badgeClass: "bg-[#ECFDF5] text-[#047857] border-[#A7F3D0]",
    };
  }
  if (rir < 1) {
    return {
      label: "Mendekati Gagal",
      badgeClass: "bg-[#FFF1F2] text-[#BE123C] border-[#FECDD3]",
    };
  }
  return {
    label: "Terlalu Ringan",
    badgeClass: "bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]",
  };
}

export function formatIndonesianDateString(dateStr?: string | null): string {
  if (!dateStr) return "";
  const isoDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
  const parsed = isoDateOnly
    ? new Date(`${dateStr}T00:00:00`)
    : new Date(dateStr);
  if (Number.isNaN(parsed.getTime())) return dateStr;
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(parsed);
}
