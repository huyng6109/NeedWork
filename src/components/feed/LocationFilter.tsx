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
          <div className="flex items-center gap-1 bg-brand-50 text-brand-700 border border-brand-200 rounded-full px-3 py-1 text-xs font-medium">
            <MapPin size={12} />
            Vị trí đã bật
            <button onClick={clearLocation} className="ml-1 hover:text-brand-900">
              <X size={12} />
            </button>
          </div>
          <div className="flex gap-1">
            {RADIUS_OPTIONS.map((r) => (
              <button
                key={r}
                onClick={() => onRadiusChange(r)}
                className={cn(
                  "px-2.5 py-1 rounded-full text-xs font-medium transition-colors",
                  radius === r
                    ? "bg-brand-600 text-white"
                    : "bg-white border border-border text-muted hover:border-brand-400"
                )}
              >
                {r}km
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
