const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const app = express();

app.use(cors());

// Reddit credentials
const REDDIT_CLIENT_ID = 's0z1rcxfv0UyvVntYiJldg';
const REDDIT_SECRET = 'wyZYLwRMUBZVNJu41T-_Kmliu-I2WQ';
let redditToken = null;
let tokenTimestamp = null;

// 🔐 Ottieni il token da Reddit
async function getRedditToken() {
  const response = await fetch('https://www.reddit.com/api/v1/access_token', {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + Buffer.from(`${REDDIT_CLIENT_ID}:${REDDIT_SECRET}`).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  });

  const json = await response.json();
  redditToken = json.access_token;
}


// 🔁 Subreddit per categoria
const subredditCategories = {
  real: ['nsfw_gifs', 'realgirls', 'gonewild', 'cumsluts', 'ass', 'boobs', 'legalteens'],
  cosplay: ['nsfwcosplay', 'cosplaybabes', 'cosplaygirls', 'cosplaybutts', 'cosplaygonewild'],
  hentai: ['hentai', 'rule34', 'nsfwhentai', 'animepussy', 'hentaigif'],
  mix: ['blowjobs', 'workgonewild', 'porninfocus']
};


subredditCategories.all = Object.values(subredditCategories).flat();

// 🌐 Rotta principale
app.get('/reddit/:category?', async (req, res) => {
  const category = req.params.category || 'all';
  const pool = subredditCategories[category] || subredditCategories.all;
  const chosenSub = pool[Math.floor(Math.random() * pool.length)];

  // 🔄 Refresh del token ogni 45 min
  if (!redditToken || (Date.now() - tokenTimestamp > 45 * 60 * 1000)) {
    await getRedditToken();
  }

  try {
    const response = await fetch(`https://oauth.reddit.com/r/${chosenSub}/hot?limit=50`, {
      headers: {
        'Authorization': `Bearer ${redditToken}`,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) RedditBot/1.0'
      }
    });

    const text = await response.text();

    // ✨ Reddit a volte ritorna HTML → errore
    let json;
    try {
      json = JSON.parse(text);
    } catch (e) {
      return res.status(500).json({ error: 'Reddit non ha restituito JSON valido.', details: text });
    }

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
  } catch (err) {
    console.error('Errore Reddit:', err);
    res.status(500).json({ error: 'Errore nella richiesta Reddit.' });
  }
});

// Avvio server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('✅ JOI proxy attivo'));
