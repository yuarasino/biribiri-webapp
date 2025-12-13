import { Head } from "fresh/runtime";
import { Icon } from "~/components/Icon.tsx";
import { define } from "~/utils/typing.ts";
import { cn } from "~/utils/styling.ts";
import { GuestConnection } from "~/islands/GuestConnection.tsx";
import { APP_NAME } from "~/consts.ts";

export default define.page(({ url }) => {
  return (
    <main>
      <Head>
        <title>ゲスト画面 | {APP_NAME}</title>
      </Head>
      <section class={cn("min-h-screen bg-cyan-50/30")}>
        <div
          class={cn(
            "bg-white border-b border-cyan-100 shadow-sm sticky top-0 z-10",
          )}
        >
          <div
            class={cn(
              "max-w-5xl mx-auto px-8 py-4 flex items-center justify-between",
            )}
          >
            <h1
              class={cn(
                "text-xl font-bold flex items-center gap-2 text-gray-800",
              )}
            >
              <span class={cn("text-cyan-500 bg-cyan-100 p-2 rounded-lg")}>
                <Icon
                  icon="icon-[material-symbols-light--bolt]"
                  class={cn("text-2xl")}
                  label="Guest"
                />
              </span>
              <span>ゲスト画面</span>
              <span class={cn("text-gray-400 font-normal text-sm ml-2")}>
                | {APP_NAME}
              </span>
            </h1>
            <a
              href="/"
              class={cn(
                "text-sm text-gray-500 hover:text-cyan-500 transition-colors font-medium",
              )}
            >
              トップへ戻る
            </a>
          </div>
        </div>
        <GuestConnection url={url} />
      </section>
    </main>
  );
});
