
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { getCurrentUser } from "@/utils/authUtils";
import { addGameHistory } from "@/utils/gameUtils";
import { useNavigate } from "react-router-dom";

// Roulette wheel data
const ROULETTE_NUMBERS = [
  { number: 0, color: 'green' },
  { number: 32, color: 'red' }, { number: 15, color: 'black' },
  { number: 19, color: 'red' }, { number: 4, color: 'black' },
  { number: 21, color: 'red' }, { number: 2, color: 'black' },
  { number: 25, color: 'red' }, { number: 17, color: 'black' },
  { number: 34, color: 'red' }, { number: 6, color: 'black' },
  { number: 27, color: 'red' }, { number: 13, color: 'black' },
  { number: 36, color: 'red' }, { number: 11, color: 'black' },
  { number: 30, color: 'red' }, { number: 8, color: 'black' },
  { number: 23, color: 'red' }, { number: 10, color: 'black' },
  { number: 5, color: 'red' }, { number: 24, color: 'black' },
  { number: 16, color: 'red' }, { number: 33, color: 'black' },
  { number: 1, color: 'red' }, { number: 20, color: 'black' },
  { number: 14, color: 'red' }, { number: 31, color: 'black' },
  { number: 9, color: 'red' }, { number: 22, color: 'black' },
  { number: 18, color: 'red' }, { number: 29, color: 'black' },
  { number: 7, color: 'red' }, { number: 28, color: 'black' },
  { number: 12, color: 'red' }, { number: 35, color: 'black' },
  { number: 3, color: 'red' }, { number: 26, color: 'black' }
];

type BetType = 'red' | 'black' | 'green' | null;

const RouletteGame = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(getCurrentUser());
  const [betAmount, setBetAmount] = useState(0);
  const [selectedBet, setSelectedBet] = useState<BetType>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [result, setResult] = useState('');
  const [wheelRotation, setWheelRotation] = useState(0);
  const [winningNumber, setWinningNumber] = useState<typeof ROULETTE_NUMBERS[0] | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/');
    }
  }, [navigate]);

  // Update user on state changes
  useEffect(() => {
    setUser(getCurrentUser());
  }, [isSpinning]);

  const createConfetti = () => {
    // This would be implemented with a proper confetti library in a real app
    console.log("Confetti effect triggered!");
  };

  const handlePlaceBet = (type: BetType) => {
    if (isSpinning || !betAmount || !user) return;
    
    setSelectedBet(type);
    setResult(`You bet ${betAmount} on ${type}`);
  };

  const handleChipSelect = (amount: number) => {
    if (isSpinning || !user) return;
    
    if (user.profile.coins >= amount) {
      // Deduct bet amount
      const updatedUser = { ...user };
      updatedUser.profile.coins -= amount;
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      setUser(updatedUser);
      
      setBetAmount(betAmount + amount);
    } else {
      toast({
        title: "Not enough coins!",
        description: "You don't have enough coins for that bet.",
        variant: "destructive",
      });
    }
  };

  const spinWheel = () => {
    if (isSpinning || !selectedBet || !betAmount || !user) return;
    
    setIsSpinning(true);
    setResult('Spinning...');
    
    // Randomly select a winning number
    const randomIndex = Math.floor(Math.random() * ROULETTE_NUMBERS.length);
    const winning = ROULETTE_NUMBERS[randomIndex];
    setWinningNumber(winning);
    
    // Animate wheel
    let rotation = 0;
    const totalSpins = 5;
    const duration = 3000;
    const interval = 50;
    const totalSteps = duration / interval;
    const degreesPerStep = (360 * totalSpins) / totalSteps;
    
    let step = 0;
    const spinInterval = setInterval(() => {
      rotation += degreesPerStep;
      setWheelRotation(rotation);
      
      step++;
      if (step >= totalSteps) {
        clearInterval(spinInterval);
        
        // Final position adjusted to show winning number
        const finalRotation = rotation + (randomIndex * (360 / ROULETTE_NUMBERS.length));
        setWheelRotation(finalRotation);
        
        setTimeout(() => {
          checkWin(winning);
        }, 1000);
      }
    }, interval);
  };

  const checkWin = (winning: typeof ROULETTE_NUMBERS[0]) => {
    let winAmount = 0;
    
    if ((selectedBet === 'red' && winning.color === 'red') || 
        (selectedBet === 'black' && winning.color === 'black')) {
      winAmount = betAmount * 2; // 2x for red/black bets
    } else if (selectedBet === 'green' && winning.color === 'green') {
      winAmount = betAmount * 14; // 14x for green bet (0)
    }
    
    if (winAmount > 0) {
      // Update user balance
      const updatedUser = { ...user };
      updatedUser.profile.coins += winAmount;
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      setUser(updatedUser);
      
      setResult(`WINNER! ${winning.number} ${winning.color}. You won ${winAmount} coins!`);
      toast({
        title: "Winner!",
        description: `You won ${winAmount} coins on ${winning.color}!`,
      });
      createConfetti();
      
      // Add to game history
      addGameHistory(user.profile.username, {
        gameId: 'roulette-game',
        gameName: 'Roulette',
        bet: betAmount,
        outcome: winAmount,
        timestamp: Date.now()
      });
    } else {
      setResult(`Sorry, ${winning.number} ${winning.color}. You lost ${betAmount} coins.`);
      
      // Add to game history
      addGameHistory(user.profile.username, {
        gameId: 'roulette-game',
        gameName: 'Roulette',
        bet: betAmount,
        outcome: -betAmount,
        timestamp: Date.now()
      });
    }
    
    // Reset for next round
    setBetAmount(0);
    setSelectedBet(null);
    setIsSpinning(false);
  };

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="p-8 rounded-lg border-2 border-casino-secondary bg-card">
        <h2 className="text-2xl font-bold mb-6 text-center gold-text">ROULETTE</h2>
        
        <div className="flex flex-col lg:flex-row items-center justify-center gap-8">
          {/* Roulette wheel */}
          <div className="relative">
            <div className="w-64 h-64 rounded-full border-4 border-casino-secondary bg-green-900 overflow-hidden relative"
                  style={{ transform: `rotate(${wheelRotation}deg)`, transition: 'transform 3s cubic-bezier(0.2, 0.8, 0.3, 1)' }}>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-yellow-500 z-10 flex items-center justify-center text-black font-bold text-xs">
                  ROYALE<br/>CASINO
                </div>
              </div>
              
              {ROULETTE_NUMBERS.map((num, index) => (
                <div key={index} 
                     className="absolute origin-bottom-right w-1/2 h-1/2"
                     style={{ 
                       transform: `rotate(${index * (360 / ROULETTE_NUMBERS.length)}deg)`,
                       backgroundColor: num.color
                     }}>
                  <span className="absolute bottom-2 right-4 text-white text-xs font-bold transform -rotate-90">
                    {num.number}
                  </span>
                </div>
              ))}
            </div>
            
            {/* Wheel indicator */}
            <div className="absolute top-0 left-1/2 w-2 h-6 bg-yellow-400 transform -translate-x-1/2 z-20"></div>
          </div>
          
          {/* Betting interface */}
          <div className="bg-muted p-6 rounded-lg shadow-lg w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Place Your Bets</h3>
            
            <div className="grid grid-cols-3 gap-2 mb-4">
              <Button 
                className={`${selectedBet === 'red' ? 'ring-2 ring-yellow-400' : ''} bg-red-600 hover:bg-red-700`}
                disabled={isSpinning || !betAmount}
                onClick={() => handlePlaceBet('red')}>
                Red
              </Button>
              <Button 
                className={`${selectedBet === 'black' ? 'ring-2 ring-yellow-400' : ''} bg-black hover:bg-gray-800`}
                disabled={isSpinning || !betAmount}
                onClick={() => handlePlaceBet('black')}>
                Black
              </Button>
              <Button 
                className={`${selectedBet === 'green' ? 'ring-2 ring-yellow-400' : ''} bg-green-600 hover:bg-green-700`}
                disabled={isSpinning || !betAmount}
                onClick={() => handlePlaceBet('green')}>
                Green (0)
              </Button>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-bold mb-2">Bet Amount: {betAmount}</label>
              <div className="flex space-x-2 flex-wrap">
                {[10, 50, 100, 500, 1000].map(amount => (
                  <button
                    key={amount}
                    onClick={() => handleChipSelect(amount)}
                    disabled={isSpinning || user.profile.coins < amount}
                    className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm cursor-pointer transition transform hover:scale-110 disabled:opacity-50 disabled:hover:scale-100 mb-2 ${
                      amount === 10 ? 'bg-red-500' :
                      amount === 50 ? 'bg-blue-500' :
                      amount === 100 ? 'bg-green-500' :
                      amount === 500 ? 'bg-purple-500' :
                      'bg-yellow-500'
                    }`}>
                    {amount}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <div>
                <span className="font-bold">Your Balance:</span>
                <span className="ml-2 gold-text">{user.profile.coins.toLocaleString()}</span>
              </div>
              <Button
                onClick={spinWheel}
                disabled={isSpinning || !selectedBet || !betAmount}
                className="bg-blue-600 hover:bg-blue-700 px-4 py-2">
                Spin Wheel
              </Button>
            </div>
            
            <div className="mt-4 p-3 bg-gray-700 rounded">
              <p className="font-bold gold-text">{result}</p>
              
              {winningNumber && (
                <p className="mt-2">Last spin: <span className="font-bold">{winningNumber.number}</span> <span className={`${
                  winningNumber.color === 'red' ? 'text-red-500' : 
                  winningNumber.color === 'black' ? 'text-gray-300' : 
                  'text-green-500'
                }`}>({winningNumber.color})</span></p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RouletteGame;
