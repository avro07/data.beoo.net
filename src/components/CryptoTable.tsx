import React, { useState, useEffect } from 'react';
import { RefreshCw, TrendingUp, TrendingDown, Clock, Calendar, DollarSign, BarChart3, Coins, Crown, Zap } from 'lucide-react';
import { CryptoData } from '../types/crypto';
import { fetchCryptoData, getCryptoMarketStatus } from '../services/cryptoService';

const CryptoTable: React.FC = () => {
  const [cryptoData, setCryptoData] = useState<CryptoData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [marketStatus, setMarketStatus] = useState(getCryptoMarketStatus());

  const loadCryptoData = async () => {
    try {
      setIsLoading(true);
      console.log('Loading real-time crypto data from Binance...');
      const data = await fetchCryptoData();
      setCryptoData(data);
      setLastUpdated(new Date());
      setMarketStatus(getCryptoMarketStatus());
    } catch (error) {
      console.error('Error fetching crypto data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCryptoData();
    
    // Auto-refresh every 30 seconds for real API data
    const interval = setInterval(loadCryptoData, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const formatPrice = (price: number, symbol: string) => {
    if (symbol === 'BTC' || symbol === 'ETH') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(price);
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 4
    }).format(price);
  };

  const formatVolume = (volume: number) => {
    if (volume >= 1000000000) {
      return `$${(volume / 1000000000).toFixed(2)}B`;
    }
    if (volume >= 1000000) {
      return `$${(volume / 1000000).toFixed(1)}M`;
    }
    if (volume >= 1000) {
      return `$${(volume / 1000).toFixed(1)}K`;
    }
    return `$${volume.toString()}`;
  };

  const formatMarketCap = (marketCap: number) => {
    if (marketCap >= 1000000000000) {
      return `$${(marketCap / 1000000000000).toFixed(2)}T`;
    }
    if (marketCap >= 1000000000) {
      return `$${(marketCap / 1000000000).toFixed(1)}B`;
    }
    if (marketCap >= 1000000) {
      return `$${(marketCap / 1000000).toFixed(1)}M`;
    }
    return `$${marketCap.toString()}`;
  };

  const formatChange = (change: number, changePercent: number) => {
    const isPositive = change >= 0;
    const color = isPositive ? 'text-green-600' : 'text-red-600';
    const bgColor = isPositive ? 'bg-green-50' : 'bg-red-50';
    const icon = isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />;
    
    return (
      <div className={`flex items-center space-x-1 px-3 py-1.5 rounded-full ${bgColor} ${color}`}>
        {icon}
        <span className="text-xs font-medium">
          {isPositive ? '+' : ''}{changePercent.toFixed(2)}%
        </span>
      </div>
    );
  };

  const getCryptoIcon = (symbol: string) => {
    const iconColors: { [key: string]: string } = {
      'BTC': 'bg-orange-100 text-orange-600',
      'ETH': 'bg-blue-100 text-blue-600',
      'BNB': 'bg-yellow-100 text-yellow-600',
      'SOL': 'bg-purple-100 text-purple-600',
      'XRP': 'bg-gray-100 text-gray-600'
    };
    
    return iconColors[symbol] || 'bg-gray-100 text-gray-600';
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return <Crown className="w-4 h-4 text-yellow-500" />;
    }
    return (
      <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
        <span className="text-xs font-bold text-gray-600">#{rank}</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-xl flex items-center justify-center">
                  <Coins className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-white">Top 5 Crypto Dashboard</h1>
                  <p className="text-purple-200 mt-1">Real-time cryptocurrency market data</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-sm text-white font-medium">
                  {marketStatus.isOpen ? '24/7 Live Trading' : marketStatus.nextOpen}
                </span>
              </div>
              <button
                onClick={loadCryptoData}
                disabled={isLoading}
                className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                <span className="font-medium">Refresh</span>
              </button>
            </div>
          </div>
          
          {lastUpdated && (
            <div className="text-sm text-purple-200 flex items-center space-x-2">
              <Clock className="w-4 h-4" />
              <span>Last updated: {lastUpdated.toLocaleTimeString()} (Live Binance Data)</span>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  <th className="text-left px-6 py-5 text-sm font-semibold text-white">
                    <div className="flex items-center space-x-2">
                      <span>🏆 Rank</span>
                    </div>
                  </th>
                  <th className="text-left px-6 py-5 text-sm font-semibold text-white">Cryptocurrency</th>
                  <th className="text-left px-6 py-5 text-sm font-semibold text-white">
                    <div className="flex items-center space-x-2">
                      <span>⏰ Hour</span>
                    </div>
                  </th>
                  <th className="text-left px-6 py-5 text-sm font-semibold text-white">
                    <div className="flex items-center space-x-2">
                      <span>📅 Date</span>
                    </div>
                  </th>
                  <th className="text-right px-6 py-5 text-sm font-semibold text-white">
                    <div className="flex items-center justify-end space-x-2">
                      <span>💲 Open Price</span>
                    </div>
                  </th>
                  <th className="text-right px-6 py-5 text-sm font-semibold text-white">
                    <div className="flex items-center justify-end space-x-2">
                      <span>🔺 High</span>
                    </div>
                  </th>
                  <th className="text-right px-6 py-5 text-sm font-semibold text-white">
                    <div className="flex items-center justify-end space-x-2">
                      <span>🔻 Low</span>
                    </div>
                  </th>
                  <th className="text-right px-6 py-5 text-sm font-semibold text-white">
                    <div className="flex items-center justify-end space-x-2">
                      <span>🏷️ Close</span>
                    </div>
                  </th>
                  <th className="text-right px-6 py-5 text-sm font-semibold text-white">
                    <div className="flex items-center justify-end space-x-2">
                      <span>📈 Volume</span>
                    </div>
                  </th>
                  <th className="text-right px-6 py-5 text-sm font-semibold text-white">
                    <div className="flex items-center justify-end space-x-2">
                      <span>💎 Market Cap</span>
                    </div>
                  </th>
                  <th className="text-center px-6 py-5 text-sm font-semibold text-white">24h Change</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {isLoading ? (
                  <tr>
                    <td colSpan={11} className="px-6 py-16 text-center">
                      <div className="flex items-center justify-center space-x-3">
                        <RefreshCw className="w-6 h-6 animate-spin text-purple-400" />
                        <span className="text-white text-lg">Loading live data from Binance...</span>
                      </div>
                    </td>
                  </tr>
                ) : cryptoData.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="px-6 py-16 text-center text-purple-200">
                      No crypto data available
                    </td>
                  </tr>
                ) : (
                  cryptoData.map((crypto) => (
                    <tr key={crypto.id} className="hover:bg-white/5 transition-colors duration-200">
                      <td className="px-6 py-5">
                        <div className="flex items-center justify-center">
                          {getRankBadge(crypto.rank)}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center space-x-4">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${getCryptoIcon(crypto.symbol)}`}>
                            <span className="font-bold text-lg">{crypto.symbol.charAt(0)}</span>
                          </div>
                          <div>
                            <div className="font-bold text-white text-lg">{crypto.symbol}</div>
                            <div className="text-sm text-purple-200">{crypto.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-sm text-purple-100 font-medium">{crypto.hour}</td>
                      <td className="px-6 py-5 text-sm text-purple-100 font-medium">{crypto.date}</td>
                      <td className="px-6 py-5 text-right text-sm font-bold text-white">
                        {formatPrice(crypto.open, crypto.symbol)}
                      </td>
                      <td className="px-6 py-5 text-right text-sm font-bold text-green-400">
                        {formatPrice(crypto.high, crypto.symbol)}
                      </td>
                      <td className="px-6 py-5 text-right text-sm font-bold text-red-400">
                        {formatPrice(crypto.low, crypto.symbol)}
                      </td>
                      <td className="px-6 py-5 text-right text-lg font-bold text-white">
                        {formatPrice(crypto.close, crypto.symbol)}
                      </td>
                      <td className="px-6 py-5 text-right text-sm font-medium text-purple-100">
                        {formatVolume(crypto.volume)}
                      </td>
                      <td className="px-6 py-5 text-right text-sm font-bold text-yellow-400">
                        {formatMarketCap(crypto.marketCap)}
                      </td>
                      <td className="px-6 py-5 text-center">
                        {formatChange(crypto.change, crypto.changePercent)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Stats Footer */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white/10 backdrop-blur-lg rounded-xl shadow-lg border border-white/20 p-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <div className="text-sm text-purple-200">Gainers</div>
                <div className="text-3xl font-bold text-green-400">
                  {cryptoData.filter(c => c.change > 0).length}
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-lg rounded-xl shadow-lg border border-white/20 p-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
                <TrendingDown className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <div className="text-sm text-purple-200">Losers</div>
                <div className="text-3xl font-bold text-red-400">
                  {cryptoData.filter(c => c.change < 0).length}
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-lg rounded-xl shadow-lg border border-white/20 p-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
                <Coins className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <div className="text-sm text-purple-200">Total Cryptos</div>
                <div className="text-3xl font-bold text-blue-400">
                  {cryptoData.length}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-xl shadow-lg border border-white/20 p-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center">
                <Zap className="w-6 h-6 text-yellow-400" />
              </div>
              <div>
                <div className="text-sm text-purple-200">Market Status</div>
                <div className="text-lg font-bold text-yellow-400">
                  24/7 Live
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CryptoTable;