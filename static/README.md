POST chat bot
=============

POST chat bot is a simple LINE bot that sends an HTTP POST request to a URL of your choosing.

## Tutorial

You can prototype your own personal LINE bot in 5 minutes right now.

### Step 1: Add the bot

Scan this QR code below to <a href="https://line.me/R/ti/p/%40605xwmmj">add the bot (@605xwmmj)</a>:

<a href="https://line.me/R/ti/p/%40605xwmmj"><img src="https://qr-official.line.me/sid/M/605xwmmj.png"></a>

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

When you send it a message, it will reply back with “Hello world!”

<div class="chat-bubbles">
  <p class="bubble -me">test</p>
  <p class="bubble -you">Hello world!</p>
</div>

### Step 4: Edit the code

You can change the code below, to make it do more things!

<div id="runkitEmbed">
exports.endpoint = createEndpoint(async request => {
    return request
})
</div>

Here are some examples for you to try:

- Inspecting the request:

  ```js
    return request.body
  ```

- Repeating the text user entered:

  ```js
    return request.body.text
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