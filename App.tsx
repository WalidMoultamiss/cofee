import React, { useState, useCallback } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { UI } from './components/UI';
import { GameState, PourStats, CoffeeFortune } from './types';
import { generateCoffeeFortune } from './services/geminiService';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [currentFill, setCurrentFill] = useState(0);
  const [startTime, setStartTime] = useState<number>(0);
  const [fortune, setFortune] = useState<CoffeeFortune | null>(null);

  const handleStart = () => {
    setGameState(GameState.PLAYING);
    setCurrentFill(0);
    setStartTime(Date.now());
    setFortune(null);
  };

  const handlePourUpdate = useCallback((fill: number, isOverflow: boolean) => {
    setCurrentFill(fill);
  }, []);

  const handleFinishPour = async () => {
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    
    setGameState(GameState.ANALYZING);

    const stats: PourStats = {
        fillPercentage: currentFill,
        spilled: currentFill > 100,
        timeTaken: duration
    };

    // Call Gemini
    const result = await generateCoffeeFortune(stats);
    setFortune(result);
    setGameState(GameState.FINISHED);
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-neutral-900">
      <GameCanvas 
        gameState={gameState} 
        onPourUpdate={handlePourUpdate}
        onFinish={(stats) => { /* Optional auto-finish logic can go here */ }}
      />
      <UI 
        gameState={gameState}
        fillLevel={currentFill}
        onStart={handleStart}
        onFinishPour={handleFinishPour}
        onReset={() => setGameState(GameState.MENU)}
        fortune={fortune}
      />
    </div>
  );
};

export default App;
