const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const app = express();

app.use(cors());

const REDDIT_CLIENT_ID = 'TUO_CLIENT_ID';
const REDDIT_SECRET = 'TUO_CLIENT_SECRET';
let redditToken = null;

async function getRedditToken() {
  const res = await fetch('https://www.reddit.com/api/v1/access_token', {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + Buffer.from(`${REDDIT_CLIENT_ID}:${REDDIT_SECRET}`).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  });

  const data = await res.json();
  redditToken = data.access_token;
}

const subredditCategories = {
  real: ['nsfw_gifs', 'realgirls', 'gonewild', 'cumsluts', 'ass', 'boobs', 'legalteens'],
  hentai: ['hentai', 'rule34', 'nsfwhentai', 'animepussy', 'hentaigif'],
  cosplay: ['nsfwcosplay', 'cosplaybabes', 'cosplaygirls'],
  mix: ['nsfw', 'gonewildcolor', 'blowjobs', 'porninfocus', 'workgonewild']
};

subredditCategories.all = Object.values(subredditCategories).flat();

app.get('/reddit/:category?', async (req, res) => {
  const category = req.params.category || 'all';
  const pool = subredditCategories[category] || subredditCategories.all;
  const chosenSub = pool[Math.floor(Math.random() * pool.length)];

  if (!redditToken) await getRedditToken();

  const response = await fetch(`https://oauth.reddit.com/r/${chosenSub}/hot?limit=50`, {
    headers: {
      'Authorization': `Bearer ${redditToken}`,
      'User-Agent': 'joi-player'
    }
  });

  const json = await response.json();
  const posts = json.data.children;

  const media = posts
    .map(p => p.data)
    .filter(p =>
      p.url &&
      (p.url.endsWith('.mp4') || p.url.endsWith('.jpg') || p.url.endsWith('.png') || p.url.endsWith('.gif'))
    )
    .map(p => p.url);

  if (media.length > 0) {
    const random = media[Math.floor(Math.random() * media.length)];
    res.json({ url: random, from: chosenSub });
  } else {
    res.status(404).json({ error: 'Nessun media trovato.' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('JOI proxy attivo'));
