import { Subscription, MessageEnvelope } from "@reinventt/pubsub-web-specs";

import SubscriptionHelper from "./SubscriptionHelper";
import TransportHelper from "./TransportHelper";

const ALL_TOPICS_PATTERN = "*";
const TOPIC_SEPARATOR = ".";

export default class Publisher {
  private instanceId: string;
  private subscriptionHelper: SubscriptionHelper;
  private transportHelper: TransportHelper;

  constructor({
    instanceId,
    subscriptionHelper,
    transportHelper,
  }: {
    instanceId: string;
    subscriptionHelper: SubscriptionHelper;
    transportHelper: TransportHelper;
  }) {
    this.instanceId = instanceId;
    this.subscriptionHelper = subscriptionHelper;
    this.transportHelper = transportHelper;
  }

  #deliverMessage = ({ channel, topic, header, payload }: MessageEnvelope) => {
    const subscriptions = this.subscriptionHelper.getSubscriptions({
      channel,
      topic,
      createNewIfNotFound: false,
    });
    subscriptions?.forEach((subscription: Subscription) => {
      const originalSourceInstanceId = header?.source?.instanceId;
      if (originalSourceInstanceId === subscription.subscriber.subscriberId) {
        // skip sending message to avoid infinite loop
        return;
      }

      // TODO: futher filtering with subscription.filter
      this.transportHelper.transport({
        target: subscription.subscriber,
        envelope: { channel, topic, header, payload },
      });
    });
  };

  publish = ({
    channel,
    topic: topicOriginal,
    header,
    payload,
  }: MessageEnvelope) => {
    let _topic = String(topicOriginal),
      position = _topic.lastIndexOf(TOPIC_SEPARATOR);

    // deliver the message as it is now
    this.#deliverMessage({ channel, topic: topicOriginal, header, payload });

    // trim the hierarchy and deliver message to each level
    while (position !== -1) {
      _topic = _topic.substr(0, position);
      position = _topic.lastIndexOf(TOPIC_SEPARATOR);
      this.#deliverMessage({ channel, topic: _topic, header, payload });
    }

    this.#deliverMessage({
      channel,
      topic: ALL_TOPICS_PATTERN,
      header,
      payload,
    });
  };
}
