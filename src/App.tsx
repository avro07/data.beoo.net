import React from 'react';
import { useState } from 'react';
import CryptoDashboard from './components/BitcoinDashboard';
import FuturesTrading from './components/FuturesTrading';
import { BarChart3, Activity } from 'lucide-react';

function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'futures'>('dashboard');

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <div className="bg-black/95 backdrop-blur-lg border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-bold text-white">Crypto Trading Platform</h1>
            </div>
            
            <nav className="flex space-x-1">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  activeTab === 'dashboard'
                    ? 'bg-gradient-to-r from-orange-500 to-yellow-500 text-white shadow-lg'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span>স্পট ড্যাশবোর্ড</span>
              </button>
              
              <button
                onClick={() => setActiveTab('futures')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  activeTab === 'futures'
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                <Activity className="w-4 h-4" />
                <span>ফিউচার ট্রেডিং</span>
              </button>
            </nav>
          </div>
        </div>
      </div>

      {/* Content */}
      {activeTab === 'dashboard' ? <CryptoDashboard /> : <FuturesTrading />}
    </div>
  );
}

export default App;