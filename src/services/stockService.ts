import { StockData, StockQuote } from '../types/stock';

// Mock stock symbols for demonstration
const STOCK_SYMBOLS = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'NVDA', 'META', 'NFLX'];

// Generate realistic stock data
const generateStockData = (symbol: string): StockQuote => {
  const basePrice = Math.random() * 300 + 50; // Random base price between 50-350
  const volatility = 0.02; // 2% volatility
  
  const change = (Math.random() - 0.5) * basePrice * volatility;
  const changePercent = (change / basePrice) * 100;
  
  const open = basePrice - change;
  const high = basePrice + Math.random() * 10;
  const low = basePrice - Math.random() * 10;
  const volume = Math.floor(Math.random() * 10000000) + 1000000;

  return {
    symbol,
    price: basePrice,
    change,
    changePercent,
    volume,
    high,
    low,
    open
  };
};

export const fetchStockData = async (): Promise<StockData[]> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const now = new Date();
  const stockData: StockData[] = STOCK_SYMBOLS.map((symbol, index) => {
    const quote = generateStockData(symbol);
    
    return {
      id: `${symbol}-${now.getTime()}-${index}`,
      symbol,
      hour: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      date: now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      open: quote.open,
      high: quote.high,
      low: quote.low,
      close: quote.price,
      volume: quote.volume,
      change: quote.change,
      changePercent: quote.changePercent
    };
  });

  return stockData;
};

export const getMarketStatus = (): { isOpen: boolean; nextOpen: string } => {
  const now = new Date();
  const currentHour = now.getHours();
  const currentDay = now.getDay();
  
  // Market is open weekdays 9:30 AM - 4:00 PM ET (simplified)
  const isWeekday = currentDay >= 1 && currentDay <= 5;
  const isMarketHours = currentHour >= 9 && currentHour < 16;
  
  const isOpen = isWeekday && isMarketHours;
  
  let nextOpen = '';
  if (!isOpen) {
    if (isWeekday && currentHour >= 16) {
      nextOpen = 'Tomorrow 9:30 AM';
    } else if (isWeekday && currentHour < 9) {
      nextOpen = 'Today 9:30 AM';
    } else {
      nextOpen = 'Monday 9:30 AM';
    }
  }
  
  return { isOpen, nextOpen };
};