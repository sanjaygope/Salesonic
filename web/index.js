const express = require('express');
const { shopifyApi, LATEST_API_VERSION } = require('@shopify/shopify-api');
const { ElevenLabsClient } = require('@elevenlabs/elevenlabs-js');
require('dotenv').config();

const app = express();
app.use(express.json());

if (process.env.NODE_ENV === 'production') {
  app.use(express.static('../frontend/build'));
}

const shopify = shopifyApi({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET,
  scopes: ['write_products', 'write_orders', 'write_themes'],
  hostName: process.env.SHOPIFY_APP_URL.replace(/https?:\/\//, ""),
});

const elevenlabs = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY,
});

const { searchProducts, viewProduct, addToCart, viewCart, applyDiscount } = require('./agent-tools.js');

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

app.post('/api/create-agent', async (req, res) => {
  const { name, description, systemPrompt, initialMessage, voiceId, mcp } = req.body;

  try {
    const agent = await elevenlabs.agents.create({
      name: name,
      description: description,
      system_prompt: `${systemPrompt}\n\n${mcp}`,
      initial_message: initialMessage,
      voice_id: voiceId,
    });

    res.status(200).json(agent);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/embed-agent', shopify.validateAuthenticatedSession(), async (req, res) => {
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

app.post('/api/agent-tool/search-products', shopify.validateAuthenticatedSession(), async (req, res) => {
  const { query } = req.body;
  const session = res.locals.shopify.session;

  try {
    const products = await searchProducts(session, query);
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/agent-tool/view-product', shopify.validateAuthenticatedSession(), async (req, res) => {
  const { productId } = req.body;
  const session = res.locals.shopify.session;

  try {
    const product = await viewProduct(session, productId);
    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/agent-tool/add-to-cart', shopify.validateAuthenticatedSession(), async (req, res) => {
  const { cartId, variantId, quantity } = req.body;
  const session = res.locals.shopify.session;

  try {
    const cart = await addToCart(session, cartId, variantId, quantity);
    res.status(200).json(cart);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/agent-tool/view-cart', shopify.validateAuthenticatedSession(), async (req, res) => {
  const { cartId } = req.body;
  const session = res.locals.shopify.session;

  try {
    const cart = await viewCart(session, cartId);
    res.status(200).json(cart);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/agent-tool/apply-discount', shopify.validateAuthenticatedSession(), async (req, res) => {
  const { cartId, discountCode } = req.body;
  const session = res.locals.shopify.session;

  try {
    const cart = await applyDiscount(session, cartId, discountCode);
    res.status(200).json(cart);
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