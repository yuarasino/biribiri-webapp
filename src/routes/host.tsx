import { Head } from "fresh/runtime";
import { Icon } from "~/components/Icon.tsx";
import { define } from "~/utils/typing.ts";
import { cn } from "~/utils/styling.ts";
import { HostConnection } from "~/islands/HostConnection.tsx";
import { APP_NAME } from "~/consts.ts";

export default define.page((
  { url },
) => {
  return (
    <main>
      <Head>
        <title>ホスト画面 | {APP_NAME}</title>
      </Head>
      <section class={cn("min-h-screen bg-pink-50/30")}>
        <div
          class={cn(
            "bg-white border-b border-pink-100 shadow-sm sticky top-0 z-10",
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
              <span class={cn("text-pink-500 bg-pink-100 p-2 rounded-lg")}>
                <Icon
                  icon="icon-[material-symbols-light--touch-app]"
                  class={cn("text-2xl")}
                  label="Host"
                />
              </span>
              <span>ホスト画面</span>
              <span class={cn("text-gray-400 font-normal text-sm ml-2")}>
                | {APP_NAME}
              </span>
            </h1>
            <a
              href="/"
              class={cn(
                "text-sm text-gray-500 hover:text-pink-500 transition-colors font-medium",
              )}
            >
              トップへ戻る
            </a>
          </div>
        </div>
        <HostConnection url={url} />
      </section>
    </main>
  );
});
