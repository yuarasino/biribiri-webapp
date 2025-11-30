import { Head } from "fresh/runtime";
import { Icon } from "~/components/Icon.tsx";
import { define } from "~/utils/typing.ts";
import { cn } from "~/utils/styling.ts";

export default define.page(() => {
  return (
    <main>
      <Head>
        <title>biribiri-webapp</title>
      </Head>
      <section>
        <h1 class={cn("text-pink-500")}>biribiri-webapp</h1>
        <p class={cn("text-slate-500")}>
          <Icon
            icon="icon-[material-symbols-light--bolt]"
            label="ビリビリ"
          />
        </p>
      </section>
    </main>
  );
});
