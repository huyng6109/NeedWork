"use client";

import { useDeferredValue, useState } from "react";
import { FeedTabs } from "@/components/feed/FeedTabs";
import { FeedList } from "@/components/feed/FeedList";
import { LocationFilter } from "@/components/feed/LocationFilter";
import { CreatePostPrompt } from "@/components/feed/CreatePostPrompt";
import type { PostType } from "@/types";
import { RADIUS_OPTIONS } from "@/constants";

export default function HomePage() {
  const [tab, setTab] = useState<PostType>("job_offer");
  const [search, setSearch] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [radius, setRadius] = useState<number>(RADIUS_OPTIONS[1]); // 10km default
  const deferredSearch = useDeferredValue(search);

  function handleLocationChange(newLat: number | null, newLng: number | null) {
    setLat(newLat);
    setLng(newLng);
  }

  return (
    <div className="space-y-4">
      <CreatePostPrompt searchValue={search} onSearchChange={setSearch} />

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

      <FeedList
        type={tab}
        search={deferredSearch}
        lat={lat}
        lng={lng}
        radius={radius}
      />
    </div>
  );
}
