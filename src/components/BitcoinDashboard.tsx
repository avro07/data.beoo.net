import React, { useState, useEffect } from 'react';
import { RefreshCw, TrendingUp, TrendingDown, Clock, Calendar, DollarSign, BarChart3, Bitcoin, Settings, Filter, Download, Coins } from 'lucide-react';

interface OHLCVData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  date: string;
  time: string;
}

interface TimeframeOption {
  value: string;
  label: string;
  interval: string;
  limit: number;
  description: string;
}

interface CoinOption {
  symbol: string;
  name: string;
  binanceSymbol: string;
  color: string;
}

const TIMEFRAMES: TimeframeOption[] = [
  { value: '1m', label: '১ মিনিট', interval: '1m', limit: 10, description: 'শেষ ১০ বার' },
  { value: '15m', label: '১৫ মিনিট', interval: '15m', limit: 10, description: '১৫ মিনিটের শেষ ১০ বার' },
  { value: '1h', label: '১ ঘন্টা', interval: '1h', limit: 10, description: '১ ঘন্টার শেষ ১০ বার' },
  { value: '4h', label: '৪ ঘন্টা', interval: '4h', limit: 10, description: '৪ ঘন্টা করে শেষ ১০ বার' },
  { value: '1d', label: '১ দিন', interval: '1d', limit: 15, description: 'শেষ ১৫ দিন' },
  { value: '1M', label: 'মাস', interval: '1M', limit: 10, description: 'শেষ ১০ মাস' }
];

const COINS: CoinOption[] = [
  { symbol: 'BTC', name: 'Bitcoin', binanceSymbol: 'BTCUSDT', color: 'from-orange-500 to-yellow-500' },
  { symbol: 'ETH', name: 'Ethereum', binanceSymbol: 'ETHUSDT', color: 'from-blue-500 to-purple-500' },
  { symbol: 'BNB', name: 'BNB', binanceSymbol: 'BNBUSDT', color: 'from-yellow-500 to-orange-500' },
  { symbol: 'SOL', name: 'Solana', binanceSymbol: 'SOLUSDT', color: 'from-purple-500 to-pink-500' },
  { symbol: 'XRP', name: 'XRP', binanceSymbol: 'XRPUSDT', color: 'from-gray-500 to-blue-500' },
  { symbol: 'ADA', name: 'Cardano', binanceSymbol: 'ADAUSDT', color: 'from-blue-600 to-indigo-600' },
  { symbol: 'DOGE', name: 'Dogecoin', binanceSymbol: 'DOGEUSDT', color: 'from-yellow-400 to-yellow-600' },
  { symbol: 'MATIC', name: 'Polygon', binanceSymbol: 'MATICUSDT', color: 'from-purple-600 to-blue-600' }
];

const CryptoDashboard: React.FC = () => {
  const [ohlcvData, setOhlcvData] = useState<OHLCVData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('1h');
  const [selectedCoin, setSelectedCoin] = useState<string>('BTC');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [priceChange, setPriceChange] = useState<number>(0);
  const [priceChangePercent, setPriceChangePercent] = useState<number>(0);
  const [priceAlerts, setPriceAlerts] = useState<{id: string, price: number, type: 'above' | 'below', enabled: boolean}[]>([]);
  const [newAboveAlertPrice, setNewAboveAlertPrice] = useState<string>('');
  const [newBelowAlertPrice, setNewBelowAlertPrice] = useState<string>('');
  const [enableAboveAlert, setEnableAboveAlert] = useState<boolean>(true);
  const [enableBelowAlert, setEnableBelowAlert] = useState<boolean>(true);
  const [lastNotifiedPrice, setLastNotifiedPrice] = useState<number>(0);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [selectedAlertSound, setSelectedAlertSound] = useState<string>('beep');
  const [priceAnimation, setPriceAnimation] = useState<boolean>(false);
  const [lastAlertTime, setLastAlertTime] = useState<{[key: string]: number}>({});

  const getCurrentCoin = () => COINS.find(coin => coin.symbol === selectedCoin) || COINS[0];

  // Sound effects using Web Audio API
  const playAlertSound = (soundType: string = 'beep') => {
    if (!soundEnabled) return;
    
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    const playSound = (frequency: number, duration: number, type: OscillatorType = 'sine') => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = frequency;
      oscillator.type = type;
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration);
    };
    
    switch (soundType) {
      case 'beep':
        playSound(800, 0.2);
        break;
      case 'alert':
        playSound(1000, 0.1);
        setTimeout(() => playSound(800, 0.1), 150);
        setTimeout(() => playSound(1000, 0.1), 300);
        break;
      case 'success':
        playSound(523, 0.2); // C
        setTimeout(() => playSound(659, 0.2), 200); // E
        setTimeout(() => playSound(784, 0.3), 400); // G
        break;
      case 'warning':
        playSound(400, 0.3, 'sawtooth');
        setTimeout(() => playSound(300, 0.3, 'sawtooth'), 350);
        break;
      case 'urgent':
        for (let i = 0; i < 5; i++) {
          setTimeout(() => playSound(1200, 0.1, 'square'), i * 150);
        }
        break;
    }
  };

  // Fetch current price for selected coin
  const fetchCurrentPrice = async () => {
    try {
      const coin = getCurrentCoin();
      const response = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${coin.binanceSymbol}`);
      if (response.ok) {
        const data = await response.json();
        setCurrentPrice(parseFloat(data.lastPrice));
        setPriceChange(parseFloat(data.priceChange));
        setPriceChangePercent(parseFloat(data.priceChangePercent));
        
        // Check price alerts
        checkPriceAlerts(parseFloat(data.lastPrice));
      }
    } catch (error) {
      console.error('Error fetching current price:', error);
    }
  };

  // Check and trigger price alerts
  const checkPriceAlerts = (currentPrice: number) => {
    priceAlerts.forEach(alert => {
      if (!alert.enabled) return;
      
      // Check cooldown period (5 minutes)
      const lastAlert = lastAlertTime[alert.id] || 0;
      const timeSinceLastAlert = Date.now() - lastAlert;
      const cooldownPeriod = 5 * 60 * 1000; // 5 minutes
      
      if (timeSinceLastAlert < cooldownPeriod) return;
      
      // Check for significant price change (at least 0.5%)
      const priceChangeThreshold = 0.005; // 0.5%
      const priceChangePercent = Math.abs(currentPrice - lastNotifiedPrice) / lastNotifiedPrice;
      
      if (priceChangePercent < priceChangeThreshold && lastNotifiedPrice > 0) return;
      
      const shouldNotify = 
        (alert.type === 'above' && currentPrice >= alert.price && lastNotifiedPrice < alert.price) ||
        (alert.type === 'below' && currentPrice <= alert.price && lastNotifiedPrice > alert.price);
      
      if (shouldNotify) {
        // Update last alert time for this alert
        setLastAlertTime(prev => ({
          ...prev,
          [alert.id]: Date.now()
        }));
        
        // Request notification permission if not granted
        if (Notification.permission === 'default') {
          Notification.requestPermission();
        }
        
        // Show notification
        if (Notification.permission === 'granted') {
          const coin = getCurrentCoin();
          const notification = new Notification(`🚨 ${coin.name} (${coin.symbol}) প্রাইস অ্যালার্ট!`, {
            body: `🎯 টার্গেট: ${formatPrice(alert.price)}\n💰 বর্তমান: ${formatPrice(currentPrice)}\n${alert.type === 'above' ? '📈 দাম উঠেছে!' : '📉 দাম নেমেছে!'}`,
            icon: '/vite.svg',
            tag: `price-alert-${alert.id}`,
            badge: '/vite.svg',
            requireInteraction: true,
            silent: false,
            vibrate: [200, 100, 200]
          });
          
          // Auto close notification after 15 seconds
          setTimeout(() => {
            notification.close();
          }, 15000);
        }
        
        // Play sound alert
        const soundType = alert.type === 'above' ? 'success' : 'warning';
        playAlertSound(soundType);
        
        // Update last alert time for cooldown
        setLastAlertTime(prev => ({
          ...prev,
          [alert.id]: Date.now()
        }));
        
        // Show browser alert as fallback
        const coin = getCurrentCoin();
        const alertMessage = `🚨 ${coin.name} প্রাইস অ্যালার্ট!\n\n🎯 টার্গেট: ${formatPrice(alert.price)}\n💰 বর্তমান: ${formatPrice(currentPrice)}\n\n${alert.type === 'above' ? '📈 দাম উঠেছে!' : '📉 দাম নেমেছে!'}`;
        
        // Create custom styled alert
        const alertDiv = document.createElement('div');
        alertDiv.innerHTML = `
          <div style="position: fixed; top: 20px; right: 20px; z-index: 10000; background: linear-gradient(135deg, #ff6b6b, #ffa500); color: white; padding: 20px; border-radius: 15px; box-shadow: 0 10px 30px rgba(0,0,0,0.3); max-width: 400px; font-family: Arial, sans-serif; animation: slideIn 0.5s ease-out;">
            <div style="font-size: 18px; font-weight: bold; margin-bottom: 10px;">🚨 ${coin.name} প্রাইস অ্যালার্ট!</div>
            <div style="margin-bottom: 8px;">🎯 টার্গেট: ${formatPrice(alert.price)}</div>
            <div style="margin-bottom: 8px;">💰 বর্তমান: ${formatPrice(currentPrice)}</div>
            <div style="font-size: 16px; font-weight: bold;">${alert.type === 'above' ? '📈 দাম উঠেছে!' : '📉 দাম নেমেছে!'}</div>
            <div style="font-size: 12px; margin-top: 8px; opacity: 0.8;">⏰ পরবর্তী এলার্ট: ৫ মিনিট পর</div>
            <button onclick="this.parentElement.parentElement.remove()" style="position: absolute; top: 5px; right: 10px; background: none; border: none; color: white; font-size: 20px; cursor: pointer;">×</button>
          </div>
        `;
        
        // Add CSS animation
        if (!document.getElementById('alert-animations')) {
          const style = document.createElement('style');
          style.id = 'alert-animations';
          style.textContent = `
            @keyframes slideIn {
              from { transform: translateX(100%); opacity: 0; }
              to { transform: translateX(0); opacity: 1; }
            }
          `;
          document.head.appendChild(style);
        }
        
        document.body.appendChild(alertDiv);
        
        // Auto remove after 15 seconds
        setTimeout(() => {
          if (alertDiv.parentElement) {
            alertDiv.remove();
          }
        }, 15000);
        
        // Update last notified price
        setLastNotifiedPrice(currentPrice);
      }
    });
  };

  // Add new price alert
  const addPriceAlert = () => {
    const newAlerts = [];
    
    // Add "above" alert if enabled
    if (enableAboveAlert) {
      const abovePrice = parseFloat(newAboveAlertPrice);
      if (isNaN(abovePrice) || abovePrice <= 0) {
        alert('অনুগ্রহ করে উপরের জন্য একটি বৈধ দাম লিখুন');
        return;
      }
      newAlerts.push({
        id: `${Date.now()}-above`,
        price: abovePrice,
        type: 'above' as const,
        enabled: true
      });
    }
    
    // Add "below" alert if enabled
    if (enableBelowAlert) {
      const belowPrice = parseFloat(newBelowAlertPrice);
      if (isNaN(belowPrice) || belowPrice <= 0) {
        alert('অনুগ্রহ করে নিচের জন্য একটি বৈধ দাম লিখুন');
        return;
      }
      newAlerts.push({
        id: `${Date.now()}-below`,
        price: belowPrice,
        type: 'below' as const,
        enabled: true
      });
    }
    
    if (newAlerts.length === 0) {
      alert('অনুগ্রহ করে কমপক্ষে একটি দিক নির্বাচন করুন (উপরে বা নিচে)');
      return;
    }
    
    setPriceAlerts([...priceAlerts, ...newAlerts]);
    setNewAboveAlertPrice('');
    setNewBelowAlertPrice('');
    
    // Request notification permission
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
    
    // Play confirmation sound
    playAlertSound('success');
  };

  // Remove price alert
  const removePriceAlert = (id: string) => {
    setPriceAlerts(priceAlerts.filter(alert => alert.id !== id));
  };

  // Toggle alert enabled/disabled
  const togglePriceAlert = (id: string) => {
    setPriceAlerts(priceAlerts.map(alert => 
      alert.id === id ? { ...alert, enabled: !alert.enabled } : alert
    ));
  };

  // Fetch OHLCV data from Binance
  const fetchOHLCVData = async () => {
    try {
      setIsLoading(true);
      
      const coin = getCurrentCoin();
      const timeframe = TIMEFRAMES.find(tf => tf.value === selectedTimeframe);
      const interval = timeframe?.interval || '1h';
      const limit = timeframe?.limit || 10;
      
      let url: string;
      
      if (customStartDate && customEndDate) {
        // Use custom date range
        const startTime = new Date(customStartDate).getTime();
        const endTime = new Date(customEndDate).getTime();
        url = `https://api.binance.com/api/v3/klines?symbol=${coin.binanceSymbol}&interval=${interval}&startTime=${startTime}&endTime=${endTime}&limit=1000`;
      } else {
        // Use default limit based on timeframe
        url = `https://api.binance.com/api/v3/klines?symbol=${coin.binanceSymbol}&interval=${interval}&limit=${limit}`;
      }
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      const formattedData: OHLCVData[] = data.map((kline: any[]) => {
        const timestamp = kline[0];
        const date = new Date(timestamp);
        
        return {
          timestamp,
          open: parseFloat(kline[1]),
          high: parseFloat(kline[2]),
          low: parseFloat(kline[3]),
          close: parseFloat(kline[4]),
          volume: parseFloat(kline[5]),
          date: date.toLocaleDateString('bn-BD', { 
            day: '2-digit', 
            month: 'short', 
            year: 'numeric' 
          }),
          time: date.toLocaleTimeString('bn-BD', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })
        };
      });
      
      // Show latest data first, but limit according to timeframe specification
      const limitedData = formattedData.reverse().slice(0, limit);
      setOhlcvData(limitedData);
      setLastUpdated(new Date());
      
    } catch (error) {
      console.error('Error fetching OHLCV data:', error);
      // Generate fallback data
      generateFallbackData();
    } finally {
      setIsLoading(false);
    }
  };

  // Generate fallback data if API fails
  const generateFallbackData = () => {
    const coin = getCurrentCoin();
    const timeframe = TIMEFRAMES.find(tf => tf.value === selectedTimeframe);
    const limit = timeframe?.limit || 10;
    
    const fallbackData: OHLCVData[] = [];
    const basePrices: { [key: string]: number } = {
      'BTC': 43000,
      'ETH': 2500,
      'BNB': 300,
      'SOL': 100,
      'XRP': 0.6,
      'ADA': 0.5,
      'DOGE': 0.08,
      'MATIC': 0.9
    };
    
    const basePrice = basePrices[coin.symbol] || 100;
    
    for (let i = limit - 1; i >= 0; i--) {
      const timestamp = Date.now() - (i * 60 * 60 * 1000);
      const date = new Date(timestamp);
      const volatility = 0.02;
      
      const open = basePrice + (Math.random() - 0.5) * basePrice * volatility;
      const close = open + (Math.random() - 0.5) * open * volatility;
      const high = Math.max(open, close) + Math.random() * open * 0.01;
      const low = Math.min(open, close) - Math.random() * open * 0.01;
      const volume = Math.random() * 1000 + 100;
      
      fallbackData.push({
        timestamp,
        open,
        high,
        low,
        close,
        volume,
        date: date.toLocaleDateString('bn-BD', { 
          day: '2-digit', 
          month: 'short', 
          year: 'numeric' 
        }),
        time: date.toLocaleTimeString('bn-BD', { 
          hour: '2-digit', 
          minute: '2-digit' 
        })
      });
    }
    
    setOhlcvData(fallbackData);
  };

  // Load data on component mount and when filters change
  useEffect(() => {
    fetchOHLCVData();
    fetchCurrentPrice();
  }, [selectedTimeframe, selectedCoin, customStartDate, customEndDate]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    // OHLCV data refresh every 30 seconds
    const ohlcvInterval = setInterval(() => {
      fetchOHLCVData();
    }, 30000);
    
    // Current price refresh every 1 second for real-time feel
    const priceInterval = setInterval(() => {
      fetchCurrentPrice();
    }, 1000);
    
    // Price animation trigger every 2 minutes
    const animationInterval = setInterval(() => {
      setPriceAnimation(true);
      playAlertSound('beep');
      setTimeout(() => setPriceAnimation(false), 2000);
    }, 120000); // 2 minutes
    
    return () => {
      clearInterval(ohlcvInterval);
      clearInterval(priceInterval);
      clearInterval(animationInterval);
    };
  }, [selectedTimeframe, selectedCoin, customStartDate, customEndDate]);

  const formatPrice = (price: number) => {
    const coin = getCurrentCoin();
    if (coin.symbol === 'BTC' || coin.symbol === 'ETH') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
      }).format(price);
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 6
    }).format(price);
  };

  const formatVolume = (volume: number) => {
    if (volume >= 1000000) {
      return `${(volume / 1000000).toFixed(1)}M`;
    }
    if (volume >= 1000) {
      return `${(volume / 1000).toFixed(1)}K`;
    }
    return volume.toFixed(2);
  };

  const resetFilters = () => {
    setCustomStartDate('');
    setCustomEndDate('');
    setSelectedTimeframe('1h');
    setSelectedCoin('BTC');
  };

  const currentCoin = getCurrentCoin();
  const currentTimeframe = TIMEFRAMES.find(tf => tf.value === selectedTimeframe);

  return (
    <div className="min-h-screen bg-black p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="sticky top-0 z-50 bg-black/95 backdrop-blur-lg border-b border-white/10 pb-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <div className={`w-16 h-16 bg-gradient-to-r ${currentCoin.color} rounded-2xl flex items-center justify-center shadow-2xl`}>
                <Coins className="w-10 h-10 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white mb-2">
                  {currentCoin.name} ({currentCoin.symbol}) ড্যাশবোর্ড
                </h1>
                <p className="text-sm text-white/70">রিয়েল-টাইম OHLCV ডেটা ও চার্ট বিশ্লেষণ</p>
                <div className="flex items-center space-x-6 mt-4">
                  <div className={`text-6xl font-bold text-white transition-all duration-500 ${
                    priceAnimation ? 'scale-110 text-yellow-400 animate-pulse' : 'scale-100'
                  }`}>
                    {formatPrice(currentPrice)}
                  </div>
                  <div className="flex items-center space-x-1 px-3 py-1 rounded-full bg-green-500/20">
                    <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-sm text-green-400 font-bold">LIVE</span>
                  </div>
                  <div className={`flex items-center space-x-1 px-3 py-1 rounded-full ${
                    priceChange >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                  }`}>
                    {priceChange >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    <span className="font-bold text-lg">
                      {priceChange >= 0 ? '+' : ''}{priceChangePercent.toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Stats in Header */}
            <div className="flex items-center space-x-6 mr-6">
              <div className="bg-white/5 backdrop-blur-lg rounded-xl shadow-lg border border-white/10 p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <div className="text-xs text-white/70">সর্বোচ্চ দাম</div>
                    <div className="text-base font-bold text-green-400">
                      {ohlcvData.length > 0 ? formatPrice(Math.max(...ohlcvData.map(d => d.high))) : '$0'}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/5 backdrop-blur-lg rounded-xl shadow-lg border border-white/10 p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
                    <TrendingDown className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <div className="text-xs text-white/70">সর্বনিম্ন দাম</div>
                    <div className="text-base font-bold text-red-400">
                      {ohlcvData.length > 0 ? formatPrice(Math.min(...ohlcvData.map(d => d.low))) : '$0'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                fetchOHLCVData();
                fetchCurrentPrice();
              }}
              disabled={isLoading}
              className={`flex items-center space-x-2 px-6 py-3 bg-gradient-to-r ${currentCoin.color} text-white rounded-xl hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg`}
            >
              <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="font-medium">রিফ্রেশ</span>
            </button>
          </div>
        </div>

        {/* Controls - Now separate from sticky header */}
        <div className="mb-8">
          {/* Controls */}
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/10 p-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Coin Selector */}
              <div>
                <label className="block text-sm font-semibold text-white mb-3">
                  <Coins className="w-4 h-4 inline mr-2" />
                  কয়েন নির্বাচন করুন
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {COINS.map((coin) => (
                    <button
                      key={coin.symbol}
                      onClick={() => setSelectedCoin(coin.symbol)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-2 ${
                        selectedCoin === coin.symbol
                          ? `bg-gradient-to-r ${coin.color} text-white shadow-lg`
                          : 'bg-white/10 text-white/70 hover:bg-white/20'
                      }`}
                    >
                      <span className="font-bold">{coin.symbol}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Alerts */}
              <div>
                <label className="block text-sm font-semibold text-white mb-3">
                  <span className="text-red-400">🚨</span> প্রাইস অ্যালার্ট 
                  <span className="text-xs text-white/60 ml-2">(সাউন্ড + নোটিফিকেশন)</span>
                </label>
                <div className="space-y-2">
                  {/* Sound Settings */}
                  <div className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">🔊</span>
                      <span className="text-sm text-white">সাউন্ড অ্যালার্ট</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <select
                        value={selectedAlertSound}
                        onChange={(e) => setSelectedAlertSound(e.target.value)}
                        className="px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-xs focus:outline-none"
                      >
                        <option value="beep" className="bg-gray-800">বিপ</option>
                        <option value="alert" className="bg-gray-800">অ্যালার্ট</option>
                        <option value="success" className="bg-gray-800">সাকসেস</option>
                        <option value="warning" className="bg-gray-800">ওয়ার্নিং</option>
                        <option value="urgent" className="bg-gray-800">জরুরি</option>
                        <option value="coin" className="bg-gray-800">কয়েন</option>
                      </select>
                      <button
                        onClick={() => playAlertSound(selectedAlertSound)}
                        className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs hover:bg-blue-500/30"
                      >
                        টেস্ট
                      </button>
                      <button
                        onClick={() => setSoundEnabled(!soundEnabled)}
                        className={`w-8 h-4 rounded-full transition-colors ${
                          soundEnabled ? 'bg-green-500' : 'bg-gray-500'
                        }`}
                      >
                        <div className={`w-3 h-3 bg-white rounded-full transition-transform ${
                          soundEnabled ? 'translate-x-4' : 'translate-x-0.5'
                        }`} />
                      </button>
                    </div>
                  </div>

                  {/* Direction Selection Checkboxes */}
                  <div className="flex space-x-4">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={enableAboveAlert}
                        onChange={(e) => setEnableAboveAlert(e.target.checked)}
                        className="w-4 h-4 text-green-600 bg-white/10 border-white/20 rounded focus:ring-green-500 focus:ring-2"
                      />
                      <span className="text-sm text-white flex items-center space-x-1">
                        <span className="text-green-400">📈</span>
                        <span>উপরে</span>
                      </span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={enableBelowAlert}
                        onChange={(e) => setEnableBelowAlert(e.target.checked)}
                        className="w-4 h-4 text-red-600 bg-white/10 border-white/20 rounded focus:ring-red-500 focus:ring-2"
                      />
                      <span className="text-sm text-white flex items-center space-x-1">
                        <span className="text-red-400">📉</span>
                        <span>নিচে</span>
                      </span>
                    </label>
                  </div>

                  {/* Price Input Fields */}
                  <div className="space-y-2">
                    {enableAboveAlert && (
                      <div className="flex items-center space-x-2">
                        <span className="text-green-400 text-lg">📈</span>
                        <input
                          type="number"
                          value={newAboveAlertPrice}
                          onChange={(e) => setNewAboveAlertPrice(e.target.value)}
                          placeholder="উপরের টার্গেট প্রাইস"
                          className="flex-1 px-3 py-2 bg-white/10 border border-green-500/30 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-green-500/50"
                        />
                      </div>
                    )}
                    {enableBelowAlert && (
                      <div className="flex items-center space-x-2">
                        <span className="text-red-400 text-lg">📉</span>
                        <input
                          type="number"
                          value={newBelowAlertPrice}
                          onChange={(e) => setNewBelowAlertPrice(e.target.value)}
                          placeholder="নিচের টার্গেট প্রাইস"
                          className="flex-1 px-3 py-2 bg-white/10 border border-red-500/30 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-red-500/50"
                        />
                      </div>
                    )}
                  </div>
                  
                  <button
                    onClick={addPriceAlert}
                    className="w-full px-4 py-3 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-lg hover:from-red-700 hover:to-orange-700 transition-all duration-200 text-sm font-medium flex items-center justify-center space-x-2 shadow-lg"
                  >
                    <span className="text-yellow-300 animate-pulse">🚨</span>
                    <span>
                      {enableAboveAlert && enableBelowAlert ? 'দুই দিকেই অ্যালার্ট যোগ করুন' : 
                       enableAboveAlert ? 'উপরের অ্যালার্ট যোগ করুন' : 
                       enableBelowAlert ? 'নিচের অ্যালার্ট যোগ করুন' : 'অ্যালার্ট যোগ করুন'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Timeframe Selector */}
              <div>
                <label className="block text-sm font-semibold text-white mb-3">
                  <Filter className="w-4 h-4 inline mr-2" />
                  টাইমফ্রেম নির্বাচন করুন
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {TIMEFRAMES.map((timeframe) => (
                    <button
                      key={timeframe.value}
                      onClick={() => setSelectedTimeframe(timeframe.value)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        selectedTimeframe === timeframe.value
                          ? `bg-gradient-to-r ${currentCoin.color} text-white shadow-lg`
                          : 'bg-white/10 text-white/70 hover:bg-white/20'
                      }`}
                      title={timeframe.description}
                    >
                      {timeframe.label}
                    </button>
                  ))}
                </div>
                {currentTimeframe && (
                  <div className="mt-2 text-xs text-white/60">
                    📊 {currentTimeframe.description}
                  </div>
                )}
              </div>

              {/* Custom Date Range */}
              <div>
                <label className="block text-sm font-semibold text-white mb-3">
                  <Calendar className="w-4 h-4 inline mr-2" />
                  কাস্টম ডেট রেঞ্জ
                </label>
                <div className="space-y-2">
                  <input
                    type="datetime-local"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30"
                    placeholder="শুরুর তারিখ"
                  />
                  <input
                    type="datetime-local"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30"
                    placeholder="শেষের তারিখ"
                  />
                </div>
              </div>

              {/* Actions */}
              <div>
                <label className="block text-sm font-semibold text-white mb-3">
                  <Settings className="w-4 h-4 inline mr-2" />
                  অ্যাকশন
                </label>
                <div className="space-y-2">
                  <button
                    onClick={resetFilters}
                    className="w-full px-4 py-2 bg-white/10 text-white/70 rounded-lg hover:bg-white/20 transition-colors duration-200 text-sm font-medium"
                  >
                    ফিল্টার রিসেট করুন
                  </button>
                  <button
                    onClick={() => {
                      const csvContent = "data:text/csv;charset=utf-8," + 
                        "Date,Time,Open,High,Low,Close,Volume\n" +
                        ohlcvData.map(row => 
                          `${row.date},${row.time},${row.open},${row.high},${row.low},${row.close},${row.volume}`
                        ).join("\n");
                      
                      const encodedUri = encodeURI(csvContent);
                      const link = document.createElement("a");
                      link.setAttribute("href", encodedUri);
                      link.setAttribute("download", `${currentCoin.symbol}_ohlcv_${selectedTimeframe}.csv`);
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }}
                    className="w-full px-4 py-2 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:from-green-700 hover:to-blue-700 transition-all duration-200 text-sm font-medium flex items-center justify-center space-x-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>CSV ডাউনলোড</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Active Price Alerts */}
          {priceAlerts.length > 0 && (
            <div className="mb-8">
              <div className="bg-white/5 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/10 p-6">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
                  <span className="text-red-400">🚨</span>
                  <span>সক্রিয় প্রাইস অ্যালার্ট ({priceAlerts.length})</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {priceAlerts.map((alert) => (
                    <div key={alert.id} className={`p-4 rounded-lg border ${
                      alert.enabled 
                        ? 'bg-white/10 border-white/20' 
                        : 'bg-white/5 border-white/10 opacity-50'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className={`text-lg ${alert.type === 'above' ? 'text-green-400' : 'text-red-400'}`}>
                            {alert.type === 'above' ? '📈' : '📉'}
                          </span>
                          <span className="text-white font-medium">
                            {alert.type === 'above' ? 'উপরে' : 'নিচে'}
                          </span>
                        </div>
                        <button
                          onClick={() => togglePriceAlert(alert.id)}
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            alert.enabled 
                              ? 'bg-green-500 text-white' 
                              : 'bg-gray-500 text-white'
                          }`}
                        >
                          {alert.enabled ? '✓' : '✗'}
                        </button>
                      </div>
                      <div className="text-2xl font-bold text-white mb-2">
                        {formatPrice(alert.price)}
                      </div>
                      <div className="text-sm text-white/70 mb-3">
                        বর্তমান: {formatPrice(currentPrice)}
                      </div>
                      {/* Cooldown Status */}
                      {(() => {
                        const lastAlert = lastAlertTime[alert.id] || 0;
                        const timeSinceLastAlert = Date.now() - lastAlert;
                        const cooldownRemaining = Math.max(0, (5 * 60 * 1000) - timeSinceLastAlert);
                        const minutesRemaining = Math.ceil(cooldownRemaining / (60 * 1000));
                        
                        if (cooldownRemaining > 0) {
                          return (
                            <div className="text-xs text-yellow-400 mb-2 flex items-center space-x-1">
                              <span>⏰</span>
                              <span>কুলডাউন: {minutesRemaining} মিনিট</span>
                            </div>
                          );
                        }
                        return (
                          <div className="text-xs text-green-400 mb-2 flex items-center space-x-1">
                            <span>✅</span>
                            <span>প্রস্তুত</span>
                          </div>
                        );
                      })()}
                      <button
                        onClick={() => removePriceAlert(alert.id)}
                        className="w-full px-3 py-1 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors duration-200 text-sm"
                      >
                        মুছে ফেলুন
                      </button>
                    </div>
                  ))}
                </div>
                
                {/* Alert System Info */}
                <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <h4 className="text-sm font-semibold text-blue-400 mb-2 flex items-center space-x-2">
                    <span>ℹ️</span>
                    <span>স্মার্ট এলার্ট সিস্টেম</span>
                  </h4>
                  <ul className="text-xs text-blue-300 space-y-1">
                    <li>• প্রতিটি এলার্টের পর ৫ মিনিট কুলডাউন পিরিয়ড</li>
                    <li>• ০.৫% এর কম দাম পরিবর্তনে এলার্ট দেবে না</li>
                    <li>• ঘন ঘন এলার্ট এড়ানোর জন্য স্মার্ট ফিল্টারিং</li>
                    <li>• সাউন্ড + ভিজ্যুয়াল + ব্রাউজার নোটিফিকেশন</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* OHLCV Data Table */}
        <div className="bg-white/5 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/10 overflow-hidden">
          <div className="px-6 py-4 border-b border-white/5">
            <h2 className="text-lg font-bold text-white flex items-center space-x-2">
              <BarChart3 className="w-6 h-6" />
              <span>
                {currentCoin.name} ({currentCoin.symbol}) OHLCV ডেটা - {currentTimeframe?.label}
              </span>
            </h2>
            <p className="text-sm text-white/60 mt-1">
              📊 {currentTimeframe?.description} | 🔴 লাইভ প্রাইস (১ সেকেন্ড) | 📊 OHLCV (৩০ সেকেন্ড)
            </p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5 border-b border-white/5">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-white">📅 তারিখ</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-white">⏰ সময়</th>
                  <th className="text-right px-6 py-4 text-sm font-semibold text-white">💲 ওপেন</th>
                  <th className="text-right px-6 py-4 text-sm font-semibold text-white">🔺 হাই</th>
                  <th className="text-right px-6 py-4 text-sm font-semibold text-white">🔻 লো</th>
                  <th className="text-right px-6 py-4 text-sm font-semibold text-white">🏷️ ক্লোজ</th>
                  <th className="text-right px-6 py-4 text-sm font-semibold text-white">📈 ভলিউম</th>
                  <th className="text-center px-6 py-4 text-sm font-semibold text-white">📊 পরিবর্তন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-16 text-center">
                      <div className="flex items-center justify-center space-x-3">
                        <RefreshCw className="w-6 h-6 animate-spin text-white/60" />
                        <span className="text-white text-lg">Binance থেকে {currentCoin.name} ডেটা লোড হচ্ছে...</span>
                      </div>
                    </td>
                  </tr>
                ) : ohlcvData.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-16 text-center text-white/60">
                      কোন ডেটা পাওয়া যায়নি
                    </td>
                  </tr>
                ) : (
                  ohlcvData.map((data, index) => {
                    const change = data.close - data.open;
                    const changePercent = (change / data.open) * 100;
                    const isPositive = change >= 0;
                    
                    return (
                      <tr key={data.timestamp} className="hover:bg-white/5 transition-colors duration-200">
                        <td className="px-6 py-4 text-sm font-medium text-white/80">{data.date}</td>
                        <td className="px-6 py-4 text-sm font-medium text-white/80">{data.time}</td>
                        <td className="px-6 py-4 text-right text-sm font-bold text-white">
                          <span className="text-sm font-bold">{formatPrice(data.open)}</span>
                        </td>
                        <td className="px-6 py-4 text-right text-sm font-bold text-green-400">
                          <span className="text-sm font-bold">{formatPrice(data.high)}</span>
                        </td>
                        <td className="px-6 py-4 text-right text-sm font-bold text-red-400">
                          <span className="text-sm font-bold">{formatPrice(data.low)}</span>
                        </td>
                        <td className="px-6 py-4 text-right text-lg font-bold text-white">
                          <span className="text-lg font-bold">{formatPrice(data.close)}</span>
                        </td>
                        <td className="px-6 py-4 text-right text-sm font-medium text-white/80">
                          <span className="text-sm font-medium">{formatVolume(data.volume)} {currentCoin.symbol}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className={`flex items-center justify-center space-x-1 px-3 py-1.5 rounded-full ${
                            isPositive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                          }`}>
                            {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            <span className="text-sm font-medium">
                              {isPositive ? '+' : ''}{changePercent.toFixed(2)}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white/5 backdrop-blur-lg rounded-xl shadow-lg border border-white/10 p-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <div className="text-sm text-white/70">গড় ভলিউম</div>
                <div className="text-lg font-bold text-blue-400">
                  {ohlcvData.length > 0 ? 
                    formatVolume(ohlcvData.reduce((sum, d) => sum + d.volume, 0) / ohlcvData.length) + ` ${currentCoin.symbol}`
                    : `0 ${currentCoin.symbol}`
                  }
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-lg rounded-xl shadow-lg border border-white/10 p-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-400" />
              </div>
              <div>
                <div className="text-sm text-white/70">ডেটা পয়েন্ট</div>
                <div className="text-lg font-bold text-yellow-400">
                  {ohlcvData.length} / {currentTimeframe?.limit}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CryptoDashboard;