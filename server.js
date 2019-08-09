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

const dataPath = key => `.data/${key}.txt`

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

  console.log(`[${new Date()}] Message from ${userId}`)
  const url = await storage.get(`users.${userId}.url`)
  const profile = await client.getProfile(userId)
  let secret = await storage.get(`users.${userId}.secret`)
  if (!secret) {
    secret = generateSecret()
    await storage.set(`users.${userId}.secret`, secret)
  }

  // TODO [#1]: Create a feature flag system to allow beta users to test out new commands.
  //
  // Detailed design:
  // - Create an ENV that holds LINE user IDs that should have beta access, comma separated.
  // - When booting the environment variable file is loaded and saved into a Set.
  // - The current user is considered a better user if the user ID appears in this Set.
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
          ]
        }
      },
      {
        name: 'get-secret',
        usage: '',
        description: 'Show the secret used to authenticate the POST request.',
        async run() {
          return [
            {
              type: 'text',
              text: `This is the secret:`
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
      },
      // TODO [#2]: Add "unset-url" command
      //
      // This command removes the set URL.

      // TODO [#3]: Add "share" command
      //
      // This command allows user to share their endpoint with other users, without having to share the URL or secret.
      // Once a user joined, they can send message to your endpoint, using your secret.
      // However the user ID will appear to originate from the joining user.
      //
      // The command will generate temporarily 6-digit key. For instance, 123456.
      // Other users can use it by sending `/post join 123456`.
      //
      // The 6-digit key only works for 6 hours,
      // but the users who previously joined remains joined even after the key expired.
      //
      // Design:
      // 1. Check if a sharing session is active. If not, generate a "share token" and assign to `users.${userId}.shareToken`.
      // 2. Check if an existing "join key" is associated, and still belongs to the user.
      //     - If yes, extend its expiry time by setting it to now plus 6 hours.
      //     - If no, generate a new, unused join key, and associate it to the user+share token, setting its expiry time to now plus 6 hours.
      //       1. Write `{ userId, shareToken, expires}` to `joinKeys.${joinJey}`.
      //       2. Write `${joinKey}` to `users.${userId}.currentJoinKey`.
      // 3. Display the "join key".
      //
      // Glossary:
      // - **join key** — The six digit number used to join a share session.
      // - **share token** — A secret token that is used by another user to confirm that they have access. This is used internally and never exposed to the user.

      // TODO [#4]: Add "unshare" command
      //
      // This command ends the sharing session immediately.
      // Everyone who has previously joined the session will be forced to leave.
      //
      // 1. Check if an existing "join key" is associated, and still belongs to the user. If so, destroy that join key.
      // 2. Delete the user’s share token.

      // TODO [#5]: Add "join" command
      //
      // This command lets user join an active sharing session.
      // For convenience, a user without an URL set can send the 6-digit number to the bot to join the session.

      // TODO [#6]: Add "leave" command
      //
      // This command lets user leave the session they’ve joined.
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

  // TODO [#7]: Check if user has joined a shared session and load the URL and secret from that.

  if (!url) {
    // TODO [#8]: Check if a 6-digit number is provided and join if the join key exists.
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
  params.user_name = profile.displayName;
  params.user_picture_url = profile.pictureUrl;
  params.id = event.message.id;
  params.type = event.message.type;
  if (event.message.text) {
    params.text = event.message.text;
  }
  if (event.message.stickerId) {
    params.sticker = [event.message.packageId, event.message.stickerId].join('/');
  }
  params.raw = JSON.stringify(event);
  
  // TODO [#11]: Create a signed URL for retrieving the file.

  const jar = getJar(userId)
  // https://github.com/axios/axios/issues/48
  const cookie = (await promisify(jar.getCookies).call(jar, 'https://localhost/'))
  const response = await axios.post(url, qs.stringify(params), {
    headers: {
      cookie: cookie.join('; '),
    },
    withCredentials: true,
    validateStatus: () => true,
  });
  try {
    await (response.headers['set-cookie'] || []).map(c => {
      return promisify(jar.setCookie).call(jar, Cookie.parse(c), 'https://localhost/')
    })
  } catch (e) {
    console.log('Cannot set cookie', e)
  }

  let data = response.data
  if (typeof data !== 'string') {
    const isRichMessage = Array.isArray(data) && data.length > 0 && data.every(item => item && typeof item.type === 'string')
    if (isRichMessage) {
      return data
    }
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