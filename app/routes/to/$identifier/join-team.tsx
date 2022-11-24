import {
  ActionFunction,
  json,
  LinksFunction,
  LoaderFunction,
  redirect,
} from "@remix-run/node";
import {
  Form,
  useLoaderData,
  useMatches,
  useNavigate,
  useTransition,
} from "@remix-run/react";
import { z } from "zod";
import { Button } from "~/components/Button";
import { Catcher } from "~/components/Catcher";
import { captainOfTeam } from "~/core/tournament/utils";
import styles from "~/styles/tournament-join-team.css";
import { getUser, parseRequestFormData, requireUser, validate } from "~/utils";
import * as Tournament from "~/models/Tournament.server";
import * as TournamentTeamMember from "~/models/TournamentTeamMember.server";
import * as TrustRelationship from "~/models/TrustRelationship.server";
import { tournamentTeamIsNotFull } from "~/core/tournament/validators";
import {
  tournamentFrontPage,
  tournamentManageTeamPage,
  tournamentTeamsPage,
} from "~/utils/urls";
import { PleaseLogin } from "~/components/PleaseLogin";

export const links: LinksFunction = () => {
  return [{ rel: "stylesheet", href: styles }];
};

const actionSchema = z.object({
  inviteCode: z.string().uuid(),
  tournamentId: z.string().uuid(),
});

export const action: ActionFunction = async ({ request, context, params }) => {
  const data = await parseRequestFormData({
    request,
    schema: actionSchema,
  });
  const parsedParams = z
    .object({ organization: z.string(), tournament: z.string() })
    .parse(params);
  const user = requireUser(context);

  const tournament = await Tournament.findById(data.tournamentId);

  validate(tournament, "Invalid tournament id");
  // TODO: 400 if tournament already started / concluded (depending on if tournament allows mid-event roster additions)

  const teamToJoin = tournament.teams.find(
    (team) => team.inviteCode === data.inviteCode
  );
  validate(teamToJoin, "Invalid invite code");
  validate(tournamentTeamIsNotFull(teamToJoin), "Team is full");

  await Promise.all([
    TournamentTeamMember.joinTeam({
      teamId: teamToJoin.id,
      memberId: user.id,
      tournamentId: data.tournamentId,
    }),
    // TODO: this could also be put to queue and scheduled for later
    TrustRelationship.upsert({
      trustReceiverId: captainOfTeam(teamToJoin).memberId,
      trustGiverId: user.id,
    }),
  ]);

  return redirect(
    tournamentTeamsPage({
      organization: parsedParams.organization,
      tournament: parsedParams.tournament,
    })
  );
};

const INVITE_CODE_LENGTH = 36;

type Data =
  | { status: "NO_CODE" }
  | { status: "TOO_SHORT" }
  | { status: "LOG_IN" }
  | { status: "ALREADY_JOINED"; teamName: string }
  | { status: "INVALID" }
  | { status: "OK"; teamName: string; inviterName: string; inviteCode: string };

const typedJson = (args: Data) => json(args);

export const loader: LoaderFunction = async ({ request, params, context }) => {
  const parsedParams = z
    .object({ tournament: z.string(), organization: z.string() })
    .parse(params);
  const user = getUser(context);

  if (!user) return typedJson({ status: "LOG_IN" });

  const inviteCode = new URL(request.url).searchParams.get("code");
  if (!inviteCode) return typedJson({ status: "NO_CODE" });
  if (inviteCode.length !== INVITE_CODE_LENGTH) {
    return typedJson({ status: "TOO_SHORT" });
  }

  const tournament = await Tournament.findByNameForUrl({
    organizationNameForUrl: parsedParams.organization,
    tournamentNameForUrl: parsedParams.tournament,
    withInviteCodes: true,
  });
  if (!tournament) throw new Response(null, { status: 404 });

  // TODO: handle inviting players mid-event
  if (tournament.startTime < new Date()) {
    return redirect(
      tournamentFrontPage({
        organization: parsedParams.organization,
        tournament: parsedParams.tournament,
      })
    );
  }

  const teamAlreadyMemberOf = tournament.teams.find((team) =>
    team.members.some(({ member }) => member.id === user.id)
  );

  if (
    teamAlreadyMemberOf?.members.some(
      ({ member, captain }) => member.id === user.id && captain
    )
  ) {
    return redirect(tournamentManageTeamPage(parsedParams));
  }

  // TODO: handle switching team
  if (teamAlreadyMemberOf) {
    return typedJson({
      status: "ALREADY_JOINED",
      teamName: teamAlreadyMemberOf.name,
    });
  }

  const teamInvitedTo = tournament.teams.find(
    (team) => team.inviteCode === inviteCode
  );
  if (!teamInvitedTo) return typedJson({ status: "INVALID" });

  return typedJson({
    status: "OK",
    teamName: teamInvitedTo.name,
    inviteCode,
    inviterName: captainOfTeam(teamInvitedTo).member.discordName,
  });
};

export default function JoinTeamPage() {
  const data = useLoaderData<Data>();

  return (
    <div>
      <Contents data={data} />
    </div>
  );
}

function Contents({ data }: { data: Data }) {
  const navigate = useNavigate();
  const [, parentRoute] = useMatches();
  const parentRouteData =
    parentRoute.data as NonNullable<Tournament.FindByNameForUrl>;
  const transition = useTransition();

  switch (data.status) {
    case "NO_CODE":
      return (
        <>
          No invite code provided in the URL. Please ask your captain to double
          check the URL they gave you.
        </>
      );
    case "TOO_SHORT":
      return (
        <>
          The code provided in the URL is too short. Please ask your captain to
          double check the URL they gave you.
        </>
      );
    case "INVALID":
      return (
        <>
          The code provided in the URL is invalid. Please ask your captain to
          double check the URL they gave you.
        </>
      );
    case "LOG_IN":
      return <PleaseLogin texts={["Please", "log in", "to join this team."]} />;
    case "ALREADY_JOINED":
      return (
        <>You are already a member of {data.teamName} for this tournament.</>
      );
    // TODO: when logging in invite code disappears
    case "OK":
      return (
        <div>
          {data.inviterName} invited you to join {data.teamName} for this
          tournament. Accept invite?
          <Form method="post">
            <input
              type="hidden"
              name="tournamentId"
              value={parentRouteData.id}
            />
            <input type="hidden" name="inviteCode" value={data.inviteCode} />
            <div className="tournament__join-team__buttons">
              <Button
                type="submit"
                loadingText="Joining..."
                loading={transition.state !== "idle"}
              >
                Join
              </Button>
              {transition.state === "idle" && (
                <Button
                  variant="outlined"
                  type="button"
                  onClick={() => navigate(parentRoute.pathname)}
                >
                  Don&apos;t join
                </Button>
              )}
            </div>
          </Form>
        </div>
      );
    default: {
      const exhaustive: never = data;
      throw new Error(
        `Unexpected join team status code: ${JSON.stringify(exhaustive)}`
      );
    }
  }
}

export const CatchBoundary = Catcher;
