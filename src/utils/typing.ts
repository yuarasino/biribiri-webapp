import { createDefine } from "fresh";

import type { AnyComponent } from "preact";

export const define = createDefine();

export const defineComponent = <Props = unknown>(
  component: AnyComponent<Props>,
): AnyComponent<Props> => {
  return component;
};
