import {
  Transporter,
  TransportType,
  Subscriber,
  MessageEnvelope,
} from "@reinventt/pubsub-web-specs";

export default class AbstractTransporter implements Transporter {
  protected transportType: TransportType;

  getTransportType = () => {
    return this.transportType;
  };

  canTransport = ({ target }: { target: Subscriber }) => {
    return target?.transportType === target.transportType;
  };

  transport = (props: {
    target: Subscriber;
    envelope: MessageEnvelope;
  }): void | never => {
    throw Error("Not implemented");
  };

  listen = (props: {
    target: Subscriber;
    onMessage: (props: any) => void;
  }): void | never => {
    throw Error("Not implemented");
  };
}
