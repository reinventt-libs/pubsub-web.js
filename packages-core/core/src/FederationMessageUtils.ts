import { ChannelName, TopicName } from "@reinventt/pubsub-web-specs";

import { SystemChannel, Topics } from "./Constants";

export const isSystemChannel = function (channel: ChannelName) {
  return SystemChannel === channel;
};

export const isTopicName_ConnectionStart = function (topicName: TopicName) {
  return Topics.Federation.Connection.START === topicName;
};

export const isTopicName_ConnectionAccept = function (topicName: TopicName) {
  return Topics.Federation.Connection.ACCEPT === topicName;
};

export const isTopicName_SyncSubscribedTopics = function (
  topicName: TopicName
) {
  return Topics.Federation.Sync.SUBSCRIBED_TOPICS === topicName;
};

export const isPubSubMessage = function (message: any) {
  try {
    return (
      message &&
      message.channel &&
      message.topic &&
      // message.header &&
      // message.header?.messageId &&
      // message.header?.source?.instanceId &&
      message.payload
    );
  } catch (err) {}
  return false;
};

export const isConnectionStartMessage = function (message: any) {
  return (
    message &&
    isPubSubMessage(message) &&
    isSystemChannel(message.channel) &&
    isTopicName_ConnectionStart(message.topic)
  );
};

export const isConnectionAcceptMessage = function (message: any) {
  return (
    message &&
    isPubSubMessage(message) &&
    isSystemChannel(message.channel) &&
    isTopicName_ConnectionAccept(message.topic)
  );
};

export const isSyncSubscribedTopicsMessage = function (message: any) {
  return (
    message &&
    isPubSubMessage(message) &&
    isSystemChannel(message.channel) &&
    isTopicName_SyncSubscribedTopics(message.topic)
  );
};

export const getSourceInstanceIdFromHeader = function (message: any) {
  const {
    header: { source: { instanceId: sourceInstanceId = undefined } = {} } = {},
  } = message || {};
  return sourceInstanceId;
};

export const getRequestIdFromHeader = function (message: any) {
  const { header: { requestId = undefined } = {} } = message || {};
  return requestId;
};

export const getSubscribedTopicsFromPayload = function (message: any) {
  const { payload: { subscribedTopics = [] } = {} } = message || {};
  return subscribedTopics;
};
