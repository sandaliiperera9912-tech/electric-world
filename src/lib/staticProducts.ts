import type { Product } from '@/types'

export const STATIC_PRODUCTS: Product[] = [
  {
    id: 'static-1',
    name: 'Sony WH-1000XM5',
    description: 'Industry-leading noise cancellation with 30hr battery, crystal-clear calls, and premium sound quality.',
    price: 349,
    category: 'audio',
    images: [],
    stock: 24,
    rating: 4.9,
    review_count: 2847,
    badge: 'Best Seller',
    created_at: '',
  },
  {
    id: 'static-2',
    name: 'iPhone 15 Pro Max',
    description: 'Titanium design, A17 Pro chip, 48MP camera system with 5× optical zoom. The ultimate iPhone.',
    price: 1199,
    category: 'phones',
    images: [],
    stock: 12,
    rating: 4.8,
    review_count: 5621,
    badge: 'New',
    created_at: '',
  },
  {
    id: 'static-3',
    name: 'MacBook Air M3',
    description: '18-hour battery, fanless design, blazing-fast M3 chip. Starts at just 2.7 lbs.',
    price: 1099,
    category: 'laptops',
    images: [],
    stock: 8,
    rating: 4.9,
    review_count: 3104,
    badge: 'Top Rated',
    created_at: '',
  },
  {
    id: 'static-4',
    name: 'Samsung 65" QLED 4K',
    description: 'Quantum HDR 32x, 144Hz refresh rate, Dolby Atmos, and Samsung Gaming Hub built-in.',
    price: 1799,
    category: 'tvs',
    images: [],
    stock: 5,
    rating: 4.7,
    review_count: 1239,
    badge: 'Deal',
    created_at: '',
  },
  {
    id: 'static-5',
    name: 'DJI Mini 4 Pro',
    description: '4K/60fps drone, tri-directional obstacle sensing, 34-min flight time. Under 249g.',
    price: 759,
    category: 'cameras',
    images: [],
    stock: 15,
    rating: 4.8,
    review_count: 876,
    badge: 'New',
    created_at: '',
  },
  {
    id: 'static-6',
    name: 'LG UltraGear 27" QHD',
    description: '165Hz IPS panel, 1ms response, G-Sync compatible. Perfect for gaming and creative work.',
    price: 449,
    category: 'monitors',
    images: [],
    stock: 20,
    rating: 4.7,
    review_count: 1542,
    badge: '',
    created_at: '',
  },
  {
    id: 'static-7',
    name: 'Dyson V15 Detect',
    description: 'Laser dust detection, 60-minute run time, LCD screen showing real-time particle data.',
    price: 749,
    category: 'appliances',
    images: [],
    stock: 10,
    rating: 4.8,
    review_count: 2103,
    badge: 'Top Rated',
    created_at: '',
  },
  {
    id: 'static-8',
    name: 'Bose QuietComfort Ultra',
    description: 'Immersive spatial audio, world-class noise cancelling, 24-hour battery. Luxury redefined.',
    price: 329,
    category: 'audio',
    images: [],
    stock: 18,
    rating: 4.8,
    review_count: 1673,
    badge: '',
    created_at: '',
  },
  {
    id: 'static-9',
    name: 'Samsung Galaxy S24 Ultra',
    description: 'Titanium frame, S Pen included, 200MP camera, Snapdragon 8 Gen 3.',
    price: 1299,
    category: 'phones',
    images: [],
    stock: 10,
    rating: 4.8,
    review_count: 3201,
    badge: 'New',
    created_at: '',
  },
  {
    id: 'static-10',
    name: 'Dell XPS 15',
    description: '13th Gen Intel Core i9, 32GB RAM, 1TB SSD, OLED touch display, NVIDIA RTX 4060.',
    price: 1899,
    category: 'laptops',
    images: [],
    stock: 6,
    rating: 4.7,
    review_count: 2154,
    badge: '',
    created_at: '',
  },
  {
    id: 'static-11',
    name: 'Apple AirPods Pro 2',
    description: 'Active noise cancellation, Adaptive Transparency, spatial audio, and H2 chip.',
    price: 249,
    category: 'audio',
    images: [],
    stock: 30,
    rating: 4.9,
    review_count: 6721,
    badge: 'Best Seller',
    created_at: '',
  },
  {
    id: 'static-12',
    name: 'Sony A7 IV',
    description: '33MP full-frame mirrorless, 4K 60fps, real-time tracking AF, 10fps burst shooting.',
    price: 2499,
    category: 'cameras',
    images: [],
    stock: 4,
    rating: 4.9,
    review_count: 987,
    badge: 'Top Rated',
    created_at: '',
  },
]

// Common shorthand aliases → keywords that appear in product names
const ALIASES: Record<string, string> = {
  'xm5': 'WH-1000XM5',
  'xm4': 'WH-1000XM4',
  'xm3': 'WH-1000XM3',
  'qc': 'QuietComfort',
  'qc45': 'QuietComfort',
  'qc ultra': 'QuietComfort Ultra',
  'airpods': 'AirPods',
  'airpods pro': 'AirPods Pro',
  'macbook': 'MacBook',
  'macbook air': 'MacBook Air',
  'macbook pro': 'MacBook Pro',
  'iphone': 'iPhone',
  'iphone 15': 'iPhone 15',
  'galaxy': 'Galaxy',
  's24': 'Galaxy S24',
  's24 ultra': 'Galaxy S24 Ultra',
  'pixel': 'Pixel',
  'xps': 'Dell XPS',
  'rog': 'ROG',
  'zephyrus': 'Zephyrus',
  'dji': 'DJI',
  'mini 4': 'Mini 4 Pro',
  'a7': 'Sony A7',
  'bravia': 'Bravia',
  'oled': 'OLED',
  'qled': 'QLED',
  'dyson': 'Dyson',
  'roomba': 'Roomba',
  'bose': 'Bose',
  'sony': 'Sony',
  'samsung': 'Samsung',
  'apple': 'Apple',
  'google': 'Google',
  'oneplus': 'OnePlus',
  'lg': 'LG',
  'dell': 'Dell',
  'asus': 'ASUS',
  'ninja': 'Ninja',
}

/** Score a product against a query — higher = better match */
function scoreProduct(product: Product, query: string): number {
  const normalized = query.toLowerCase().trim()

  // Resolve alias first
  const resolved = ALIASES[normalized] ?? normalized
  const haystack = `${product.name} ${product.description} ${product.category}`.toLowerCase()

  // Exact name match = highest score
  if (product.name.toLowerCase() === resolved.toLowerCase()) return 100

  // Name starts with query
  if (product.name.toLowerCase().startsWith(resolved.toLowerCase())) return 80

  // Name contains exact resolved alias
  if (haystack.includes(resolved.toLowerCase())) return 60

  // Multi-word scoring: split query into tokens, score each hit
  const tokens = normalized.split(/\s+/).filter(t => t.length > 1)
  let score = 0
  for (const token of tokens) {
    const resolvedToken = ALIASES[token] ?? token
    if (haystack.includes(resolvedToken.toLowerCase())) score += 20
    else if (haystack.includes(token)) score += 10
  }

  return score
}

/** Search static products by keyword — returns results sorted by best match */
export function searchStaticProducts(query: string): Product[] {
  const q = query.toLowerCase().trim()
  const resolved = (ALIASES[q] ?? q).toLowerCase()

  const scored = STATIC_PRODUCTS
    .map(p => ({ product: p, score: scoreProduct(p, q) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)

  // If nothing matched by score, do a fallback contains check with resolved alias
  if (scored.length === 0) {
    return STATIC_PRODUCTS.filter(p => {
      const hay = `${p.name} ${p.description} ${p.category}`.toLowerCase()
      return hay.includes(resolved) || hay.includes(q)
    })
  }

  return scored.map(({ product }) => product)
}

/** Find the single best-matching static product for a keyword */
export function fuzzyFindProduct(query: string): Product | undefined {
  const results = searchStaticProducts(query)
  return results[0]
}

/** Find a static product by its ID */
export function findStaticProduct(id: string): Product | undefined {
  return STATIC_PRODUCTS.find(p => p.id === id)
}
