"use client";

import { useCallback, useEffect, useState } from "react";
import {
  LayoutDashboard,
  Users,
  Users2,
  FlaskConical,
  ClipboardCheck,
  Award,
  Settings,
  BookOpen,
  CalendarClock,
  LogOut,
  Loader2,
  Atom,
} from "lucide-react";
import type {
  Student,
  Person,
  AdminTeam,
  Milestone,
  TeamMember,
  Challenge,
  Resource,
  Submission,
  SeasonSettings,
  Certificate,
} from "@/lib/types";
import { ADMIN_STORAGE_KEY } from "@/lib/utils";
import { ChallengeOptionsProvider } from "@/lib/challengeOptions";
import { OverviewTab } from "./OverviewTab";
import { StudentsTab } from "./StudentsTab";
import { PeopleTab } from "./PeopleTab";
import { TeamsTab } from "./TeamsTab";
import { ChallengesTab } from "./ChallengesTab";
import { SubmissionsTab } from "./SubmissionsTab";
import { MilestonesTab } from "./MilestonesTab";
import { CertificatesTab } from "./CertificatesTab";
import { SeasonTab } from "./SeasonTab";
import { ResourcesTab } from "./ResourcesTab";

const TABS = [
  { id: "overview", label: "نظرة عامة", icon: LayoutDashboard },
  { id: "students", label: "الطلاب المسجّلون", icon: Users },
  { id: "people", label: "الأفراد", icon: Users2 },
  { id: "teams", label: "الفرق", icon: Users },
  { id: "challenges", label: "التحديات", icon: FlaskConical },
  { id: "resources", label: "المصادر", icon: BookOpen },
  { id: "milestones", label: "المراحل", icon: CalendarClock },
  { id: "submissions", label: "التسليمات", icon: ClipboardCheck },
  { id: "certificates", label: "الشهادات", icon: Award },
  { id: "season", label: "المواسم", icon: Settings },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function AdminDashboard({ passcode, onLogout }: { passcode: string; onLogout: () => void }) {
  const [tab, setTab] = useState<TabId>("overview");
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<Student[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [teams, setTeams] = useState<AdminTeam[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [seasons, setSeasons] = useState<SeasonSettings[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const season = seasons.find((s) => s.isCurrent) ?? seasons[0] ?? null;
  const [loadError, setLoadError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const handleLogout = useCallback(() => {
    window.sessionStorage.removeItem(ADMIN_STORAGE_KEY);
    onLogout();
  }, [onLogout]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const headers = { "x-admin-passcode": passcode };
        const get = async (url: string, withAuth: boolean) => {
          const r = await fetch(url, { headers: withAuth ? headers : undefined, cache: "no-store" });
          if (r.status === 401 || r.status === 429 || r.status === 503) throw new Error("auth");
          if (!r.ok) throw new Error("server");
          return r.json();
        };
        const [s, pe, te, tm, ch, sub, cert, se, res, ms] = await Promise.all([
          get("/api/students", true),
          get("/api/people", true),
          get("/api/teams", true),
          get("/api/team-members", true),
          get("/api/challenges", true),
          get("/api/submissions", true),
          get("/api/certificates", true),
          get("/api/season", true),
          get("/api/resources", false),
          get("/api/milestones", true),
        ]);
        if (cancelled) return;
        setStudents(s.students ?? []);
        setPeople(pe.items ?? []);
        setTeams(te.items ?? []);
        setChallenges(ch.challenges ?? []);
        setSubmissions(sub.submissions ?? []);
        setCertificates(cert.certificates ?? []);
        setSeasons(se.seasons ?? []);
        setResources(res.resources ?? []);
        setMilestones(ms.items ?? []);
        setTeamMembers(tm.items ?? []);
        setLoadError("");
      } catch (error) {
        if (cancelled) return;
        if (error instanceof Error && error.message === "auth") {
          handleLogout(); // saved passcode is no longer valid
        } else {
          setLoadError("تعذّر تحميل البيانات من الخادم. تأكد من اتصال قاعدة البيانات ثم أعد المحاولة.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [passcode, reloadKey, handleLogout]);

  return (
    <div dir="rtl" lang="ar" className="min-h-screen bg-[#0b1220] text-slate-100">
      <div className="flex min-h-screen">
        <aside className="hidden w-64 flex-shrink-0 flex-col border-l border-slate-800 bg-[#0d1526] lg:flex">
          <div className="flex items-center gap-2.5 border-b border-slate-800 px-6 py-5">
            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-cyan-300/40 bg-navy">
              <Atom className="h-4 w-4 text-cyan-300" />
            </span>
            <div>
              <p className="font-display text-sm font-extrabold text-white">EYAS Admin</p>
              <p className="text-[11px] text-slate-500">لوحة المرشدين والمشرفين</p>
            </div>
          </div>

          <nav className="flex-1 space-y-1 p-4">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                  tab === t.id
                    ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white"
                    : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
                }`}
              >
                <t.icon className="h-4 w-4" />
                {t.label}
              </button>
            ))}
          </nav>

          <div className="border-t border-slate-800 p-4">
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-red-400 hover:bg-red-500/10"
            >
              <LogOut className="h-4 w-4" />
              تسجيل الخروج
            </button>
          </div>
        </aside>

        <div className="flex-1">
          <header className="flex items-center justify-between border-b border-slate-800 bg-[#0d1526] px-5 py-4 lg:hidden">
            <div className="flex items-center gap-2">
              <Atom className="h-5 w-5 text-cyan-300" />
              <span className="font-display font-extrabold text-white">EYAS Admin</span>
            </div>
            <button onClick={handleLogout} className="text-xs font-bold text-red-400">
              خروج
            </button>
          </header>

          <div className="scrollbar-thin flex gap-2 overflow-x-auto border-b border-slate-800 bg-[#0d1526] px-4 py-3 lg:hidden">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex flex-shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-bold transition ${
                  tab === t.id ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white" : "bg-slate-900 text-slate-400"
                }`}
              >
                <t.icon className="h-3.5 w-3.5" />
                {t.label}
              </button>
            ))}
          </div>

          <main className="p-5 sm:p-8">
            <div className="mb-6">
              <h1 className="font-display text-2xl font-extrabold text-white">
                {TABS.find((t) => t.id === tab)?.label}
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                إدارة بيانات مسابقة EYAS وتحديثها مباشرة — كل التغييرات تنعكس فورًا على البوابة العامة.
              </p>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-24">
                <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
              </div>
            ) : loadError ? (
              <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-center">
                <p className="text-sm text-red-300">{loadError}</p>
                <button
                  onClick={() => {
                    setLoading(true);
                    setReloadKey((k) => k + 1);
                  }}
                  className="mt-4 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-2 text-sm font-bold text-white"
                >
                  إعادة المحاولة
                </button>
              </div>
            ) : (
              <ChallengeOptionsProvider
                options={challenges.map((c) => ({ slug: c.slug, title: c.title }))}
              >
                {tab === "overview" && (
                  <OverviewTab
                    students={students}
                    people={people}
                    teams={teams}
                    submissions={submissions}
                    certificates={certificates}
                  />
                )}
                {tab === "students" && (
                  <StudentsTab
                    passcode={passcode}
                    students={students}
                    seasons={seasons}
                    challenges={challenges}
                    people={people}
                    teams={teams}
                    members={teamMembers}
                    onStudentsChange={setStudents}
                    onPeopleChange={setPeople}
                  />
                )}
                {tab === "people" && (
                  <PeopleTab
                    passcode={passcode}
                    seasons={seasons}
                    challenges={challenges}
                    people={people}
                    onPeopleChange={setPeople}
                  />
                )}
                {tab === "teams" && (
                  <TeamsTab
                    passcode={passcode}
                    seasons={seasons}
                    challenges={challenges}
                    students={students}
                    teams={teams}
                    members={teamMembers}
                    onTeamsChange={setTeams}
                    onMembersChange={setTeamMembers}
                  />
                )}
                {tab === "challenges" && (
                  <ChallengesTab
                    passcode={passcode}
                    challenges={challenges}
                    seasons={seasons}
                    onChange={setChallenges}
                  />
                )}
                {tab === "resources" && (
                  <ResourcesTab
                    passcode={passcode}
                    challenges={challenges}
                    seasons={seasons}
                    resources={resources}
                    onChange={setResources}
                  />
                )}
                {tab === "submissions" && (
                  <SubmissionsTab
                    passcode={passcode}
                    submissions={submissions}
                    milestones={milestones}
                    onChange={setSubmissions}
                  />
                )}
                {tab === "milestones" && (
                  <MilestonesTab
                    passcode={passcode}
                    seasons={seasons}
                    milestones={milestones}
                    onChange={setMilestones}
                  />
                )}
                {tab === "certificates" && (
                  <CertificatesTab
                    passcode={passcode}
                    students={students}
                    certificates={certificates}
                    seasonName={season?.seasonName}
                    onChange={setCertificates}
                  />
                )}
                {tab === "season" && (
                  <SeasonTab passcode={passcode} seasons={seasons} onChange={setSeasons} />
                )}
              </ChallengeOptionsProvider>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
