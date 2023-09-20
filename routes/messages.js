const express = require('express');
const router = express.Router();
const EventEmitter = require('events');

const messages = [];
const messageEmitter = new EventEmitter();

const findMessagesSince = (since) => {
  const sinceIndex = messages.findIndex(({ created }) => created === since);
  return messages.slice(sinceIndex + 1);
};

router.ws('/', function(ws, req) {
  let since;

  const onNewMessage = () => {
    const newMessages = since ? findMessagesSince(since) : messages;
    if (!newMessages.length) return;
    since = messages[messages.length - 1].created;

    ws.send(JSON.stringify(newMessages));
  };

  onNewMessage();

  messageEmitter.on('new-message', onNewMessage);
  ws.on('message', (data) => {
    const { content } = JSON.parse(data);
    messages.push({ content, created: new Date().toISOString() });
    messageEmitter.emit('new-message');
  });
  ws.on('close', () => {
    messageEmitter.removeListener('new-message', onNewMessage);
  });
});

module.exports = router;
