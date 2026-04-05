"use client";

import { useState } from "react";
import { MapPin, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { RADIUS_OPTIONS } from "@/constants";
import { cn } from "@/lib/utils";

interface LocationFilterProps {
  lat: number | null;
  lng: number | null;
  radius: number;
  onLocationChange: (lat: number | null, lng: number | null) => void;
  onRadiusChange: (radius: number) => void;
}

export function LocationFilter({
  lat,
  lng,
  radius,
  onLocationChange,
  onRadiusChange,
}: LocationFilterProps) {
  const [loading, setLoading] = useState(false);
  const active = lat !== null && lng !== null;

  function requestLocation() {
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onLocationChange(pos.coords.latitude, pos.coords.longitude);
        setLoading(false);
      },
      () => {
        setLoading(false);
      }
    );
  }

  function clearLocation() {
    onLocationChange(null, null);
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {!active ? (
        <Button
          variant="outline"
          size="sm"
          loading={loading}
          onClick={requestLocation}
          className="gap-1.5"
        >
          <MapPin size={14} />
          Lọc theo vị trí
        </Button>
      ) : (
        <>
          <div className="flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium border bg-[var(--location-chip-bg)] text-[var(--location-chip-text)] border-[var(--location-chip-border)]">
            <MapPin size={12} />
            Vị trí đã bật
            <button onClick={clearLocation} className="ml-1 opacity-80 hover:opacity-100">
              <X size={12} />
            </button>
          </div>

          <div className="flex gap-1">
            {RADIUS_OPTIONS.map((option) => (
              <button
                key={option}
                onClick={() => onRadiusChange(option)}
                className={cn(
                  "px-2.5 py-1 rounded-full text-xs font-medium transition-colors border",
                  radius === option
                    ? "bg-[var(--radius-chip-active-bg)] text-[var(--radius-chip-active-text)] border-[var(--radius-chip-active-bg)]"
                    : "bg-[var(--radius-chip-bg)] text-[var(--radius-chip-text)] border-[var(--radius-chip-border)] hover:bg-[var(--radius-chip-hover)]"
                )}
              >
                {option}km
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
