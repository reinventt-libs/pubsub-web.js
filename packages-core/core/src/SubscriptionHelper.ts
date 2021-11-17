import {
  ChannelName,
  TopicName,
  Subscription,
  SubscriptionId,
  Subscriber,
} from "@reinventt/pubsub-web-specs";
import { getUniqueSubscriptionId } from "./Utils";

type TopicSubscriptionMap = Map<TopicName, Array<Subscription>> | undefined;
type ChannelTopicMap = Map<ChannelName, TopicSubscriptionMap> | undefined;

interface SubscribeMethodAdvancedOptions {
  forceGenerateSubscriptionId?: boolean;
}
export default class SubscriptionHelper {
  private instanceId: string;
  private subscriptionIdIndex = new Map<SubscriptionId, Subscription>();
  private channelTopicMap: ChannelTopicMap = new Map<
    ChannelName,
    TopicSubscriptionMap
  >();

  constructor({ instanceId }: { instanceId: string }) {
    this.instanceId = instanceId;
  }

  #getTopicSubscriptionMap = ({
    channel,
    createNewIfNotFound = true,
  }: {
    channel: ChannelName;
    createNewIfNotFound?: boolean;
  }): TopicSubscriptionMap | undefined => {
    let topicSubscriptionMap = this.channelTopicMap.get(channel);
    if (!topicSubscriptionMap && createNewIfNotFound) {
      topicSubscriptionMap = new Map<TopicName, Array<Subscription>>();
      this.channelTopicMap.set(channel, topicSubscriptionMap);
    }
    globalThis["__PUB_SUB_subs"] = this.channelTopicMap;
    globalThis["__PUB_SUB_subsIndex"] = this.subscriptionIdIndex;
    return topicSubscriptionMap;
  };

  getSubscribedTopics = () => {
    let subscribedTopics: Array<{
      channel: ChannelName;
      topic: TopicName;
    }> = [];
    this.channelTopicMap.forEach((topicSubscriptionMap, channel) => {
      for (const topic of topicSubscriptionMap.keys()) {
        subscribedTopics.push({
          channel,
          topic,
        });
      }
    });
    return subscribedTopics;
  };

  getSubscriptions = ({
    channel,
    topic,
    createNewIfNotFound = true,
  }: {
    channel: ChannelName;
    topic: TopicName;
    createNewIfNotFound?: boolean;
  }) => {
    const topicSubscriptionMap = this.#getTopicSubscriptionMap({
      channel,
      createNewIfNotFound: true,
    });
    let subscriptions = topicSubscriptionMap?.get(topic);
    if (!subscriptions && createNewIfNotFound) {
      subscriptions = new Array<Subscriber>();
      topicSubscriptionMap.set(topic, subscriptions);
    }
    return subscriptions;
  };

  subscribe = (
    subscriptionOriginal: Subscription,
    options?: SubscribeMethodAdvancedOptions
  ): string | undefined => {
    const {
      subscriptionId: subscriptionIdOriginal,
      channel,
      topic,
      subscriber: { subscriberId },
    } = subscriptionOriginal;

    const { forceGenerateSubscriptionId = false } = options || {};

    let subscriptionId = subscriptionIdOriginal;
    if (forceGenerateSubscriptionId) {
      subscriptionId = getUniqueSubscriptionId({
        subscriptionId: subscriptionIdOriginal,
        channel,
        topic,
      });
    }

    const subscription = {
      ...subscriptionOriginal,
      subscriptionId,
    };

    // TODO: Should we dedup based on subscriptionId, channel, topic?
    // It can be helpful to dedup during federated subscriptions
    if (this.subscriptionIdIndex.has(subscriptionId)) {
      // already subscribed with the same subscriber id
      return subscriptionId;
    }
    let subscriptions = this.getSubscriptions({
      channel,
      topic,
      createNewIfNotFound: true,
    });
    subscriptions?.push(subscription);
    this.subscriptionIdIndex.set(subscriptionId, subscription);
    return subscriptionId;
  };

  unsubscribe = ({
    subscriptionId,
  }: {
    subscriptionId: SubscriptionId;
  }): void => {
    const subscription = this.subscriptionIdIndex.get(subscriptionId);
    if (!subscription) {
      // subscription not found
      return;
    }
    const { channel, topic } = subscription;
    let subscriptions = this.getSubscriptions({
      channel,
      topic,
      createNewIfNotFound: false,
    });
    const subscriptionIndex = subscriptions?.findIndex(
      (s) => subscriptionId === s.subscriptionId
    );
    if (subscriptionIndex != -1) {
      subscriptions?.splice(subscriptionIndex, 1); // remove 1 element from index
    }
    this.subscriptionIdIndex.delete(subscriptionId);
  };
}
