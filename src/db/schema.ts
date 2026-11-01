import { nanoid } from "nanoid";
import {
  pgTable,
  text,
  integer,
  boolean,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

// ---------- Students (full registrations) ----------
export const students = pgTable("students", {
  id: varchar("id", { length: 21 })
    .primaryKey()
    .$defaultFn(() => nanoid()),
  fullName: text("full_name").notNull(),
  grade: text("grade").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  teamStatus: text("team_status").notNull().default("solo"), // legacy, no longer collected
  teamName: text("team_name"), // legacy, no longer collected
  challenge: text("challenge"), // challenge slug; null until the student picks one
  role: text("role").notNull().default(""), // legacy, no longer collected
  seasonId: varchar("season_id", { length: 21 }), // season the student registered for
  guardianConsent: boolean("guardian_consent").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ---------- Challenges (editable by admin) ----------
export const challenges = pgTable("challenges", {
  id: varchar("id", { length: 21 })
    .primaryKey()
    .$defaultFn(() => nanoid()),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  category: text("category").notNull(), // Environment | Energy | AI & Tech
  description: text("description").notNull(),
  deliverables: text("deliverables").notNull(), // newline separated
  coverImage: text("cover_image").notNull(),
  pdfUrl: text("pdf_url").notNull(),
  seasonId: varchar("season_id", { length: 21 }), // which season this challenge belongs to
  published: boolean("published").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  teamImage: text("team_image").notNull().default("1"), // '1' | '2' | '3' preset team picture
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ---------- Resources (links/files per challenge) ----------
export const resources = pgTable("resources", {
  id: varchar("id", { length: 21 })
    .primaryKey()
    .$defaultFn(() => nanoid()),
  challengeId: varchar("challenge_id", { length: 21 })
    .notNull()
    .references(() => challenges.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  url: text("url").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ---------- Milestone submissions ----------
export const submissions = pgTable("submissions", {
  id: varchar("id", { length: 21 })
    .primaryKey()
    .$defaultFn(() => nanoid()),
  teamName: text("team_name").notNull(),
  studentName: text("student_name").notNull(),
  challenge: text("challenge"),
  milestone: integer("milestone").notNull(), // 1 | 2 | 3
  link: text("link").notNull(),
  score: integer("score"),
  feedback: text("feedback"),
  teamId: varchar("team_id", { length: 21 }), // set for submissions made through the team portal
  milestoneId: varchar("milestone_id", { length: 21 }),
  note: text("note").notNull().default(""),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ---------- Milestones (the deliverable stages of a season) ----------
export const milestones = pgTable("milestones", {
  id: varchar("id", { length: 21 })
    .primaryKey()
    .$defaultFn(() => nanoid()),
  seasonId: varchar("season_id", { length: 21 }).notNull(),
  number: integer("number").notNull().default(1), // display order
  title: text("title").notNull(),
  description: text("description").notNull().default(""), // shown to teams once the stage opens
  opensAt: timestamp("opens_at"), // details become visible from here (null = already visible)
  dueAt: timestamp("due_at"), // deadline (null = no deadline)
  isOpen: boolean("is_open").notNull().default(true), // manual lock
  resultsVisible: boolean("results_visible").notNull().default(false), // show scores/feedback to teams
  closedMessage: text("closed_message").notNull().default(""), // optional message teams see when the stage is closed
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ---------- Seasons (one row per season, exactly one is current) ----------
export const seasonSettings = pgTable("season_settings", {
  id: varchar("id", { length: 21 })
    .primaryKey()
    .$defaultFn(() => nanoid()),
  applicationsOpen: boolean("applications_open").notNull().default(true),
  countdownDate: timestamp("countdown_date").notNull(),
  seasonName: text("season_name").notNull().default("Season 1"),
  whatsappLink: text("whatsapp_link").notNull().default(""), // shown to students after they register
  challengePickOpen: boolean("challenge_pick_open").notNull().default(false), // "choose your challenge" form open?
  teamLookupOpen: boolean("team_lookup_open").notNull().default(false), // "find your team" form open?
  teamMinSize: integer("team_min_size").notNull().default(1), // smallest sensible team (editable in the admin)
  teamMaxSize: integer("team_max_size").notNull().default(4), // largest team the admin can build (editable in the admin)
  isCurrent: boolean("is_current").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ---------- Certificates generated by mentors ----------
export const certificates = pgTable("certificates", {
  id: varchar("id", { length: 21 })
    .primaryKey()
    .$defaultFn(() => nanoid()),
  studentName: text("student_name").notNull(),
  teamName: text("team_name").notNull(),
  badge: text("badge").notNull(), // gold | silver | bronze | completion
  issuedAt: timestamp("issued_at").notNull().defaultNow(),
});

// ---------- Uploaded files (challenge covers, PDFs) stored in the database ----------
export const uploads = pgTable("uploads", {
  id: varchar("id", { length: 21 })
    .primaryKey()
    .$defaultFn(() => nanoid()),
  fileName: text("file_name").notNull(),
  mimeType: text("mime_type").notNull(),
  size: integer("size").notNull(),
  data: text("data").notNull(), // base64
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ---------- Public participants list (added by the admin, shown after "publish") ----------
export const people = pgTable("people", {
  id: varchar("id", { length: 21 })
    .primaryKey()
    .$defaultFn(() => nanoid()),
  seasonId: varchar("season_id", { length: 21 }).notNull(),
  name: text("name").notNull(),
  challenge: text("challenge").notNull(), // challenge slug
  gender: text("gender").notNull().default("boy"), // 'boy' | 'girl' -> which fixed avatar is shown
  published: boolean("published").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ---------- Public teams list (name + challenge only) ----------
export const teams = pgTable("teams", {
  id: varchar("id", { length: 21 })
    .primaryKey()
    .$defaultFn(() => nanoid()),
  seasonId: varchar("season_id", { length: 21 }).notNull(),
  name: text("name").notNull(),
  challenge: text("challenge").notNull(), // challenge slug (its team picture comes from the challenge)
  code: text("code").notNull().default(""), // secret team code used on the team portal (never public)
  discordLink: text("discord_link").notNull().default(""), // private channel invite (never public)
  published: boolean("published").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ---------- Team members (who is in which team; a student can only be in ONE team) ----------
export const teamMembers = pgTable("team_members", {
  id: varchar("id", { length: 21 })
    .primaryKey()
    .$defaultFn(() => nanoid()),
  teamId: varchar("team_id", { length: 21 })
    .notNull()
    .references(() => teams.id, { onDelete: "cascade" }),
  studentId: varchar("student_id", { length: 21 })
    .notNull()
    .unique()
    .references(() => students.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
