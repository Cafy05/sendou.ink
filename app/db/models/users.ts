import { sql } from "../sql";
import type { User } from "../types";

const upsertStm = sql.prepare(`
  INSERT INTO
    "User" (
      "discordId",
      "discordName",
      "discordDiscriminator",
      "discordAvatar",
      "twitch",
      "twitter",
      "youtubeId"
    )
    VALUES (
      $discordId,
      $discordName,
      $discordDiscriminator,
      $discordAvatar,
      $twitch,
      $twitter,
      $youtubeId
    )
    ON CONFLICT("discordId") DO UPDATE SET
      "discordName" = excluded."discordName",
      "discordDiscriminator" = excluded."discordDiscriminator",
      "discordAvatar" = excluded."discordAvatar",
      "twitch" = excluded."twitch",
      "twitch" = excluded."twitch",
      "youtubeId" = excluded."youtubeId"
    RETURNING *
`);

export function upsert(
  input: Pick<
    User,
    | "discordId"
    | "discordName"
    | "discordDiscriminator"
    | "discordAvatar"
    | "twitch"
    | "twitter"
    | "youtubeId"
  >
) {
  return upsertStm.get(input) as User;
}

const updateProfileStm = sql.prepare(`
  UPDATE "User"
    SET "country" = $country
    WHERE "id" = $id
`);

export function updateProfile(params: Pick<User, "country" | "id">) {
  updateProfileStm.run(params);
}

const findByIdentifierStm = sql.prepare(`
  SELECT *
    FROM "User"
    WHERE "discordId" = $identifier
`);

export function findByIdentifier(identifier: string) {
  return findByIdentifierStm.get({ identifier }) as User | undefined;
}
