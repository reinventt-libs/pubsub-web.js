import { nanoid } from "nanoid";

import {
  Transporter,
  TransportType,
  Subscriber,
  MessageEnvelope,
} from "@reinventt/pubsub-web-specs";

export default class TransportHelper {
  private instanceId: string;

  /**
   * There won't be multiple updations/deletions on this map.
   * Using Object as a map instead of `Map` interface, since the usecase is simple
   */
  private transporterMap: Record<string, Transporter> = {};

  constructor({ instanceId }: { instanceId: string }) {
    this.instanceId = instanceId;
  }

  register = (transporter: Transporter) => {
    const transportType = transporter?.getTransportType();
    if (this.transporterMap[transportType]) {
      // Transport type already registered
      // Do we need to throw error? or log & ignore?
      return;
    }
    this.transporterMap[transportType] = transporter;
  };

  getTransport = (transportType: TransportType) => {
    return this.transporterMap[transportType];
  };

  #getTransport = (target: Subscriber) => {
    const transportType = target?.transportType;
    return this.getTransport(transportType);
  };

  transport = ({
    target,
    envelope: { channel, topic, header: headerOriginal, payload },
  }: {
    target: Subscriber;
    envelope: MessageEnvelope;
  }) => {
    try {
      // Inject source instanceId to the header always
      // If we don't do this, we might end up with an infinite loop
      // while trying to federate across pubsub instances
      const header = {
        ...headerOriginal,
        source: {
          ...(headerOriginal?.source || {}),
          instanceId: this.instanceId,
          messageId: nanoid(),
        },
      };
      this.#getTransport(target)?.transport({
        target,
        envelope: { channel, topic, header, payload },
      });
    } catch (error) {
      console.log("error while delivering message", error);
    }
  };

  listen = ({
    target,
    onMessage,
  }: {
    target: Subscriber;
    onMessage: (props: any) => void;
  }): void | never => {
    try {
      this.#getTransport(target)?.listen({ target, onMessage });
    } catch (error) {
      console.log("error while listening message", error);
    }
  };
}
