POST chat bot
=============

POST chat bot is a simple LINE bot that sends an HTTP POST request to a URL of your choosing.

## Tutorial

You can prototype your own personal LINE bot in 5 minutes right now.

### Step 1: Add the bot

Scan this QR code below to [add the bot (@605xwmmj)](https://line.me/R/ti/p/%40605xwmmj):

[![Add the bot](https://qr-official.line.me/sid/M/605xwmmj.png)](https://line.me/R/ti/p/%40605xwmmj)

### Step 2: Tell the bot to use the URL

Send this text to the bot:

<div class="chat-bubbles">
  <p class="bubble -me -clickable" onclick="docsUtils.copy('copyText')">
    <span id="copyText">/post set-url <strong id="endpointText">https://<em>[please wait...]</em></strong></span>
    <br>
    <small style="opacity: 0.5">(Click to copy)</small>
  </p>
  <p class="bubble -you">Alright! I’ve changed the URL 😊</p>
  <p class="bubble -you">From now, when you send me messages, I will make a POST request to that URL.</p>
</div>

### Step 3: Send it messages

When you send it a message, it will reply back with “Hello, world!”

<div class="chat-bubbles">
  <p class="bubble -me">test</p>
  <p class="bubble -you">Hello, world!</p>
</div>

### Step 4: Edit the code

You can change the code below, to make it do more things!

<div id="runkitEmbed">
exports.endpoint = createEndpoint(async request => {
    return 'Hello, world!'
})
</div>

#### Code examples

Here are some code examples for you to try:

-   This will make the bot echo back the text you send it:

    ```js
    exports.endpoint = createEndpoint(async request => {
        return request.body.text
    })
    ```

-   Want to know what else is available in `request.body`? Send it back:

    ```js
    exports.endpoint = createEndpoint(async request => {
        return request.body
    })
    ```

-   This makes the bot give you a random number between 1 and 6:

    ```js
    exports.endpoint = createEndpoint(async request => {
        return Math.floor(Math.random() * 6) + 1
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

-   This will make the bot keep track of how many messages you sent it:

    ```js
    exports.endpoint = createEndpoint(async (request, response) => {
        const count = (+request.cookies.count || 0) + 1
        response.cookie('count', count)
        if (count === 1) {
            return "You’ve sent me 1 message! Send more!"
        } else {
            return "You’ve sent me " + count + " messages!"
        }
    })
    ```

## Reference

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
| `secret` | The secret key that can be checked to ensure that the message came from the bot. |
| `user_id` | The user ID that sent the message. |
| `type` | The type of the message, such as `text` or `sticker`. |
| `text` | For `type=text`, the text message. |
| `sticker` | The sticker ID in format of `<packageId>/<stickerId>`. |
| `raw` | The raw [message event](https://developers.line.biz/en/reference/messaging-api/#message-event) received from LINE, JSON-encoded. |

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