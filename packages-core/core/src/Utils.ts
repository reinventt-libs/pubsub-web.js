import {
  ChannelName,
  SubscriptionId,
  TopicName,
} from "@reinventt/pubsub-web-specs";

export const getUniqueSubscriptionId = function ({
  subscriptionId,
  channel,
  topic,
}: {
  subscriptionId: SubscriptionId;
  channel: ChannelName;
  topic: TopicName;
}) {
  return `${subscriptionId}__${channel}__${topic}`;
};
