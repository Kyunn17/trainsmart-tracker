"use client";

import { useState } from "react";
import Image from "next/image";
import { Dumbbell } from "lucide-react";

interface ExerciseThumbnailProps {
  src?: string | null;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
}

export default function ExerciseThumbnail({
  src,
  alt,
  className = "",
  sizes = "(max-width: 640px) 100vw, 300px",
  priority = false,
}: ExerciseThumbnailProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return (
      <div
        className={`relative flex flex-col items-center justify-center bg-[#ECEFE9] text-[#626E67] border border-[#DCE1D8] overflow-hidden ${className}`}
        role="img"
        aria-label={alt}
      >
        <Dumbbell className="w-7 h-7 mb-1 text-[#626E67]" />
        <span className="text-xs font-medium text-[#626E67]">
          Foto belum tersedia
        </span>
      </div>
    );
  }

  const isSvg = src.toLowerCase().endsWith(".svg");

  return (
    <div
      className={`relative ${
        isSvg ? "bg-[#F5F6F3]" : "bg-[#ECEFE9]"
      } overflow-hidden border border-[#DCE1D8] ${className}`}
    >
      {!isLoaded && (
        <div
          className="absolute inset-0 bg-[#ECEFE9] animate-pulse"
          aria-hidden="true"
        />
      )}
      <Image
        src={src}
        alt={alt}
        fill
        unoptimized={isSvg}
        sizes={sizes}
        loading={priority ? undefined : "lazy"}
        priority={priority}
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
        className={`${
          isSvg ? "object-contain" : "object-cover"
        } transition-opacity duration-200 ${
          isLoaded ? "opacity-100" : "opacity-0"
        }`}
      />
    </div>
  );
}
