const express = require('express');
const line = require('@line/bot-sdk');
const fs = require('fs');
const axios = require('axios');

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

app.use(express.static('static'))

const dataPath = key => `.data/${key}.json`
const storage = {
  async get(key) {
    const filePath = dataPath(key)
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath, 'utf8')
    } else {
      return null
    }
  },
  async set(key, value) {
    const filePath = dataPath(key)
    return fs.writeFileSync(filePath, String(value), 'utf8')
  },
}

const client = new line.Client(config);
const handleEvent = async event => {
  if (event.type !== 'message') {
    return null;
  }
  const userId = event.source.userId
  if (!userId || !/^U\w+$/.test(userId)) {
    throw new Error(`Invalid user ID: ${userId}`)
  }

  const url = await storage.get(`${userId}.url`)
  let secret = await storage.get(`${userId}.secret`)
  if (!secret) {
    secret = 'SK' + require('crypto').randomBytes(20).toString('hex')
    await storage.set(`${userId}.secret`, secret)
  }

  if (event.message.type === 'text') {
    const text = event.message.text
    const m1 = /^\s*\/post(?:\s+([^]+))?/i.exec(text)
    if (text) {
      
    }
  }

  if (!url) {
    return client.replyMessage(event.replyToken, [
      {
        type: 'text',
        text: 'Hmmm... It seems like you haven’t set a URL yet! To set a URL, send the following command:'
      },
      {
        type: 'text',
        text: '/post set-url <URL>'
      }
    ]);
    return
  }
}

app.listen(3000);