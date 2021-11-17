import {
  GenericSubscriber,
  MessageEnvelope,
} from "@reinventt/pubsub-web-specs";

import AbstractTransporter from "./AbstractTransporter";

export interface WebWorkerSubscriber extends GenericSubscriber {
  reference: Worker;
}

export default class WebWorkerTransporter extends AbstractTransporter {
  static TRANSPORT_TYPE = "WEB_WORKER";

  constructor() {
    super();
    this.transportType = WebWorkerTransporter.TRANSPORT_TYPE;
  }

  transport = ({
    target,
    envelope,
  }: {
    target: WebWorkerSubscriber;
    envelope: MessageEnvelope;
  }) => {
    if (!this.canTransport({ target })) {
      // Invalid type, should we throw an error
      return;
    }
    if (target?.reference?.postMessage) {
      target.reference.postMessage(envelope);
    }
  };

  listen = ({
    target,
    onMessage,
  }: {
    target: WebWorkerSubscriber;
    onMessage: (props: any) => void;
  }): void | never => {
    if (target?.reference) {
      target.reference.onmessage = ({ data }: MessageEvent) => {
        onMessage(data);
      };
    }
  };
}
