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

export const MAJOR_MUSCLE_KEYS = [
  "chest",
  "back",
  "shoulders",
  "biceps",
  "triceps",
  "quads",
  "hamstrings",
  "glutes",
  "calves",
  "core",
] as const;

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

const SHOULDER_REGIONS = ["front_delt", "lateral_delt", "rear_delt"];

/**
 * Compute estimated weekly training frequency per major muscle group directly from a list of sessions.
 */
export function computeMuscleFrequencyFromSessions(
  sessions: SplitSession[]
): Record<string, number> {
  const counts: Record<string, number> = {};
  MAJOR_MUSCLE_KEYS.forEach((m) => {
    counts[m] = 0;
  });

  for (const session of sessions) {
    const uniqueMuscles = Array.from(new Set(session.muscle_groups || []));
    for (const muscle of uniqueMuscles) {
      if (muscle in counts) {
        counts[muscle] += 1;
      }
    }
  }

  return counts;
}

/**
 * Compute weekly training frequency per major muscle group from the currently placed 7-day schedule.
 */
export function computeScheduleMuscleFrequency(
  sessions: SplitSession[],
  dayMap: Record<number, number | null>
): Record<string, number> {
  const sessionsById = new Map<number, SplitSession>();
  sessions.forEach((s) => sessionsById.set(s.id, s));

  const placedSessions: SplitSession[] = [];
  for (let d = 1; d <= 7; d++) {
    const sid = dayMap[d];
    if (!sid) continue;
    const session = sessionsById.get(sid);
    if (session) placedSessions.push(session);
  }

  return computeMuscleFrequencyFromSessions(placedSessions);
}

function isHeavyLowerSession(session?: SplitSession): boolean {
  if (!session) return false;
  if (["legs", "lower", "full_body"].includes(session.session_type)) {
    return true;
  }
  return Boolean(session.is_heavy);
}

/**
 * Auto-fill a Monday-Sunday schedule map from split template sessions.
 * Preserves defined `sort_order`, avoids consecutive heavy sessions when possible,
 * and spreads rest days sensibly (for 6-day splits, Sunday is deliberately reserved as rest).
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

  const ordered = [...sessions].sort((a, b) => a.sort_order - b.sort_order);
  const capped = ordered.slice(0, Math.min(daysPerWeek, ordered.length));

  // 1. Check if database template `default_day_of_week` provides a complete, non-colliding layout
  const preferredDays = capped.map((s) => s.default_day_of_week);
  const allPreferredValid =
    preferredDays.every((d) => typeof d === "number" && d >= 1 && d <= 7) &&
    new Set(preferredDays).size === capped.length;

  if (allPreferredValid) {
    let hasBackToBackHeavy = false;
    const byPreferredDay = new Map<number, SplitSession>();
    capped.forEach((s) => {
      if (s.default_day_of_week) byPreferredDay.set(s.default_day_of_week, s);
    });

    const pairs: Array<[number, number]> = [
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
      [5, 6],
      [6, 7],
      [7, 1],
    ];
    for (const [a, b] of pairs) {
      const sA = byPreferredDay.get(a);
      const sB = byPreferredDay.get(b);
      if (sA && sB && isHeavyLowerSession(sA) && isHeavyLowerSession(sB)) {
        hasBackToBackHeavy = true;
        break;
      }
    }

    if (!hasBackToBackHeavy) {
      capped.forEach((s) => {
        if (s.default_day_of_week) {
          result[s.default_day_of_week] = s.id;
        }
      });
      return result;
    }
  }

  // 2. Fallback / algorithmic placement keeping `sort_order` intact & spreading rest days
  let slots: number[];
  if (capped.length === 2) {
    slots = [1, 4]; // Senin & Kamis
  } else if (capped.length === 3) {
    slots = [1, 3, 5]; // Senin, Rabu, Jumat
  } else if (capped.length === 4) {
    // If session 3 & 4 (0-idx 2 & 3) are both heavy lower/full-body (e.g. PPL + Full Body), separate them
    const s2Heavy = isHeavyLowerSession(capped[2]);
    const s3Heavy = isHeavyLowerSession(capped[3]);
    slots = s2Heavy && s3Heavy ? [1, 2, 4, 6] : [1, 2, 4, 5];
  } else if (capped.length === 5) {
    // Put rest on Thu+Sun when session 1..3 is a 3-day block (e.g. PPL + UL), else Wed+Sun
    const thirdIsLegs = ["legs", "lower", "shoulders"].includes(
      capped[2]?.session_type || ""
    );
    slots = thirdIsLegs ? [1, 2, 3, 5, 6] : [1, 2, 4, 5, 6];
  } else if (capped.length === 6) {
    slots = [1, 2, 3, 4, 5, 6]; // Deliberate single rest day on Sunday
  } else {
    slots = capped.map((_, i) => (i % 7) + 1);
  }

  capped.forEach((session, idx) => {
    const day = slots[idx] ?? (idx % 7) + 1;
    result[day] = session.id;
  });

  return result;
}

/**
 * Advisory client-side schedule validator mirroring backend ScheduleValidationService.
 * Computed dynamically from session templates (`muscle_groups` and `muscle_regions`).
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
  const frequency = computeScheduleMuscleFrequency(sessions, dayMap);

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

  if (assignedDays.length > 0) {
    const lowerCoverage =
      (frequency.quads || 0) +
      (frequency.hamstrings || 0) +
      (frequency.glutes || 0);

    if (lowerCoverage === 0) {
      warnings.push({
        code: "no_lower_body_session",
        severity: "warning",
        message:
          "Jadwal minggu ini belum memiliki sesi kaki / tubuh bawah (Quads, Hamstring, atau Glutes). Tambahkan minimal 1 sesi untuk keseimbangan proporsi tubuh.",
        days: [],
      });
    }

    if ((frequency.chest || 0) === 0) {
      warnings.push({
        code: "no_chest_session",
        severity: "warning",
        message: "Jadwal minggu ini belum melatih otot Dada (Chest).",
        days: [],
      });
    }

    if ((frequency.back || 0) === 0) {
      warnings.push({
        code: "no_back_session",
        severity: "warning",
        message: "Jadwal minggu ini belum melatih otot Punggung (Back).",
        days: [],
      });
    }
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
    let overlap = musclesA.filter((m) => musclesB.includes(m));

    // Region-aware shoulder check (Push/Anterior vs Pull/Posterior do not overlap shoulder sub-regions)
    if (overlap.includes("shoulders")) {
      const regionsA = sessionA.muscle_regions || [];
      const regionsB = sessionB.muscle_regions || [];
      if (regionsA.length > 0 && regionsB.length > 0) {
        const deltA = regionsA.filter((r) => SHOULDER_REGIONS.includes(r));
        const deltB = regionsB.filter((r) => SHOULDER_REGIONS.includes(r));
        const hasDeltOverlap = deltA.some((r) => deltB.includes(r));
        if (!hasDeltOverlap) {
          overlap = overlap.filter((m) => m !== "shoulders");
        }
      }
    }

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
