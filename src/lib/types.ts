export interface Challenge {
  id: string;
  slug: string;
  title: string;
  category: string;
  description: string;
  deliverables: string;
  coverImage: string;
  pdfUrl: string;
  seasonId: string | null;
  published: boolean;
  sortOrder: number;
  teamImage: string;
  updatedAt: string;
}

export interface Resource {
  id: string;
  challengeId: string;
  title: string;
  description: string;
  url: string;
  createdAt: string;
}

export interface Student {
  id: string;
  fullName: string;
  grade: string;
  email: string;
  phone: string;
  teamStatus: string;
  teamName: string | null;
  challenge: string | null;
  role: string;
  seasonId: string | null;
  guardianConsent: boolean;
  createdAt: string;
}

export interface Person {
  id: string;
  seasonId: string;
  name: string;
  challenge: string;
  gender: "boy" | "girl";
  published: boolean;
  createdAt: string;
}

export interface Team {
  id: string;
  seasonId: string;
  name: string;
  challenge: string;
  published: boolean;
  createdAt: string;
}

export interface Submission {
  id: string;
  teamName: string;
  studentName: string;
  challenge: string | null;
  milestone: number;
  link: string;
  score: number | null;
  feedback: string | null;
  teamId: string | null;
  milestoneId: string | null;
  note: string;
  createdAt: string;
}

/** A team as the public site shows it: member names are already shortened (e.g. "محمد أ."). */
export interface PublicTeam extends Team {
  members: string[];
}

export interface TeamMember {
  id: string;
  teamId: string;
  studentId: string;
  createdAt: string;
}

/** A team as the admin sees it (includes the secret code and the private Discord link). */
export interface AdminTeam extends Team {
  code: string;
  discordLink: string;
}

export interface Milestone {
  id: string;
  seasonId: string;
  number: number;
  title: string;
  description: string;
  opensAt: string | null;
  dueAt: string | null;
  isOpen: boolean;
  resultsVisible: boolean;
  closedMessage: string;
  createdAt: string;
}

export interface SeasonSettings {
  id: string;
  applicationsOpen: boolean;
  countdownDate: string;
  seasonName: string;
  whatsappLink: string;
  challengePickOpen: boolean;
  teamLookupOpen: boolean;
  teamMinSize: number;
  teamMaxSize: number;
  isCurrent: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Certificate {
  id: string;
  studentName: string;
  teamName: string;
  badge: "gold" | "silver" | "bronze" | "completion";
  issuedAt: string;
}
