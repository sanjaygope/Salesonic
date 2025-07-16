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
            variants(first: 10) {
              edges {
                node {
                  id
                  title
                  price
                }
              }
            }
          }
        }
      }
    }
  `;

  const response = await client.query({ data: queryString });
  return response.body.data.products.edges.map(edge => edge.node);
}

async function viewProduct(session, productId) {
  const client = new shopify.api.clients.Graphql({ session });

  const queryString = `
    {
      product(id: "${productId}") {
        id
        title
        description
        onlineStoreUrl
        variants(first: 10) {
          edges {
            node {
              id
              title
              price
            }
          }
        }
      }
    }
  `;

  const response = await client.query({ data: queryString });
  return response.body.data.product;
}

async function addToCart(session, cartId, variantId, quantity) {
  const client = new shopify.api.clients.Graphql({ session });

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

async function viewCart(session, cartId) {
  const client = new shopify.api.clients.Graphql({ session });

  const queryString = `
    {
      cart(id: "${cartId}") {
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
                  price
                }
              }
            }
          }
        }
        cost {
          totalAmount {
            amount
            currencyCode
          }
        }
      }
    }
  `;

  const response = await client.query({ data: queryString });
  return response.body.data.cart;
}

async function applyDiscount(session, cartId, discountCode) {
  const client = new shopify.api.clients.Graphql({ session });

  const mutation = `
    mutation cartDiscountCodesUpdate($cartId: ID!, $discountCodes: [String!]) {
      cartDiscountCodesUpdate(cartId: $cartId, discountCodes: $discountCodes) {
        cart {
          id
          discountCodes {
            code
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
    discountCodes: [discountCode],
  };

  const response = await client.query({ data: { query: mutation, variables } });
  return response.body.data.cartDiscountCodesUpdate;
}

module.exports = { searchProducts, viewProduct, addToCart, viewCart, applyDiscount };