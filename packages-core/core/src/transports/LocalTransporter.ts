import {
  GenericSubscriber,
  MessageEnvelope,
} from "@reinventt/pubsub-web-specs";
import AbstractTransporter from "./AbstractTransporter";

export interface OnMessageCallbackProps extends MessageEnvelope {}

export type OnMessageCallbackFunction = (props: OnMessageCallbackProps) => void;

export interface LocalSubscriber extends GenericSubscriber {
  onMessage: OnMessageCallbackFunction;
}

export default class LocalTransporter extends AbstractTransporter {
  static TRANSPORT_TYPE = "LOCAL";

  constructor() {
    super();
    this.transportType = LocalTransporter.TRANSPORT_TYPE;
  }

  transport = ({
    target,
    envelope,
  }: {
    target: LocalSubscriber;
    envelope: MessageEnvelope;
  }) => {
    if (!this.canTransport({ target })) {
      // Invalid type, should we throw an error
      return;
    }
    target?.onMessage && target?.onMessage(envelope);
  };
}
