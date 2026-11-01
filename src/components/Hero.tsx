"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { ArrowDown } from "lucide-react";
import { CountdownTimer } from "./CountdownTimer";
import { HeroArt } from "./HeroArt";
import { IconBadgeCheck, IconCalendar, IconCheck, IconUsers, IconVideo } from "./icons";
import { heroContent } from "@/content/hero";
import type { SeasonSettings } from "@/lib/types";

interface Stats {
  participants: number;
  teams: number;
  challenges: number;
  totalSubmissions: number;
}

const FACT_ICONS = [IconBadgeCheck, IconUsers, IconCalendar, IconVideo];

export function Hero({
  season,
  initialStats,
  registrationOpen,
  onRegisterClick,
}: {
  season: SeasonSettings | null;
  initialStats: Stats;
  registrationOpen: boolean;
  onRegisterClick: () => void;
}) {
  const [stats, setStats] = useState(initialStats);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/stats", { cache: "no-store" });
        if (res.ok) setStats(await res.json());
      } catch {
        // ignore
      }
    };
    const interval = setInterval(load, 60000);
    return () => clearInterval(interval);
  }, []);

  // The numbers only appear once there are enough participants to be worth showing.
  const showStats = stats.participants >= heroContent.statsMinParticipants;
  const statCells = [
    { label: "مشارك", value: stats.participants },
    { label: "فريق", value: stats.teams },
    { label: "تحدٍّ علمي", value: stats.challenges },
    { label: "تسليم مستلَم", value: stats.totalSubmissions },
  ];

  return (
    <section id="top" className="relative overflow-hidden">
      <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 pb-12 pt-28 sm:px-6 sm:pt-32 lg:grid-cols-12 lg:gap-6 lg:px-8 lg:pb-16 lg:pt-36">
        <div className="text-center lg:col-span-7 lg:text-start">
          <div className="rise inline-flex items-center gap-2.5 rounded-full border border-line-strong bg-surface px-4 py-1.5 text-[15px]">
            <span
              className={`h-2.5 w-2.5 rounded-full ${registrationOpen ? "bg-ok" : "bg-muted"}`}
              aria-hidden
            />
            <span className="font-semibold text-ink">
              {registrationOpen ? "التسجيل مفتوح" : "التسجيل مغلق حاليًا"}
            </span>
            {season && (
              <>
                <span className="text-line-strong" aria-hidden>
                  |
                </span>
                <span className="text-muted">{season.seasonName}</span>
              </>
            )}
          </div>

          <h1
            className="rise mt-7 font-display text-[clamp(2rem,8vw,3.6rem)] font-black leading-[1.3] text-ink lg:text-[clamp(2.6rem,5.2vw,4.75rem)]"
            style={{ animationDelay: "80ms" }}
          >
            {heroContent.headlineLines.map((line, i) => (
              <span key={line} className={`block ${i === 2 ? "text-accent-display" : ""}`}>
                {line}
              </span>
            ))}
          </h1>

          {/* Phones and tablets: the drawing sits centered right under the headline */}
          <div
            className="rise mx-auto mt-5 w-[min(64vw,16rem)] sm:w-[min(46vw,20rem)] lg:hidden"
            style={{ animationDelay: "160ms" }}
          >
            <HeroArt className="w-full" />
          </div>

          <p
            className="rise mx-auto mt-6 max-w-2xl text-lg leading-9 text-muted sm:text-xl sm:leading-10 lg:mx-0 lg:mt-7"
            style={{ animationDelay: "160ms" }}
          >
            {heroContent.subtitle}
          </p>

          <div
            className="rise mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center lg:mt-9 lg:justify-start"
            style={{ animationDelay: "240ms" }}
          >
            <button
              onClick={onRegisterClick}
              disabled={!registrationOpen}
              className="btn-primary w-full px-8 py-4 text-lg sm:w-auto"
            >
              {registrationOpen ? heroContent.primaryCta : "التسجيل مغلق حاليًا"}
            </button>
            <a href="#challenges" className="btn-outline w-full px-8 py-4 text-lg sm:w-auto">
              استعرض التحديات
              <ArrowDown className="h-5 w-5" />
            </a>
          </div>

          <ul
            className="rise mt-8 flex flex-wrap justify-center gap-x-7 gap-y-3 text-[15px] font-semibold text-ink lg:mt-9 lg:justify-start"
            style={{ animationDelay: "320ms" }}
          >
            {heroContent.facts(season?.teamMaxSize).map((fact, i) => {
              const Icon = FACT_ICONS[i] ?? IconCheck;
              return (
                <li key={fact} className="flex items-center gap-2.5">
                  <Icon className="h-5 w-5 text-accent-text" />
                  {fact}
                </li>
              );
            })}
          </ul>
        </div>

        <div className="rise hidden lg:col-span-5 lg:block" style={{ animationDelay: "200ms" }}>
          <HeroArt className="w-full" />
        </div>
      </div>

      {(season || showStats) && (
        <div className="border-y border-line bg-surface2">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              {season && (
                <>
                  <p className="font-display text-xl font-extrabold text-ink">تنطلق المسابقة خلال</p>
                  <div className="w-full lg:w-[34rem]">
                    <CountdownTimer targetDate={season.countdownDate} />
                  </div>
                </>
              )}
            </div>

            {showStats && (
              <dl
                className={`grid grid-cols-2 gap-4 sm:grid-cols-4 ${
                  season ? "mt-6 border-t border-line pt-6" : ""
                }`}
              >
                {statCells.map((cell) => (
                  <div key={cell.label} className="flex flex-col-reverse">
                    <dt className="text-[15px] font-medium text-muted">{cell.label}</dt>
                    <dd className="font-mono text-3xl font-semibold tabular-nums text-ink sm:text-4xl">
                      <span
                        className="count"
                        aria-hidden="true"
                        style={{ "--target": cell.value } as CSSProperties}
                      />
                      <span className="sr-only">{cell.value}</span>
                    </dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
