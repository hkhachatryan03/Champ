import { ARMENIAN_LOCATIONS } from "@/lib/constants";

export default function LocationSelect({
  name,
  defaultValue,
  required,
}: {
  name: string;
  defaultValue?: string;
  required?: boolean;
}) {
  return (
    <select
      name={name}
      defaultValue={defaultValue || ""}
      required={required}
      className="w-full px-3 py-2 rounded-lg border border-line text-sm outline-none"
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
