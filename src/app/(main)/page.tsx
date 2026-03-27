"use client";

import { useState } from "react";
import { FeedTabs } from "@/components/feed/FeedTabs";
import { FeedList } from "@/components/feed/FeedList";
import { LocationFilter } from "@/components/feed/LocationFilter";
import type { PostType } from "@/types";
import { RADIUS_OPTIONS } from "@/constants";

export default function HomePage() {
  const [tab, setTab] = useState<PostType>("job_offer");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [radius, setRadius] = useState<number>(RADIUS_OPTIONS[1]); // 10km default

  function handleLocationChange(newLat: number | null, newLng: number | null) {
    setLat(newLat);
    setLng(newLng);
  }

  return (
    <div className="space-y-4">
      <FeedTabs active={tab} onChange={setTab} />

      {tab === "job_offer" && (
        <LocationFilter
          lat={lat}
          lng={lng}
          radius={radius}
          onLocationChange={handleLocationChange}
          onRadiusChange={setRadius}
        />
      )}

      <FeedList type={tab} lat={lat} lng={lng} radius={radius} />
    </div>
  );
}
