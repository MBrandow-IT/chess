"use client";

import { useEffect, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { isSoundEnabled, setSoundEnabled } from "@/lib/sound";

export function SoundToggle() {
  const [on, setOn] = useState(true);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setOn(isSoundEnabled());
    setHydrated(true);
  }, []);

  function toggle() {
    const next = !on;
    setOn(next);
    setSoundEnabled(next);
  }

  const Icon = on ? Volume2 : VolumeX;

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={on}
      aria-label={on ? "Mute sound effects" : "Enable sound effects"}
      className="focus-ring inline-flex items-center gap-1.5 rounded-md border border-black/10 bg-white px-3 py-1.5 text-xs font-medium hover:bg-black/5"
      title={on ? "Sound on (click to mute)" : "Sound off (click to enable)"}
    >
      <Icon aria-hidden className="h-4 w-4" />
      {hydrated ? (on ? "Sound on" : "Sound off") : "Sound"}
    </button>
  );
}
