import { Head } from "fresh/runtime";
import { Icon } from "~/components/Icon.tsx";
import { APP_NAME } from "~/consts.ts";
import { GuestIsland } from "~/islands/GuestIsland.tsx";
import { cn } from "~/utils/styling.ts";
import { define } from "~/utils/typing.ts";

export default define.page((
  { url },
) => {
  return (
    <main
      class={cn(
        "min-h-screen bg-gray-50 flex flex-col items-center py-20 px-4",
      )}
    >
      <Head>
        <title>ゲスト画面 | {APP_NAME}</title>
      </Head>
      <section class={cn("w-full max-w-4xl")}>
        <div class={cn("mb-8 flex items-center gap-4")}>
          <a
            href="/"
            class={cn(
              "p-2 rounded-full hover:bg-gray-200 transition-colors duration-200",
            )}
          >
            <Icon
              icon="icon-[material-symbols-light--arrow-back]"
              class={cn("text-2xl text-gray-600")}
              label="Back"
            />
          </a>
          <h1
            class={cn(
              "text-3xl font-black text-gray-800 tracking-tight",
            )}
          >
            ゲスト画面
          </h1>
        </div>
        <GuestIsland url={url} />
      </section>
    </main>
  );
});
