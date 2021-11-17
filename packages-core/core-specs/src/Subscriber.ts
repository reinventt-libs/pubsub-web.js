import { TransportType } from "./Transporter";

export type SubscriberId = string;

export interface GenericSubscriber {
  /**
   * unique identifier of the subscriber
   */
  subscriberId: SubscriberId;

  transportType: TransportType;
}

type ExtendsGenericSubscriber<S extends GenericSubscriber> = S;

export type Subscriber = ExtendsGenericSubscriber<any>;
