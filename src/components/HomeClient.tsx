"use client";

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { ThemeProvider } from "./ThemeProvider";
import { Navbar } from "./Navbar";
import { Hero } from "./Hero";
import { HowItWorks } from "./HowItWorks";
import { ChallengeHub } from "./ChallengeHub";
import { Roadmap } from "./Roadmap";
import { Awards } from "./Awards";
import { PeopleTeams } from "./PeopleTeams";
import { ChallengePick } from "./ChallengePick";
import { FindTeam } from "./FindTeam";
import { TeamPortal } from "./TeamPortal";
import { CtaBand } from "./CtaBand";
import { Footer } from "./Footer";
import { RegistrationModal } from "./RegistrationModal";
import type { Challenge, Person, PublicTeam, Resource, SeasonSettings } from "@/lib/types";
import { ChallengeOptionsProvider } from "@/lib/challengeOptions";

export function HomeClient({
  challenges,
  resources,
  people,
  teams,
  season,
  stats,
}: {
  challenges: Challenge[];
  resources: Resource[];
  people: Person[];
  teams: PublicTeam[];
  season: SeasonSettings | null;
  stats: {
    participants: number;
    teams: number;
    challenges: number;
    totalSubmissions: number;
  };
}) {
  const [registerOpen, setRegisterOpen] = useState(false);
  const registrationOpen = season ? season.applicationsOpen : true;
  const openRegistration = () => {
    if (registrationOpen) setRegisterOpen(true);
  };

  const options = challenges.map((c) => ({ slug: c.slug, title: c.title }));

  return (
    <ThemeProvider>
      <ChallengeOptionsProvider options={options}>
      <Navbar registrationOpen={registrationOpen} onRegisterClick={openRegistration} />
      <main>
        <Hero
          season={season}
          initialStats={stats}
          registrationOpen={registrationOpen}
          onRegisterClick={openRegistration}
        />
        <HowItWorks teamMax={season?.teamMaxSize} />
        <ChallengeHub challenges={challenges} resources={resources} />
        {season?.challengePickOpen && <ChallengePick challenges={challenges} />}
        <Roadmap />
        <Awards />
        {season?.teamLookupOpen && <FindTeam />}
        <PeopleTeams people={people} teams={teams} challenges={challenges} />
        <TeamPortal />
        <CtaBand registrationOpen={registrationOpen} onRegisterClick={openRegistration} />
      </main>
      <Footer />
      <AnimatePresence>
        {registerOpen && (
          <RegistrationModal
            seasonName={season?.seasonName}
            onClose={() => setRegisterOpen(false)}
          />
        )}
      </AnimatePresence>
      </ChallengeOptionsProvider>
    </ThemeProvider>
  );
}
