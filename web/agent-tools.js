const { shopifyApi } = require('@shopify/shopify-api');

async function searchProducts(session, query) {
  const client = new shopify.api.clients.Graphql({ session });

  const queryString = `
    {
      products(query: "title:${query}*", first: 10) {
        edges {
          node {
            id
            title
            description
            onlineStoreUrl
          }
        }
      }
    }
  `;

  const response = await client.query({ data: queryString });
  return response.body.data.products.edges.map(edge => edge.node);
}

async function addToCart(session, variantId, quantity) {
  const client = new shopify.api.clients.Graphql({ session });

  // First, we need to create a cart if one doesn't exist.
  // For simplicity, we'll assume a cart exists. In a real app, you'd need to handle cart creation.
  const cartId = "gid://shopify/Cart/1234567890"; // This is a placeholder

  const mutation = `
    mutation cartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
      cartLinesAdd(cartId: $cartId, lines: $lines) {
        cart {
          id
          lines(first: 10) {
            edges {
              node {
                id
                quantity
                merchandise {
                  ... on ProductVariant {
                    id
                    title
                  }
                }
              }
            }
          }
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const variables = {
    cartId: cartId,
    lines: [
      {
        merchandiseId: variantId,
        quantity: quantity,
      },
    ],
  };

  const response = await client.query({ data: { query: mutation, variables } });
  return response.body.data.cartLinesAdd;
}

module.exports = { searchProducts, addToCart };
