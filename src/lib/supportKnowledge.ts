export const FAQ_DATA = [
  {
    category: 'Shipping',
    items: [
      {
        q: 'How long does shipping take?',
        a: 'Standard shipping takes 3–5 business days. Express next-day delivery is available at checkout. Orders placed before 2 PM EST ship the same day.',
      },
      {
        q: 'Is free shipping available?',
        a: 'Yes! All orders over $75 qualify for free standard shipping (3–5 business days). Orders under $75 have a flat $5.99 shipping fee.',
      },
      {
        q: 'Do you ship internationally?',
        a: 'Currently we ship to the US, UK, Australia, Canada, Germany, France, and Japan. International shipping takes 7–14 business days.',
      },
      {
        q: 'Can I track my order?',
        a: 'Yes! Once your order ships, you\'ll receive an email with a tracking number. You can also check your order status on the Orders page or ask Volt AI with your order ID.',
      },
    ],
  },
  {
    category: 'Returns',
    items: [
      {
        q: 'What is your return policy?',
        a: 'We offer a 30-day hassle-free return window from the delivery date. Items must be in original condition and original packaging.',
      },
      {
        q: 'How do I start a return?',
        a: 'Visit your Orders page, select the item, and click "Request Return". We\'ll email you a prepaid return label within 24 hours. No cost to you!',
      },
      {
        q: 'When do I get my refund?',
        a: 'Refunds are processed within 3–5 business days of receiving your returned item. The refund goes back to your original payment method.',
      },
    ],
  },
  {
    category: 'Warranty',
    items: [
      {
        q: 'What warranty do products come with?',
        a: 'All products include a 1-year manufacturer warranty covering defects and malfunctions from normal use.',
      },
      {
        q: 'Are extended warranty plans available?',
        a: 'Yes! 2-year and 3-year extended warranty plans are available for most products at checkout, starting from $19.99.',
      },
      {
        q: 'My product stopped working. What do I do?',
        a: 'If your product fails within the warranty period, contact us at support@electricworld.com. We\'ll arrange a repair or replacement free of charge.',
      },
    ],
  },
  {
    category: 'Orders & Payments',
    items: [
      {
        q: 'What payment methods are accepted?',
        a: 'We accept Visa, Mastercard, American Express, and Apple Pay — all processed securely through Stripe.',
      },
      {
        q: 'Can I change or cancel my order?',
        a: 'Orders can be cancelled within 1 hour of placement. After that, you\'ll need to wait for delivery and then initiate a return.',
      },
      {
        q: 'Is my payment information secure?',
        a: 'Yes! We never store your card details. All payments are processed by Stripe, which is PCI DSS Level 1 compliant — the highest level of payment security.',
      },
    ],
  },
  {
    category: 'Account',
    items: [
      {
        q: 'How do I reset my password?',
        a: 'Click "Sign In", then "Forgot Password". Enter your email and we\'ll send a reset link within a few minutes.',
      },
      {
        q: 'How do I update my profile?',
        a: 'Go to your Profile page (click your name in the top nav). You can update your full name and profile picture there.',
      },
    ],
  },
]

export const SUPPORT_SYSTEM_PROMPT = `You are Volt AI on the Electric World Support page. Your primary goal is to resolve customer issues quickly and helpfully.

## Electric World Support Policies

### Shipping
- Standard: 3–5 business days
- Express: Next business day (available at checkout)
- Free shipping: All orders over $75
- Same-day dispatch: Orders before 2 PM EST
- International: US, UK, AU, CA, DE, FR, JP (7–14 days)

### Returns
- 30-day return window from delivery
- Items must be in original condition and packaging
- Free prepaid return label provided
- Refund in 3–5 business days after return received

### Warranty
- 1-year manufacturer warranty on all products
- Extended plans (2–3 years) available at checkout
- Defective items: free repair or replacement

### Payment
- Visa, Mastercard, Amex, Apple Pay via Stripe
- Never stored on our servers — Stripe PCI DSS Level 1

### Order Tracking
- Check the Orders page or ask me with your order ID
- Tracking email sent when order ships

## Escalation
- If you cannot resolve after 2 attempts, offer: "I'll connect you to our support email: support@electricworld.com"
- If user says "useless", "not helpful", "speak to human", or similar frustration — immediately offer human support
- Log unresolved queries automatically

## Communication
- Be empathetic and solution-focused
- Keep responses concise (2–4 sentences)
- Use available tools to check real order status when asked`
