/**
 * Merchant registry.
 *
 * Real Indian merchants, mapped to the taxonomy leaf they belong to. The
 * classifier consults this first because a registry hit is the highest-
 * confidence signal available; everything else is inference.
 */
export interface MerchantEntry {
  /** Display name. */
  name: string
  l1: string
  l2: string
  /** How the narration typically appears on an Indian bank statement. */
  narration: string
  confidence: number
  /** Marks merchants whose baskets straddle bands and need a line-item split. */
  mixedBasket?: boolean
}

export const MERCHANTS: MerchantEntry[] = [
  // RED — shelter
  { name: 'Landlord (rent)',   l1: 'Shelter', l2: 'Rent',          narration: 'NEFT-RENT-AUG-S KRISHNAN',       confidence: 0.97 },
  { name: 'HDFC Home Loan',    l1: 'Shelter', l2: 'Home loan EMI',  narration: 'ACH-D-HDFC HOME LOAN EMI',       confidence: 0.98 },
  { name: 'BESCOM',            l1: 'Shelter', l2: 'Utilities',      narration: 'BBPS/BESCOM/ELECTRICITY',        confidence: 0.96 },
  { name: 'KSEB',              l1: 'Shelter', l2: 'Utilities',      narration: 'BBPS/KSEB/ELECTRICITY',          confidence: 0.96 },
  { name: 'ACT Fibernet',      l1: 'Shelter', l2: 'Utilities',      narration: 'UPI-ACTFIBERNET-BROADBAND',      confidence: 0.95 },
  { name: 'Society maintenance', l1: 'Shelter', l2: 'Utilities',    narration: 'UPI-PRESTIGE APTS-MAINT',        confidence: 0.90 },
  // RED — health
  { name: 'Star Health',       l1: 'Health', l2: 'Health insurance', narration: 'ACH-D-STAR HEALTH PREMIUM',     confidence: 0.97 },
  { name: 'HDFC ERGO',         l1: 'Health', l2: 'Health insurance', narration: 'ACH-D-HDFC ERGO HEALTH',        confidence: 0.97 },
  { name: 'Apollo Pharmacy',   l1: 'Health', l2: 'Pharmacy',         narration: 'UPI-APOLLOPHARMACY-P2M',        confidence: 0.95 },
  { name: 'PharmEasy',         l1: 'Health', l2: 'Pharmacy',         narration: 'UPI-PHARMEASY-P2M',             confidence: 0.94 },
  { name: 'Apollo Diagnostics',l1: 'Health', l2: 'Doctor & diagnostics', narration: 'UPI-APOLLODIAGNOSTIC-P2M',  confidence: 0.93 },
  { name: 'Practo',            l1: 'Health', l2: 'Doctor & diagnostics', narration: 'UPI-PRACTO CONSULT-P2M',    confidence: 0.90 },
  // RED — food
  { name: 'DMart',             l1: 'Food', l2: 'Groceries & staples', narration: 'POS/AVENUE SUPERMARTS/DMART',  confidence: 0.96 },
  { name: 'BigBasket',         l1: 'Food', l2: 'Groceries & staples', narration: 'UPI-BIGBASKET-P2M',            confidence: 0.95 },
  { name: 'Zepto',             l1: 'Food', l2: 'Groceries & staples', narration: 'UPI-ZEPTONOW-P2M',             confidence: 0.88 },
  { name: 'Local kirana',      l1: 'Food', l2: 'Groceries & staples', narration: 'UPI-SRI LAKSHMI STORES-P2M',   confidence: 0.82 },
  { name: 'Country Delight',   l1: 'Food', l2: 'Milk & daily fresh',  narration: 'UPI-COUNTRYDELIGHT-P2M',       confidence: 0.94 },
  // RED — education
  { name: 'School fee portal', l1: 'Education', l2: 'School & college fees', narration: 'NEFT-VIDYA VIHAR SCHOOL FEE', confidence: 0.96 },
  { name: 'Crossword',         l1: 'Education', l2: 'Books & supplies',      narration: 'POS/CROSSWORD BOOKSTORE',     confidence: 0.90 },
  { name: 'Coursera',          l1: 'Education', l2: 'Upskilling',            narration: 'INTL-COURSERA INC',           confidence: 0.88 },

  // GREEN — entertainment
  { name: 'Netflix',           l1: 'Entertainment', l2: 'OTT & subscriptions', narration: 'ACH-D-NETFLIX ENTERTAIN', confidence: 0.97 },
  { name: 'Spotify',           l1: 'Entertainment', l2: 'OTT & subscriptions', narration: 'UPI-SPOTIFY INDIA-P2M',   confidence: 0.96 },
  { name: 'Disney+ Hotstar',   l1: 'Entertainment', l2: 'OTT & subscriptions', narration: 'UPI-HOTSTAR-P2M',         confidence: 0.96 },
  { name: 'Amazon Prime',      l1: 'Entertainment', l2: 'OTT & subscriptions', narration: 'UPI-AMAZON PRIME-P2M',    confidence: 0.95 },
  { name: 'JioSaavn',          l1: 'Entertainment', l2: 'OTT & subscriptions', narration: 'UPI-JIOSAAVN-P2M',        confidence: 0.93 },
  { name: 'BookMyShow',        l1: 'Entertainment', l2: 'Movies & events',     narration: 'UPI-BOOKMYSHOW-P2M',      confidence: 0.95 },
  { name: 'Google Play',       l1: 'Entertainment', l2: 'Gaming',              narration: 'INTL-GOOGLE PLAY APPS',   confidence: 0.86 },
  { name: 'Steam',             l1: 'Entertainment', l2: 'Gaming',              narration: 'INTL-VALVE CORP STEAM',   confidence: 0.92 },
  // GREEN — restaurants
  { name: 'Swiggy',            l1: 'Restaurants', l2: 'Food delivery', narration: 'UPI-SWIGGY-P2M',                confidence: 0.94 },
  { name: 'Zomato',            l1: 'Restaurants', l2: 'Food delivery', narration: 'UPI-ZOMATO ONLINE-P2M',         confidence: 0.94 },
  { name: 'Third Wave Coffee', l1: 'Restaurants', l2: 'Dine-in',       narration: 'POS/THIRD WAVE COFFEE',         confidence: 0.91 },
  { name: 'Toit Brewpub',      l1: 'Restaurants', l2: 'Dine-in',       narration: 'POS/TOIT BREWPUB',              confidence: 0.90 },
  { name: 'Saravana Bhavan',   l1: 'Restaurants', l2: 'Dine-in',       narration: 'POS/SARAVANA BHAVAN',           confidence: 0.90 },
  // GREEN — travel
  { name: 'MakeMyTrip',        l1: 'Travel', l2: 'Leisure travel', narration: 'POS/MAKEMYTRIP INDIA',              confidence: 0.94 },
  { name: 'IRCTC',             l1: 'Travel', l2: 'Leisure travel', narration: 'UPI-IRCTC-P2M',                     confidence: 0.85 },
  { name: 'Uber',              l1: 'Travel', l2: 'Ride-hailing',   narration: 'UPI-UBER INDIA-P2M',                confidence: 0.92 },
  { name: 'Ola',               l1: 'Travel', l2: 'Ride-hailing',   narration: 'UPI-OLA CABS-P2M',                  confidence: 0.92 },
  { name: 'Rapido',            l1: 'Travel', l2: 'Ride-hailing',   narration: 'UPI-RAPIDO BIKE-P2M',               confidence: 0.90 },
  // GREEN — retail
  { name: 'Myntra',            l1: 'Fashion', l2: 'Apparel & accessories', narration: 'UPI-MYNTRA DESIGNS-P2M',    confidence: 0.94 },
  { name: 'Ajio',              l1: 'Fashion', l2: 'Apparel & accessories', narration: 'UPI-AJIO RELIANCE-P2M',     confidence: 0.93 },
  { name: 'Croma',             l1: 'Electronics', l2: 'Gadgets & devices',  narration: 'POS/CROMA INFINITI RETAIL', confidence: 0.94 },
  { name: 'Urban Company',     l1: 'Personal care', l2: 'Grooming & wellness', narration: 'UPI-URBANCOMPANY-P2M',  confidence: 0.92 },
  { name: 'Cult.fit',          l1: 'Personal care', l2: 'Grooming & wellness', narration: 'UPI-CUREFIT-P2M',       confidence: 0.91 },
  { name: 'Ferns N Petals',    l1: 'Gifting', l2: 'Gifts & celebrations',   narration: 'UPI-FERNSNPETALS-P2M',     confidence: 0.90 },

  // AMBER — genuinely ambiguous
  { name: 'Amazon',   l1: 'Ambiguous', l2: 'Mixed basket',        narration: 'UPI-AMAZON SELLER SVC-P2M', confidence: 0.55, mixedBasket: true },
  { name: 'Flipkart', l1: 'Ambiguous', l2: 'Mixed basket',        narration: 'UPI-FLIPKART INTERNET-P2M', confidence: 0.55, mixedBasket: true },
  { name: 'ATM cash', l1: 'Ambiguous', l2: 'Cash withdrawal',     narration: 'ATW/CASH WDL/HDFC ATM',     confidence: 0.40 },
  { name: 'Self transfer', l1: 'Ambiguous', l2: 'Self / family transfer', narration: 'UPI-SELF@OKAXIS-P2A', confidence: 0.50 },

  // GROW
  { name: 'Zerodha Coin', l1: 'Investment', l2: 'SIP & mutual funds', narration: 'ACH-D-ZERODHA COIN SIP',  confidence: 0.97 },
  { name: 'Groww',        l1: 'Investment', l2: 'SIP & mutual funds', narration: 'ACH-D-GROWW SIP',        confidence: 0.97 },
  { name: 'PPF',          l1: 'Investment', l2: 'PPF / EPF / NPS',    narration: 'NEFT-PPF ACCOUNT SBI',   confidence: 0.96 },
  { name: 'Recurring deposit', l1: 'Savings', l2: 'Emergency fund',   narration: 'ACH-D-RD INSTALMENT',    confidence: 0.94 },
]

export const MERCHANT_BY_NAME: Record<string, MerchantEntry> =
  Object.fromEntries(MERCHANTS.map((m) => [m.name, m]))

/** Keyword fallbacks used when no registry entry matches the narration. */
export const KEYWORD_RULES: { pattern: RegExp; l1: string; l2: string; confidence: number }[] = [
  { pattern: /\brent\b/i,                       l1: 'Shelter', l2: 'Rent', confidence: 0.84 },
  { pattern: /\b(emi|home ?loan)\b/i,           l1: 'Shelter', l2: 'Home loan EMI', confidence: 0.82 },
  { pattern: /(electric|power|bescom|kseb|tneb|bses)/i, l1: 'Shelter', l2: 'Utilities', confidence: 0.80 },
  { pattern: /(broadband|fibernet|airtel|jio ?fiber)/i, l1: 'Shelter', l2: 'Utilities', confidence: 0.78 },
  { pattern: /(pharma|medic|chemist|apollo)/i,  l1: 'Health', l2: 'Pharmacy', confidence: 0.80 },
  { pattern: /(hospital|clinic|diagnost|lab)/i, l1: 'Health', l2: 'Doctor & diagnostics', confidence: 0.78 },
  { pattern: /(insurance|premium|policy)/i,     l1: 'Health', l2: 'Health insurance', confidence: 0.76 },
  { pattern: /(school|college|tuition|fee)/i,   l1: 'Education', l2: 'School & college fees', confidence: 0.78 },
  { pattern: /(mart|grocer|kirana|supermarket|stores)/i, l1: 'Food', l2: 'Groceries & staples', confidence: 0.76 },
  { pattern: /(swiggy|zomato|eatsure|food ?delivery)/i,  l1: 'Restaurants', l2: 'Food delivery', confidence: 0.86 },
  { pattern: /(restaurant|cafe|coffee|brewpub|bhavan)/i, l1: 'Restaurants', l2: 'Dine-in', confidence: 0.74 },
  { pattern: /(uber|ola|rapido|cab)/i,          l1: 'Travel', l2: 'Ride-hailing', confidence: 0.82 },
  { pattern: /(flight|indigo|vistara|hotel|makemytrip|goibibo)/i, l1: 'Travel', l2: 'Leisure travel', confidence: 0.80 },
  { pattern: /(myntra|ajio|fashion|apparel|lifestyle)/i, l1: 'Fashion', l2: 'Apparel & accessories', confidence: 0.78 },
  { pattern: /(croma|reliance ?digital|electronic)/i,    l1: 'Electronics', l2: 'Gadgets & devices', confidence: 0.76 },
  { pattern: /(netflix|spotify|hotstar|prime|subscription)/i, l1: 'Entertainment', l2: 'OTT & subscriptions', confidence: 0.84 },
  { pattern: /(salon|spa|barber|curefit|cult)/i, l1: 'Personal care', l2: 'Grooming & wellness', confidence: 0.76 },
  { pattern: /\b(sip|mutual ?fund|zerodha|groww|nps|ppf)\b/i, l1: 'Investment', l2: 'SIP & mutual funds', confidence: 0.86 },
  { pattern: /(atm|cash ?wdl|cash withdrawal)/i, l1: 'Ambiguous', l2: 'Cash withdrawal', confidence: 0.45 },
  { pattern: /(self|own ?account|p2a)/i,        l1: 'Ambiguous', l2: 'Self / family transfer', confidence: 0.48 },
]
