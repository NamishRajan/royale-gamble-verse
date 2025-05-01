
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { getCurrentUser } from "@/utils/authUtils";
import { addGameHistory } from "@/utils/gameUtils";
import { useNavigate } from "react-router-dom";

const SPIN_COST = 100;
const slotSymbols = ['🍒', '🍋', '🍊', '7️⃣', '💰', '🍇', '🔔'];

const SlotsGame = () => {
  const navigate = useNavigate();
  const [reels, setReels] = useState(['🍒', '🍋', '🍊']);
  const [isSpinning, setIsSpinning] = useState(false);
  const [result, setResult] = useState('');
  const [user, setUser] = useState(getCurrentUser());

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

  const spin = () => {
    if (isSpinning || !user) return;

    if (user.profile.coins < SPIN_COST) {
      toast({
        title: "Not enough coins!",
        description: "You need at least 100 coins to play slots.",
        variant: "destructive",
      });
      return;
    }

    // Deduct spin cost
    const updatedUser = { ...user };
    updatedUser.profile.coins -= SPIN_COST;
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    setUser(updatedUser);

    setIsSpinning(true);
    setResult('');

    // Animate reels
    const animationDuration = 2000;
    const animationSteps = 20;
    const stepTime = animationDuration / animationSteps;

    let step = 0;
    const animationInterval = setInterval(() => {
      // Generate random symbols for the reels
      const randomReels = [
        slotSymbols[Math.floor(Math.random() * slotSymbols.length)],
        slotSymbols[Math.floor(Math.random() * slotSymbols.length)],
        slotSymbols[Math.floor(Math.random() * slotSymbols.length)]
      ];
      
      setReels(randomReels);
      step++;

      if (step >= animationSteps) {
        clearInterval(animationInterval);
        
        // Set final symbols
        const finalReels = [
          slotSymbols[Math.floor(Math.random() * slotSymbols.length)],
          slotSymbols[Math.floor(Math.random() * slotSymbols.length)],
          slotSymbols[Math.floor(Math.random() * slotSymbols.length)]
        ];
        
        setReels(finalReels);
        checkWin(finalReels);
      }
    }, stepTime);
  };

  const checkWin = (symbols: string[]) => {
    let winAmount = 0;
    
    // Check for jackpots
    if (symbols[0] === '7️⃣' && symbols[1] === '7️⃣' && symbols[2] === '7️⃣') {
      winAmount = 1000 * SPIN_COST; // 1000x the spin cost
    } else if (symbols[0] === '💰' && symbols[1] === '💰' && symbols[2] === '💰') {
      winAmount = 800 * SPIN_COST;
    } else if (symbols[0] === '🍒' && symbols[1] === '🍒' && symbols[2] === '🍒') {
      winAmount = 500 * SPIN_COST;
    } else if (symbols[0] === '🍋' && symbols[1] === '🍋' && symbols[2] === '🍋') {
      winAmount = 300 * SPIN_COST;
    } else if (symbols[0] === '🍊' && symbols[1] === '🍊' && symbols[2] === '🍊') {
      winAmount = 200 * SPIN_COST;
    }
    // Check for any two matching
    else if ((symbols[0] === symbols[1] || symbols[0] === symbols[2] || symbols[1] === symbols[2]) && 
             !(symbols[0] === symbols[1] && symbols[1] === symbols[2])) {
      winAmount = 50 * SPIN_COST;
    }
    
    if (winAmount > 0) {
      // Update user balance
      const updatedUser = { ...user };
      updatedUser.profile.coins += winAmount;
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      setUser(updatedUser);

      // Add to game history
      addGameHistory(user.profile.username, {
        gameId: 'slots-game',
        gameName: 'Lucky Slots',
        bet: SPIN_COST,
        outcome: winAmount,
        timestamp: Date.now()
      });
      
      setResult(`WINNER! You won ${winAmount.toLocaleString()} coins!`);
      toast({
        title: "Jackpot!",
        description: `You won ${winAmount.toLocaleString()} coins!`,
      });
      createConfetti();
    } else {
      setResult("No win this time. Try again!");
      
      // Add to game history
      addGameHistory(user.profile.username, {
        gameId: 'slots-game',
        gameName: 'Lucky Slots',
        bet: SPIN_COST,
        outcome: -SPIN_COST,
        timestamp: Date.now()
      });
    }
    
    setIsSpinning(false);
  };

  if (!user) return null;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-card p-8 rounded-lg border-2 border-casino-secondary">
        <h2 className="text-2xl font-bold mb-6 text-center gold-text">SLOT MACHINE</h2>
        
        <div className="flex justify-center mb-8">
          {reels.map((symbol, index) => (
            <div key={index} className="bg-white w-24 h-32 mx-2 flex items-center justify-center text-4xl font-bold rounded-lg shadow-inner">
              {symbol}
            </div>
          ))}
        </div>
        
        <div className="flex justify-center mb-6">
          <Button 
            onClick={spin} 
            disabled={isSpinning || user.profile.coins < SPIN_COST}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-full text-xl transition duration-200"
          >
            {isSpinning ? "SPINNING..." : `SPIN! (Cost: ${SPIN_COST})`}
          </Button>
        </div>
        
        <div className="text-center mb-4">
          <p className="text-xl font-bold gold-text">{result}</p>
        </div>
        
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
        </div>
      </div>
    </div>
  );
};

export default SlotsGame;
