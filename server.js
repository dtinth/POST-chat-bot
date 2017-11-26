const express = require('express');

const app = express();
app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.post('/webhook', (req, res) => {
  res.send('Hello World!');
});

app.listen(3000);