import { ScheduleWarning, SplitSession } from "@/types/workout";

export const WEEKDAYS: Array<{ day: number; label: string; short: string }> = [
  { day: 1, label: "Senin", short: "Sen" },
  { day: 2, label: "Selasa", short: "Sel" },
  { day: 3, label: "Rabu", short: "Rab" },
  { day: 4, label: "Kamis", short: "Kam" },
  { day: 5, label: "Jumat", short: "Jum" },
  { day: 6, label: "Sabtu", short: "Sab" },
  { day: 7, label: "Minggu", short: "Min" },
];

export const MUSCLE_LABELS: Record<string, string> = {
  chest: "Dada",
  back: "Punggung",
  shoulders: "Bahu",
  biceps: "Bisep",
  triceps: "Trisep",
  quads: "Paha Depan",
  hamstrings: "Hamstring",
  glutes: "Glutes",
  calves: "Betis",
  core: "Core",
};

/**
 * Auto-fill a Monday-Sunday schedule map from split template sessions.
 */
export function buildRecommendedSchedule(
  sessions: SplitSession[],
  daysPerWeek: number
): Record<number, number | null> {
  const result: Record<number, number | null> = {
    1: null,
    2: null,
    3: null,
    4: null,
    5: null,
    6: null,
    7: null,
  };

  if (!sessions.length) return result;

  // Special case: 2-day Full Body puts 2 sessions with ample recovery (Senin & Kamis)
  if (daysPerWeek === 2 && sessions.length >= 2) {
    result[1] = sessions[0].id;
    result[4] = sessions[1].id;
    return result;
  }

  const ordered = [...sessions].sort((a, b) => a.sort_order - b.sort_order);
  const capped = ordered.slice(0, Math.min(daysPerWeek, ordered.length));

  capped.forEach((session, idx) => {
    const preferred = session.default_day_of_week;
    if (preferred && preferred >= 1 && preferred <= 7 && result[preferred] === null) {
      result[preferred] = session.id;
    } else {
      // Fallback: place on first open day
      const openDay = [1, 2, 3, 4, 5, 6, 7].find((d) => result[d] === null);
      if (openDay) result[openDay] = session.id;
      else result[(idx % 7) + 1] = session.id;
    }
  });

  return result;
}

/**
 * Advisory client-side schedule validator mirroring backend ScheduleValidationService.
 */
export function validateScheduleLocally(
  sessions: SplitSession[],
  dayMap: Record<number, number | null>,
  daysPerWeek: number
): ScheduleWarning[] {
  const warnings: ScheduleWarning[] = [];
  const sessionsById = new Map<number, SplitSession>();
  sessions.forEach((s) => sessionsById.set(s.id, s));

  const assignedDays = [1, 2, 3, 4, 5, 6, 7].filter(
    (d) => dayMap[d] !== null && dayMap[d] !== undefined
  );

  if (assignedDays.length === 7) {
    warnings.push({
      code: "no_rest_day",
      severity: "warning",
      message:
        "Anda belum menyisakan hari istirahat. Otot bertumbuh saat pemulihan—sisakan minimal 1 hari istirahat setiap minggu.",
      days: [1, 2, 3, 4, 5, 6, 7],
    });
  }

  if (assignedDays.length !== daysPerWeek) {
    warnings.push({
      code: "days_count_mismatch",
      severity: "info",
      message: `Anda memilih target ${daysPerWeek} hari latihan per minggu, tetapi saat ini menjadwalkan ${assignedDays.length} sesi.`,
      days: [],
    });
  }

  const pairs: Array<[number, number]> = [
    [1, 2],
    [2, 3],
    [3, 4],
    [4, 5],
    [5, 6],
    [6, 7],
    [7, 1],
  ];

  const dayNames = new Map(WEEKDAYS.map((w) => [w.day, w.label]));

  for (const [dayA, dayB] of pairs) {
    const idA = dayMap[dayA];
    const idB = dayMap[dayB];
    if (!idA || !idB) continue;

    const sessionA = sessionsById.get(idA);
    const sessionB = sessionsById.get(idB);
    if (!sessionA || !sessionB) continue;

    const musclesA = sessionA.muscle_groups || [];
    const musclesB = sessionB.muscle_groups || [];
    const overlap = musclesA.filter((m) => musclesB.includes(m));

    if (overlap.length > 0) {
      const muscleNames = overlap
        .map((m) => MUSCLE_LABELS[m] || m)
        .join(", ");
      warnings.push({
        code: "consecutive_muscle_overlap",
        severity: "warning",
        message: `${dayNames.get(dayA)} (${sessionA.name}) dan ${dayNames.get(
          dayB
        )} (${sessionB.name}) melatih kelompok otot yang sama secara berturut-turut (${muscleNames}). Pertimbangkan memberi jeda 1 hari istirahat.`,
        days: [dayA, dayB],
      });
    }
  }

  return warnings;
}
