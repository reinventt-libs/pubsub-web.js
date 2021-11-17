import { nanoid } from "nanoid";

import {
  InstanceId,
  ChannelName,
  TopicName,
  TransportType,
  Subscriber,
  SubscriberId,
} from "@reinventt/pubsub-web-specs";

import TransportHelper from "./TransportHelper";
import SubscriptionHelper from "./SubscriptionHelper";
import Publisher from "./Publisher";
import { SystemChannel, Topics } from "./Constants";
import {
  isSystemChannel,
  isPubSubMessage,
  isSyncSubscribedTopicsMessage,
  isConnectionStartMessage,
  isConnectionAcceptMessage,
  getSourceInstanceIdFromHeader,
  getSubscribedTopicsFromPayload,
  getRequestIdFromHeader,
} from "./FederationMessageUtils";

export interface FederationTargetUserInput {
  transportType: TransportType;
  reference: any;
}

type FederatedSubscribersMap = Map<string, Subscriber>;

export default class FederationHelper {
  private instanceId: InstanceId;
  private transportHelper: TransportHelper;
  private subscriptionHelper: SubscriptionHelper;
  private publisher: Publisher;

  private federatedSubscribers: FederatedSubscribersMap = new Map<
    SubscriberId,
    Subscriber
  >();

  constructor({
    instanceId,
    publisher,
    transportHelper,
    subscriptionHelper,
  }: {
    instanceId: string;
    publisher: Publisher;
    transportHelper: TransportHelper;
    subscriptionHelper: SubscriptionHelper;
  }) {
    this.instanceId = instanceId;
    this.publisher = publisher;
    this.transportHelper = transportHelper;
    this.subscriptionHelper = subscriptionHelper;
  }

  #syncSubscribedTopics = ({
    target,
  }: {
    target: FederationTargetUserInput;
  }) => {
    const subscribedTopics = this.subscriptionHelper.getSubscribedTopics();

    console.log("[pubsub] subscribedTopics", { subscribedTopics, globalThis });
    if (subscribedTopics?.length === 0) {
      // skip sending the message, if no subscribed topics
      return;
    }
    this.transportHelper.transport({
      target,
      envelope: {
        channel: SystemChannel,
        topic: Topics.Federation.Sync.SUBSCRIBED_TOPICS,
        header: {},
        payload: {
          subscribedTopics,
        },
      },
    });
  };

  register = ({
    target,
    subscriberId,
  }: {
    target: FederationTargetUserInput;
    subscriberId: SubscriberId;
  }) => {
    if (this.federatedSubscribers.has(subscriberId)) {
      // alredy registered
      return;
    }
    const subscriber = {
      subscriberId,
      ...target,
    };
    this.federatedSubscribers.set(subscriberId, subscriber);
    this.#syncSubscribedTopics({
      target,
    });

    console.log("[pubsub] registered remote instance", {
      globalThis,
      subscriber,
      federatedSubscribers: this.federatedSubscribers,
    });
  };

  #handleSyncSubscribedTopicsMessage = (message: any) => {
    if (!isPubSubMessage(message)) {
      return;
    }
    const subscribedTopics = getSubscribedTopicsFromPayload(message);
    const sourceInstanceId = getSourceInstanceIdFromHeader(message);
    console.log("[pubsub] handleSyncSubscribedTopicsMessage", {
      message,
      subscribedTopics,
      globalThis,
    });

    const federatedSubscriber = this.federatedSubscribers.get(sourceInstanceId);
    if (!federatedSubscriber) {
      console.error(
        "[pubsub] federatedSubscriber not connected for sourceInstanceId",
        {
          sourceInstanceId,
        }
      );
      return;
    }

    if (subscribedTopics && Array.isArray(subscribedTopics)) {
      subscribedTopics?.forEach((subscribedTopic) => {
        const { channel, topic } = subscribedTopic;
        if (!channel || !topic) {
          console.error("[pubsub] channel or topic not found", {
            subscribedTopic,
          });
          return;
        }
        this.subscriptionHelper.subscribe(
          {
            subscriptionId: federatedSubscriber?.subscriberId,
            channel,
            topic,
            subscriber: federatedSubscriber,
          },
          { forceGenerateSubscriptionId: true }
        );
      });
    }
  };

  #handleFederatedMessage = (message: any) => {
    if (!isPubSubMessage(message)) {
      return;
    }
    if (isSyncSubscribedTopicsMessage(message)) {
      this.#handleSyncSubscribedTopicsMessage(message);
      return;
    }
    if (isSystemChannel(message)) {
      // Do not forward system message
      return;
    }
    this.publisher.publish(message);
  };

  handleConnectionStartMessage = ({
    target,
    message,
  }: {
    target: FederationTargetUserInput;
    message: any;
  }) => {
    if (isConnectionStartMessage(message)) {
      this.acceptConnection({
        target,
      });

      this.transportHelper.listen({
        target,
        onMessage: (message: any) => {
          this.#handleFederatedMessage(message);
        },
      });
      this.register({
        target,
        subscriberId: getSourceInstanceIdFromHeader(message),
      });
      return true;
    }
    return false;
  };

  listenToAcceptConnection = ({
    target,
  }: {
    target: FederationTargetUserInput;
  }) => {
    this.transportHelper.listen({
      target,
      onMessage: (message: any) => {
        if (!isPubSubMessage(message)) {
          return;
        }
        if (isConnectionAcceptMessage(message)) {
          this.register({
            target,
            subscriberId: getSourceInstanceIdFromHeader(message),
          });
          // performance.mark(
          //   `startConnection.end.${getSourceInstanceIdFromHeader(
          //     message
          //   )}_${getRequestIdFromHeader(message)}`
          // );
          return;
        }
        this.#handleFederatedMessage(message);
      },
    });
  };

  startConnection = ({ target }: { target: FederationTargetUserInput }) => {
    const requestId = nanoid();
    // performance.mark(`startConnection.start.${this.instanceId}_${requestId}`);
    this.transportHelper.transport({
      target,
      envelope: {
        channel: SystemChannel,
        topic: Topics.Federation.Connection.START,
        header: {
          requestId,
        },
        payload: {},
      },
    });
  };

  acceptConnection = ({ target }: { target: FederationTargetUserInput }) => {
    this.transportHelper.transport({
      target,
      envelope: {
        channel: SystemChannel,
        topic: Topics.Federation.Connection.ACCEPT,
        header: {},
        payload: {},
      },
    });
  };

  subscribe = ({
    channel,
    topic,
    filter,
  }: {
    channel?: ChannelName;
    topic: TopicName;
    filter?: string;
  }) => {
    this.federatedSubscribers?.forEach((federatedSubscriber) => {
      this.subscriptionHelper.subscribe(
        {
          subscriptionId: federatedSubscriber?.subscriberId,
          channel,
          topic,
          filter,
          subscriber: federatedSubscriber,
        },
        { forceGenerateSubscriptionId: true }
      );
    });
  };
}
