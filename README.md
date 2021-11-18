# pubsub-web &middot; [![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/reinventt-libs/pubsub-web.js/blob/main/LICENSE) [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/reinventt-libs/pubsub-web.js) [![npm version](https://img.shields.io/npm/v/@reinventt/pubsub-web.svg?style=flat)](https://www.npmjs.com/package/@reinventt/pubsub-web)

## Overview

TBD

## Key Features

TBD

## Installation

Using npm:

`npm install @reinventt/pubsub-web`

Using yarn:

`yarn add @reinventt/pubsub-web`

## Getting Started

## Examples

First you have to import the module:

```javascript
import PubSub from "@reinventt/pubsub-web";
```

### Basic example

```javascript
/*
 * Create a handler function to process the message
 */
const messageHandler = function ({ channel, topic, header, payload }) {
  console.log("[pubsub] message handler", { channel, topic, header, payload });
};

/*
 * Subscribe to specific channel & topic.
 *
 * We're keeping the returned `subscription id`,
 * in order to be able to unsubscribe later on
 */
const s1 = PubSub.subscribe({
  channel: "testchannel",
  topic: "x.y.z",
  onMessage: messageHandler,
});

/*
 * Publish asynchronously
 */
PubSub.publish({
  channel: "testchannel",
  topic: "x.y.z",
  payload: "Hello pubsub!",
});

/*
 * Publish synchronously, which is faster in some environments,
 * but will get confusing when one message triggers new messages
 * in the same execution chain. Use this with caution!
 */
PubSub.publishSync({
  channel: "testchannel",
  topic: "x.y.z",
  payload: "Hello pubsub!",
});

/*
 * Cancel specific subscription
 */
PubSub.unsubscribe({ subscriptionId: s1 });
```

### Hierarchical addressing

```javascript
/*
 * Receives message published for all sub topics of x (i.e., "x", "x.y", "x.y.z")
 */
const s1 = PubSub.subscribe({
  channel: "orders",
  topic: "item",
  onMessage: function ({ channel, topic, header, payload }) {
    console.log("[pubsub] 'item' toplevel message handler", {
      channel,
      topic,
      header,
      payload,
    });
  },
});

/*
 * Receives message published for all sub topics of x (i.e., "x", "x.y", "x.y.z")
 */
const s2 = PubSub.subscribe({
  channel: "orders",
  topic: "item.add",
  onMessage: function ({ channel, topic, header, payload }) {
    console.log("[pubsub] 'item.add' specific message handler", {
      channel,
      topic,
      header,
      payload,
    });
  },
});

/*
 * Receives message published for all topics for a given channel
 */
const s3 = PubSub.subscribe({
  channel: "orders",
  topic: "*",
  onMessage: function ({ channel, topic, header, payload }) {
    console.log("[pubsub] all topics message handler", {
      channel,
      topic,
      header,
      payload,
    });
  },
});

/*
 * Publish some messages
 */
PubSub.publish({
  channel: "orders",
  topic: "item.add",
  payload: { sku: "AZDTF4346", qty: 21 },
});
PubSub.publish({
  channel: "orders",
  topic: "item.remove",
  payload: { sku: "AZDTF4346", qty: 1 },
});
PubSub.publish({
  channel: "orders",
  topic: "payment.success",
  payload: {
    orderId: "42F8-8B6A-9557",
    transactionId: "5CB8F366-5F55-45D3-888D",
    amount: "236.05",
    status: "success",
  },
});
```

## Message Federation

TBD

## API

TBD

# Credits / Inpired by

- Channel based pubsub & concept of federation is inspired by https://github.com/postaljs/postal.js. However, the code is not a fork of the same. Instead this is built ground up to solve some of the unique needs.
- API contracts are loosely inspired by https://github.com/mroderick/PubSubJS. Heirarchical message delivery is inpired by this snippet https://github.com/mroderick/PubSubJS/blob/v1.9.4/src/pubsub.js#L93
