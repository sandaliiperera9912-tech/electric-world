import type OpenAI from 'openai'

export const AI_TOOLS: OpenAI.Chat.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'search_products',
      description: 'Search Electric World product catalog. Use when user asks about specific products, categories, or wants recommendations.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Search terms (product name, brand, feature)',
          },
          category: {
            type: 'string',
            enum: ['phones', 'laptops', 'audio', 'tvs', 'monitors', 'cameras', 'appliances'],
            description: 'Filter by category',
          },
          minPrice: {
            type: 'number',
            description: 'Minimum price in USD',
          },
          maxPrice: {
            type: 'number',
            description: 'Maximum price in USD',
          },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'add_to_cart',
      description: 'Add a specific product to the user\'s cart. Use when user explicitly wants to add a product.',
      parameters: {
        type: 'object',
        properties: {
          productId: {
            type: 'string',
            description: 'The UUID of the product to add',
          },
          quantity: {
            type: 'number',
            description: 'Quantity to add (default 1)',
          },
        },
        required: ['productId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_cart_items',
      description: 'Get the current cart contents for the user.',
      parameters: {
        type: 'object',
        properties: {},
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_order_status',
      description: 'Check order status. Can retrieve all recent orders or a specific order by ID.',
      parameters: {
        type: 'object',
        properties: {
          orderId: {
            type: 'string',
            description: 'Specific order ID to look up (optional — omit to get recent orders)',
          },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'redirect_to_checkout',
      description: 'Redirect the user to the checkout page. Use when user wants to complete purchase, says "buy now", "checkout", "place order", or similar.',
      parameters: {
        type: 'object',
        properties: {},
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'compare_products',
      description: 'Compare two or more products side by side. Use when user says "compare", "vs", "difference between", "which is better", or wants to choose between specific products.',
      parameters: {
        type: 'object',
        properties: {
          productNames: {
            type: 'array',
            items: { type: 'string' },
            description: 'Array of product names or IDs to compare (2–4 products)',
          },
        },
        required: ['productNames'],
      },
    },
  },
]
