const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const app = express();

app.use(cors());

const REDDIT_CLIENT_ID = 'Striking-Expert1218';
const REDDIT_SECRET = 'wyZYLwRMUBZVNJu41T-_Kmliu-I2WQ';
let redditToken = null;

async function getRedditToken() {
    const response = await fetch(`https://oauth.reddit.com/r/${chosenSub}/hot?limit=50`, {
    headers: {
      'Authorization': `Bearer ${redditToken}`,
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) RedditBot/1.0'
    }
  });

  const text = await response.text();
  try {
    const json = JSON.parse(text);
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
  } catch (e) {
    console.error('Errore nella conversione JSON:', e);
    res.status(500).json({ error: 'Reddit non ha restituito JSON valido.', details: text });
  }
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
