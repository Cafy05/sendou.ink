import { Form, useMatches } from "@remix-run/react";
import invariant from "tiny-invariant";
import type { BracketModified } from "~/services/bracket";
import type { FindTournamentByNameForUrlI } from "~/services/tournament";
import { Unpacked } from "~/utils";
import { Chat } from "../Chat";
import { SubmitButton } from "../SubmitButton";
import { ActionSectionWrapper } from "./ActionSectionWrapper";
import { DuringMatchActionsRosters } from "./DuringMatchActionsRosters";
import { FancyStageBanner } from "./FancyStageBanner";

export function DuringMatchActions({
  ownTeam,
  currentMatch,
  currentRound,
}: {
  ownTeam: Unpacked<FindTournamentByNameForUrlI["teams"]>;
  currentMatch: Unpacked<Unpacked<BracketModified["rounds"]>["matches"]>;
  currentRound: Unpacked<BracketModified["rounds"]>;
}) {
  const [, parentRoute] = useMatches();
  const { teams } = parentRoute.data as FindTournamentByNameForUrlI;

  const opponentTeam = teams.find(
    (team) =>
      [currentMatch.participants?.[0], currentMatch.participants?.[1]].includes(
        team.name
      ) && team.id !== ownTeam.id
  );
  invariant(opponentTeam, "opponentTeam is undefined");

  const currentPosition =
    currentMatch.score?.reduce((acc, cur) => acc + cur, 1) ?? 1;
  const currentStage = currentRound.stages.find(
    (s) => s.position === currentPosition
  );
  invariant(currentStage, "currentStage is undefined");
  const { stage } = currentStage;

  const roundInfos = [
    <>
      <b>{currentMatch.score?.join("-")}</b> (Best of{" "}
      {currentRound.stages.length})
    </>,
  ];

  return (
    <>
      <Chat
        key={currentMatch.id}
        id={currentMatch.id}
        users={Object.fromEntries(
          [...ownTeam.members, ...opponentTeam.members].map((m) => [
            m.member.id,
            {
              name: m.member.discordName,
              info: m.member.friendCode,
            },
          ])
        )}
      />
      <div className="tournament-bracket__during-match-actions">
        <FancyStageBanner
          stage={stage}
          roundNumber={currentPosition}
          infos={roundInfos}
        >
          {currentPosition > 1 && (
            <Form method="post">
              <input type="hidden" name="_action" value="UNDO_REPORT_SCORE" />
              <input
                type="hidden"
                name="position"
                value={currentPosition - 1}
              />
              <input type="hidden" name="matchId" value={currentMatch.id} />
              <div className="tournament-bracket__stage-banner__bottom-bar">
                <SubmitButton
                  actionType="UNDO_REPORT_SCORE"
                  className="tournament-bracket__stage-banner__undo-button"
                  loadingText="Undoing..."
                >
                  Undo last score
                </SubmitButton>
              </div>
            </Form>
          )}
        </FancyStageBanner>
        <ActionSectionWrapper>
          <DuringMatchActionsRosters
            // Without the key prop when switching to another match the winnerId is remembered
            // which causes "No winning team matching the id" error.
            // Switching the key props forces the component to remount.
            key={currentMatch.id}
            ownTeam={ownTeam}
            opponentTeam={opponentTeam}
            matchId={currentMatch.id}
            position={currentPosition}
          />
        </ActionSectionWrapper>
      </div>
    </>
  );
}
