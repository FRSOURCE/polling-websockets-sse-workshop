const express = require('express');
const router = express.Router();
const messages = [];

const findMessagesSince = (since) => {
  const sinceIndex = messages.findIndex(({ created }) => created === since);
  return messages.slice(sinceIndex + 1);
};

router.get('/', function(req, res, next) {
  const { since } = req.query;
  if (since) {
    const response = findMessagesSince(since);
    if (response.length) res.json(response);
    else res.sendStatus(304);
  } else res.json(messages);
});

router.post('/', function(req, res, next) {
  messages.push({ content: req.body.content, created: new Date().toISOString() });
  res.sendStatus(201);
});

module.exports = router;
