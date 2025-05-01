import { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { getCurrentUser } from "@/utils/authUtils";
import { addGameHistory } from "@/utils/gameUtils";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Check, X, ArrowRight, Gamepad } from "lucide-react";

const SPIN_COST_BASE = 100;
const slotSymbols = ['🍒', '🍋', '🍊', '7️⃣', '💰', '🍇', '🔔'];

const SlotsGame = () => {
  const navigate = useNavigate();
  const [reels, setReels] = useState(['🍒', '🍋', '🍊']);
  const [isSpinning, setIsSpinning] = useState(false);
  const [result, setResult] = useState('');
  const [user, setUser] = useState(getCurrentUser());
  const [betMultiplier, setBetMultiplier] = useState(1);
  const [paylines, setPaylines] = useState(1);
  const [spinCost, setSpinCost] = useState(SPIN_COST_BASE);
  const [autoPlay, setAutoPlay] = useState(false);
  const [winStreak, setWinStreak] = useState(0);
  const [lastWins, setLastWins] = useState<number[]>([]);
  const animationRef = useRef<number | null>(null);
  const [holdReels, setHoldReels] = useState([false, false, false]);

  // Track spins and wins for achievements
  const [totalSpins, setTotalSpins] = useState(0);
  const [sessionWinnings, setSessionWinnings] = useState(0);

  useEffect(() => {
    if (!user) {
      navigate('/');
    }
  }, [navigate]);

  // Update user on state changes
  useEffect(() => {
    setUser(getCurrentUser());
  }, [isSpinning]);

  // Calculate actual spin cost based on bet multiplier and paylines
  useEffect(() => {
    setSpinCost(SPIN_COST_BASE * betMultiplier * paylines);
  }, [betMultiplier, paylines]);

  // Auto-play functionality
  useEffect(() => {
    if (autoPlay && !isSpinning && user && user.profile.coins >= spinCost) {
      const timeout = setTimeout(() => {
        spin();
      }, 1500);
      
      return () => clearTimeout(timeout);
    }
    
    return () => {};
  }, [autoPlay, isSpinning, user, spinCost]);

  // Clean up any animations on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

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

  const toggleHoldReel = (index: number) => {
    if (isSpinning) return;
    
    const newHoldReels = [...holdReels];
    newHoldReels[index] = !newHoldReels[index];
    setHoldReels(newHoldReels);
  };

  const spin = () => {
    if (isSpinning || !user) return;

    if (user.profile.coins < spinCost) {
      toast({
        title: "Not enough coins!",
        description: `You need at least ${spinCost} coins to play slots.`,
        variant: "destructive",
      });
      return;
    }

    // Deduct spin cost
    const updatedUser = { ...user };
    updatedUser.profile.coins -= spinCost;
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    setUser(updatedUser);

    setIsSpinning(true);
    setResult('');
    setTotalSpins(prev => prev + 1);

    // Animate reels
    const animationDuration = 2000;
    const animationSteps = 20;
    const stepTime = animationDuration / animationSteps;

    let step = 0;
    const animationInterval = setInterval(() => {
      // Generate random symbols for the reels
      const randomReels = [...reels];
      for (let i = 0; i < reels.length; i++) {
        if (!holdReels[i]) {
          randomReels[i] = slotSymbols[Math.floor(Math.random() * slotSymbols.length)];
        }
      }
      
      setReels(randomReels);
      step++;

      if (step >= animationSteps) {
        clearInterval(animationInterval);
        
        // Set final symbols
        const finalReels = [...reels];
        for (let i = 0; i < reels.length; i++) {
          if (!holdReels[i]) {
            finalReels[i] = slotSymbols[Math.floor(Math.random() * slotSymbols.length)];
          }
        }
        
        setReels(finalReels);
        checkWin(finalReels);
      }
    }, stepTime);
  };

  const checkWin = (symbols: string[]) => {
    let winAmount = 0;
    let paylineWins = 0;
    
    // Main payline (middle row)
    if (symbols[0] === '7️⃣' && symbols[1] === '7️⃣' && symbols[2] === '7️⃣') {
      winAmount = 1000 * spinCost; // 1000x the spin cost
      paylineWins++;
    } else if (symbols[0] === '💰' && symbols[1] === '💰' && symbols[2] === '💰') {
      winAmount = 800 * spinCost;
      paylineWins++;
    } else if (symbols[0] === '🍒' && symbols[1] === '🍒' && symbols[2] === '🍒') {
      winAmount = 500 * spinCost;
      paylineWins++;
    } else if (symbols[0] === '🍋' && symbols[1] === '🍋' && symbols[2] === '🍋') {
      winAmount = 300 * spinCost;
      paylineWins++;
    } else if (symbols[0] === '🍊' && symbols[1] === '🍊' && symbols[2] === '🍊') {
      winAmount = 200 * spinCost;
      paylineWins++;
    }
    // Check for any two matching
    else if ((symbols[0] === symbols[1] || symbols[0] === symbols[2] || symbols[1] === symbols[2]) && 
             !(symbols[0] === symbols[1] && symbols[1] === symbols[2])) {
      winAmount = 50 * spinCost;
      paylineWins++;
    }
    
    // Apply bonus for win streak
    const streakBonus = winStreak > 0 ? winStreak * 0.1 : 0; // 10% bonus per win streak
    if (winAmount > 0) {
      winAmount = Math.floor(winAmount * (1 + streakBonus));
      setWinStreak(prev => prev + 1);
      
      // Update user balance
      const updatedUser = { ...user };
      updatedUser.profile.coins += winAmount;
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      setUser(updatedUser);

      // Add to game history
      addGameHistory(user.profile.username, {
        gameId: 'slots-game',
        gameName: 'Lucky Slots',
        bet: spinCost,
        outcome: winAmount,
        timestamp: Date.now()
      });
      
      setResult(`WINNER! ${paylineWins} payline${paylineWins > 1 ? 's' : ''} hit! You won ${winAmount.toLocaleString()} coins!`);
      
      // Update session stats
      setSessionWinnings(prev => prev + winAmount);
      
      // Update last wins (keep last 5)
      setLastWins(prev => {
        const newWins = [...prev, winAmount];
        if (newWins.length > 5) {
          return newWins.slice(newWins.length - 5);
        }
        return newWins;
      });
      
      toast({
        title: "Jackpot!",
        description: `You won ${winAmount.toLocaleString()} coins!`,
      });
      createConfetti();
    } else {
      setResult("No win this time. Try again!");
      setWinStreak(0);
      
      // Add to game history
      addGameHistory(user.profile.username, {
        gameId: 'slots-game',
        gameName: 'Lucky Slots',
        bet: spinCost,
        outcome: -spinCost,
        timestamp: Date.now()
      });
    }
    
    // Reset hold reels after spin
    setHoldReels([false, false, false]);
    setIsSpinning(false);
  };

  const resetHolds = () => {
    setHoldReels([false, false, false]);
  };

  if (!user) return null;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-card p-8 rounded-lg border-2 border-casino-secondary">
        <h2 className="text-2xl font-bold mb-6 text-center gold-text">SLOT MACHINE</h2>
        
        {/* Stats and Controls */}
        <div className="flex flex-wrap gap-4 justify-between mb-6">
          <div className="bg-muted p-2 rounded">
            <div className="text-sm">Total Spins: <span className="font-bold">{totalSpins}</span></div>
            <div className="text-sm">Session Winnings: <span className="font-bold gold-text">{sessionWinnings}</span></div>
          </div>
          
          <div className="flex gap-2">
            <Badge variant={autoPlay ? "default" : "outline"} 
                  className="cursor-pointer" 
                  onClick={() => setAutoPlay(!autoPlay)}>
              Auto Play {autoPlay ? "ON" : "OFF"}
            </Badge>
            {winStreak > 0 && (
              <Badge variant="secondary" className="bg-yellow-600">
                {winStreak}x Streak!
              </Badge>
            )}
          </div>
        </div>
        
        {/* Reels */}
        <div className="flex justify-center mb-8">
          {reels.map((symbol, index) => (
            <div key={index} className="relative mx-2">
              <div className={`bg-white w-24 h-32 flex items-center justify-center text-4xl font-bold rounded-lg shadow-inner ${
                holdReels[index] ? 'ring-2 ring-yellow-500' : ''
              }`}>
                {symbol}
              </div>
              <Button 
                size="sm" 
                variant={holdReels[index] ? "default" : "outline"}
                className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 mt-2"
                onClick={() => toggleHoldReel(index)}
                disabled={isSpinning}
              >
                {holdReels[index] ? "Hold" : "Hold?"}
              </Button>
            </div>
          ))}
        </div>
        
        {/* Bet Controls */}
        <div className="bg-muted p-4 rounded-lg mb-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <span className="font-bold">Bet Multiplier: </span>
              <span className="text-lg font-bold gold-text">{betMultiplier}x</span>
            </div>
            <div className="w-1/2">
              <Slider
                value={[betMultiplier]}
                min={1}
                max={5}
                step={1}
                onValueChange={(vals) => setBetMultiplier(vals[0])}
                disabled={isSpinning}
              />
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <div>
              <span className="font-bold">Paylines: </span>
              <span className="text-lg font-bold gold-text">{paylines}</span>
            </div>
            <div className="w-1/2">
              <Slider
                value={[paylines]}
                min={1}
                max={3}
                step={1}
                onValueChange={(vals) => setPaylines(vals[0])}
                disabled={isSpinning}
              />
            </div>
          </div>
        </div>
        
        {/* Spin Button */}
        <div className="flex justify-center mb-6">
          <Button 
            onClick={spin} 
            disabled={isSpinning || user.profile.coins < spinCost}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-full text-xl transition duration-200"
            size="lg"
          >
            {isSpinning ? "SPINNING..." : `SPIN! (Cost: ${spinCost})`}
          </Button>
        </div>
        
        {/* Result Display */}
        <div className="text-center mb-4">
          <p className="text-xl font-bold gold-text">{result}</p>
        </div>
        
        {/* Recent Wins */}
        {lastWins.length > 0 && (
          <div className="bg-gray-800 p-2 rounded-lg mb-4">
            <h3 className="text-sm font-bold mb-1">Recent Wins:</h3>
            <div className="flex flex-wrap gap-2 justify-center">
              {lastWins.map((win, i) => (
                <Badge key={i} variant="secondary" className="bg-green-700">
                  {win} coins
                </Badge>
              ))}
            </div>
          </div>
        )}
        
        {/* Payouts Info */}
        <div className="bg-muted p-4 rounded-lg">
          <h3 className="text-lg font-bold mb-2">Payouts:</h3>
          <div className="grid grid-cols-2 gap-2">
            <div>🍒🍒🍒 = 500x</div>
            <div>🍋🍋🍋 = 300x</div>
            <div>🍊🍊🍊 = 200x</div>
            <div>7️⃣7️⃣7️⃣ = 1000x</div>
            <div>💰💰💰 = 800x</div>
            <div>Any 2 matching = 50x</div>
          </div>
          
          <div className="mt-3 text-sm">
            <div><ArrowRight className="inline h-4 w-4 mr-1" /> Win Streak bonus: +10% per consecutive win!</div>
            <div><ArrowRight className="inline h-4 w-4 mr-1" /> Hold reels to keep symbols for next spin</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SlotsGame;
