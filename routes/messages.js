const express = require('express');
const router = express.Router();
const EventEmitter = require('events');

const MAXIMUM_POLL_TIMEOUT = 15000;
const messages = [];
const messageEmitter = new EventEmitter();

const findMessagesSince = (since) => {
  const sinceIndex = messages.findIndex(({ created }) => created === since);
  return messages.slice(sinceIndex + 1);
};

const waitForMessageChanges = (since, onMessageChanged, onTimeout) => {
  const onNewMessage = () => {
    const newMessages = findMessagesSince(since);
    if (!newMessages.length) return;

    messageEmitter.removeListener('new-message', onNewMessage);
    clearTimeout(timeoutId);
    onMessageChanged(newMessages);
  };

  const timeoutId = setTimeout(() => {
    messageEmitter.removeListener('new-message', onNewMessage);
    onTimeout();
  }, MAXIMUM_POLL_TIMEOUT);

  messageEmitter.on('new-message', onNewMessage);
  onNewMessage();
};

router.get('/', function(req, res, next) {
  const { since } = req.query;
  waitForMessageChanges(
    since, 
    (newMessages) => res.json(newMessages),
    () => res.sendStatus(304),
  );
});

router.post('/', function(req, res, next) {
  messages.push({ content: req.body.content, created: new Date().toISOString() });
  messageEmitter.emit('new-message');
  res.sendStatus(201);
});

module.exports = router;
