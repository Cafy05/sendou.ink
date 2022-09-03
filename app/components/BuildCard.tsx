import clsx from "clsx";
import { useTranslation } from "react-i18next";
import type { Build, BuildWeapon, GearType } from "~/db/types";
import { useIsMounted } from "~/hooks/useIsMounted";
import { useUser } from "~/modules/auth";
import type {
  Ability as AbilityType,
  ModeShort,
} from "~/modules/in-game-lists";
import type { BuildAbilitiesTuple } from "~/modules/in-game-lists/types";
import { databaseTimestampToDate } from "~/utils/dates";
import { gearImageUrl, modeImageUrl, weaponImageUrl } from "~/utils/urls";
import { Ability } from "./Ability";
import { Button, LinkButton } from "./Button";
import { FormWithConfirm } from "./FormWithConfirm";
import { Image } from "./Image";
import { Popover } from "./Popover";

type BuildProps = Pick<
  Build,
  | "id"
  | "title"
  | "description"
  | "clothesGearSplId"
  | "headGearSplId"
  | "shoesGearSplId"
  | "updatedAt"
  | "modes"
> & {
  abilities: BuildAbilitiesTuple;
  modes: ModeShort[] | null;
  weapons: Array<BuildWeapon["weaponSplId"]>;
  canEdit?: boolean;
};

export function BuildCard({
  id,
  title,
  description,
  weapons,
  updatedAt,
  headGearSplId,
  clothesGearSplId,
  shoesGearSplId,
  abilities,
  modes,
  canEdit = false,
}: BuildProps) {
  const user = useUser();
  const { t } = useTranslation(["weapons", "builds", "common"]);
  const { i18n } = useTranslation();
  const isMounted = useIsMounted();

  const bottomRowItems = [
    description && (
      <Popover
        key="info"
        trigger={<>{t("builds:buildCard.info")}</>}
        triggerClassName="build__small-text"
      >
        {description}
      </Popover>
    ),
    canEdit && (
      <LinkButton
        key="edit"
        className="build__small-text"
        variant="minimal"
        tiny
        to={`new?buildId=${id}&userId=${user!.id}`}
      >
        {t("builds:buildCard.edit")}
      </LinkButton>
    ),
    canEdit && (
      <FormWithConfirm
        key="delete"
        dialogHeading={t("builds:deleteConfirm", { title })}
        fields={[["buildToDeleteId", id]]}
      >
        <Button
          className="build__small-text"
          variant="minimal-destructive"
          tiny
          type="submit"
        >
          {t("common:actions.delete")}
        </Button>
      </FormWithConfirm>
    ),
  ].filter(Boolean);

  return (
    <div className="build">
      <div>
        <div className="build__top-row">
          <h2 className="build__title">{title}</h2>
          {modes && modes.length > 0 && (
            <div className="build__modes">
              {modes.map((mode) => (
                <Image
                  key={mode}
                  alt=""
                  path={modeImageUrl(mode)}
                  width={18}
                  height={18}
                />
              ))}
            </div>
          )}
        </div>
        <time className={clsx("build__date", { invisible: !isMounted })}>
          {isMounted
            ? databaseTimestampToDate(updatedAt).toLocaleDateString(
                i18n.language,
                {
                  day: "numeric",
                  month: "numeric",
                  year: "numeric",
                }
              )
            : "t"}
        </time>
      </div>
      <div className="build__weapons">
        {weapons.map((weaponSplId) => (
          <div key={weaponSplId} className="build__weapon">
            <Image
              path={weaponImageUrl(weaponSplId)}
              alt={t(`weapons:${weaponSplId}` as any)}
              title={t(`weapons:${weaponSplId}` as any)}
              height={36}
              width={36}
            />
          </div>
        ))}
        {weapons.length === 1 && (
          <div className="build__weapon-text">
            {t(`weapons:${weapons[0]!}` as any)}
          </div>
        )}
      </div>
      <div className="build__gear-abilities">
        <AbilitiesRowWithGear
          gearType="HEAD"
          abilities={abilities[0]}
          gearId={headGearSplId}
        />
        <AbilitiesRowWithGear
          gearType="CLOTHES"
          abilities={abilities[1]}
          gearId={clothesGearSplId}
        />
        <AbilitiesRowWithGear
          gearType="SHOES"
          abilities={abilities[2]}
          gearId={shoesGearSplId}
        />
      </div>
      {bottomRowItems.length > 0 && (
        <div className="build__bottom-row">{bottomRowItems}</div>
      )}
    </div>
  );
}

function AbilitiesRowWithGear({
  gearType,
  abilities,
  gearId,
}: {
  gearType: GearType;
  abilities: AbilityType[];
  gearId: number;
}) {
  return (
    <>
      <Image
        height={64}
        width={64}
        alt=""
        path={gearImageUrl(gearType, gearId)}
        className="build__gear"
      />
      {abilities.map((ability, i) => (
        <Ability key={i} ability={ability} size={i === 0 ? "MAIN" : "SUB"} />
      ))}
    </>
  );
}
