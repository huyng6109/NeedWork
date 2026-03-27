"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import type { LatLng } from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default marker icon in Next.js
import L from "leaflet";
const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

interface Location {
  lat: number;
  lng: number;
  name: string;
}

interface MapPickerProps {
  value: Location | null;
  onChange: (location: Location) => void;
}

function ClickHandler({ onPick }: { onPick: (latlng: LatLng) => void }) {
  useMapEvents({ click: (e) => onPick(e.latlng) });
  return null;
}

export default function MapPicker({ value, onChange }: MapPickerProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  async function handlePick(latlng: LatLng) {
    // Reverse geocode using Nominatim (free, no API key)
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${latlng.lat}&lon=${latlng.lng}&format=json`
      );
      const data = await res.json();
      const name =
        data.display_name?.split(",").slice(0, 3).join(", ") ??
        `${latlng.lat.toFixed(4)}, ${latlng.lng.toFixed(4)}`;
      onChange({ lat: latlng.lat, lng: latlng.lng, name });
    } catch {
      onChange({
        lat: latlng.lat,
        lng: latlng.lng,
        name: `${latlng.lat.toFixed(4)}, ${latlng.lng.toFixed(4)}`,
      });
    }
  }

  if (!mounted) return <div className="h-full bg-gray-100 animate-pulse rounded-xl" />;

  return (
    <MapContainer
      center={value ? [value.lat, value.lng] : [10.7769, 106.7009]}
      zoom={13}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ClickHandler onPick={handlePick} />
      {value && <Marker position={[value.lat, value.lng]} icon={icon} />}
    </MapContainer>
  );
}
