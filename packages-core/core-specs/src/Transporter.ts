import { MessageEnvelope } from "./MessageEnvelope";
import { Subscriber } from "./Subscriber";

enum TransportTypeEnum {
  LOCAL,
  WEB_WORKER,
}

export type TransportType = keyof typeof TransportTypeEnum | string;

export interface Transporter {
  getTransportType: () => TransportType;
  canTransport: ({ target }: { target: Subscriber }) => boolean;
  transport: ({
    target,
    envelope,
  }: {
    target: Subscriber;
    envelope: MessageEnvelope;
  }) => void | never;
  listen: ({
    target,
    onMessage,
  }: {
    target: Subscriber;
    onMessage: (props: any) => void;
  }) => void | never;
}
