import React, { useState, useEffect } from 'react';
import { RefreshCw, TrendingUp, TrendingDown, Clock, Calendar, DollarSign, BarChart3 } from 'lucide-react';
import { StockData } from '../types/stock';
import { fetchStockData, getMarketStatus } from '../services/stockService';

const StockTable: React.FC = () => {
  const [stockData, setStockData] = useState<StockData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [marketStatus, setMarketStatus] = useState(getMarketStatus());

  const loadStockData = async () => {
    try {
      setIsLoading(true);
      const data = await fetchStockData();
      setStockData(data);
      setLastUpdated(new Date());
      setMarketStatus(getMarketStatus());
    } catch (error) {
      console.error('Error fetching stock data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStockData();
    
    // Auto-refresh every 15 seconds
    const interval = setInterval(loadStockData, 15000);
    
    return () => clearInterval(interval);
  }, []);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price);
  };

  const formatVolume = (volume: number) => {
    if (volume >= 1000000) {
      return `${(volume / 1000000).toFixed(1)}M`;
    }
    if (volume >= 1000) {
      return `${(volume / 1000).toFixed(1)}K`;
    }
    return volume.toString();
  };

  const formatChange = (change: number, changePercent: number) => {
    const isPositive = change >= 0;
    const color = isPositive ? 'text-green-600' : 'text-red-600';
    const bgColor = isPositive ? 'bg-green-50' : 'bg-red-50';
    const icon = isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />;
    
    return (
      <div className={`flex items-center space-x-1 px-2 py-1 rounded-full ${bgColor} ${color}`}>
        {icon}
        <span className="text-xs font-medium">
          {isPositive ? '+' : ''}{change.toFixed(2)} ({changePercent.toFixed(2)}%)
        </span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Stock Market Dashboard</h1>
              <p className="text-gray-600 mt-1">Real-time stock data with live updates</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${marketStatus.isOpen ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-sm text-gray-600">
                  {marketStatus.isOpen ? 'Market Open' : `Market Closed - ${marketStatus.nextOpen}`}
                </span>
              </div>
              <button
                onClick={loadStockData}
                disabled={isLoading}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>
          
          {lastUpdated && (
            <div className="text-sm text-gray-500">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </div>
          )}
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">Symbol</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">
                    <div className="flex items-center space-x-2">
                      <span>⏰ Hour</span>
                    </div>
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">
                    <div className="flex items-center space-x-2">
                      <span>📅 Date</span>
                    </div>
                  </th>
                  <th className="text-right px-6 py-4 text-sm font-semibold text-gray-900">
                    <div className="flex items-center justify-end space-x-2">
                      <span>💲 Open Price</span>
                    </div>
                  </th>
                  <th className="text-right px-6 py-4 text-sm font-semibold text-gray-900">
                    <div className="flex items-center justify-end space-x-2">
                      <span>🔺 High</span>
                    </div>
                  </th>
                  <th className="text-right px-6 py-4 text-sm font-semibold text-gray-900">
                    <div className="flex items-center justify-end space-x-2">
                      <span>🔻 Low</span>
                    </div>
                  </th>
                  <th className="text-right px-6 py-4 text-sm font-semibold text-gray-900">
                    <div className="flex items-center justify-end space-x-2">
                      <span>🏷️ Close</span>
                    </div>
                  </th>
                  <th className="text-right px-6 py-4 text-sm font-semibold text-gray-900">
                    <div className="flex items-center justify-end space-x-2">
                      <span>📈 Volume</span>
                    </div>
                  </th>
                  <th className="text-center px-6 py-4 text-sm font-semibold text-gray-900">Change</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
                        <span className="text-gray-600">Loading stock data...</span>
                      </div>
                    </td>
                  </tr>
                ) : stockData.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                      No stock data available
                    </td>
                  </tr>
                ) : (
                  stockData.map((stock) => (
                    <tr key={stock.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-bold text-sm">{stock.symbol.charAt(0)}</span>
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">{stock.symbol}</div>
                            <div className="text-sm text-gray-500">Stock</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{stock.hour}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{stock.date}</td>
                      <td className="px-6 py-4 text-right text-sm font-medium text-gray-900">
                        {formatPrice(stock.open)}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium text-green-600">
                        {formatPrice(stock.high)}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium text-red-600">
                        {formatPrice(stock.low)}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-bold text-gray-900">
                        {formatPrice(stock.close)}
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-gray-900">
                        {formatVolume(stock.volume)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {formatChange(stock.change, stock.changePercent)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Stats Footer */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <div className="text-sm text-gray-600">Gainers</div>
                <div className="text-2xl font-bold text-green-600">
                  {stockData.filter(s => s.change > 0).length}
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <div className="text-sm text-gray-600">Losers</div>
                <div className="text-2xl font-bold text-red-600">
                  {stockData.filter(s => s.change < 0).length}
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="text-sm text-gray-600">Total Stocks</div>
                <div className="text-2xl font-bold text-blue-600">
                  {stockData.length}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockTable;