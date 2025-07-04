const express = require('express');
const { shopifyApi, LATEST_API_VERSION } = require('@shopify/shopify-api');
const { ElevenLabsClient } = require('@elevenlabs/elevenlabs-js');
require('dotenv').config();

const app = express();
app.use(express.json());

const shopify = shopifyApi({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET,
  scopes: ['write_products', 'write_orders', 'write_themes'],
  hostName: 'localhost',
});

const elevenlabs = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY,
});

app.use('/api/*', shopify.validateAuthenticatedSession());

app.get('/api/auth', async (req, res) => {
    await shopify.auth.begin({
        shop: shopify.utils.sanitizeShop(req.query.shop, true),
        callbackPath: '/api/auth/callback',
        isOnline: false,
        rawRequest: req,
        rawResponse: res,
    });
});

app.get('/api/auth/callback', async (req, res) => {
    const session = await shopify.auth.callback({
        rawRequest: req,
        rawResponse: res,
    });

    // You can now use the session to make API requests

    res.redirect(`/?shop=${session.shop}`);
});
  const { name, description, systemPrompt, initialMessage, voiceId } = req.body;

  try {
    const agent = await elevenlabs.agents.create({
      name: name,
      description: description,
      system_prompt: systemPrompt,
      initial_message: initialMessage,
      voice_id: voiceId,
    });

    res.status(200).json(agent);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/embed-agent', async (req, res) => {
  const { agentId } = req.body;
  const session = res.locals.shopify.session;

  try {
    const themes = await shopify.api.rest.Theme.all({
      session: session,
    });

    const mainTheme = themes.data.find(theme => theme.role === 'main');

    if (!mainTheme) {
      return res.status(404).json({ error: 'Main theme not found' });
    }

    const asset = new shopify.api.rest.Asset({
      session: session,
      theme_id: mainTheme.id,
    });
    asset.key = 'snippets/elevenlabs-widget.liquid';
    asset.value = `<script src="https://unpkg.com/@elevenlabs/convai-widget-embed" async type="text/javascript"></script><elevenlabs-convai agent-id="${agentId}"></elevenlabs-convai>`;
    await asset.save({ update: true });

    const themeAsset = new shopify.api.rest.Asset({
        session: session,
        theme_id: mainTheme.id,
        asset: {
            key: 'layout/theme.liquid',
        },
    });

    const themeSource = await themeAsset.get();
    const newThemeSource = themeSource.value.replace(
        '</body>',
        `{% include 'elevenlabs-widget' %}</body>`
    );

    themeAsset.value = newThemeSource;
    await themeAsset.save({ update: true });

    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const { searchProducts, addToCart } = require('./agent-tools.js');

app.post('/api/agent-tool/search-products', async (req, res) => {
  const { query } = req.body;
  const session = res.locals.shopify.session;

  try {
    const products = await searchProducts(session, query);
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/get-conversations', async (req, res) => {
  try {
    const conversations = await elevenlabs.history.getAll();
    res.status(200).json(conversations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = app;
