export const DEFAULT_CHANNEL_NAME = "default";

export const SystemChannel = "system.pubsub";
export const Topics = {
  Federation: {
    Connection: {
      START: "federation.conn.start",
      ACCEPT: "federation.conn.accept",
      DISCONNECT: "federation.conn.disconnect",
    },
    Sync: {
      SUBSCRIBED_TOPICS: "federation.sync.subscribedTopics",
    },
  },
};
