// server.js
const express = require('express');
const cors = require('cors');
const cheerio = require('cheerio');

const app = express();

/**
 * CORS – allow your Shopify storefront to call this API
 * For now we allow all origins ("*"). If you want to be strict,
 * replace "*" with "https://turfgroupaustralia.com.au" (or your actual domain).
 */
app.use(cors({
  origin: '*',
  methods: ['GET', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));

// Simple health check (optional)
app.get('/', (req, res) => {
  res.send('PGS stats listener is running');
});

app.get('/pgs-stats', async (req, res) => {
  try {
    const response = await fetch('https://premiumgolfsuites.com.au/', {
      headers: {
        'User-Agent': 'PGS-Stats-Sync/1.0'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch supplier page: ' + response.status);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const stats = {
      simulators: null,
      venues: null,
      users: null
    };

    // Parse each counter by its title
    $('.ecom__element.element__counter').each((_, el) => {
      const title = $(el).find('.element__counter--title').text().trim();
      const numEl = $(el).find('.element__counter--number');
      const raw =
        numEl.attr('data-to-value') ||
        numEl.text().trim();

      const value = raw ? parseInt(raw.replace(/,/g, ''), 10) : null;

      if (/simulator/i.test(title)) {
        stats.simulators = value;
      } else if (/venue/i.test(title)) {
        stats.venues = value;
      } else if (/user/i.test(title)) {
        stats.users = value;
      }
    });

    res.json({
      simulators: stats.simulators,
      venues: stats.venues,
      users: stats.users,
      updated_at: new Date().toISOString()
    });
  } catch (err) {
    console.error('PGS stats error:', err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Render will set PORT in env
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('PGS stats listener running on port ' + PORT);
});
