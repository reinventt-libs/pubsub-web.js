import { ChannelName, TopicName, MessageHeader, MessagePayload } from "./basic";

export interface MessageEnvelope {
  channel: ChannelName;
  topic: TopicName;
  header?: MessageHeader;
  payload: MessagePayload;
}
