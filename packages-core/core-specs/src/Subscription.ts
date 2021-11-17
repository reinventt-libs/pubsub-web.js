import { ChannelName, TopicName, Subscriber } from "./index";

export type SubscriptionId = string;

export interface Subscription {
  /**
   * unique identifier of the subscriber
   * This will be used to ensure duplicate subscriptions are not created for a given subsriber id
   */
  subscriptionId: SubscriptionId;

  subscriber: Subscriber;

  channel: ChannelName;
  topic: TopicName;

  /**
   * Will be used to filter the subscription &
   * deliver the message only if the filter criteria matches
   *
   * This is on top of channel & topic filtering
   */
  filter?: string; // TODO: Revisit filter criteria. Do we need this?
}
