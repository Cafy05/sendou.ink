import type { Ability } from "~/modules/in-game-lists";
import type allTags from "../routes/calendar/tags.json";

export interface User {
  id: number;
  discordId: string;
  discordName: string;
  discordDiscriminator: string;
  discordAvatar: string | null;
  twitch: string | null;
  twitter: string | null;
  youtubeId: string | null;
  bio: string | null;
  country: string | null;
  patronTier: number | null;
  patronSince: number | null;
}

/** User table after joined with PlusTier table */
export interface UserWithPlusTier extends User {
  plusTier: PlusTier["tier"] | null;
}

export interface PlusSuggestion {
  id: number;
  text: string;
  authorId: number;
  suggestedId: number;
  month: number;
  year: number;
  tier: number;
  createdAt: number;
}

export interface PlusVote {
  month: number;
  year: number;
  tier: number;
  authorId: number;
  votedId: number;
  score: number;
  validAfter: number;
}

export interface PlusVotingResult {
  votedId: number;
  tier: number;
  score: number;
  month: number;
  year: number;
  wasSuggested: number;
  passedVoting: number;
}

export interface PlusTier {
  userId: number;
  tier: number;
}

export interface Badge {
  id: number;
  code: string;
  displayName: string;
  hue?: number;
}

/** View that is union of TournamentBadgeOwner and Patreon badges */
export interface BadgeOwner {
  badgeId: number;
  userId: number;
}

export interface TournamentBadgeOwner {
  badgeId: number;
  userId: number;
}

export interface BadgeManager {
  badgeId: number;
  userId: number;
}

export interface CalendarEvent {
  id: number;
  name: string;
  authorId: number;
  tags: string | null;
  description: string | null;
  discordInviteCode: string | null;
  // generated column
  discordUrl: string | null;
  bracketUrl: string;
  participantCount: number | null;
}

export type CalendarEventTag = keyof typeof allTags;

export interface CalendarEventDate {
  id: number;
  eventId: number;
  startTime: number;
}

export interface CalendarEventResultTeam {
  id: number;
  eventId: number;
  name: string;
  placement: number;
}

export interface CalendarEventResultPlayer {
  teamId: number;
  userId: number | null;
  name: string | null;
}

export interface CalendarEventBadge {
  eventId: number;
  badgeId: number;
}

export interface Build {
  id: number;
  ownerId: number;
  title: string;
  description: string | null;
  modes: string | null;
  headGearSplId: number;
  clothesGearSplId: number;
  shoesGearSplId: number;
  updatedAt: number;
}

export interface BuildWeapon {
  buildId: number;
  weaponSplId: number;
}

export interface BuildAbility {
  buildId: number;
  gearType: "HEAD" | "CLOTHES" | "SHOES";
  ability: Ability;
  slotIndex: 0 | 1 | 2 | 3;
}
