const express = require('express');
const line = require('@line/bot-sdk');

const config = {
  channelAccessToken: 'fA0bfXF8m7R8vhNh7JOFuyxWiSFXmmjvkjnZvAcvQEAixdDSC6Bf9wKygs8BVKQH+kogmTd9tJ3ZA1RI7ZgAT6xbTfGtGSdZWEoQu5YGpPzz86/INj+c9LHKrFM2cmVc02b22RIY6c2q82kjNx3B2gdB04t89/1O/w1cDnyilFU=',
  channelSecret: '69647fabb48a53d7ba4a12efd0f1d089'
};

const app = express();
app.get('/', () => {
  
})

app.listen(3000);
