import { CryptoData, CryptoQuote } from '../types/crypto';

// Top 5 cryptocurrencies by market cap with Binance symbols
const TOP_CRYPTOS = [
  { symbol: 'BTC', name: 'Bitcoin', rank: 1, binanceSymbol: 'BTCUSDT' },
  { symbol: 'ETH', name: 'Ethereum', rank: 2, binanceSymbol: 'ETHUSDT' },
  { symbol: 'BNB', name: 'BNB', rank: 3, binanceSymbol: 'BNBUSDT' },
  { symbol: 'SOL', name: 'Solana', rank: 4, binanceSymbol: 'SOLUSDT' },
  { symbol: 'XRP', name: 'XRP', rank: 5, binanceSymbol: 'XRPUSDT' }
];

// Fetch real-time price from Binance API
const fetchBinancePrice = async (symbol: string): Promise<number> => {
  try {
    const response = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return parseFloat(data.price);
  } catch (error) {
    console.error(`Error fetching price for ${symbol}:`, error);
    // Fallback to mock data if API fails
    return generateFallbackPrice(symbol);
  }
};

// Fetch 24hr ticker statistics from Binance
const fetchBinance24hrStats = async (symbol: string) => {
  try {
    const response = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return {
      price: parseFloat(data.lastPrice),
      change: parseFloat(data.priceChange),
      changePercent: parseFloat(data.priceChangePercent),
      high: parseFloat(data.highPrice),
      low: parseFloat(data.lowPrice),
      open: parseFloat(data.openPrice),
      volume: parseFloat(data.volume),
      quoteVolume: parseFloat(data.quoteVolume)
    };
  } catch (error) {
    console.error(`Error fetching 24hr stats for ${symbol}:`, error);
    return null;
  }
};

// Fallback price generation if API fails
const generateFallbackPrice = (binanceSymbol: string): number => {
  const basePrices: { [key: string]: number } = {
    'BTCUSDT': 43000 + Math.random() * 4000,
    'ETHUSDT': 2500 + Math.random() * 300,
    'BNBUSDT': 300 + Math.random() * 50,
    'SOLUSDT': 100 + Math.random() * 20,
    'XRPUSDT': 0.6 + Math.random() * 0.1
  };
  return basePrices[binanceSymbol] || 100;
};

// Generate market cap estimation (simplified calculation)
const estimateMarketCap = (symbol: string, price: number): number => {
  // Approximate circulating supply (these are rough estimates)
  const circulatingSupply: { [key: string]: number } = {
    'BTC': 19700000,
    'ETH': 120000000,
    'BNB': 150000000,
    'SOL': 400000000,
    'XRP': 53000000000
  };
  
  const supply = circulatingSupply[symbol] || 1000000;
  return price * supply;
};

// Generate crypto data using real Binance API
const generateCryptoData = async (symbol: string, name: string, rank: number, binanceSymbol: string): Promise<CryptoQuote> => {
  // Try to fetch real data from Binance
  const stats = await fetchBinance24hrStats(binanceSymbol);
  
  if (stats) {
    // Use real Binance data
    const marketCap = estimateMarketCap(symbol, stats.price);
    
    return {
      symbol,
      name,
      price: stats.price,
      change: stats.change,
      changePercent: stats.changePercent,
      volume: stats.quoteVolume, // Use quote volume (in USDT)
      high: stats.high,
      low: stats.low,
      open: stats.open,
      marketCap,
      rank
    };
  } else {
    // Fallback to mock data if API fails
    const basePrice = generateFallbackPrice(binanceSymbol);
    const volatility = 0.05;
    
    const change = (Math.random() - 0.5) * basePrice * volatility;
    const changePercent = (change / basePrice) * 100;
    
    const open = basePrice - change;
    const high = basePrice + Math.random() * basePrice * 0.03;
    const low = basePrice - Math.random() * basePrice * 0.03;
    const volume = Math.floor(Math.random() * 5000000000) + 100000000;
    const marketCap = estimateMarketCap(symbol, basePrice);

    return {
      symbol,
      name,
      price: basePrice,
      change,
      changePercent,
      volume,
      high,
      low,
      open,
      marketCap,
      rank
    };
  }
};

export const fetchCryptoData = async (): Promise<CryptoData[]> => {
  console.log('Fetching real crypto data from Binance API...');
  
  const now = new Date();
  const cryptoPromises = TOP_CRYPTOS.map(async (crypto, index) => {
    const quote = await generateCryptoData(crypto.symbol, crypto.name, crypto.rank, crypto.binanceSymbol);
    
    return {
      id: `${crypto.symbol}-${now.getTime()}-${index}`,
      symbol: crypto.symbol,
      name: crypto.name,
      hour: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      date: now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      open: quote.open,
      high: quote.high,
      low: quote.low,
      close: quote.price,
      volume: quote.volume,
      change: quote.change,
      changePercent: quote.changePercent,
      marketCap: quote.marketCap,
      rank: quote.rank
    };
  });

  const cryptoData = await Promise.all(cryptoPromises);
  return cryptoData.sort((a, b) => a.rank - b.rank);
};

export const getCryptoMarketStatus = (): { isOpen: boolean; nextOpen: string } => {
  // Crypto markets are always open
  return { 
    isOpen: true, 
    nextOpen: '24/7 Trading' 
  };
};