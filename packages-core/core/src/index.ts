import { nanoid } from "nanoid";

import {
  MessageEnvelope,
  ChannelName,
  SubscriptionId,
  TopicName,
  TransportType,
  Transporter,
} from "@reinventt/pubsub-web-specs";

import { DEFAULT_CHANNEL_NAME } from "./Constants";
import Publisher from "./Publisher";
import SubscriptionHelper from "./SubscriptionHelper";
import TransportHelper from "./TransportHelper";
import FederationHelper, {
  FederationTargetUserInput,
} from "./FederationHelper";

import { OnMessageCallbackFunction } from "./transports/LocalTransporter";

import {
  isConnectionStartMessage,
  isConnectionAcceptMessage,
} from "./FederationMessageUtils";
import LocalTransporter from "./transports/LocalTransporter";
import WebWorkerTransporter from "./transports/WebWorkerTransporter";

interface SubscribeMethodUserInput {
  subscriptionId?: SubscriptionId;
  channel?: ChannelName;
  topic: TopicName;
  filter?: string;
  onMessage: OnMessageCallbackFunction;
}

class PubSub {
  private instanceId: string;
  private subscriptionHelper: SubscriptionHelper;
  private publisher: Publisher;
  private transportHelper: TransportHelper;
  private federationHelper: FederationHelper;

  constructor() {
    this.instanceId = nanoid();
    this.subscriptionHelper = new SubscriptionHelper({
      instanceId: this.instanceId,
    });
    this.transportHelper = new TransportHelper({ instanceId: this.instanceId });
    this.registerTransporter(new LocalTransporter());
    this.registerTransporter(new WebWorkerTransporter());
    this.publisher = new Publisher({
      instanceId: this.instanceId,
      subscriptionHelper: this.subscriptionHelper,
      transportHelper: this.transportHelper,
    });
    this.federationHelper = new FederationHelper({
      instanceId: this.instanceId,
      publisher: this.publisher,
      subscriptionHelper: this.subscriptionHelper,
      transportHelper: this.transportHelper,
    });
  }

  getInstanceId = () => this.instanceId;

  registerTransporter = (transporter: Transporter) => {
    this.transportHelper.register(transporter);
  };

  // tap: () => {},
  channel = ({
    channel,
  }: Pick<SubscribeMethodUserInput, keyof { channel }>) => {
    return {
      subscribe: (props: Omit<SubscribeMethodUserInput, "channel">) => {
        return this.subscribe({
          ...props,
          channel,
        });
      },
    };
  };
  topic = ({
    channel,
    topic,
  }: Pick<SubscribeMethodUserInput, keyof { channel; topic }>) => {
    return {
      subscribe: (
        props: Omit<SubscribeMethodUserInput, keyof { channel; topic }>
      ) => {
        return this.subscribe({
          ...props,
          channel,
          topic,
        });
      },
    };
  };
  subscribe = ({
    subscriptionId: subscriptionIdNullable,
    channel: channelNullable,
    topic,
    filter,
    onMessage,
  }: SubscribeMethodUserInput) => {
    const subscriptionId = subscriptionIdNullable || nanoid();
    const channel = channelNullable || DEFAULT_CHANNEL_NAME;

    const subscriptionIdResponse = this.subscriptionHelper.subscribe({
      subscriptionId,
      channel,
      topic,
      filter,
      subscriber: {
        subscriberId: this.getInstanceId(),
        transportType: LocalTransporter.TRANSPORT_TYPE,
        onMessage,
      },
    });
    setTimeout(() => {
      this.federationHelper.subscribe({
        channel,
        topic,
        filter,
      });
    }, 0);
    return subscriptionIdResponse;
  };
  // subscribeAll = () => {},
  // subscribeOnce = () => {},
  unsubscribe = (props: { subscriptionId: SubscriptionId }) => {
    return this.subscriptionHelper.unsubscribe(props);
  };

  publish = (envelope: MessageEnvelope) => {
    setTimeout(() => {
      this.publisher.publish(envelope);
    }, 0);
  };

  publishSync = (envelope: MessageEnvelope) => {
    this.publisher.publish(envelope);
  };

  federation = {
    isConnectionStartMessage,
    isConnectionAcceptMessage,
    webworker: (reference: Worker) => {
      return this.federation.target({
        transportType: "WEB_WORKER",
        reference,
      });
    },
    target: (target: FederationTargetUserInput) => {
      return {
        handleConnectionStartMessage: (message: any) => {
          return this.federationHelper.handleConnectionStartMessage({
            target,
            message,
          });
        },
        startConnection: () => {
          if (typeof window === "undefined") {
            // Connection can be started via window scope only
            // TODO: Need to revisit this.
            return;
          }
          this.federationHelper.listenToAcceptConnection({ target });
          this.federationHelper.startConnection({ target });
        },
        acceptConnection: () => {
          this.federationHelper.acceptConnection({
            target,
          });
        },
      };
    },
  };
}

export default new PubSub();
