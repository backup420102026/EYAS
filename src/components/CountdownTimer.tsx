"use client";

import { useEffect, useState } from "react";

function getTimeLeft(target: Date) {
  const diff = Math.max(0, target.getTime() - Date.now());
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);
  return { days, hours, minutes, seconds, finished: diff <= 0 };
}

type TimeLeft = ReturnType<typeof getTimeLeft>;

export function CountdownTimer({ targetDate }: { targetDate: string }) {
  // null until mounted: the server and the first client render match (no hydration mismatch).
  const [time, setTime] = useState<TimeLeft | null>(null);

  useEffect(() => {
    const target = new Date(targetDate);
    const tick = () => setTime(getTimeLeft(target));
    const first = setTimeout(tick, 0);
    const interval = setInterval(tick, 1000);
    return () => {
      clearTimeout(first);
      clearInterval(interval);
    };
  }, [targetDate]);

  if (time?.finished) {
    return <p className="font-display text-2xl font-extrabold text-accent-display">انطلقت المسابقة</p>;
  }

  const units = [
    { label: "يوم", value: time?.days },
    { label: "ساعة", value: time?.hours },
    { label: "دقيقة", value: time?.minutes },
    { label: "ثانية", value: time?.seconds },
  ];

  return (
    <div className="grid grid-cols-4 gap-2 sm:gap-3" role="timer" aria-label="العد التنازلي لانطلاق المسابقة">
      {units.map((unit) => (
        <div
          key={unit.label}
          className="rounded-2xl border border-line bg-surface px-2 py-3 text-center shadow-sm sm:py-4"
        >
          <div className="font-mono text-3xl font-semibold tabular-nums leading-none text-ink sm:text-4xl">
            {unit.value === undefined ? "--" : String(unit.value).padStart(2, "0")}
          </div>
          <div className="mt-2 text-sm font-medium text-muted">{unit.label}</div>
        </div>
      ))}
    </div>
  );
}
