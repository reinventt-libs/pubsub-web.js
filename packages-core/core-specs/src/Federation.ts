export enum PubSubInstanceTypeEnum {
  LOCAL = "LOCAL",
  WEB_WORKER = "WEB_WORKER",
}

// Do we need this?
export interface PubSubInstance {
  instanceId: string;
  type: PubSubInstanceTypeEnum;
  reference: any;
}
