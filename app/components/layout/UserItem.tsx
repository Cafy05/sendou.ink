import { useUser } from "~/hooks/useUser";
import { LOG_IN_URL } from "~/utils/urls";
import { Button } from "../Button";
import { DiscordIcon } from "../icons/Discord";
import { LogOutIcon } from "../icons/LogOut";
import { Popover } from "../Popover";

export function UserItem() {
  const user = useUser();

  if (user && user.discordAvatar)
    return (
      <Popover
        trigger={
          <img
            className="layout__avatar"
            src={`https://cdn.discordapp.com/avatars/${user.discordId}/${user.discordAvatar}.png?size=80`}
          />
        }
      >
        <form method="post" action="/logout">
          <Button tiny variant="outlined" icon={<LogOutIcon />}>
            Log out
          </Button>
        </form>
      </Popover>
    );

  // TODO: just show text... my profile?
  // TODO: also show this if discordAvatar is stale and 404's
  if (user) {
    return <div className="layout__header__logo-container" />;
  }

  return (
    <form action={LOG_IN_URL} method="post" data-cy="log-in-form">
      <button
        type="submit"
        className="layout__log-in-button"
        data-cy="log-in-button"
      >
        <DiscordIcon /> Log in
      </button>
    </form>
  );
}
