const express = require('express');
const router = express.Router();
const EventEmitter = require('events');

const messages = [];
let messageId = 0;
const messageEmitter = new EventEmitter();

const SSEHeaders = {
  'Content-Type': 'text/event-stream',
  'Connection': 'keep-alive',
  'Cache-Control': 'no-cache'
};

const findMessagesSince = (since) => {
  const sinceIndex = messages.findIndex(({ created }) => created === since);
  return messages.slice(sinceIndex + 1);
};

const sendSSEData = (res, data) => {
  // res.write(`id: ${++messageId}\n`); // optional
  // res.write('event: example-event-name\n'); // optional (default name: message)
  // res.write('retry: 10000\n'); // optional
  res.write(`data: ${JSON.stringify(data)}\n\n`);
};

router.get('/', (req, res) => {
  let since;

  const onNewMessage = () => {
    const newMessages = since ? findMessagesSince(since) : messages;
    if (!newMessages.length) return;
    since = messages[messages.length - 1].created;

    sendSSEData(res, newMessages);
  };

  res.writeHead(200, SSEHeaders);

  onNewMessage();

  messageEmitter.on('new-message', onNewMessage);
  req.on('close', () => {
    messageEmitter.removeListener('new-message', onNewMessage);
  });
});

router.post('/', function(req, res, next) {
  messages.push({ content: req.body.content, created: new Date().toISOString() });
  messageEmitter.emit('new-message');
  res.sendStatus(201);
});

module.exports = router;
