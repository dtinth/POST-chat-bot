const express = require('express');
const line = require('@line/bot-sdk');
const fs = require('fs');
const axios = require('axios').create({
  responseType: 'text'
});
const didYouMean = require('didyoumean');
const qs = require('qs');
const cookieStore = require('tough-cookie-file-store');
const { Cookie, CookieJar } = require('tough-cookie');
const { promisify } = require('util');

if (process.env.GIT_EMAIL) {
  require('child_process').execSync(`git config user.email ${process.env.GIT_EMAIL}`)
}

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

const jars = new Map()
const getJar = userId => {
  if (jars.has(userId)) return jars.get(userId)
  const jar = new CookieJar(new cookieStore(`.data/users.${userId}.cookies.json`))
  jars.set(userId, jar)
  return jar
}

const client = new line.Client(config);
const handleEvent = async event => {
  if (event.type !== 'message') {
    return null;
  }
  try {
    await client.replyMessage(event.replyToken, await handleMessageEvent(event));
  } catch (e) {
    let sent = false
    let message = e.originalError && e.originalError.response && e.originalError.response.data && e.originalError.response.data.message
    if (message) {
      if (Array.isArray(e.originalError.response.data.details)) {
        message += e.originalError.response.data.details.map(d => `\n${d.property}: ${d.message}`).join('')
      }
      await client.replyMessage(event.replyToken, {
        type: 'text',
        text: `Error from LINE API: ${message}`
      });
      sent = true
    }
    console.error(e)
    if (!sent) {
      await client.replyMessage(event.replyToken, {
        type: 'text',
        text: `Unknown failure: ${e}`
      });
      sent = true
    }
  }
}

const generateSecret = () => 'SK' + require('crypto').randomBytes(20).toString('hex')

const handleMessageEvent = async event => {
  const userId = event.source.userId
  if (!userId || !/^U\w+$/.test(userId)) {
    throw new Error(`Invalid user ID: ${userId}`)
  }

  const url = await storage.get(`users.${userId}.url`)
  let secret = await storage.get(`users.${userId}.secret`)
  if (!secret) {
    secret = generateSecret()
    await storage.set(`users.${userId}.secret`, secret)
  }

  if (event.message.type === 'text') {
    const text = event.message.text.trim()
    const m = /^\/post(?:\s+([\S]+)(?:\s+([^]+))?)?/i.exec(text)
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
          await storage.set(`users.${userId}.url`, url)
          return [
            {
              type: 'text',
              text: `Alright! I’ve changed the URL 😊`
            },
            {
              type: 'text',
              text: `From now, when you send me messages, I will make a POST request to that URL.`
            },
            {
              type: 'text',
              text: `To verify that the request came from me, you can check the "secret" parameter, which should be:`
            },
            {
              type: 'text',
              text: `${secret}`
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
          await storage.set(`users.${userId}.secret`, secret)
          return [
            {
              type: 'text',
              text: `This is your new "secret" parameter:`
            },
            {
              type: 'text',
              text: `${secret}`
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

  const params = {
  };
  params.secret = secret;
  params.user_id = userId;
  params.id = event.message.id;
  params.type = event.message.type;
  if (event.message.text) {
    params.text = event.message.text;
  }
  if (event.message.stickerId) {
    params.sticker = [event.message.packageId, event.message.stickerId].join('/');
  }
  params.raw = JSON.stringify(event);

  const jar = getJar(userId)
  // https://github.com/axios/axios/issues/48
  const cookie = (await promisify(jar.getCookies).call(jar, config.url))
  console.log(cookie)
  const response = await axios.post(url, qs.stringify(params), {
    headers: {
      cookie,
    },
    withCredentials: true,
  });
  console.log(response.headers)
  await (response.headers['set-cookie'] || []).map(c => {
    return promisify(jar.setCookie).call(jar, Cookie.parse(c), response.config.url)
  })
  jar.serialize(console.log)

  let data = response.data
  if (typeof data !== 'string') {
    data = JSON.stringify(data, null, 2)
  }
  return [
    {
      type: 'text',
      text: String(data)
    }
  ]    
}

app.listen(3000, () => {
  console.log('App started')
});