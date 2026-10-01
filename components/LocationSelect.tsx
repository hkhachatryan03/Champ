import { ARMENIAN_LOCATIONS } from "@/lib/constants";

export default function LocationSelect({
  name,
  defaultValue,
  required,
  glass = false,
}: {
  name: string;
  defaultValue?: string;
  required?: boolean;
  /** Dark "Ethereal Glass" look. Default = original light select. */
  glass?: boolean;
}) {
  return (
    <select
      name={name}
      defaultValue={defaultValue || ""}
      required={required}
      className={glass ? "aur-field" : "w-full px-3 py-2 rounded-lg border border-line text-sm outline-none"}
    >
      <option value="" disabled>
        Choose a location
      </option>
      {ARMENIAN_LOCATIONS.map((loc) => (
        <option key={loc.value} value={loc.value}>
          {loc.label}
        </option>
      ))}
    </select>
  );
}
