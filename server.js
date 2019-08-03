const express = require('express');
const line = require('@line/bot-sdk');
const fs = require('fs');
const axios = require('axios');
const didYouMean = require('didyoumean');

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
  try {
    await client.replyMessage(event.replyToken, await handleMessageEvent(event));
  } catch (e) {
    if (e.originalError) {
      console.error(e.originalError.response && e.originalError.response.data)
    }
    console.error(e)
  }
}

const generateSecret = () => 'SK' + require('crypto').randomBytes(20).toString('hex')

const handleMessageEvent = async event => {
  const userId = event.source.userId
  if (!userId || !/^U\w+$/.test(userId)) {
    throw new Error(`Invalid user ID: ${userId}`)
  }

  const url = await storage.get(`${userId}.url`)
  let secret = await storage.get(`${userId}.secret`)
  if (!secret) {
    secret = generateSecret()
    await storage.set(`${userId}.secret`, secret)
  }

  if (event.message.type === 'text') {
    const text = event.message.text.trim()
    const m = /^\/post(?:\s+([^]+)(?:\s+([^]+))?)?/i.exec(text)
    const commands = [
      {
        name: 'set-url',
        usage: '<URL>',
        description: 'Set a URL',
        async run(text) {
          if (!text || !text.match(/^https:\/\//)) {
            return {
              type: 'text',
              text: 'Hmmm... It seems the URL you sent me is not an https URL. The URL should begin with `https://`.'
            }
          }
          const url = text
          return [
            {
              type: 'text',
              text: `Alright! I’ve changed the URL :D`
            },
            {
              type: 'text',
              text: `Now when you send me messages, I will make a POST request to that URL.`
            },
            {
              type: 'text',
              text: `The "secret" parameter is ${secret}. Check it to verify that the request came from me.`
            },
          ]
        }
      },
      {
        name: 'reset-secret',
        usage: '',
        description: 'Resets the secret.',
        async run(text) {
          secret = generateSecret()
          await storage.set(`${userId}.secret`, secret)
          return [
            {
              type: 'text',
              text: `The "secret" parameter has been changed to "${secret}. Check it to verify that the request came from me.`
            },
          ]
        }
      }
    ]
    if (m) {
      if (!m[1]) {
        return [
          {
            type: 'text',
            text: 'Hmmm... When you invoked `/post`, you should follow it with a command... such as:'
          },
          {
            type: 'text',
            text: commands.map(c => `/post ${c.name} ${c.usage}`.trim() + '\n    ' + c.description).join('\n\n')
          },
        ]
      }
      const commandName = m[1].toLowerCase()
      const matchedCommand = commands.find(c => c.name === commandName)
      if (!matchedCommand) {
        const list = commands.map(c => c.name)
        const result = didYouMean(commandName, list);

        return [
          {
            type: 'text',
            text: `Hmmm... I don’t understand the command \`/post ${commandName}\`...`
          },
          ...result ? [
            {
              type: 'text',
              text: `Did you meant... \`/post ${result} ...\`?`
            },
          ] : []
        ]
      }
      return await matchedCommand.run(m[2])
    }
  }

  if (!url) {
    return [
      {
        type: 'text',
        text: 'Hmmm... It seems like you haven’t set a URL yet! To set a URL, send the following command:'
      },
      {
        type: 'text',
        text: '/post set-url <URL>'
      }
    ]
  }
  
  return [
    {
      type: 'text',
      text: 'MEOW'
    }
  ]
}

app.listen(3000);