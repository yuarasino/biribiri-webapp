export type WebSocketMessage = {
  type: "connect";
  data: {
    uuid: string;
    name: string;
  };
} | {
  type: "disconnect";
  data: {
    uuid: string;
  };
} | {
  type: "launch";
  data: {
    targets: string[];
  };
};
