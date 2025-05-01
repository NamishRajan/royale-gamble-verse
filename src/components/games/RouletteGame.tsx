
import { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { getCurrentUser } from "@/utils/authUtils";
import { addGameHistory } from "@/utils/gameUtils";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Check, X, ArrowRight, RefreshCw } from "lucide-react";

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

type BetType = 'red' | 'black' | 'green' | 'odd' | 'even' | 'high' | 'low' | number | null;
type BetRecord = { type: BetType; amount: number };

const RouletteGame = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(getCurrentUser());
  const [betAmount, setBetAmount] = useState(0);
  const [activeBets, setActiveBets] = useState<BetRecord[]>([]);
  const [selectedBet, setSelectedBet] = useState<BetType>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [result, setResult] = useState('');
  const [wheelRotation, setWheelRotation] = useState(0);
  const [wheelSpeed, setWheelSpeed] = useState(0);
  const [winningNumber, setWinningNumber] = useState<typeof ROULETTE_NUMBERS[0] | null>(null);
  const [betHistory, setBetHistory] = useState<Array<{
    number: number;
    color: string;
    win: boolean;
  }>>([]);
  const [hotNumbers, setHotNumbers] = useState<{[key: number]: number}>({});
  const [repeatLastBet, setRepeatLastBet] = useState(false);
  const [lastBets, setLastBets] = useState<BetRecord[]>([]);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/');
    }
  }, [navigate]);

  // Update user on state changes
  useEffect(() => {
    setUser(getCurrentUser());
  }, [isSpinning]);

  // Clean up animation
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // Effect for repeating last bet
  useEffect(() => {
    if (repeatLastBet && lastBets.length > 0) {
      setActiveBets([...lastBets]);
      
      // Calculate total bet amount
      const totalAmount = lastBets.reduce((sum, bet) => sum + bet.amount, 0);
      
      // Check if user has enough coins
      if (user && user.profile.coins >= totalAmount) {
        // Deduct bet amount
        const updatedUser = { ...user };
        updatedUser.profile.coins -= totalAmount;
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        setUser(updatedUser);
        
        setBetAmount(totalAmount);
      } else {
        toast({
          title: "Not enough coins!",
          description: "You don't have enough coins to repeat your last bet.",
          variant: "destructive",
        });
        setActiveBets([]);
      }
      
      // Reset flag
      setRepeatLastBet(false);
    }
  }, [repeatLastBet, lastBets, user]);

  const createConfetti = () => {
    const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff'];
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.top = '0';
    container.style.left = '0';
    container.style.width = '100%';
    container.style.height = '100%';
    container.style.pointerEvents = 'none';
    container.style.zIndex = '9999';
    document.body.appendChild(container);
    
    const confettiCount = 150;
    
    for (let i = 0; i < confettiCount; i++) {
      setTimeout(() => {
        const confetti = document.createElement('div');
        const size = Math.random() * 10 + 5;
        
        confetti.style.position = 'absolute';
        confetti.style.width = `${size}px`;
        confetti.style.height = `${size}px`;
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.left = `${Math.random() * 100}%`;
        confetti.style.top = '-20px';
        confetti.style.borderRadius = `${Math.random() > 0.5 ? '50%' : '0'}`;
        confetti.style.opacity = '1';
        
        container.appendChild(confetti);
        
        const angle = Math.random() * Math.PI * 2;
        const velocity = Math.random() * 2 + 2;
        const rotationVelocity = (Math.random() - 0.5) * 10;
        let rotation = 0;
        let posX = Math.random() * window.innerWidth;
        let posY = -20;
        
        function animateConfetti() {
          posX += Math.cos(angle) * velocity;
          posY += Math.sin(angle) * velocity + 2; // Gravity effect
          rotation += rotationVelocity;
          
          confetti.style.transform = `translate3d(${posX}px, ${posY}px, 0) rotate(${rotation}deg)`;
          
          if (posY < window.innerHeight) {
            animationRef.current = requestAnimationFrame(animateConfetti);
          } else {
            confetti.remove();
            if (i === confettiCount - 1) {
              setTimeout(() => container.remove(), 1000);
            }
          }
        }
        
        animationRef.current = requestAnimationFrame(animateConfetti);
      }, i * 20);
    }
  };

  const handlePlaceBet = (type: BetType) => {
    if (isSpinning || !betAmount || !user) return;
    
    setSelectedBet(type);
    
    // Add to active bets
    const existingBetIndex = activeBets.findIndex(bet => bet.type === type);
    if (existingBetIndex !== -1) {
      // Update existing bet
      const updatedBets = [...activeBets];
      updatedBets[existingBetIndex].amount += betAmount;
      setActiveBets(updatedBets);
    } else {
      // Add new bet
      setActiveBets([...activeBets, { type, amount: betAmount }]);
    }
    
    setResult(`You bet ${betAmount} on ${typeof type === 'number' ? `number ${type}` : type}`);
    setBetAmount(0); // Reset bet amount after placing
  };

  const clearBets = () => {
    if (isSpinning) return;
    
    // Refund all bet amounts
    if (activeBets.length > 0) {
      const totalRefund = activeBets.reduce((sum, bet) => sum + bet.amount, 0);
      const updatedUser = { ...user };
      updatedUser.profile.coins += totalRefund;
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      setUser(updatedUser);
    }
    
    setActiveBets([]);
    setResult('All bets cleared');
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
    if (isSpinning || !activeBets.length || !user) return;
    
    setIsSpinning(true);
    setResult('Spinning...');
    setLastBets([...activeBets]); // Store for repeat bet feature
    
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
    setWheelSpeed(10); // Start at high speed
    
    const spinInterval = setInterval(() => {
      rotation += degreesPerStep;
      setWheelRotation(rotation);
      
      // Gradually slow down
      if (step > totalSteps * 0.7) {
        setWheelSpeed(prev => Math.max(0.5, prev * 0.95));
      }
      
      step++;
      if (step >= totalSteps) {
        clearInterval(spinInterval);
        
        // Final position adjusted to show winning number
        const finalRotation = rotation + (randomIndex * (360 / ROULETTE_NUMBERS.length));
        setWheelRotation(finalRotation);
        setWheelSpeed(0);
        
        setTimeout(() => {
          checkWin(winning);
        }, 1000);
      }
    }, interval);
  };

  const checkWin = (winning: typeof ROULETTE_NUMBERS[0]) => {
    let totalWinAmount = 0;
    
    // Update bet history
    setBetHistory(prev => [
      { number: winning.number, color: winning.color, win: false },
      ...prev.slice(0, 9)
    ]);
    
    // Update hot numbers
    setHotNumbers(prev => {
      const updated = { ...prev };
      updated[winning.number] = (updated[winning.number] || 0) + 1;
      return updated;
    });
    
    // Check each active bet
    activeBets.forEach(bet => {
      let winAmount = 0;
      let win = false;
      
      // Check different bet types
      if (typeof bet.type === 'number' && bet.type === winning.number) {
        // Straight up number bet (35:1)
        winAmount = bet.amount * 36; // Original bet + 35x win
        win = true;
      } else if (bet.type === 'red' && winning.color === 'red') {
        winAmount = bet.amount * 2;
        win = true;
      } else if (bet.type === 'black' && winning.color === 'black') {
        winAmount = bet.amount * 2;
        win = true;
      } else if (bet.type === 'green' && winning.color === 'green') {
        winAmount = bet.amount * 36;
        win = true;
      } else if (bet.type === 'odd' && winning.number % 2 === 1 && winning.number !== 0) {
        winAmount = bet.amount * 2;
        win = true;
      } else if (bet.type === 'even' && winning.number % 2 === 0 && winning.number !== 0) {
        winAmount = bet.amount * 2;
        win = true;
      } else if (bet.type === 'high' && winning.number >= 19 && winning.number !== 0) {
        winAmount = bet.amount * 2;
        win = true;
      } else if (bet.type === 'low' && winning.number <= 18 && winning.number !== 0) {
        winAmount = bet.amount * 2;
        win = true;
      }
      
      if (win) {
        totalWinAmount += winAmount;
        
        // Update history to show this as a win
        setBetHistory(prev => {
          const updated = [...prev];
          if (updated[0]) updated[0].win = true;
          return updated;
        });
      }
    });
    
    if (totalWinAmount > 0) {
      // Update user balance
      const updatedUser = { ...user };
      updatedUser.profile.coins += totalWinAmount;
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      setUser(updatedUser);
      
      setResult(`WINNER! ${winning.number} ${winning.color}. You won ${totalWinAmount} coins!`);
      toast({
        title: "Winner!",
        description: `You won ${totalWinAmount} coins!`,
      });
      createConfetti();
      
      // Add to game history
      addGameHistory(user.profile.username, {
        gameId: 'roulette-game',
        gameName: 'Roulette',
        bet: activeBets.reduce((sum, bet) => sum + bet.amount, 0),
        outcome: totalWinAmount,
        timestamp: Date.now()
      });
    } else {
      const totalLoss = activeBets.reduce((sum, bet) => sum + bet.amount, 0);
      setResult(`Sorry, ${winning.number} ${winning.color}. You lost ${totalLoss} coins.`);
      
      // Add to game history
      addGameHistory(user.profile.username, {
        gameId: 'roulette-game',
        gameName: 'Roulette',
        bet: totalLoss,
        outcome: -totalLoss,
        timestamp: Date.now()
      });
    }
    
    // Reset for next round
    setActiveBets([]);
    setSelectedBet(null);
    setIsSpinning(false);
  };

  const getNumberBetTotal = (number: number) => {
    const bet = activeBets.find(bet => bet.type === number);
    return bet ? bet.amount : 0;
  };

  const getTotalBets = () => {
    return activeBets.reduce((sum, bet) => sum + bet.amount, 0);
  };

  const getBetOnType = (type: BetType) => {
    const bet = activeBets.find(bet => bet.type === type);
    return bet ? bet.amount : 0;
  };

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="p-8 rounded-lg border-2 border-casino-secondary bg-card">
        <h2 className="text-2xl font-bold mb-6 text-center gold-text">ROULETTE</h2>
        
        <div className="flex flex-col lg:flex-row items-start justify-center gap-8">
          {/* Roulette wheel and number grid */}
          <div>
            <div className="relative mb-6">
              <div className="w-64 h-64 rounded-full border-4 border-casino-secondary bg-green-900 overflow-hidden relative"
                    style={{ 
                      transform: `rotate(${wheelRotation}deg)`, 
                      transition: wheelSpeed ? 'none' : 'transform 3s cubic-bezier(0.2, 0.8, 0.3, 1)'
                    }}>
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
            
            {/* Numbers grid for direct bets */}
            <div className="bg-green-900 p-2 rounded-lg border border-casino-secondary">
              <div className="grid grid-cols-3 mb-2">
                <Button 
                  variant="ghost" 
                  className={`bg-green-800 text-white ${
                    getBetOnType(0) > 0 ? 'ring-2 ring-yellow-400' : ''
                  }`}
                  onClick={() => handlePlaceBet(0)}
                >
                  0
                  {getBetOnType(0) > 0 && (
                    <div className="absolute -top-1 -right-1 bg-yellow-500 text-black text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {getBetOnType(0)}
                    </div>
                  )}
                </Button>
                <div></div>
                <div></div>
              </div>
              
              <div className="grid grid-cols-12 gap-1">
                {[...Array(36)].map((_, i) => {
                  const num = i + 1;
                  const rouletteNumber = ROULETTE_NUMBERS.find(n => n.number === num);
                  const color = rouletteNumber ? rouletteNumber.color : 'black';
                  const column = ((i % 3) * 4) + Math.floor(i / 12);
                  const row = Math.floor((i % 12) / 3);
                  
                  return (
                    <Button 
                      key={num}
                      variant="ghost"
                      className={`bg-${color === 'red' ? 'red-600' : 'black'} text-white text-xs p-0 h-7 w-7 relative ${
                        getNumberBetTotal(num) > 0 ? 'ring-2 ring-yellow-400' : ''
                      }`}
                      style={{ gridColumn: column + 1, gridRow: row + 1 }}
                      onClick={() => handlePlaceBet(num)}
                    >
                      {num}
                      {getNumberBetTotal(num) > 0 && (
                        <div className="absolute -top-1 -right-1 bg-yellow-500 text-black text-xs rounded-full w-4 h-4 flex items-center justify-center">
                          {getNumberBetTotal(num)}
                        </div>
                      )}
                    </Button>
                  );
                })}
              </div>
              
              {/* Outside bets */}
              <div className="grid grid-cols-2 gap-1 mt-2">
                <Button 
                  variant="ghost"
                  className={`bg-red-600 text-white ${
                    getBetOnType('red') > 0 ? 'ring-2 ring-yellow-400' : ''
                  }`}
                  onClick={() => handlePlaceBet('red')}
                >
                  Red {getBetOnType('red') > 0 && `(${getBetOnType('red')})`}
                </Button>
                <Button 
                  variant="ghost"
                  className={`bg-black text-white ${
                    getBetOnType('black') > 0 ? 'ring-2 ring-yellow-400' : ''
                  }`}
                  onClick={() => handlePlaceBet('black')}
                >
                  Black {getBetOnType('black') > 0 && `(${getBetOnType('black')})`}
                </Button>
                <Button 
                  variant="ghost"
                  className={`bg-gray-700 text-white ${
                    getBetOnType('odd') > 0 ? 'ring-2 ring-yellow-400' : ''
                  }`}
                  onClick={() => handlePlaceBet('odd')}
                >
                  Odd {getBetOnType('odd') > 0 && `(${getBetOnType('odd')})`}
                </Button>
                <Button 
                  variant="ghost"
                  className={`bg-gray-700 text-white ${
                    getBetOnType('even') > 0 ? 'ring-2 ring-yellow-400' : ''
                  }`}
                  onClick={() => handlePlaceBet('even')}
                >
                  Even {getBetOnType('even') > 0 && `(${getBetOnType('even')})`}
                </Button>
                <Button 
                  variant="ghost"
                  className={`bg-gray-700 text-white ${
                    getBetOnType('low') > 0 ? 'ring-2 ring-yellow-400' : ''
                  }`}
                  onClick={() => handlePlaceBet('low')}
                >
                  1-18 {getBetOnType('low') > 0 && `(${getBetOnType('low')})`}
                </Button>
                <Button 
                  variant="ghost"
                  className={`bg-gray-700 text-white ${
                    getBetOnType('high') > 0 ? 'ring-2 ring-yellow-400' : ''
                  }`}
                  onClick={() => handlePlaceBet('high')}
                >
                  19-36 {getBetOnType('high') > 0 && `(${getBetOnType('high')})`}
                </Button>
              </div>
            </div>
          </div>
          
          {/* Betting interface */}
          <div className="bg-muted p-6 rounded-lg shadow-lg w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Place Your Bets</h3>
            
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
            
            <div className="flex justify-between items-center mb-4">
              <div>
                <span className="font-bold">Total Bet:</span>
                <span className="ml-2 gold-text">{getTotalBets()}</span>
              </div>
              <div>
                <span className="font-bold">Your Balance:</span>
                <span className="ml-2 gold-text">{user.profile.coins.toLocaleString()}</span>
              </div>
            </div>
            
            <div className="flex space-x-2 mb-6">
              <Button
                onClick={spinWheel}
                disabled={isSpinning || !activeBets.length}
                className="bg-blue-600 hover:bg-blue-700 flex-1">
                Spin Wheel
              </Button>
              <Button
                onClick={clearBets}
                disabled={isSpinning || !activeBets.length}
                variant="destructive"
                className="flex-shrink-0">
                Clear Bets
              </Button>
              <Button
                onClick={() => setRepeatLastBet(true)}
                disabled={isSpinning || lastBets.length === 0}
                variant="secondary"
                title="Repeat last bet"
                className="flex-shrink-0">
                <RefreshCw className="h-4 w-4" />
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
            
            {/* History and stats */}
            <div className="mt-4">
              <h4 className="font-bold mb-2">Last 10 Numbers:</h4>
              <div className="flex space-x-2 overflow-x-auto pb-2">
                {betHistory.map((item, i) => (
                  <div 
                    key={i}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs ${
                      item.color === 'red' ? 'bg-red-600' :
                      item.color === 'black' ? 'bg-black' : 'bg-green-600'
                    } ${item.win ? 'ring-2 ring-yellow-400' : ''}`}
                  >
                    {item.number}
                  </div>
                ))}
              </div>
            </div>
            
            {/* Hot numbers */}
            {Object.keys(hotNumbers).length > 0 && (
              <div className="mt-4">
                <h4 className="font-bold mb-2">Hot Numbers:</h4>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(hotNumbers)
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 5)
                    .map(([num, count]) => {
                      const number = parseInt(num);
                      const rouletteNum = ROULETTE_NUMBERS.find(n => n.number === number);
                      const color = rouletteNum ? rouletteNum.color : 'black';
                      
                      return (
                        <Badge 
                          key={num}
                          className={`${
                            color === 'red' ? 'bg-red-600' :
                            color === 'black' ? 'bg-black' : 'bg-green-600'
                          } text-white cursor-pointer`}
                          onClick={() => handlePlaceBet(number)}
                        >
                          {num}: {count}x
                        </Badge>
                      );
                    })}
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Payout info */}
        <div className="mt-6 bg-gray-800 p-4 rounded-lg text-sm">
          <h4 className="font-bold mb-2">Roulette Payouts:</h4>
          <div className="grid grid-cols-2 gap-2">
            <div><ArrowRight className="inline h-4 w-4 mr-1" /> Single number: 35 to 1</div>
            <div><ArrowRight className="inline h-4 w-4 mr-1" /> Red/Black: 1 to 1</div>
            <div><ArrowRight className="inline h-4 w-4 mr-1" /> Odd/Even: 1 to 1</div>
            <div><ArrowRight className="inline h-4 w-4 mr-1" /> 1-18/19-36: 1 to 1</div>
            <div><ArrowRight className="inline h-4 w-4 mr-1" /> Zero (Green): 35 to 1</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RouletteGame;
