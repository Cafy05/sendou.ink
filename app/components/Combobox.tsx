import { Combobox as HeadlessCombobox } from "@headlessui/react";
import * as React from "react";
import Fuse from "fuse.js";
import clsx from "clsx";
import type { Unpacked } from "~/utils/types";
import type { UserWithPlusTier } from "~/db/types";
import { useUsers } from "~/hooks/swr";
import { useTranslation } from "react-i18next";
import type { GearType } from "~/modules/in-game-lists";
import {
  clothesGearIds,
  headGearIds,
  shoesGearIds,
  weaponIds,
} from "~/modules/in-game-lists";
import { gearImageUrl, weaponImageUrl } from "~/utils/urls";
import { Image } from "./Image";

const MAX_RESULTS_SHOWN = 6;

interface ComboboxBaseOption {
  label: string;
  value: string;
  imgPath?: string;
}

type ComboboxOption<T> = ComboboxBaseOption & T;
interface ComboboxProps<T> {
  options: ComboboxOption<T>[];
  inputName: string;
  placeholder: string;
  className?: string;
  id?: string;
  isLoading?: boolean;
  required?: boolean;
  initialValue?: ComboboxOption<T>;
  onChange?: (selectedOption?: ComboboxOption<T>) => void;
}

export function Combobox<T extends Record<string, string | null | number>>({
  options,
  inputName,
  placeholder,
  initialValue,
  onChange,
  required,
  className,
  id,
  isLoading = false,
}: ComboboxProps<T>) {
  const [selectedOption, setSelectedOption] =
    React.useState<Unpacked<typeof options>>();
  const [query, setQuery] = React.useState("");

  React.useEffect(() => {
    setSelectedOption(initialValue);
  }, [initialValue]);

  const filteredOptions = (() => {
    if (!query) return [];

    const fuse = new Fuse(options, {
      keys: [...Object.keys(options[0] ?? {})],
    });
    return fuse
      .search(query)
      .slice(0, MAX_RESULTS_SHOWN)
      .map((res) => res.item);
  })();

  const noMatches = filteredOptions.length === 0;

  return (
    <HeadlessCombobox
      value={selectedOption}
      onChange={(selected) => {
        onChange?.(selected);
        setSelectedOption(selected);
      }}
      name={inputName}
      disabled={isLoading}
    >
      <HeadlessCombobox.Input
        onChange={(event) => setQuery(event.target.value)}
        placeholder={isLoading ? "Loading..." : placeholder}
        className={clsx("combobox-input", className)}
        displayValue={(option) =>
          (option as Unpacked<typeof options>)?.label ?? ""
        }
        data-cy={`${inputName}-combobox-input`}
        id={id}
        required={required}
      />
      <HeadlessCombobox.Options
        className={clsx("combobox-options", {
          empty: noMatches,
          hidden: !query,
        })}
      >
        {noMatches ? (
          <div className="combobox-no-matches">
            No matches found <span className="combobox-emoji">🤔</span>
          </div>
        ) : (
          filteredOptions.map((option) => (
            <HeadlessCombobox.Option
              key={option.value}
              value={option}
              as={React.Fragment}
            >
              {({ active }) => (
                <li className={clsx("combobox-item", { active })}>
                  {option.imgPath && (
                    <Image
                      alt=""
                      path={option.imgPath}
                      width={24}
                      height={24}
                    />
                  )}
                  {option.label}
                </li>
              )}
            </HeadlessCombobox.Option>
          ))
        )}
      </HeadlessCombobox.Options>
    </HeadlessCombobox>
  );
}

// TODO: if we search with only discord id "79237403620945920" then doesn't really make sense to do fuzzy search
export function UserCombobox({
  inputName,
  initialUserId,
  onChange,
  userIdsToOmit,
  className,
  required,
  id,
}: Pick<
  ComboboxProps<Pick<UserWithPlusTier, "discordId" | "plusTier">>,
  "inputName" | "onChange" | "className" | "id" | "required"
> & { userIdsToOmit?: Set<number>; initialUserId?: number }) {
  const { users, isLoading, isError } = useUsers();

  const options = React.useMemo(() => {
    if (!users) return [];

    const data = userIdsToOmit
      ? users.filter((user) => !userIdsToOmit.has(user.id))
      : users;

    return data.map((u) => ({
      label: u.discordFullName,
      value: String(u.id),
      discordId: u.discordId,
      plusTier: u.plusTier,
    }));
  }, [users, userIdsToOmit]);

  const initialValue = React.useMemo(() => {
    if (!initialUserId) return;
    return options.find((o) => o.value === String(initialUserId));
  }, [options, initialUserId]);

  if (isError) {
    return (
      <div className="text-sm text-error">
        Something went wrong. Try reloading the page.
      </div>
    );
  }

  return (
    <Combobox
      inputName={inputName}
      options={options}
      placeholder="Sendou#0043"
      isLoading={isLoading}
      initialValue={initialValue}
      onChange={onChange}
      className={className}
      id={id}
      required={required}
    />
  );
}

export function WeaponCombobox({
  id,
  required,
  className,
  inputName,
  onChange,
}: Pick<
  ComboboxProps<ComboboxBaseOption>,
  "inputName" | "onChange" | "className" | "id" | "required"
>) {
  const { t } = useTranslation("weapons");

  const idToWeapon = (id: typeof weaponIds[number]) => ({
    value: String(id),
    label: t(`${id}`),
    imgPath: weaponImageUrl(id),
  });

  return (
    <Combobox
      inputName={inputName}
      options={weaponIds.map(idToWeapon)}
      placeholder={t(`${weaponIds[0]}`)}
      onChange={onChange}
      className={className}
      id={id}
      required={required}
    />
  );
}

export function GearCombobox({
  id,
  required,
  className,
  inputName,
  onChange,
  gearType,
}: Pick<
  ComboboxProps<ComboboxBaseOption>,
  "inputName" | "onChange" | "className" | "id" | "required"
> & { gearType: GearType }) {
  const { t } = useTranslation("gear");

  const translationPrefix =
    gearType === "head" ? "H" : gearType === "clothes" ? "C" : "S";
  const ids =
    gearType === "head"
      ? headGearIds
      : gearType === "clothes"
      ? clothesGearIds
      : shoesGearIds;

  const idToGear = (id: typeof ids[number]) => ({
    value: String(id),
    label: t(`${translationPrefix}_${id}` as any),
    imgPath: gearImageUrl(gearType, id),
  });

  return (
    <Combobox
      inputName={inputName}
      options={ids.map(idToGear)}
      placeholder={idToGear(ids[0]).label}
      onChange={onChange}
      className={className}
      id={id}
      required={required}
    />
  );
}
