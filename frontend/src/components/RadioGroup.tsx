/**
 * Accessible single-choice group backed by native radio inputs. Generic over
 * string or number option values. Large tap targets for mobile; dark-theme
 * neutral surfaces (identical for every option).
 */
interface Option<T extends string | number> {
  value: T;
  label: string;
}

interface RadioGroupProps<T extends string | number> {
  /** Unique input `name` for this group. */
  name: string;
  legend: string;
  options: Option<T>[];
  value: T | null;
  onChange: (value: T) => void;
}

export default function RadioGroup<T extends string | number>({
  name,
  legend,
  options,
  value,
  onChange,
}: RadioGroupProps<T>) {
  return (
    <fieldset>
      <legend className="mb-3 text-base font-medium text-slate-100">
        {legend}
      </legend>
      <div className="space-y-2">
        {options.map((option) => {
          const id = `${name}-${option.value}`;
          const selected = value === option.value;
          return (
            <label
              key={id}
              htmlFor={id}
              className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 text-slate-300 ${
                selected
                  ? 'border-slate-300 bg-abyss-800'
                  : 'border-abyss-700 hover:border-slate-500'
              }`}
            >
              <input
                type="radio"
                id={id}
                name={name}
                checked={selected}
                onChange={() => onChange(option.value)}
                className="h-4 w-4 accent-slate-300"
              />
              <span>{option.label}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
