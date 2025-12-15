import { useEffect, useRef, useState } from "preact/hooks";
import { Icon } from "~/components/Icon.tsx";
import { HOST_NAME, HOST_UUID, LEVEL_DELAY, POWER_DELAY } from "~/consts.ts";
import { Guest, WebSocketMessage } from "~/types.ts";
import { cn } from "~/utils/styling.ts";
import { defineComponent } from "~/utils/typing.ts";
import { sleep } from "~/utils/functions.ts";

export type HostIslandProps = {
  url: URL;
};

export const HostIsland = defineComponent<HostIslandProps>((
  { url },
) => {
  const [socket, setSocket] = useState<WebSocket | undefined>(undefined);
  const [guests, setGuests] = useState<Guest[]>([]);
  const guestsRef = useRef<Guest[]>(guests);
  guestsRef.current = guests;

  const [level, setLevel] = useState<number>(5);
  const [duration, setDuration] = useState<number>(5);

  const wsurl = url.protocol === "https:"
    ? `wss://${url.origin}/websocket`
    : "ws://localhost:8000/websocket";

  useEffect(() => {
    const socket = new WebSocket(wsurl);
    if (!socket) {
      alert("サーバーに接続できませんでした。ページを再読み込みしてください。");
      return;
    }
    setSocket(socket);

    socket.addEventListener("open", () => {
      const message = {
        type: "connect",
        data: {
          uuid: HOST_UUID,
          name: HOST_NAME,
        },
      };
      socket.send(JSON.stringify(message));
    });

    socket.addEventListener("message", (event) => {
      const message: WebSocketMessage = JSON.parse(event.data);
      if (message.type === "connect") {
        if (message.data.uuid !== HOST_UUID) {
          if (
            !guestsRef.current.some((guest) => guest.uuid === message.data.uuid)
          ) {
            const guest: Guest = {
              uuid: message.data.uuid,
              name: message.data.name,
              timer: -1,
              isRunning: false,
              isTarget: false,
            };
            setGuests(guestsRef.current.concat(guest));
          }
        }
      }
      if (message.type === "disconnect") {
        setGuests(
          guestsRef.current.filter((guest) => guest.uuid !== message.data.uuid),
        );
      }
    });

    const onWindowClose = () => {
      socket.close();
    };

    globalThis.addEventListener("beforeunload", onWindowClose);

    return () => {
      globalThis.removeEventListener("beforeunload", onWindowClose);
    };
  }, []);

  const onNameInput = (event: Event, uuid: string) => {
    if (!socket) {
      return;
    }
    const target = event.target as HTMLInputElement;
    const name = target.value;

    setGuests(guests.map((guest) => {
      if (guest.uuid === uuid) {
        return {
          ...guest,
          name: name,
        };
      }
      return guest;
    }));

    const data: WebSocketMessage = {
      type: "name",
      data: {
        uuid: uuid,
        name: name,
      },
    };
    socket.send(JSON.stringify(data));
  };

  const onCheckInput = (event: Event, uuid: string) => {
    if (!socket) {
      return;
    }
    const target = event.target as HTMLInputElement;
    const isTarget = target.checked;

    setGuests(guests.map((guest) => {
      if (guest.uuid === uuid) {
        return {
          ...guest,
          isTarget: isTarget,
        };
      }
      return guest;
    }));
  };

  const onLevelInput = (event: Event) => {
    const target = event.target as HTMLInputElement;
    const level = Number(target.value);
    setLevel(level);
  };

  const onDurationInput = (event: Event) => {
    const target = event.target as HTMLInputElement;
    const duration = Number(target.value);
    setDuration(duration);
  };

  const onLaunchLoop = async () => {
    await sleep(POWER_DELAY + LEVEL_DELAY * level);
    for (let i = 0; i < duration; i++) {
      setGuests(guestsRef.current.map((guest) => {
        if (guest.isTarget) {
          return {
            ...guest,
            timer: guest.timer - 1,
            isRunning: true,
          };
        }
        return guest;
      }));
      await sleep(1000);
    }

    setGuests(guestsRef.current.map((guest) => {
      if (guest.isTarget) {
        return {
          ...guest,
          timer: -1,
          isRunning: false,
          isTarget: false,
        };
      }
      return guest;
    }));
  };

  const onLaunchClick = async () => {
    if (!socket) {
      return;
    }

    setGuests(guestsRef.current.map((guest) => {
      if (guest.isTarget) {
        return {
          ...guest,
          timer: duration,
        };
      }
      return guest;
    }));

    const data: WebSocketMessage = {
      type: "launch",
      data: {
        targets: guestsRef.current.filter((guest) => guest.isTarget).map((
          guest,
        ) => guest.uuid),
        level: level,
        duration: duration,
      },
    };
    socket.send(JSON.stringify(data));

    await onLaunchLoop();
  };

  return (
    <div class={cn("grid md:grid-cols-2 gap-8 items-start")}>
      <div
        class={cn("bg-white rounded-2xl p-6 shadow-sm border border-gray-100")}
      >
        <div class={cn("flex items-center justify-between mb-6")}>
          <h2
            class={cn(
              "text-xl font-bold text-gray-800 flex items-center gap-2",
            )}
          >
            <Icon
              icon="icon-[material-symbols-light--group]"
              class={cn("text-2xl text-pink-500")}
              label="Users"
            />
            参加者リスト
            <span
              class={cn(
                "bg-pink-100 text-pink-600 text-sm py-0.5 px-2 rounded-full font-medium",
              )}
            >
              {guests.length}人
            </span>
          </h2>
        </div>

        {guests.length === 0
          ? (
            <div
              class={cn(
                "text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200",
              )}
            >
              <Icon
                icon="icon-[material-symbols-light--person-off]"
                class={cn("text-4xl text-gray-300 mb-2 mx-auto")}
                label="No users"
              />
              <p class={cn("text-gray-400 font-medium")}>
                参加者がまだいません
              </p>
            </div>
          )
          : (
            <div class={cn("space-y-3")}>
              {guests.map((guest) => (
                <div
                  key={guest.uuid}
                  class={cn(
                    "relative p-4 rounded-xl border transition-all duration-200 flex items-center gap-4",
                    guest.isTarget || guest.timer >= 0
                      ? "border-pink-500 bg-pink-50/50 shadow-sm"
                      : "border-gray-100 bg-white hover:border-gray-200",
                    guest.isRunning && "animate-vibrate",
                  )}
                >
                  <div
                    class={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                      guest.isTarget || guest.timer >= 0
                        ? "bg-pink-100 text-pink-600"
                        : "bg-gray-100 text-gray-500",
                    )}
                  >
                    <Icon
                      icon="icon-[material-symbols-light--person]"
                      class={cn("text-2xl")}
                      label="User"
                    />
                  </div>

                  <div class={cn("grow min-w-0")}>
                    <div class={cn("relative group")}>
                      <input
                        type="text"
                        value={guest.name}
                        onInput={(event) => onNameInput(event, guest.uuid)}
                        class={cn(
                          "w-full font-bold text-gray-800 border border-gray-200 rounded-lg px-2 py-1 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 focus:outline-none transition-all placeholder-gray-400",
                          "bg-gray-50/50 hover:bg-white focus:bg-white",
                        )}
                        placeholder="名前を入力"
                      />
                      <Icon
                        icon="icon-[material-symbols-light--edit]"
                        class={cn(
                          "absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none group-hover:text-pink-400 transition-colors",
                        )}
                        label="Edit"
                      />
                    </div>
                    <div class={cn("flex items-center gap-1.5 mt-1")}>
                      <span
                        class={cn(
                          "w-2 h-2 rounded-full animate-pulse",
                          guest.timer >= 0 ? "bg-orange-500" : "bg-green-500",
                        )}
                      />
                      <div class={cn("flex items-center gap-1 font-mono")}>
                        {guest.timer >= 0
                          ? (
                            <>
                              <span
                                class={cn("text-lg font-black text-orange-600")}
                              >
                                {guest.timer}
                              </span>
                              <span
                                class={cn(
                                  "text-xs font-bold text-gray-400 pt-1",
                                )}
                              >
                                s
                              </span>
                            </>
                          )
                          : (
                            <span class={cn("text-xs font-bold text-gray-400")}>
                              休電中
                            </span>
                          )}
                      </div>
                    </div>
                  </div>

                  <div class={cn("flex items-center")}>
                    <input
                      type="checkbox"
                      checked={guest.isTarget}
                      onInput={(event) => onCheckInput(event, guest.uuid)}
                      class={cn(
                        "w-6 h-6 rounded border-gray-300 text-pink-500 focus:ring-pink-500 cursor-pointer accent-pink-500",
                      )}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
      </div>

      <div
        class={cn(
          "bg-white rounded-2xl p-6 shadow-sm border border-gray-100 md:sticky md:top-8",
        )}
      >
        <h2
          class={cn(
            "text-xl font-bold text-gray-800 flex items-center gap-2 mb-6",
          )}
        >
          <Icon
            icon="icon-[material-symbols-light--settings]"
            class={cn("text-2xl text-gray-600")}
            label="Settings"
          />
          設定と起動
        </h2>

        <div class={cn("grid grid-cols-2 gap-4 mb-8")}>
          <div class={cn("space-y-3")}>
            <label
              class={cn(
                "text-sm font-bold text-gray-500 tracking-wider flex items-center gap-2",
              )}
            >
              <Icon
                icon="icon-[material-symbols-light--bolt]"
                class={cn("text-lg")}
                label="Level"
              />
              強度（5～15）
            </label>
            <div class={cn("flex items-center gap-4")}>
              <input
                type="number"
                min="5"
                max="15"
                value={level}
                onInput={onLevelInput}
                class={cn(
                  "w-20 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-center font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent",
                )}
              />
            </div>
          </div>

          <div class={cn("space-y-3")}>
            <label
              class={cn(
                "text-sm font-bold text-gray-500 tracking-wider flex items-center gap-2",
              )}
            >
              <Icon
                icon="icon-[material-symbols-light--timer]"
                class={cn("text-lg")}
                label="Duration"
              />
              時間（5～30s）
            </label>
            <div class={cn("flex items-center gap-4")}>
              <input
                type="number"
                min="5"
                max="30"
                value={duration}
                onInput={onDurationInput}
                class={cn(
                  "w-20 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-center font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent",
                )}
              />
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onLaunchClick}
          disabled={!guests.some((g) => g.isTarget)}
          class={cn(
            "w-full py-4 text-center rounded-xl font-black text-xl flex items-center justify-center gap-3 transition-all duration-300",
            guests.some((g) => g.isTarget)
              ? "bg-pink-500 text-white shadow-lg shadow-pink-200 hover:bg-pink-600 hover:shadow-xl hover:scale-[1.01] active:scale-[0.99]"
              : "bg-gray-100 text-gray-400 cursor-not-allowed",
          )}
        >
          <Icon
            icon="icon-[material-symbols-light--offline-bolt]"
            class={cn("text-3xl")}
            label="Launch"
          />
          ビリビリを起動
        </button>
      </div>
    </div>
  );
});
