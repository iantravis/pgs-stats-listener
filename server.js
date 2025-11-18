// server.js
const express = require('express');
const cheerio = require('cheerio');

const app = express();

// Simple CORS middleware
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*'); // or your domain instead of *
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
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

    // Find each counter + match by its title
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('PGS stats listener running on port ' + PORT);
});
