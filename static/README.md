POST chat bot
=============

POST chat bot is a simple LINE bot that sends an HTTP POST request to a URL of your choosing.

## Tutorial

You can prototype your own personal LINE bot in 5 minutes right now.

### Step 1: Add the bot

Scan this QR code below to [add the bot (@605xwmmj)](https://line.me/R/ti/p/%40605xwmmj):

[![Add the bot](https://qr-official.line.me/sid/M/605xwmmj.png)](https://line.me/R/ti/p/%40605xwmmj)

### Step 2: Meet the editor

We will set the bot to run the following code:

<div id="runkitEmbed">
exports.endpoint = createEndpoint(async request => {
    return 'Hello, world!'
})
</div>

### Step 3: Tell the bot to use the URL

<span id="sendLink">Send</span> this text to the bot:

<div class="chat-bubbles">
  <p class="bubble -me -clickable" onclick="docsUtils.copy('copyText')">
    <span id="copyText">/post set-url <strong id="endpointText">https://<em>[please wait...]</em></strong></span>
    <br>
    <small style="opacity: 0.5">(Click to copy)</small>
  </p>
  <p class="bubble -you">Alright! I’ve changed the URL 😊</p>
  <p class="bubble -you">From now, when you send me messages, I will make a POST request to that URL.</p>
</div>

### Step 4: Send it messages

When you send it a message, it will reply back with “Hello, world!”

<div class="chat-bubbles">
  <p class="bubble -me">test</p>
  <p class="bubble -you">Hello, world!</p>
</div>

### Step 5: Edit the code

You can go back to the code editor above, and change the code to make it do more things!
The changes will take effect immediately; no need to save!

Here are some code examples for you to try:

-   This will make the bot echo back the text you send it:

    ```js
    exports.endpoint = createEndpoint(async request => {
        return request.body.text
    })
    ```

-   This makes the bot send you a random LINE sticker:

    ```js
    exports.endpoint = createEndpoint(async request => {
        const stickerId = Math.floor(Math.random() * 17) + 1
        return [{ type: 'sticker', packageId: 1, stickerId }]
    })
    ```

-   This makes the bot send you a random menu from [Maidreamin API](https://ex-maid-blog.now.sh/):

    ```js
    exports.endpoint = createEndpoint(async request => {
        const menu = await fetch('https://maidreamin.now.sh/menu')
            .then(r => r.json())
            .then(d => [].concat(...Object.values(d.data).map(Object.values)))
        return menu[Math.floor(menu.length * Math.random())]
    })
    ```

-   [**See more examples &rarr;**](https://github.com/dtinth/POST-chat-bot/wiki/RunKit-Code-Examples)

## Usage reference

### Adding the bot

You can add the bot as your friend by scanning the QR code below or <a href="https://line.me/R/ti/p/%40605xwmmj">add @605xwmmj</a>:

<a href="https://line.me/R/ti/p/%40605xwmmj"><img src="https://qr-official.line.me/sid/M/605xwmmj.png"></a>

### Setting the URL

Send this command to the bot, replacing `<URL>` with an actual URL you want:

```
/post set-url <URL>
```

### Handling requests

POST chat bot will send an HTTP POST request to the URL you set with `Content-Type` header set to `application/x-www-form-urlencoded`.
The POST body will contain these fields:

| field | description |
| ----- | ----------- |
| `id` | The message ID from LINE. |
| `user_id` | The user ID that sent the message. |
| `type` | The type of the message, such as `text` or `sticker`. |
| `text` | For `type=text`, the text message. |
| `sticker` | The sticker ID in format of `<packageId>/<stickerId>`. |
| `raw` | The raw [message event](https://developers.line.biz/en/reference/messaging-api/#message-event) received from LINE, JSON-encoded. |
| `timestamp` | Number of seconds since epoch. |
| `signature` | See [verifying request authenticity](#verifying-request-authenticity) section |

For example, the following PHP script will make the bot send back the text you entered:

```php
<?php echo $_POST['text'];
```

…and this script will show the data it received:

```php
<?php print_r($_POST);
```

### Persisting state

You can use HTTP cookies to store the state via `set-cookie` header.
On the next message, the bot will send back the stored cookies.

**NOTE:** All URLs will share the same cookie storage (as if they are from the same domain).

### Verifying request authenticity

To verify that the POST request really comes from the POST bot,
it will generate for you a "secret" key that is used to authenticate the POST requests.

<div class="chat-bubbles">
  <p class="bubble -me">/post get-secret</p>
  <p class="bubble -you"><strong>SK5d3759ec6f0de68106b660a64696174316bd574a</strong></p>
</div>

1. To prevent unauthorized request, check the `signature` parameter.
   (Instructions to be written.)

2. To prevent replay attack, ensure that `id` is never used twice and that `timestamp` is recent enough.
   Otherwise, an attacker may send a request with same `id` and `timestamp` but with different message/username.

<!--
When making a POST request, the bot will send this secret string in the POST body under a parameter called `secret`.
-->

<!--
// TODO [#9]: Remove this comment when sharing endpoints is released.
//
**Security note:** If you share your endpoint allows others to run an arbitrary code, please be careful as they may be able to access the secret.
-->

### Sending response

The bot will send the response back to the user.

- **Plain text response** is the default.

- **Rich message response:** If you return a JSON array where each member is an object containing a string property `type`,
  then it is assumed that the response is an array of [LINE Message Objects](https://developers.line.biz/en/reference/messaging-api/#message-objects),
  and will be passed on to the Line API.

<!--
// TODO [#10]: Write the "Sharing endpoint" section
-->

## `/post` command reference

### `/post set-url <URL>`

Changes the bot URL to `<URL>`.

### `/post get-secret`

Show the secret used to authenticate the POST request.

### `/post reset-secret`

Resets the secret.