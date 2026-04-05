"use client";

import { useEffect, useRef, useState } from "react";
import { MapContainer, Marker, useMap, useMapEvents } from "react-leaflet";
import { MapPin, Search } from "lucide-react";
import type { LatLng } from "leaflet";
import "leaflet/dist/leaflet.css";
import "maplibre-gl/dist/maplibre-gl.css";
import "maplibre-gl";
import "@maplibre/maplibre-gl-leaflet";

import L from "leaflet";

const markerIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const DEFAULT_CENTER: [number, number] = [10.7769, 106.7009];
const DEFAULT_BIAS = `${DEFAULT_CENTER[1]},${DEFAULT_CENTER[0]}`;
const OPEN_FREE_MAP_STYLE_URL = "https://tiles.openfreemap.org/styles/liberty";

interface Location {
  lat: number;
  lng: number;
  name: string;
}

interface SearchResult {
  place_id?: string | number;
  formatted: string;
  lat: number;
  lon: number;
}

interface GeoapifyResponse {
  results?: SearchResult[];
}

interface MapPickerProps {
  notice?: string;
  value: Location | null;
  onChange: (location: Location) => void;
}

function formatCoordinateLabel(lat: number, lng: number) {
  return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
}

function OpenFreeMapLayer() {
  const map = useMap();

  useEffect(() => {
    const maplibreLayer = L.maplibreGL({
      style: OPEN_FREE_MAP_STYLE_URL,
      interactive: false,
      attributionControl: {
        customAttribution:
          '&copy; <a href="https://openfreemap.org/" target="_blank" rel="noreferrer">OpenFreeMap</a> ' +
          '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>',
      },
    });

    maplibreLayer.addTo(map);
    maplibreLayer.getContainer().style.pointerEvents = "none";
    maplibreLayer.getCanvas().style.pointerEvents = "none";
    map.invalidateSize();

    return () => {
      map.removeLayer(maplibreLayer);
    };
  }, [map]);

  return null;
}

function ClickHandler({ onPick }: { onPick: (latlng: LatLng) => void }) {
  useMapEvents({ click: (event) => onPick(event.latlng) });
  return null;
}

function MapViewport({ value }: { value: Location | null }) {
  const map = useMap();

  useEffect(() => {
    if (!value) {
      return;
    }

    map.flyTo([value.lat, value.lng], 15, { duration: 0.6 });
  }, [map, value]);

  return null;
}

export default function MapPicker({ notice, value, onChange }: MapPickerProps) {
  const [mounted, setMounted] = useState(false);
  const [query, setQuery] = useState(value?.name ?? "");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [hasCompletedSearch, setHasCompletedSearch] = useState(false);
  const [queryEditedByUser, setQueryEditedByUser] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const suppressNextSearchRef = useRef(false);

  const geoapifyApiKey = process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY ?? "";
  const searchEnabled = Boolean(geoapifyApiKey);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (value?.name) {
      setQuery(value.name);
      setHasCompletedSearch(false);
      setQueryEditedByUser(false);
    }
  }, [value?.name]);

  useEffect(() => {
    if (!searchEnabled || query.trim().length < 3) {
      setResults([]);
      setSearching(false);
      setHasCompletedSearch(false);
      return;
    }

    if (suppressNextSearchRef.current) {
      suppressNextSearchRef.current = false;
      setResults([]);
      setSearching(false);
      setHasCompletedSearch(false);
      return;
    }

    const controller = new AbortController();
    setSearching(true);
    setHasCompletedSearch(false);
    const timeoutId = setTimeout(async () => {
      try {
        setErrorMessage(null);

        const bias = value ? `${value.lng},${value.lat}` : DEFAULT_BIAS;
        const url = new URL("https://api.geoapify.com/v1/geocode/autocomplete");
        url.searchParams.set("text", query.trim());
        url.searchParams.set("lang", "vi");
        url.searchParams.set("limit", "5");
        url.searchParams.set("format", "json");
        url.searchParams.set("filter", "countrycode:vn");
        url.searchParams.set("bias", `proximity:${bias}`);
        url.searchParams.set("apiKey", geoapifyApiKey);

        const response = await fetch(url.toString(), {
          signal: controller.signal,
          headers: {
            Accept: "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("Geoapify autocomplete request failed.");
        }

        const data = (await response.json()) as GeoapifyResponse;
        setResults(data.results ?? []);
        setHasCompletedSearch(true);
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          setResults([]);
          setHasCompletedSearch(true);
          setErrorMessage("Không thể tìm địa chỉ lúc này.");
        }
      } finally {
        setSearching(false);
      }
    }, 350);

    return () => {
      controller.abort();
      clearTimeout(timeoutId);
    };
  }, [geoapifyApiKey, query, searchEnabled, value]);

  async function reverseGeocode(latlng: LatLng) {
    const fallback = formatCoordinateLabel(latlng.lat, latlng.lng);

    if (!searchEnabled) {
      return fallback;
    }

    try {
      const url = new URL("https://api.geoapify.com/v1/geocode/reverse");
      url.searchParams.set("lat", String(latlng.lat));
      url.searchParams.set("lon", String(latlng.lng));
      url.searchParams.set("lang", "vi");
      url.searchParams.set("format", "json");
      url.searchParams.set("apiKey", geoapifyApiKey);

      const response = await fetch(url.toString(), {
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Geoapify reverse geocoding request failed.");
      }

      const data = (await response.json()) as GeoapifyResponse;
      return data.results?.[0]?.formatted ?? fallback;
    } catch {
      return fallback;
    }
  }

  async function handlePick(latlng: LatLng) {
    const name = await reverseGeocode(latlng);

    suppressNextSearchRef.current = true;
    setQueryEditedByUser(false);
    setHasCompletedSearch(false);
    onChange({ lat: latlng.lat, lng: latlng.lng, name });
    setQuery(name);
    setResults([]);
    setErrorMessage(null);
  }

  function handleSelectResult(result: SearchResult) {
    const selectedLocation = {
      lat: Number(result.lat),
      lng: Number(result.lon),
      name: result.formatted,
    };

    suppressNextSearchRef.current = true;
    setQueryEditedByUser(false);
    setHasCompletedSearch(false);
    onChange(selectedLocation);
    setQuery(selectedLocation.name);
    setResults([]);
    setErrorMessage(null);
  }

  if (!mounted) {
    return <div className="h-full animate-pulse rounded-xl bg-gray-100" />;
  }

  return (
    <div className="flex h-full flex-col bg-[var(--card-bg)]">
      <div className="space-y-2 p-3 pb-0">
        {notice && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            {notice}
          </div>
        )}

        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 theme-text-muted"
          />
          <input
            value={query}
            onChange={(event) => {
              suppressNextSearchRef.current = false;
              setQueryEditedByUser(true);
              setHasCompletedSearch(false);
              setQuery(event.target.value);
              setErrorMessage(null);
            }}
            placeholder={
              searchEnabled
                ? "Nhập địa chỉ để tìm trên bản đồ..."
                : "Thêm NEXT_PUBLIC_GEOAPIFY_API_KEY để bật bản đồ..."
            }
            disabled={!searchEnabled}
            className="w-full rounded-lg border border-border theme-input py-2 pl-10 pr-3 text-sm theme-text placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:cursor-not-allowed disabled:opacity-60"
          />
        </div>

        {searching && <div className="text-xs theme-text-muted">Đang tìm địa chỉ...</div>}

        {!searching && results.length > 0 && (
          <div className="max-h-44 overflow-y-auto rounded-xl border border-border bg-[var(--card-bg)]">
            {results.map((result, index) => (
              <button
                key={String(result.place_id ?? `${result.lat}-${result.lon}-${index}`)}
                type="button"
                onClick={() => handleSelectResult(result)}
                className="w-full border-b border-border px-3 py-2 text-left text-sm theme-text hover:bg-[var(--button-outline-hover)] last:border-b-0"
              >
                <span className="inline-flex items-start gap-2">
                  <MapPin size={14} className="mt-0.5 shrink-0 theme-text-muted" />
                  <span className="line-clamp-2">{result.formatted}</span>
                </span>
              </button>
            ))}
          </div>
        )}

        {!searching &&
          searchEnabled &&
          queryEditedByUser &&
          hasCompletedSearch &&
          query.trim().length >= 3 &&
          results.length === 0 &&
          !errorMessage && (
            <div className="text-xs theme-text-muted">Không tìm thấy địa chỉ phù hợp.</div>
          )}

        {errorMessage && <div className="text-xs text-red-500">{errorMessage}</div>}
      </div>

      <div className="min-h-0 flex-1 p-3">
        {!searchEnabled ? (
          <div className="flex h-full items-center justify-center rounded-xl border border-border bg-[var(--card-bg)] px-4 text-center text-sm theme-text-muted">
            Thêm `NEXT_PUBLIC_GEOAPIFY_API_KEY` để hiển thị bản đồ và tìm kiếm địa chỉ.
          </div>
        ) : (
          <div className="h-full overflow-hidden rounded-xl border border-border">
            <MapContainer
              center={value ? [value.lat, value.lng] : DEFAULT_CENTER}
              zoom={13}
              minZoom={1}
              style={{ height: "100%", width: "100%" }}
            >
              <OpenFreeMapLayer />
              <ClickHandler onPick={handlePick} />
              <MapViewport value={value} />
              {value && <Marker position={[value.lat, value.lng]} icon={markerIcon} />}
            </MapContainer>
          </div>
        )}
      </div>
    </div>
  );
}
