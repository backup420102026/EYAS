"use client";

import { useState } from "react";
import type { Challenge, Person, PublicTeam } from "@/lib/types";
import { useChallengeOptions } from "@/lib/challengeOptions";
import { displayName } from "@/lib/displayName";
import { SectionHeader } from "./SectionHeader";
import { Reveal } from "./Reveal";
import { PersonAvatar } from "./PersonAvatar";
import { TeamEmblem, teamBadge } from "./TeamEmblem";

const PAGE_SIZE = 48;

const TABS = [
  { key: "people", label: "المشاركون" },
  { key: "teams", label: "الفرق" },
] as const;

const firstLetter = (text: string) => Array.from(text.trim())[0] ?? "؟";

export function PeopleTeams({
  people,
  teams,
}: {
  people: Person[];
  teams: PublicTeam[];
  challenges?: Challenge[];
}) {
  const { options, label } = useChallengeOptions();
  const [tab, setTab] = useState<"people" | "teams">("people");
  const [filter, setFilter] = useState("");
  const [visible, setVisible] = useState(PAGE_SIZE);

  const peopleList = people.filter((p) => !filter || p.challenge === filter);
  const teamList = teams.filter((t) => !filter || t.challenge === filter);
  const total = tab === "people" ? peopleList.length : teamList.length;

  const switchTab = (next: "people" | "teams") => {
    setTab(next);
    setVisible(PAGE_SIZE);
  };

  return (
    <section id="teams" className="bg-surface2 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <SectionHeader
            index="04"
            eyebrow="المشاركون والفرق"
            title="أنت لست وحدك في هذه الرحلة"
            description="كل المشاركين في الموسم الحالي وفرقهم في مكان واحد."
          />
        </Reveal>

        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div
            className="inline-flex self-start rounded-xl border border-line-strong bg-surface p-1"
            role="tablist"
          >
            {TABS.map((t) => (
              <button
                key={t.key}
                role="tab"
                aria-selected={tab === t.key}
                onClick={() => switchTab(t.key)}
                className={`min-h-10 rounded-lg px-5 text-[15px] font-bold transition-colors ${
                  tab === t.key ? "bg-ink text-bg" : "text-muted hover:text-ink"
                }`}
              >
                {t.label}
                <span className="ms-2 font-mono text-[13px] opacity-70">
                  {t.key === "people" ? people.length : teams.length}
                </span>
              </button>
            ))}
          </div>

          {options.length > 1 && (
            <select
              value={filter}
              onChange={(e) => {
                setFilter(e.target.value);
                setVisible(PAGE_SIZE);
              }}
              aria-label="تصفية حسب التحدي"
              className="field w-full sm:w-72"
            >
              <option value="">كل التحديات</option>
              {options.map((o) => (
                <option key={o.slug} value={o.slug}>
                  {o.title}
                </option>
              ))}
            </select>
          )}
        </div>

        {total === 0 ? (
          <div className="rounded-2xl border border-dashed border-line-strong py-16 text-center">
            <p className="text-muted">لم تُنشر أي {tab === "people" ? "أسماء" : "فرق"} هنا بعد.</p>
          </div>
        ) : tab === "people" ? (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {peopleList.slice(0, visible).map((person) => (
              <li key={person.id} className="card flex items-center gap-3.5 p-3.5">
                <PersonAvatar
                  gender={person.gender === "girl" ? "girl" : "boy"}
                  seed={person.id}
                  size={52}
                />
                <div className="min-w-0">
                  <p className="truncate font-display text-base font-extrabold text-ink">
                    {displayName(person.name)}
                  </p>
                  <p className="mt-0.5 truncate text-[14px] text-muted">{label(person.challenge)}</p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {teamList.slice(0, visible).map((team) => {
              const badge = teamBadge(team.id);
              return (
                <li key={team.id} className="card overflow-hidden">
                  <div className="relative">
                    <TeamEmblem seed={team.id} className="block h-24 w-full" />
                    <span
                      aria-hidden
                      className="absolute -bottom-5 start-4 flex h-11 w-11 items-center justify-center rounded-xl border-[3px] border-surface font-display text-lg font-extrabold"
                      style={badge}
                    >
                      {firstLetter(team.name)}
                    </span>
                  </div>
                  <div className="px-4 pb-5 pt-8">
                    <p className="truncate font-display text-lg font-extrabold text-ink">{team.name}</p>
                    <p className="mt-1 text-[14px] leading-6 text-muted">{label(team.challenge)}</p>
                    {team.members.length > 0 && (
                      <ul className="mt-4 flex flex-wrap gap-2">
                        {team.members.map((member) => (
                          <li
                            key={member}
                            className="flex items-center gap-2 rounded-full bg-surface2 py-1 ps-1 pe-3 text-[14px] font-medium text-ink"
                          >
                            <span
                              aria-hidden
                              className="flex h-6 w-6 items-center justify-center rounded-full bg-surface text-[12px] font-bold text-ink"
                            >
                              {firstLetter(member)}
                            </span>
                            {member}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {total > visible && (
          <div className="mt-8 text-center">
            <button onClick={() => setVisible((v) => v + PAGE_SIZE)} className="btn-outline">
              عرض المزيد
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
