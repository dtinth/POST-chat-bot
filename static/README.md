POST chat bot
=============

POST chat bot is a simple LINE bot that sends an HTTP POST request to a URL of your choosing.

## Usage

### Add the bot

You can add the bot as your friend by scanning the QR code below or <a href="https://line.me/R/ti/p/%40605xwmmj">add @605xwmmj</a>:

<a href="http://nav.cx/7fkj0uj"><img src="https://qr-official.line.me/sid/M/605xwmmj.png"></a>

### Set the URL

Send this command to the bot, replacing `<URL>` with an actual URL you want:

```
/post set-url <URL>
```

### Handle the request

POST chat bot will send an HTTP POST request to the URL you set with `Content-Type` header set to `application/x-www-form-urlencoded`.
The POST body will contain these fields:

| field | description |
| ----- | ----------- |
| `secret` | The secret key that can be checked to ensure that the message came from the bot. |
| `user_id` | The user ID that sent the message. |
| `type` | The type of the message, such as `text` or `sticker`. |
| `text` | For `type=text`, the text message. |
| `sticker` | The sticker ID in format of `<packageId>/<stickerId>`. |
| `raw` | The raw [message event](https://developers.line.biz/en/reference/messaging-api/#message-event) received from LINE, JSON-encoded. |
