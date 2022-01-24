import { Mode } from ".prisma/client";

export const stages = [
  "The Reef",
  "Musselforge Fitness",
  "Starfish Mainstage",
  "Humpback Pump Track",
  "Inkblot Art Academy",
  "Sturgeon Shipyard",
  "Moray Towers",
  "Port Mackerel",
  "Manta Maria",
  "Kelp Dome",
  "Snapper Canal",
  "Blackbelly Skatepark",
  "MakoMart",
  "Walleye Warehouse",
  "Shellendorf Institute",
  "Arowana Mall",
  "Goby Arena",
  "Piranha Pit",
  "Camp Triggerfish",
  "Wahoo World",
  "New Albacore Hotel",
  "Ancho-V Games",
  "Skipper Pavilion",
] as const;

export const modesShort: readonly Mode[] = [
  "TW",
  "SZ",
  "TC",
  "RM",
  "CB",
] as const;
export const modesShortToLong: Record<Mode, string> = {
  TW: "Turf War",
  SZ: "Splat Zones",
  TC: "Tower Control",
  RM: "Rainmaker",
  CB: "Clam Blitz",
} as const;

export const navItems = [
  {
    title: "builds",
    items: ["browse", "gear", "analyzer"],
  },
  {
    title: "play",
    items: ["calendar", "battle", "Rankings"],
  },
  {
    title: "tools",
    items: ["planner", "rotations", "top 500"],
  },
  {
    title: "misc",
    items: ["badges", "links"],
  },
] as const;

export const DISCORD_URL = "https://discord.gg/sendou";

export const ADMIN_TEST_UUID = "846e12eb-d373-4002-a0c3-e23077e1c88c";
export const ADMIN_TEST_DISCORD_ID = "79237403620945920";
export const ADMIN_TEST_AVATAR = "fcfd65a3bea598905abb9ca25296816b";
export const NZAP_TEST_UUID = "fab649fe-3421-46e9-88cf-d10aa2153821";
export const NZAP_TEST_DISCORD_ID = "455039198672453645";
export const NZAP_TEST_AVATAR = "f809176af93132c3db5f0a5019e96339";

export const ROOM_PASS_LENGTH = 4;
export const TOURNAMENT_TEAM_ROSTER_MIN_SIZE = 4;
export const TOURNAMENT_TEAM_ROSTER_MAX_SIZE = 6;
/** How many minutes before the start of the tournament check-in closes */
export const TOURNAMENT_CHECK_IN_CLOSING_MINUTES_FROM_START = 10;
export const BEST_OF_OPTIONS = [3, 5, 7, 9] as const;

export const checkInClosesDate = (startTime: string): Date => {
  return new Date(new Date(startTime).getTime() - 1000 * 10);
};
