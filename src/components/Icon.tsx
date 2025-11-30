import { defineComponent } from "~/utils/typing.ts";
import { cn } from "~/utils/styling.ts";

export type IconProps = {
  class?: string;
  icon: string;
  label: string;
};

export const Icon = defineComponent<IconProps>((
  { class: class_, icon, label },
) => {
  return (
    <span
      class={cn(
        icon,
        class_,
      )}
      role="img"
      aria-label={label}
    />
  );
});
