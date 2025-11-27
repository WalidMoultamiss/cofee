import React from 'react';
import { GameState, CoffeeFortune } from '../types';

interface UIProps {
  gameState: GameState;
  fillLevel: number;
  onStart: () => void;
  onFinishPour: () => void;
  onReset: () => void;
  fortune: CoffeeFortune | null;
}

export const UI: React.FC<UIProps> = ({ 
  gameState, 
  fillLevel, 
  onStart, 
  onFinishPour, 
  onReset, 
  fortune 
}) => {
  // Helpers
  const isOverflow = fillLevel > 100;
  const isGoodPour = fillLevel >= 80 && fillLevel <= 96;
  
  if (gameState === GameState.MENU) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm z-10 text-white">
        <h1 className="text-6xl mb-4 font-serif text-[#eab308] drop-shadow-md">Zen Coffee</h1>
        <p className="text-xl mb-8 font-light tracking-wide max-w-md text-center">
          Master the art of the pour. Fill the cup to the gold ring without spilling. 
          Discover your fortune in the grounds.
        </p>
        <button 
          onClick={onStart}
          className="px-8 py-3 bg-[#eab308] hover:bg-[#ca9a07] text-black font-bold rounded-full transition-all transform hover:scale-105 shadow-lg"
        >
          Start Brewing
        </button>
      </div>
    );
  }

  if (gameState === GameState.PLAYING) {
    return (
      <div className="absolute inset-0 pointer-events-none z-10 p-6 flex flex-col justify-between">
        <div className="flex justify-between items-start">
            <div className="bg-white/90 backdrop-blur rounded-xl p-4 shadow-lg text-gray-800">
                <h3 className="text-sm uppercase tracking-widest text-gray-500 mb-1">Target</h3>
                <p className="font-bold text-xl">Fill to Gold Ring</p>
            </div>
            
            {/* Live Stats */}
            <div className="bg-white/90 backdrop-blur rounded-xl p-4 shadow-lg text-gray-800 min-w-[120px]">
                <h3 className="text-sm uppercase tracking-widest text-gray-500 mb-1">Fill Level</h3>
                <div className="flex items-end gap-1">
                    <span className={`text-3xl font-bold ${isOverflow ? 'text-red-500' : 'text-gray-900'}`}>
                        {Math.min(fillLevel, 100).toFixed(0)}%
                    </span>
                    {isOverflow && <span className="text-red-500 text-sm font-bold mb-1">OVERFLOW!</span>}
                </div>
            </div>
        </div>

        {/* Done Button - Only active if poured something */}
        <div className="flex justify-center pb-8">
            <button
                onClick={onFinishPour}
                disabled={fillLevel <= 0}
                className={`pointer-events-auto px-10 py-4 rounded-full font-bold text-lg shadow-xl transition-all
                  ${fillLevel <= 0 
                     ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                     : 'bg-green-600 hover:bg-green-700 text-white transform hover:scale-105'
                  }`}
            >
                {isOverflow ? 'Clean Up & Serve' : 'Serve Coffee'}
            </button>
        </div>
      </div>
    );
  }

  if (gameState === GameState.ANALYZING) {
      return (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-20">
             <div className="flex flex-col items-center">
                <div className="w-16 h-16 border-4 border-[#eab308] border-t-transparent rounded-full animate-spin mb-4"></div>
                <h2 className="text-2xl text-white font-serif">Consulting the Coffee Spirits...</h2>
             </div>
        </div>
      );
  }

  if (gameState === GameState.FINISHED && fortune) {
      return (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-md z-30 p-4">
            <div className="bg-[#fffcf5] text-gray-900 max-w-lg w-full rounded-2xl shadow-2xl overflow-hidden border border-gray-200">
                {/* Header */}
                <div className="bg-[#2c241b] p-6 text-center">
                    <h2 className="text-[#eab308] text-3xl font-serif mb-2">{fortune.title}</h2>
                    <div className="flex justify-center items-center gap-2">
                         <div className="text-white/80 text-sm tracking-widest uppercase">Barista Rating</div>
                         <div className="text-2xl font-bold text-white">{fortune.rating}/10</div>
                    </div>
                </div>
                
                {/* Content */}
                <div className="p-8 space-y-6">
                    <div>
                        <h3 className="text-sm font-bold text-[#eab308] uppercase mb-2 tracking-wide">The Oracle Speaks</h3>
                        <p className="text-xl font-serif leading-relaxed italic text-gray-700">
                            "{fortune.fortune}"
                        </p>
                    </div>
                    
                    <div className="bg-gray-100 p-4 rounded-lg border-l-4 border-gray-400">
                        <h3 className="text-xs font-bold text-gray-500 uppercase mb-1">Technique Critique</h3>
                        <p className="text-sm text-gray-600">
                            {fortune.baristaComment}
                        </p>
                    </div>

                    <button 
                        onClick={onReset}
                        className="w-full py-4 bg-[#eab308] hover:bg-[#ca9a07] text-black font-bold text-lg rounded-xl transition-colors shadow-md"
                    >
                        Brew Another Cup
                    </button>
                </div>
            </div>
        </div>
      );
  }

  return null;
};
