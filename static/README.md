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
  <p class="me">/post set-url <strong id="endpointText">https://<em>[please wait...]</em></strong></p>
</div>


<!-- <div id="runkitEmbed">
exports.endpoint = function(request, response) {
    response.end("Hello world!");
}
</div> -->


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