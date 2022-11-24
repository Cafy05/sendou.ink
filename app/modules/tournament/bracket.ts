import clone from "just-clone";
import invariant from "tiny-invariant";
import { v4 as uuidv4 } from "uuid";
import { TOURNAMENT } from "~/constants";
import type { BracketType, TeamOrder, TournamentRoundForDB } from "~/db/types";
import { eliminationBracket } from "./algorithms";
import type {
  BestOf,
  Bracket,
  EliminationBracket,
  EliminationBracketSide,
  Match,
  TournamentTeamWithMembers,
} from "./types";

export function participantCountToRoundsInfo(
  bracket: Bracket
): EliminationBracket<
  {
    name: string;
    bestOf: BestOf;
  }[]
> {
  const roundNames = getRoundNames(bracket);
  const roundsDefaultBestOf = getRoundsDefaultBestOf(bracket);

  return {
    winners: roundNames.winners.map((roundName, i) => {
      const bestOf = roundsDefaultBestOf.winners[i];
      invariant(bestOf, "bestOf undefined in winners");
      return {
        name: roundName,
        bestOf,
      };
    }),
    losers: roundNames.losers.map((roundName, i) => {
      const bestOf = roundsDefaultBestOf.losers[i];
      invariant(bestOf, "bestOf undefined in losers");
      return {
        name: roundName,
        bestOf,
      };
    }),
  };
}

// xxx: move to constants
const WINNERS_DEFAULT = 5;
const WINNERS_FIRST_TWO_DEFAULT = 3;
const GRAND_FINALS_DEFAULT = 7;
const GRAND_FINALS_RESET_DEFAULT = 7;
const LOSERS_DEFAULT = 3;
const LOSERS_FINALS_DEFAULT = 5;

export function getRoundsDefaultBestOf(
  bracket: Bracket
): EliminationBracket<BestOf[]> {
  const { winners: winnersRoundCount, losers: losersRoundCount } =
    countRounds(bracket);

  return {
    winners: new Array(winnersRoundCount).fill(null).map((_, i) => {
      const isSE = losersRoundCount === 0;
      if (i === 0) return WINNERS_FIRST_TWO_DEFAULT;
      if (i === 1) return WINNERS_FIRST_TWO_DEFAULT;
      if (i === winnersRoundCount - 2 + Number(isSE)) {
        return GRAND_FINALS_DEFAULT;
      }
      if (i === winnersRoundCount - 1) return GRAND_FINALS_RESET_DEFAULT;
      return WINNERS_DEFAULT;
    }),
    losers: new Array(losersRoundCount)
      .fill(null)
      .map((_, i) =>
        i === losersRoundCount - 1 ? LOSERS_FINALS_DEFAULT : LOSERS_DEFAULT
      ),
  };
}

export function winnersRoundNames(count: number, isSE: boolean) {
  return new Array(count).fill(null).map((_, i) => {
    if (i === count - 4 + Number(isSE)) {
      return "Winners' Semifinals";
    }
    if (i === count - 3 + Number(isSE)) return "Winners' Finals";
    if (i === count - 2 + Number(isSE)) return "Grand Finals";
    if (!isSE && i === count - 1) return "Bracket Reset";
    return `Winners' Round ${i + 1}`;
  });
}

export function losersRoundNames(count: number) {
  return new Array(count)
    .fill(null)
    .map((_, i) =>
      i === count - 1 ? "Losers' Finals" : `Losers' Round ${i + 1}`
    );
}

export function getRoundNames(bracket: Bracket): EliminationBracket<string[]> {
  const { winners: winnersRoundCount, losers: losersRoundCount } =
    countRounds(bracket);

  return {
    winners: winnersRoundNames(winnersRoundCount, losersRoundCount === 0),
    losers: losersRoundNames(losersRoundCount),
  };
}

/** Returns round name (e.g. "Winners' Round 1") from positions
 *
 * @param position Position of the match to get the name for
 * @param allPositions All positions of matches in the bracket. Positive integers are winners and negative losers.
 *
 */
export function getRoundNameByPositions(
  position: number,
  allPositions: number[]
): string {
  const winnersRoundCount = allPositions.reduce(
    (sum, pos) => (pos > 0 ? 1 : 0) + sum,
    0
  );
  const losersRoundCount = allPositions.reduce(
    (sum, pos) => (pos < 0 ? 1 : 0) + sum,
    0
  );

  const allRoundNames = {
    winners: winnersRoundNames(winnersRoundCount, losersRoundCount === 0),
    losers: losersRoundNames(losersRoundCount),
  };

  const result = (() => {
    const index = Math.abs(position) - 1;
    if (position > 0) return allRoundNames.winners[index];

    return allRoundNames.losers[index];
  })();
  invariant(result, "No round name found");

  return result;
}

export function countRounds(
  bracket: Bracket,
  skipFirstRoundLosersIfNotPlayed = true
): EliminationBracket<number> {
  const isDE = bracket.losers.length > 0;
  let winners = isDE ? 2 : 0;

  for (let i = bracket.participantsWithByesCount; i > 1; i /= 2) {
    winners++;
  }

  if (!isDE) return { winners, losers: 0 };

  const losersMatchIds = new Set(bracket.losers.map((match) => match.id));
  let losers = 0;
  let losersMatch = bracket.losers[0];

  while (true) {
    losers++;
    const match1 = losersMatch?.winnerDestinationMatch;
    const match2 = losersMatch?.winnerDestinationMatch;
    if (match1 && losersMatchIds.has(match1.id)) {
      losersMatch = match1;
      continue;
    } else if (match2 && losersMatchIds.has(match2.id)) {
      losersMatch = match2;
      continue;
    }

    break;
  }

  let matchesWithByes = 0;
  let matchesWithOpponent = 0;

  for (const match of bracket.winners) {
    if (!match.upperTeam) break;
    if (match.upperTeam === "BYE" || match.lowerTeam === "BYE") {
      matchesWithByes++;
      continue;
    }

    matchesWithOpponent++;
  }

  // First round of losers is not played if certain amount of byes
  if (
    skipFirstRoundLosersIfNotPlayed &&
    matchesWithByes &&
    matchesWithByes >= matchesWithOpponent
  ) {
    losers--;
  }

  return { winners, losers };
}

/** Resolve collection of brackets to string that can be shown to user */
export function resolveTournamentFormatString(
  brackets: { type: BracketType }[]
) {
  invariant(brackets[0], "no brackets");
  return brackets[0].type === "DE"
    ? "Double Elimination"
    : "Single Elimination";
}

export function countParticipants(teams: Array<TournamentTeamWithMembers>) {
  return teams.reduce((acc, team) => {
    if (!team.checkedInAt) return acc;
    invariant(
      team.members.length < TOURNAMENT.TEAM_MIN_MEMBERS_FOR_FULL,
      `Team with id ${team.id} has too small roster: ${team.members.length}`
    );

    return acc + 1;
  }, 0);
}

export function tournamentRoundsForDB({
  bracketType,
  participantsSeeded,
}: {
  bracketType: BracketType;
  participantsSeeded: { id: string }[];
}): TournamentRoundForDB[] {
  const bracket = eliminationBracket(participantsSeeded.length, bracketType);
  const result: TournamentRoundForDB[] = [];

  const groupedRounds = advanceByes(groupMatchesByRound(bracket));

  for (const [sideI, side] of [
    groupedRounds.winners,
    groupedRounds.losers,
  ].entries()) {
    const isWinners = sideI === 0;
    for (const [roundI, round] of side.entries()) {
      const position = isWinners ? roundI + 1 : -(roundI + 1);

      const matches = round.map((match) => {
        return {
          id: match.id,
          position: match.position,
          number: match.number,
          winnerDestinationMatchId: match.winnerDestinationMatch?.id,
          loserDestinationMatchId: match.loserDestinationMatch?.id,
          participants: [match.upperTeam, match.lowerTeam].flatMap(
            (team, i) => {
              if (!team) return [];
              const teamOrBye =
                team === "BYE"
                  ? team
                  : { id: participantsSeeded[team - 1]?.id };
              invariant(
                typeof teamOrBye === "string" || teamOrBye?.id,
                `teamId is undefined - participantsSeeded: ${participantsSeeded.join(
                  ","
                )}; team: ${team}`
              );

              return {
                team: teamOrBye as "BYE" | { id: string },
                order: i === 0 ? "UPPER" : ("LOWER" as TeamOrder),
              };
            }
          ),
        };
      });

      result.push({
        id: uuidv4(),
        position,
        matches,
      });
    }
  }

  return result;
}

function groupMatchesByRound(bracket: Bracket): EliminationBracket<Match[][]> {
  const { winners, losers } = countRounds(bracket, false);

  const result: EliminationBracket<Match[][]> = {
    winners: new Array(winners).fill(null).map(() => []),
    losers: new Array(losers).fill(null).map(() => []),
  };
  const matchesIncluded = new Set<string>();
  for (const match of bracket.winners) {
    // first round match
    if (match.upperTeam && match.lowerTeam) {
      search(match, "winners", 1);
      search(match.loserDestinationMatch, "losers", 1);
    }
  }

  invariant(
    matchesIncluded.size === bracket.winners.length + bracket.losers.length,
    `matchesIncluded: ${matchesIncluded.size}; winners: ${bracket.winners.length}; losers: ${bracket.losers.length}`
  );
  return result;

  function search(
    match: Match | undefined,
    side: EliminationBracketSide,
    depth: number
  ) {
    if (!match) return;
    if (matchesIncluded.has(match.id)) return;

    search(match.winnerDestinationMatch, side, depth + 1);
    matchesIncluded.add(match.id);

    const roundsArray = result[side][depth - 1];
    invariant(roundsArray, "No rounds array for the match");
    roundsArray.push(match);
  }
}

function advanceByes(
  rounds_: EliminationBracket<Match[][]>
): EliminationBracket<Match[][]> {
  const result = clone(rounds_);

  const teamsForSecondRound = new Map<
    number,
    ["upperTeam" | "lowerTeam", number][]
  >();

  const firstRound = result.winners[0];
  invariant(firstRound, "No first round in winners bracket");

  for (const round of firstRound) {
    invariant(round.winnerDestinationMatch, "!round.winnerDestinationMatch");

    const teamsForSecondRoundArr =
      teamsForSecondRound.get(round.winnerDestinationMatch.number) ?? [];
    let changed = false;
    if (
      round.upperTeam &&
      round.upperTeam !== "BYE" &&
      round.lowerTeam === "BYE"
    ) {
      teamsForSecondRoundArr.push([
        resolveSide(round, round.winnerDestinationMatch, result),
        round.upperTeam,
      ]);
      changed = true;
    } else if (
      round.lowerTeam &&
      round.lowerTeam !== "BYE" &&
      round.upperTeam === "BYE"
    ) {
      teamsForSecondRoundArr.push([
        resolveSide(round, round.winnerDestinationMatch, result),
        round.lowerTeam,
      ]);
      changed = true;
    }

    if (changed) {
      teamsForSecondRound.set(
        round.winnerDestinationMatch.number,
        teamsForSecondRoundArr
      );
    }
  }

  const secondRound = result.winners[1];
  invariant(secondRound, "No second round in winners bracket");

  for (const [i, round] of secondRound.entries()) {
    const teamForSecondRoundArr = teamsForSecondRound.get(round.number);
    if (!teamForSecondRoundArr) continue;

    for (const teamForSecondRound of teamForSecondRoundArr) {
      const [key, teamNumber] = teamForSecondRound;

      const secondRoundMatch = result.winners[1]?.[i];
      invariant(secondRoundMatch, "No second round match");

      result.winners[1]![i] = { ...secondRoundMatch, [key]: teamNumber };
    }
  }

  return result;
}

function resolveSide(
  currentMatch: Match,
  destinationMatch: Match,
  rounds: EliminationBracket<Match[][]>
): "upperTeam" | "lowerTeam" {
  const matchPositions = getWinnerDestinationMatchIdToMatchPositions(
    rounds
  ).get(destinationMatch.id);
  const otherPosition = matchPositions?.find(
    (num) => num !== currentMatch.position
  );

  invariant(
    otherPosition,
    `no otherPosition; matchPositions length was: ${
      matchPositions?.length ?? "NO_LENGTH"
    }`
  );

  if (otherPosition > currentMatch.position) return "upperTeam";
  return "lowerTeam";
}

function getWinnerDestinationMatchIdToMatchPositions(
  rounds: EliminationBracket<Match[][]>
): Map<string, number[]> {
  const firstRound = rounds.winners[0];
  invariant(firstRound, "No first round in winners bracket");

  return firstRound.reduce((map, round) => {
    invariant(
      round.winnerDestinationMatch,
      "round.winnerDestinationMatch is undefined"
    );
    if (!map.has(round.winnerDestinationMatch.id)) {
      return map.set(round.winnerDestinationMatch.id, [round.position]);
    }

    const arr = map.get(round.winnerDestinationMatch.id);
    invariant(arr, "arr is undefined");
    arr.push(round.position);

    return map;
  }, new Map<string, number[]>());
}

// xxx:
// export function newResultChangesWinner({
//   oldResults,
//   newResults,
// }: {
//   oldResults: Unpacked<NonNullable<FindInfoForModal>>["matchInfos"];
//   newResults: BracketMatchAction["results"];
// }): boolean {
//   const oldWinnerIdCounts = oldResults.reduce(
//     (acc: Record<string, number>, stage) => {
//       if (!stage.winnerId) return acc;

//       if (!acc[stage.winnerId]) acc[stage.winnerId] = 1;
//       else acc[stage.winnerId]++;

//       return acc;
//     },
//     {}
//   );
//   const countsToWinner = (counts: Record<string, number>) =>
//     Object.entries(counts).sort((a, b) => b[1] - a[1])?.[0][0];

//   const oldWinnerId = countsToWinner(oldWinnerIdCounts);
//   invariant(oldWinnerId, "!oldWinnerId");

//   const newWinnerIdCounts = newResults.reduce(
//     (acc: Record<string, number>, stage) => {
//       if (!stage.winnerTeamId) return acc;

//       if (!acc[stage.winnerTeamId]) acc[stage.winnerTeamId] = 1;
//       else acc[stage.winnerTeamId]++;

//       return acc;
//     },
//     {}
//   );
//   const newWinnerId = countsToWinner(newWinnerIdCounts);
//   invariant(newWinnerId, "!newWinnerId");

//   return oldWinnerId !== newWinnerId;
// }
