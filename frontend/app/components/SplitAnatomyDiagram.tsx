"use client";

import React from "react";

export const MUSCLE_REGION_LABELS: Record<string, string> = {
  upper_chest: "Dada Atas",
  middle_chest: "Dada Tengah",
  lower_chest: "Dada Bawah",
  front_delt: "Bahu Depan",
  lateral_delt: "Bahu Samping",
  rear_delt: "Bahu Belakang",
  lats: "Sayap (Lats)",
  mid_back: "Punggung Tengah",
  biceps: "Bisep",
  triceps: "Trisep",
  quads: "Paha Depan",
  hamstrings: "Hamstring",
  glutes: "Glutes",
  calves: "Betis",
  core: "Core / Perut",
};

interface SplitAnatomyDiagramProps {
  activeRegions: string[];
  activeMuscleGroups?: string[];
  sessionLabel?: string;
}

const BASE_SKIN = "#F0C5A4";
const ACTIVE_FILL = "#C84B11";
const ACTIVE_HIGHLIGHT = "#E56D35";
const SHORTS_FILL = "#1F2622";
const SHORTS_ACTIVE_GLUTES = "#C84B11";

/**
 * Interactive Front & Back anatomical SVG diagram built directly from TrainSmart's
 * curated region SVG illustrations (`backend/storage/app/public/exercises/regions/*.svg`).
 * Dynamically highlights all targeted muscle regions for any split or session.
 */
export default function SplitAnatomyDiagram({
  activeRegions,
  activeMuscleGroups = [],
  sessionLabel,
}: SplitAnatomyDiagramProps) {
  const regionSet = new Set(activeRegions);
  const groupSet = new Set(activeMuscleGroups);

  const hasRegion = (...keys: string[]) => keys.some((k) => regionSet.has(k));

  // Front view muscle activation
  const chestActive =
    hasRegion("upper_chest", "middle_chest", "lower_chest") ||
    groupSet.has("chest");
  const upperChestActive = hasRegion("upper_chest");
  const lowerChestActive = hasRegion("lower_chest");
  const frontDeltActive =
    hasRegion("front_delt", "lateral_delt") ||
    (groupSet.has("shoulders") && activeRegions.length === 0);
  const bicepsActive = hasRegion("biceps") || groupSet.has("biceps");
  const coreActive = hasRegion("core") || groupSet.has("core");
  const quadsActive = hasRegion("quads") || groupSet.has("quads");

  // Back view muscle activation
  const latsActive = hasRegion("lats") || groupSet.has("back");
  const midBackActive = hasRegion("mid_back") || groupSet.has("back");
  const rearDeltActive =
    hasRegion("rear_delt") ||
    (groupSet.has("shoulders") && activeRegions.length === 0);
  const tricepsActive = hasRegion("triceps") || groupSet.has("triceps");
  const glutesActive = hasRegion("glutes") || groupSet.has("glutes");
  const hamstringsActive =
    hasRegion("hamstrings") || groupSet.has("hamstrings");
  const calvesActive = hasRegion("calves") || groupSet.has("calves");

  const activeRegionLabels = activeRegions
    .filter((r, idx, arr) => arr.indexOf(r) === idx)
    .map((r) => MUSCLE_REGION_LABELS[r] || r);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        {/* FRONT VIEW (ANTERIOR) */}
        <div className="bg-[#F5F6F3] border border-[#DCE1D8] rounded-2xl p-3 flex flex-col items-center">
          <div className="w-full flex items-center justify-between mb-1 px-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#48524C]">
              Tampak Depan
            </span>
            <span className="text-[11px] font-mono tabular-nums text-[#626E67]">
              Anterior
            </span>
          </div>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="170 24 300 432"
            className="w-full max-w-[190px] h-auto"
            role="img"
            aria-label={`Anatomi tampak depan untuk ${sessionLabel || "split"}`}
          >
            <ellipse cx="320" cy="442" rx="108" ry="11" fill="#E6EAE2" />

            <g
              stroke="#141916"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {/* Neck & Traps */}
              <path d="M294 114 L274 134 L366 134 L346 114 Z" fill={BASE_SKIN} />
              <rect x="303" y="96" width="34" height="24" rx="10" fill={BASE_SKIN} />

              {/* Head */}
              <ellipse cx="320" cy="68" rx="28" ry="33" fill={BASE_SKIN} />
              <path
                d="M308 46 Q316 40 326 44"
                stroke="#FFFFFF"
                strokeWidth="3"
                opacity="0.75"
                fill="none"
              />
              <path d="M292 64 C286 64 286 78 292 79" fill={BASE_SKIN} />
              <path d="M348 64 C354 64 354 78 348 79" fill={BASE_SKIN} />
              <path d="M306 60 L315 62" strokeWidth="3" />
              <path d="M334 60 L325 62" strokeWidth="3" />
              <circle cx="310" cy="68" r="2.6" fill="#141916" stroke="none" />
              <circle cx="330" cy="68" r="2.6" fill="#141916" stroke="none" />
              <path d="M313 82 Q320 87 327 82" strokeWidth="2.6" fill="none" />

              {/* Torso base */}
              <path
                d="M262 136 Q320 124 378 136 L364 252 L276 252 Z"
                fill={BASE_SKIN}
              />

              {/* Chest (Pectorals) */}
              <path
                d="M268 142 Q294 136 318 146 L318 184 Q292 192 269 178 Z"
                fill={chestActive ? ACTIVE_FILL : BASE_SKIN}
              />
              <path
                d="M372 142 Q346 136 322 146 L322 184 Q348 192 371 178 Z"
                fill={chestActive ? ACTIVE_FILL : BASE_SKIN}
              />
              {chestActive && (
                <>
                  <path
                    d="M278 156 Q296 154 312 162"
                    stroke={ACTIVE_HIGHLIGHT}
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    d="M362 156 Q344 154 328 162"
                    stroke={ACTIVE_HIGHLIGHT}
                    strokeWidth="4"
                    fill="none"
                  />
                </>
              )}
              {upperChestActive && (
                <>
                  <path
                    d="M276 146 Q296 142 313 150"
                    stroke="#FDE68A"
                    strokeWidth="2.5"
                    fill="none"
                    opacity="0.7"
                  />
                  <path
                    d="M364 146 Q344 142 327 150"
                    stroke="#FDE68A"
                    strokeWidth="2.5"
                    fill="none"
                    opacity="0.7"
                  />
                </>
              )}
              {lowerChestActive && (
                <>
                  <path
                    d="M274 176 Q296 184 314 179"
                    stroke="#FDE68A"
                    strokeWidth="2.5"
                    fill="none"
                    opacity="0.7"
                  />
                  <path
                    d="M366 176 Q344 184 326 179"
                    stroke="#FDE68A"
                    strokeWidth="2.5"
                    fill="none"
                    opacity="0.7"
                  />
                </>
              )}

              {/* Core / Abs */}
              <g fill={coreActive ? ACTIVE_FILL : BASE_SKIN}>
                <rect x="294" y="191" width="23" height="17" rx="5" />
                <rect x="323" y="191" width="23" height="17" rx="5" />
                <rect x="296" y="211" width="21" height="17" rx="5" />
                <rect x="323" y="211" width="21" height="17" rx="5" />
                <rect x="298" y="231" width="19" height="16" rx="5" />
                <rect x="323" y="231" width="19" height="16" rx="5" />
              </g>

              {/* Front & Lateral Deltoids */}
              <path
                d="M266 134 C244 134 234 152 240 174 C246 184 260 184 268 174 Z"
                fill={frontDeltActive ? ACTIVE_FILL : BASE_SKIN}
              />
              <path
                d="M374 134 C396 134 406 152 400 174 C394 184 380 184 372 174 Z"
                fill={frontDeltActive ? ACTIVE_FILL : BASE_SKIN}
              />

              {/* Upper Arms (Biceps) */}
              <path
                d="M241 174 C230 194 230 218 240 232 L262 230 C268 212 268 192 266 174 Z"
                fill={bicepsActive ? ACTIVE_FILL : BASE_SKIN}
              />
              <path
                d="M399 174 C410 194 410 218 400 232 L378 230 C372 212 372 192 374 174 Z"
                fill={bicepsActive ? ACTIVE_FILL : BASE_SKIN}
              />

              {/* Forearms & Hands */}
              <path d="M238 232 L226 286 L246 290 L260 232 Z" fill={BASE_SKIN} />
              <path d="M402 232 L414 286 L394 290 L380 232 Z" fill={BASE_SKIN} />
              <circle cx="234" cy="298" r="11" fill={BASE_SKIN} />
              <circle cx="406" cy="298" r="11" fill={BASE_SKIN} />

              {/* Gym Shorts */}
              <path
                d="M275 250 L365 250 L374 322 L326 322 L320 294 L314 322 L266 322 Z"
                fill={SHORTS_FILL}
              />
              <path d="M276 260 L364 260" stroke="#34403A" strokeWidth="3" />

              {/* Thighs (Quads) */}
              <path
                d="M269 322 C266 346 270 366 280 378 L308 378 C316 364 318 344 314 322 Z"
                fill={quadsActive ? ACTIVE_FILL : BASE_SKIN}
              />
              <path
                d="M371 322 C374 346 370 366 360 378 L332 378 C324 364 322 344 326 322 Z"
                fill={quadsActive ? ACTIVE_FILL : BASE_SKIN}
              />
              {quadsActive && (
                <>
                  <path
                    d="M286 334 L292 366"
                    stroke={ACTIVE_HIGHLIGHT}
                    strokeWidth="3.5"
                  />
                  <path
                    d="M354 334 L348 366"
                    stroke={ACTIVE_HIGHLIGHT}
                    strokeWidth="3.5"
                  />
                </>
              )}

              {/* Lower Legs */}
              <path d="M280 378 L276 426 L304 426 L307 378 Z" fill={BASE_SKIN} />
              <path d="M360 378 L364 426 L336 426 L333 378 Z" fill={BASE_SKIN} />

              {/* Sneakers */}
              <path
                d="M273 424 L306 424 L310 439 L264 439 Q264 428 273 424 Z"
                fill="#FFFFFF"
              />
              <path
                d="M367 424 L334 424 L330 439 L376 439 Q376 428 367 424 Z"
                fill="#FFFFFF"
              />
              <line
                x1="264"
                y1="439"
                x2="310"
                y2="439"
                stroke="#48524C"
                strokeWidth="4"
              />
              <line
                x1="330"
                y1="439"
                x2="376"
                y2="439"
                stroke="#48524C"
                strokeWidth="4"
              />
            </g>
          </svg>
        </div>

        {/* BACK VIEW (POSTERIOR) */}
        <div className="bg-[#F5F6F3] border border-[#DCE1D8] rounded-2xl p-3 flex flex-col items-center">
          <div className="w-full flex items-center justify-between mb-1 px-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#48524C]">
              Tampak Belakang
            </span>
            <span className="text-[11px] font-mono tabular-nums text-[#626E67]">
              Posterior
            </span>
          </div>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="170 24 300 432"
            className="w-full max-w-[190px] h-auto"
            role="img"
            aria-label={`Anatomi tampak belakang untuk ${sessionLabel || "split"}`}
          >
            <ellipse cx="320" cy="442" rx="108" ry="11" fill="#E6EAE2" />

            <g
              stroke="#141916"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {/* Neck & Upper Traps */}
              <path
                d="M294 114 L272 136 L368 136 L346 114 Z"
                fill={midBackActive ? ACTIVE_FILL : BASE_SKIN}
              />
              <rect x="303" y="96" width="34" height="24" rx="10" fill={BASE_SKIN} />

              {/* Head (Back View) */}
              <ellipse cx="320" cy="68" rx="28" ry="33" fill={BASE_SKIN} />
              <path
                d="M308 46 Q318 40 328 45"
                stroke="#FFFFFF"
                strokeWidth="3"
                opacity="0.7"
                fill="none"
              />
              <path d="M292 64 C286 64 286 78 292 79" fill={BASE_SKIN} />
              <path d="M348 64 C354 64 354 78 348 79" fill={BASE_SKIN} />

              {/* Back Torso Base */}
              <path
                d="M260 136 Q320 124 380 136 L364 252 L276 252 Z"
                fill={BASE_SKIN}
              />

              {/* Mid-Back / Rhomboids */}
              <path
                d="M286 138 L354 138 L340 206 L300 206 Z"
                fill={midBackActive ? ACTIVE_FILL : BASE_SKIN}
              />

              {/* Lats (Wings) */}
              <path
                d="M266 158 C258 188 268 220 284 238 L314 232 L314 176 Z"
                fill={latsActive ? ACTIVE_FILL : BASE_SKIN}
              />
              <path
                d="M374 158 C382 188 372 220 356 238 L326 232 L326 176 Z"
                fill={latsActive ? ACTIVE_FILL : BASE_SKIN}
              />
              {latsActive && (
                <>
                  <path
                    d="M276 184 L302 216"
                    stroke={ACTIVE_HIGHLIGHT}
                    strokeWidth="4.5"
                  />
                  <path
                    d="M364 184 L338 216"
                    stroke={ACTIVE_HIGHLIGHT}
                    strokeWidth="4.5"
                  />
                </>
              )}

              {/* Spine contour */}
              <line
                x1="320"
                y1="138"
                x2="320"
                y2="246"
                stroke={midBackActive ? ACTIVE_HIGHLIGHT : "#DFAD89"}
                strokeWidth="3"
              />

              {/* Rear Deltoids */}
              <path
                d="M266 134 C244 134 234 152 240 174 C248 182 262 180 272 168 Z"
                fill={rearDeltActive ? ACTIVE_FILL : BASE_SKIN}
              />
              <path
                d="M374 134 C396 134 406 152 400 174 C392 182 378 180 368 168 Z"
                fill={rearDeltActive ? ACTIVE_FILL : BASE_SKIN}
              />

              {/* Triceps (Back of Upper Arms) */}
              <path
                d="M240 174 C228 194 230 218 240 232 L262 230 C268 212 268 192 266 174 Z"
                fill={tricepsActive ? ACTIVE_FILL : BASE_SKIN}
              />
              <path
                d="M400 174 C412 194 410 218 400 232 L378 230 C372 212 372 192 374 174 Z"
                fill={tricepsActive ? ACTIVE_FILL : BASE_SKIN}
              />

              {/* Forearms & Hands */}
              <path d="M238 232 L226 286 L246 290 L260 232 Z" fill={BASE_SKIN} />
              <path d="M402 232 L414 286 L394 290 L380 232 Z" fill={BASE_SKIN} />
              <circle cx="234" cy="298" r="11" fill={BASE_SKIN} />
              <circle cx="406" cy="298" r="11" fill={BASE_SKIN} />

              {/* Gym Shorts + Glutes */}
              <path
                d="M275 250 L365 250 L374 322 L326 322 L320 294 L314 322 L266 322 Z"
                fill={SHORTS_FILL}
              />
              <path d="M276 260 L364 260" stroke="#34403A" strokeWidth="3" />
              {glutesActive ? (
                <>
                  <path
                    d="M276 262 C272 288 282 306 318 302 L318 262 Z"
                    fill={SHORTS_ACTIVE_GLUTES}
                  />
                  <path
                    d="M364 262 C368 288 358 306 322 302 L322 262 Z"
                    fill={SHORTS_ACTIVE_GLUTES}
                  />
                </>
              ) : (
                <path d="M320 262 L320 294" stroke="#34403A" strokeWidth="2.5" />
              )}

              {/* Hamstrings (Back of Thighs) */}
              <path
                d="M269 322 C266 346 270 366 280 378 L308 378 C316 364 318 344 314 322 Z"
                fill={hamstringsActive ? ACTIVE_FILL : BASE_SKIN}
              />
              <path
                d="M371 322 C374 346 370 366 360 378 L332 378 C324 364 322 344 326 322 Z"
                fill={hamstringsActive ? ACTIVE_FILL : BASE_SKIN}
              />

              {/* Calves (Gastrocnemius) */}
              <path
                d="M280 378 C272 392 272 408 278 426 L304 426 C310 408 310 392 307 378 Z"
                fill={calvesActive ? ACTIVE_FILL : BASE_SKIN}
              />
              <path
                d="M360 378 C368 392 368 408 362 426 L336 426 C330 408 330 392 333 378 Z"
                fill={calvesActive ? ACTIVE_FILL : BASE_SKIN}
              />

              {/* Sneakers */}
              <path d="M273 424 L306 424 L310 439 L268 439 Z" fill="#FFFFFF" />
              <path d="M367 424 L334 424 L330 439 L372 439 Z" fill="#FFFFFF" />
              <line
                x1="268"
                y1="439"
                x2="310"
                y2="439"
                stroke="#48524C"
                strokeWidth="4"
              />
              <line
                x1="330"
                y1="439"
                x2="372"
                y2="439"
                stroke="#48524C"
                strokeWidth="4"
              />
            </g>
          </svg>
        </div>
      </div>

      {/* Legend & Active Region Chips */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <div className="flex items-center gap-3 text-xs text-[#48524C]">
          <span className="inline-flex items-center gap-1.5 font-medium">
            <span className="w-3 h-3 rounded-sm bg-[#C84B11] border border-[#141916]" />
            Otot Target Aktif
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-[#F0C5A4] border border-[#141916]" />
            Otot Istirahat
          </span>
        </div>
        {activeRegionLabels.length > 0 && (
          <span className="text-xs font-mono tabular-nums text-[#626E67]">
            {activeRegionLabels.length} sub-bagian otot
          </span>
        )}
      </div>

      {activeRegionLabels.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {activeRegionLabels.map((label) => (
            <span
              key={label}
              className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-[#FFF1EA] text-[#A83D0B] border border-[#F4C4AC]"
            >
              {label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
