"use client";

import { useState, useMemo } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import {
  AlertTriangle,
  CheckCircle2,
  GripVertical,
  Info,
  RotateCcw,
  Save,
  Sparkles,
  X,
} from "lucide-react";
import { Split, SplitSession, ScheduleWarning } from "@/types/workout";
import { saveUserPlan } from "@/lib/api";
import {
  WEEKDAYS,
  MUSCLE_LABELS,
  buildRecommendedSchedule,
  validateScheduleLocally,
} from "@/lib/scheduleValidation";

interface ScheduleBuilderProps {
  split: Split;
  daysPerWeek: number;
  initialSchedule?: Record<number, number | null>;
  onSaved?: (warnings: ScheduleWarning[]) => void;
  onBack?: () => void;
}

const SESSION_BADGE_COLORS: Record<string, string> = {
  push: "bg-[#FFF1EA] text-[#C84B11] border-[#F4C4AC]",
  pull: "bg-[#EFF6FF] text-[#1D4ED8] border-[#BFDBFE]",
  legs: "bg-[#ECFDF5] text-[#047857] border-[#A7F3D0]",
  upper: "bg-[#FFF1EA] text-[#C84B11] border-[#F4C4AC]",
  lower: "bg-[#ECFDF5] text-[#047857] border-[#A7F3D0]",
  anterior: "bg-[#FFF1EA] text-[#C84B11] border-[#F4C4AC]",
  posterior: "bg-[#EFF6FF] text-[#1D4ED8] border-[#BFDBFE]",
  full_body: "bg-[#ECFDF5] text-[#047857] border-[#A7F3D0]",
};

function DraggablePoolSession({
  session,
  placedCount,
}: {
  session: SplitSession;
  placedCount: number;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `pool-${session.id}`,
      data: { type: "pool", sessionId: session.id },
    });

  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined;

  const badgeClass =
    SESSION_BADGE_COLORS[session.session_type] ||
    "bg-[#ECEFE9] text-[#141916] border-[#DCE1D8]";

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`p-3.5 bg-white border border-[#DCE1D8] hover:border-[#C84B11] rounded-xl shadow-xs cursor-grab active:cursor-grabbing transition-colors select-none touch-none ${
        isDragging ? "opacity-40" : ""
      }`}
    >
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-2 min-w-0">
          <GripVertical className="w-4 h-4 text-[#626E67] shrink-0" />
          <span
            className={`px-2.5 py-0.5 rounded-lg border text-xs font-bold truncate ${badgeClass}`}
          >
            {session.name}
          </span>
        </div>
        <span className="text-xs font-mono tabular-nums font-semibold text-[#626E67] shrink-0">
          {placedCount}×
        </span>
      </div>
      <p className="text-xs text-[#48524C] pl-6 line-clamp-1">
        {(session.muscle_groups || [])
          .map((m) => MUSCLE_LABELS[m] || m)
          .join(", ")}
      </p>
    </div>
  );
}

function DraggableDayBadge({
  day,
  session,
  onClear,
}: {
  day: number;
  session: SplitSession;
  onClear: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `day-item-${day}`,
      data: { type: "day", fromDay: day, sessionId: session.id },
    });

  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined;

  const badgeClass =
    SESSION_BADGE_COLORS[session.session_type] ||
    "bg-[#ECEFE9] text-[#141916] border-[#DCE1D8]";

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 bg-white shadow-xs ${
        isDragging ? "opacity-40" : ""
      } border-[#DCE1D8]`}
    >
      <div
        {...listeners}
        {...attributes}
        className="flex items-center gap-2 min-w-0 flex-1 cursor-grab active:cursor-grabbing touch-none"
      >
        <GripVertical className="w-4 h-4 text-[#626E67] shrink-0" />
        <div className="min-w-0">
          <span
            className={`inline-block px-2 py-0.5 rounded-md border text-xs font-bold ${badgeClass}`}
          >
            {session.name}
          </span>
          <p className="text-xs text-[#626E67] mt-1 truncate">
            {(session.muscle_groups || [])
              .map((m) => MUSCLE_LABELS[m] || m)
              .slice(0, 3)
              .join(", ")}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onClear}
        className="w-9 h-9 rounded-lg text-[#626E67] hover:text-[#BE123C] hover:bg-[#FFF1F2] flex items-center justify-center transition-colors shrink-0 cursor-pointer"
        aria-label={`Jadikan hari istirahat`}
        title="Kosongkan menjadi hari istirahat"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

function DroppableDayCard({
  day,
  label,
  session,
  allSessions,
  hasWarning,
  onSelectSession,
  onClear,
}: {
  day: number;
  label: string;
  session: SplitSession | null;
  allSessions: SplitSession[];
  hasWarning: boolean;
  onSelectSession: (sessionId: number | null) => void;
  onClear: () => void;
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: `day-${day}`,
    data: { day },
  });

  return (
    <div
      ref={setNodeRef}
      className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 min-h-[144px] ${
        isOver
          ? "bg-[#FFF1EA] border-[#C84B11] ring-2 ring-[#C84B11]/25"
          : hasWarning
          ? "bg-[#FFFBEB]/60 border-[#FDE68A]"
          : session
          ? "bg-white border-[#DCE1D8]"
          : "bg-[#F5F6F3] border-dashed border-[#C5CCC0]"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-bold text-[#141916]">{label}</span>
        <span
          className={`text-xs font-semibold px-2 py-0.5 rounded-md ${
            session
              ? "bg-[#ECFDF5] text-[#047857]"
              : "bg-[#ECEFE9] text-[#626E67]"
          }`}
        >
          {session ? "Latihan" : "Istirahat"}
        </span>
      </div>

      {session ? (
        <DraggableDayBadge day={day} session={session} onClear={onClear} />
      ) : (
        <div className="py-2 text-center text-xs text-[#626E67]">
          Tarik sesi ke sini atau pilih di bawah
        </div>
      )}

      {/* Accessible keyboard & mobile 1-tap selector */}
      <select
        aria-label={`Pilih sesi untuk hari ${label}`}
        value={session?.id ?? ""}
        onChange={(e) =>
          onSelectSession(e.target.value ? Number(e.target.value) : null)
        }
        className="w-full h-10 px-2.5 bg-white border border-[#C5CCC0] rounded-xl text-xs font-medium text-[#141916] outline-none focus:border-[#C84B11]"
      >
        <option value="">Hari Istirahat</option>
        {allSessions.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>
    </div>
  );
}

export default function ScheduleBuilder({
  split,
  daysPerWeek,
  initialSchedule,
  onSaved,
  onBack,
}: ScheduleBuilderProps) {
  const sessions = useMemo(() => split.sessions || [], [split.sessions]);

  const [dayMap, setDayMap] = useState<Record<number, number | null>>(() => {
    if (initialSchedule) return initialSchedule;
    return buildRecommendedSchedule(sessions, daysPerWeek);
  });

  const [activeDragSessionId, setActiveDragSessionId] = useState<number | null>(
    null
  );
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 150, tolerance: 6 },
    }),
    useSensor(KeyboardSensor)
  );

  const sessionsById = useMemo(() => {
    const map = new Map<number, SplitSession>();
    sessions.forEach((s) => map.set(s.id, s));
    return map;
  }, [sessions]);

  const warnings = useMemo(
    () => validateScheduleLocally(sessions, dayMap, daysPerWeek),
    [sessions, dayMap, daysPerWeek]
  );

  const warningDaysSet = useMemo(() => {
    const set = new Set<number>();
    warnings.forEach((w) => {
      if (w.severity === "warning") {
        w.days.forEach((d) => set.add(d));
      }
    });
    return set;
  }, [warnings]);

  const placedCounts = useMemo(() => {
    const counts = new Map<number, number>();
    Object.values(dayMap).forEach((sid) => {
      if (sid) counts.set(sid, (counts.get(sid) || 0) + 1);
    });
    return counts;
  }, [dayMap]);

  const handleDragStart = (event: DragStartEvent) => {
    const sessionId = event.active.data.current?.sessionId as
      | number
      | undefined;
    if (sessionId) setActiveDragSessionId(sessionId);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDragSessionId(null);
    const { active, over } = event;
    if (!over) return;

    const targetDay = over.data.current?.day as number | undefined;
    if (!targetDay) return;

    const activeData = active.data.current;
    if (!activeData) return;

    const sessionId = activeData.sessionId as number;

    if (activeData.type === "pool") {
      setDayMap((prev) => ({ ...prev, [targetDay]: sessionId }));
    } else if (activeData.type === "day") {
      const fromDay = activeData.fromDay as number;
      if (fromDay === targetDay) return;
      setDayMap((prev) => {
        const targetExisting = prev[targetDay] ?? null;
        return {
          ...prev,
          [fromDay]: targetExisting,
          [targetDay]: sessionId,
        };
      });
    }
  };

  const handleUseRecommendation = () => {
    setDayMap(buildRecommendedSchedule(sessions, daysPerWeek));
    setErrorMsg(null);
  };

  const handleClearAll = () => {
    setDayMap({
      1: null,
      2: null,
      3: null,
      4: null,
      5: null,
      6: null,
      7: null,
    });
  };

  const handleSave = async () => {
    const assignedCount = Object.values(dayMap).filter(Boolean).length;
    if (assignedCount === 0) {
      setErrorMsg(
        "Pilih minimal 1 hari latihan sebelum menyimpan jadwal mingguan."
      );
      return;
    }

    setIsSaving(true);
    setErrorMsg(null);

    const schedule = WEEKDAYS.map(({ day }) => ({
      day_of_week: day,
      split_session_id: dayMap[day] ?? null,
    }));

    const res = await saveUserPlan({
      split_id: split.id,
      days_per_week: daysPerWeek,
      schedule,
    });

    setIsSaving(false);

    if (!res.success) {
      setErrorMsg(res.message);
      return;
    }

    if (onSaved) {
      onSaved(res.warnings);
    }
  };

  const draggedSession = activeDragSessionId
    ? sessionsById.get(activeDragSessionId)
    : null;

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-[#DCE1D8] rounded-2xl p-4 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-[#141916]">
            Susun Jadwal Mingguan ({split.name})
          </h2>
          <p className="text-xs sm:text-sm text-[#48524C]">
            Tarik sesi latihan ke hari Senin–Minggu, atau pilih langsung melalui menu di tiap hari.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleUseRecommendation}
            className="h-11 px-4 bg-[#FFF1EA] hover:bg-[#F4C4AC]/50 border border-[#F4C4AC] text-[#C84B11] font-semibold rounded-xl text-xs sm:text-sm flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Gunakan Rekomendasi</span>
          </button>
          <button
            type="button"
            onClick={handleClearAll}
            className="h-11 px-4 bg-[#ECEFE9] hover:bg-[#DCE1D8] text-[#48524C] hover:text-[#141916] font-semibold rounded-xl text-xs sm:text-sm flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Kosongkan</span>
          </button>
        </div>
      </div>

      {/* Advisory Warnings Panel */}
      {warnings.length > 0 ? (
        <div
          role="status"
          className="p-4 bg-[#FFFBEB] border border-[#FDE68A] rounded-2xl space-y-2"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-bold text-[#B45309] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Catatan Pemulihan & Jadwal (Saran)</span>
            </span>
            <span className="text-xs font-medium text-[#B45309]">
              Tetap dapat disimpan
            </span>
          </div>
          <ul className="space-y-1.5 text-xs sm:text-sm text-[#141916]">
            {warnings.map((w, idx) => (
              <li key={`${w.code}-${idx}`} className="flex items-start gap-2">
                {w.severity === "warning" ? (
                  <AlertTriangle className="w-4 h-4 text-[#B45309] shrink-0 mt-0.5" />
                ) : (
                  <Info className="w-4 h-4 text-[#1D4ED8] shrink-0 mt-0.5" />
                )}
                <span>{w.message}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="p-3.5 bg-[#ECFDF5] border border-[#A7F3D0] rounded-xl text-xs sm:text-sm text-[#047857] font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>
            Jadwal terlihat seimbang — tidak ada tumpang tindih otot berturut-turut dan waktu pemulihan terjaga.
          </span>
        </div>
      )}

      {/* Drag and Drop Area */}
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Draggable Session Pool */}
          <div className="lg:col-span-4 bg-white border border-[#DCE1D8] rounded-2xl p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#141916]">
                Daftar Sesi Latihan
              </h3>
              <span className="text-xs font-mono tabular-nums text-[#626E67]">
                {sessions.length} Sesi
              </span>
            </div>
            <div className="space-y-2.5">
              {sessions.map((session) => (
                <DraggablePoolSession
                  key={session.id}
                  session={session}
                  placedCount={placedCounts.get(session.id) || 0}
                />
              ))}
            </div>
          </div>

          {/* 7-Day Drop Grid */}
          <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5">
            {WEEKDAYS.map(({ day, label }) => {
              const assignedId = dayMap[day] ?? null;
              const session = assignedId
                ? sessionsById.get(assignedId) || null
                : null;
              return (
                <DroppableDayCard
                  key={day}
                  day={day}
                  label={label}
                  session={session}
                  allSessions={sessions}
                  hasWarning={warningDaysSet.has(day)}
                  onSelectSession={(sid) =>
                    setDayMap((prev) => ({ ...prev, [day]: sid }))
                  }
                  onClear={() =>
                    setDayMap((prev) => ({ ...prev, [day]: null }))
                  }
                />
              );
            })}
          </div>
        </div>

        <DragOverlay>
          {draggedSession ? (
            <div className="p-3 bg-white border-2 border-[#C84B11] rounded-xl shadow-lg text-sm font-bold text-[#141916]">
              {draggedSession.name}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {errorMsg && (
        <div
          role="alert"
          className="p-3.5 bg-[#FFF1F2] border border-[#FECDD3] rounded-xl text-sm text-[#BE123C] font-medium"
        >
          {errorMsg}
        </div>
      )}

      {/* Footer Save / Back Buttons */}
      <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 pt-2">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="w-full sm:w-auto h-11 px-5 bg-[#ECEFE9] hover:bg-[#DCE1D8] text-[#141916] font-semibold rounded-xl text-sm cursor-pointer"
          >
            Kembali ke Daftar Gerakan
          </button>
        ) : (
          <div />
        )}

        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="w-full sm:w-auto h-12 px-7 bg-[#C84B11] hover:bg-[#A83D0B] disabled:opacity-50 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? "Menyimpan Jadwal..." : "Simpan Jadwal Latihan"}</span>
        </button>
      </div>
    </div>
  );
}
