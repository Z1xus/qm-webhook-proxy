// index.js
const express = require('express');
const axios = require('axios');
const os = require('os');
var clc = require("cli-color");
require('dotenv').config();

// setup express app
const app = express();
const port = process.env.PORT || 3000;
const webhookURL = process.env.DISCORD_WEBHOOK_URL;

// parsing json and urlencoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// redirect root to GitHub repository
app.get('/', (_, res) => {
  res.redirect('https://github.com/Z1xus/qm-webhook-proxy');
});

// endpoint to process webhook requests
app.post('/api/webhook', async (req, res) => {
  const { logUrl, detailLog, authorName, timestamp } = req.body;

  if (!logUrl) {
    return res.status(400).json({ error: 'log-url is required' });
  }

  // create embed
  const embeds = [{
    title: "New Log Received",
    color: 16644863,
    timestamp: timestamp || new Date().toISOString(), // default to current time if timestamp is not provided
    fields: [
      {
        name: "Detail",
        value: detailLog || 'No details provided.'
      },
      {
        name: "Log URL",
        value: logUrl
      }
    ],
    author: {
      name: authorName || 'Anonymous'
    }
  }];

  // send webhook
  axios.post(webhookURL, { embeds }, { headers: { "Content-Type": "application/json" } })
    .then(response => {
      res.status(200).json({ message: 'webhook sent successfully.' });
    })
    .catch(error => {
      console.error('error sending webhook', error);
      res.status(error.response ? error.response.status : 500).json({
        error: 'an error occurred while sending webhook.'
      });
    });
});

// simple endpoint for healthcheck purposes
app.get('/api/healthcheck', (_, res) => {
  res.json({ status: 'ok' });
});

// get the network ip address
function getNetworkAddress() {
  const ifaces = os.networkInterfaces();
  for (const dev in ifaces) {
    for (const details of ifaces[dev]) {
      if (details.family === 'IPv4' && !details.internal) {
        return details.address;
      }
    }
  }
  return 'localhost';
}

// start the express server
app.listen(port, () => {
  const networkAddress = getNetworkAddress();
  console.log(clc.greenBright("\n   workie!"));
  console.log(clc.green("\n  ➜  ") + "Local:  " + clc.cyan("http://localhost:") + clc.cyanBright(`${port}`));
  console.log(clc.green("  ➜  ") + "Network:  " + clc.cyan(`${networkAddress}:`) + clc.cyanBright(`${port}`));
});
