const express = require('express');
const line = require('@line/bot-sdk');

const config = {
  channelAccessToken: process.env.TOKEN,
  channelSecret: process.env.SECRET
};

const app = express();

app.post('/webhooks/line', line.middleware(config), (req, res) => {
  Promise
    .all(req.body.events.map(handleEvent))
    .then((result) => res.json(result))
    .catch(e => {
      console.error(e);
    });
});

app.use(express.static('static'));

const client = new line.Client(config);
const handleEvent = (event) => {
  if (event.type !== 'message' || event.message.type !== 'text') {
    return Promise.resolve(null);
  }

  return client.replyMessage(event.replyToken, {
    type: 'text',
    text: event.message.text
  });
}

app.listen(3000);