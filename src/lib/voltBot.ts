export function getBotReply(message: string): string {
  const msg = message.toLowerCase().trim()

  if (/\b(hi|hello|hey|howdy|greetings)\b/.test(msg)) {
    return "Hey there! ⚡ I'm **Volt AI**, your smart shopping assistant at Electric World. I can help you find electronics, compare products, track orders, or answer any questions. What are you looking for today?"
  }

  if (/\b(phone|iphone|samsung|smartphone|mobile)\b/.test(msg)) {
    return "We have an amazing phones collection! 📱 Top picks:\n- **iPhone 15 Pro Max** — $1,199 | 6.7\" Super Retina XDR, A17 Pro chip\n- **Samsung Galaxy S24 Ultra** — $1,299 | 200MP camera, titanium frame\n- **Google Pixel 8 Pro** — $999 | Best-in-class AI camera\n\nWant me to add any of these to your cart, or would you like to filter by budget?"
  }

  if (/\b(laptop|macbook|notebook|computer)\b/.test(msg)) {
    return "Great choice! 💻 Our best laptops right now:\n- **MacBook Air M3** — $1,099 | 18-hr battery, fanless, blazing fast\n- **Dell XPS 15** — $1,499 | 4K OLED, RTX 4060\n- **ASUS ROG Zephyrus G14** — $1,199 | Gaming powerhouse, OLED display\n\nShall I help you narrow it down by use case (work, gaming, creative)?"
  }

  if (/\b(headphone|earphone|earbud|audio|speaker|sound)\b/.test(msg)) {
    return "Awesome taste! 🎧 Our top audio gear:\n- **Sony WH-1000XM5** — $349 | Industry-leading noise cancellation\n- **Bose QuietComfort Ultra** — $329 | Immersive spatial audio\n- **Apple AirPods Pro 2** — $249 | Best for iPhone users\n- **Bose SoundLink Max** — $399 | Portable speaker, 20hr battery\n\nLooking for headphones or earbuds? Over-ear or in-ear?"
  }

  if (/\b(tv|television|qled|oled|smart tv)\b/.test(msg)) {
    return "Our TV lineup is incredible! 📺\n- **Samsung 65\" QLED 4K** — $1,799 | Quantum HDR, 120Hz\n- **LG C3 OLED 55\"** — $1,499 | Perfect blacks, Dolby Vision\n- **Sony Bravia XR 75\"** — $2,299 | Cognitive Processor XR\n\nWhat size are you looking for?"
  }

  if (/\b(monitor|display|screen)\b/.test(msg)) {
    return "Perfect for work or gaming! 🖥️\n- **LG UltraGear 27\" QHD** — $449 | 165Hz, 1ms, G-Sync\n- **Dell U2722D 27\" 4K** — $599 | USB-C, IPS panel\n- **Samsung Odyssey G9 49\"** — $999 | Ultrawide curved gaming\n\nWork monitor or gaming setup?"
  }

  if (/\b(camera|drone|dji|photography)\b/.test(msg)) {
    return "Capture every moment! 📸\n- **DJI Mini 4 Pro** — $759 | 4K/60fps, obstacle avoidance drone\n- **Sony A7 IV** — $2,499 | Full-frame mirrorless, 33MP\n- **GoPro HERO12** — $399 | Action cam, 5.3K video\n\nDrone, action camera, or mirrorless?"
  }

  if (/\b(appliance|vacuum|dyson|washing|fridge|microwave)\b/.test(msg)) {
    return "Smart home appliances! 🏠\n- **Dyson V15 Detect** — $749 | Laser dust detection, 60min battery\n- **iRobot Roomba j7+** — $599 | AI obstacle avoidance, auto-empty\n- **Ninja Foodi 9-in-1** — $199 | Air fryer + pressure cooker\n\nWhich appliance can I help you find?"
  }

  if (/\b(add to cart|add it|buy this|i want this)\b/.test(msg)) {
    return "I'd love to help you add that! 🛒 Could you tell me the product name so I can locate it? For example: 'Add Sony WH-1000XM5 to cart'. Once logged in, I can do this for you directly."
  }

  if (/\b(cart|my cart|what's in my cart)\b/.test(msg)) {
    return "You can view your cart by clicking the 🛒 cart icon in the top navigation bar. From there you can adjust quantities, remove items, and proceed to checkout. Need help with anything in your cart?"
  }

  if (/\b(checkout|pay|purchase|order)\b/.test(msg)) {
    return "Ready to checkout? 🎉 Head to your cart and click **Proceed to Checkout**. We accept all major credit cards, debit cards, and Apple Pay — all secured by Stripe. Would you like me to take you there?"
  }

  if (/\b(shipping|delivery|ship|arrive)\b/.test(msg)) {
    return "📦 Shipping info:\n- **Standard shipping**: 3–5 business days\n- **Express shipping**: Next business day\n- **Free shipping** on all orders over **$75**!\n\nAll orders include a tracking number sent to your email. Any specific order you want to track?"
  }

  if (/\b(return|refund|send back)\b/.test(msg)) {
    return "Our return policy is hassle-free! 📦\n- **30-day return window** from delivery date\n- Items must be in original condition and packaging\n- We provide a **prepaid return label** — no shipping cost to you\n- Refunds processed within 3–5 business days\n\nNeed help starting a return?"
  }

  if (/\b(warranty|guarantee|broken|repair)\b/.test(msg)) {
    return "🛡️ All products come with a **1-year manufacturer warranty** covering defects and malfunctions. Extended warranty plans (2–3 years) are available at checkout for most products. If something's broken within the warranty period, we'll replace or repair it free of charge!"
  }

  if (/\b(budget|cheap|affordable|under|less than)\b/.test(msg)) {
    const priceMatch = msg.match(/\$?(\d+)/)
    if (priceMatch) {
      const budget = parseInt(priceMatch[1])
      return `Great budget of $${budget}! 💰 Here are some top picks under that price:\n- Check our **Deals** section for the best value products\n- Use the **price filter** on the Products page to narrow down exactly\n- I recommend checking our **Audio** and **Accessories** sections for great value\n\nWhat category are you shopping in?`
    }
    return "Looking for affordable options? 💰 We have great products at every price point! Tell me what category you're interested in and your budget, and I'll find the best deals for you."
  }

  if (/\b(deal|discount|sale|offer|promo)\b/.test(msg)) {
    return "🔥 Hot deals right now:\n- **Sony WH-1000XM5** headphones — 15% off\n- **MacBook Air M3** — Back-to-school special\n- **Samsung QLED TVs** — Up to $300 off\n\nCheck the **Deals** section in the nav for all current offers!"
  }

  if (/\b(recommend|suggest|best|top|popular)\b/.test(msg)) {
    return "Here are our **top-rated products** this week ⭐:\n1. **Sony WH-1000XM5** — Headphones (4.9★)\n2. **iPhone 15 Pro Max** — Smartphone (4.8★)\n3. **MacBook Air M3** — Laptop (4.9★)\n4. **LG C3 OLED** — TV (4.8★)\n5. **DJI Mini 4 Pro** — Drone (4.7★)\n\nWant details on any of these?"
  }

  if (/\b(thank|thanks|thank you|appreciate)\b/.test(msg)) {
    return "You're very welcome! ⚡ If you need anything else — whether it's finding a product, tracking an order, or any questions — I'm always here. Happy shopping at Electric World! 🛒"
  }

  if (/\b(help|support|contact|human|agent|person)\b/.test(msg)) {
    return "I'm here to help! ⚡ For complex issues, you can also:\n- Visit our **Support page** for FAQs\n- Email us at **support@electricworld.com**\n- I can assist with: product search, order tracking, returns, warranty, and more\n\nWhat do you need help with?"
  }

  return "Hmm, I'm not sure about that one. 🤔 Could you rephrase? I can help you with:\n- **Finding products** (phones, laptops, audio, TVs, etc.)\n- **Order tracking & returns**\n- **Shipping & warranty info**\n- **Recommendations** based on your needs\n\nWhat would you like to know?"
}
