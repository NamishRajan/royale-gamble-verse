import { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { getCurrentUser } from "@/utils/authUtils";
import { addGameHistory } from "@/utils/gameUtils";
import { useNavigate } from "react-router-dom";
import { Dice1, Dice2, Dice3, Dice4, Dice5, Dice6, ArrowRight } from "lucide-react";

// Bet types
type BetType = 'pass' | 'dontPass' | 'field' | 'any7' | 'hardway' | 'come' | 'dontCome';

interface Bet {
  type: BetType;
  amount: number;
  point?: number;
}

const CrapsGame = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(getCurrentUser());
  const [dice, setDice] = useState<[number, number]>([1, 1]);
  const [activeBets, setActiveBets] = useState<Bet[]>([]);
  const [betAmount, setBetAmount] = useState(0);
  const [selectedBet, setSelectedBet] = useState<BetType | null>(null);
  const [gameState, setGameState] = useState<'comeOut' | 'point' | 'rolling'>('comeOut');
  const [point, setPoint] = useState<number | null>(null);
  const [result, setResult] = useState('');
  const [rolling, setRolling] = useState(false);
  const [history, setHistory] = useState<{roll: [number, number], outcome: string}[]>([]);
  const [showTable, setShowTable] = useState(false);
  const [tableOpen, setTableOpen] = useState(true); // Whether the table is accepting new bets
  const [rollHistory, setRollHistory] = useState<number[]>([]); // Keep track of all rolls (sum)
  const [gameStats, setGameStats] = useState({
    rollsMade: 0,
    passLineWins: 0,
    biggestWin: 0,
    totalWagered: 0,
    totalWon: 0
  });
  const animationRef = useRef<number | null>(null);
  
  useEffect(() => {
    if (!user) {
      navigate('/');
    }
  }, [navigate]);
  
  // Update user on state changes
  useEffect(() => {
    setUser(getCurrentUser());
  }, [gameState]);
  
  // Clean up animations
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
  
  const handlePlaceBet = (type: BetType) => {
    if (!tableOpen || !betAmount || !user || rolling) return;
    
    if (user.profile.coins < betAmount) {
      toast({
        title: "Not enough coins!",
        description: `You need at least ${betAmount} coins to place this bet.`,
        variant: "destructive",
      });
      return;
    }
    
    setSelectedBet(type);
    
    // Deduct bet amount
    const updatedUser = { ...user };
    updatedUser.profile.coins -= betAmount;
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    setUser(updatedUser);
    
    // Add to active bets
    setActiveBets([...activeBets, { 
      type, 
      amount: betAmount,
      point: type === 'come' || type === 'dontCome' ? null : point || undefined
    }]);
    
    // Update game stats
    setGameStats(prev => ({
      ...prev,
      totalWagered: prev.totalWagered + betAmount
    }));
    
    // Reset bet amount
    setBetAmount(0);
    
    setResult(`Bet placed: ${betAmount} on ${getBetName(type)}`);
  };
  
  const getBetName = (type: BetType): string => {
    switch(type) {
      case 'pass': return 'Pass Line';
      case 'dontPass': return "Don't Pass";
      case 'field': return 'Field';
      case 'any7': return 'Any 7';
      case 'hardway': return 'Hard Way';
      case 'come': return 'Come';
      case 'dontCome': return "Don't Come";
      default: return type;
    }
  };
  
  const handleChipSelect = (amount: number) => {
    if (rolling || !user) return;
    
    setBetAmount(amount);
  };
  
  const rollDice = () => {
    if (rolling || !user) return;
    
    // Need at least one bet to roll
    if (activeBets.length === 0) {
      toast({
        title: "Place a bet first!",
        description: "You need to place at least one bet to roll the dice.",
      });
      return;
    }
    
    setRolling(true);
    setResult('Rolling...');
    
    // Animate dice roll
    let rolls = 0;
    const totalRolls = 10;
    const rollInterval = setInterval(() => {
      const die1 = Math.floor(Math.random() * 6) + 1;
      const die2 = Math.floor(Math.random() * 6) + 1;
      setDice([die1, die2]);
      
      rolls++;
      if (rolls >= totalRolls) {
        clearInterval(rollInterval);
        
        // Final roll
        const finalDie1 = Math.floor(Math.random() * 6) + 1;
        const finalDie2 = Math.floor(Math.random() * 6) + 1;
        const finalRoll: [number, number] = [finalDie1, finalDie2];
        const sum = finalDie1 + finalDie2;
        
        setDice(finalRoll);
        
        // Update roll history
        setRollHistory(prev => [...prev, sum]);
        
        // Update stats
        setGameStats(prev => ({
          ...prev,
          rollsMade: prev.rollsMade + 1
        }));
        
        // Process the roll
        setTimeout(() => {
          processRoll(finalRoll);
        }, 500);
      }
    }, 100);
  };
  
  const processRoll = (roll: [number, number]) => {
    const sum = roll[0] + roll[1];
    const isHardWay = roll[0] === roll[1] && roll[0] > 1; // Hard way is doubles (except snake eyes)
    let outcome = '';
    let totalWinnings = 0;
    
    // Process bets based on game state
    if (gameState === 'comeOut') {
      // Come out roll
      if (sum === 7 || sum === 11) {
        // Pass line wins, don't pass loses
        outcome = `${sum} - Pass Line Wins!`;
        
        // Update stats for pass line wins
        setGameStats(prev => ({
          ...prev,
          passLineWins: prev.passLineWins + 1
        }));
        
        // Process natural win/loss
        processPassLineBets(true);
        totalWinnings += processFieldBets(sum);
        totalWinnings += processSpecialBets(sum, isHardWay);
        
        // Game continues in come out state
        setGameState('comeOut');
        setPoint(null);
      } else if (sum === 2 || sum === 3 || sum === 12) {
        // Pass line loses, don't pass wins (except 12 which is a push on don't pass)
        outcome = `${sum} - ${sum === 12 ? "Craps - Don't Pass Bar 12" : "Craps"}`;
        
        // Process craps
        processPassLineBets(false);
        totalWinnings += processFieldBets(sum);
        totalWinnings += processSpecialBets(sum, isHardWay);
        
        // Game continues in come out state
        setGameState('comeOut');
        setPoint(null);
      } else {
        // Point is established
        outcome = `${sum} - Point is ${sum}`;
        setGameState('point');
        setPoint(sum);
        
        // Process field bets
        totalWinnings += processFieldBets(sum);
        
        // Process come/don't come bets
        totalWinnings += processComeLineBets(sum);
        
        // Process special bets
        totalWinnings += processSpecialBets(sum, isHardWay);
      }
    } else {
      // Point has been established
      if (sum === point) {
        // Point is made - pass line wins, don't pass loses
        outcome = `${sum} - Point is made! Pass Line Wins!`;
        
        // Update stats for pass line wins
        setGameStats(prev => ({
          ...prev,
          passLineWins: prev.passLineWins + 1
        }));
        
        // Process pass line win
        processPassLineBets(true);
        
        // Process other bets
        totalWinnings += processFieldBets(sum);
        totalWinnings += processComeLineBets(sum);
        totalWinnings += processSpecialBets(sum, isHardWay);
        
        // Back to come out roll
        setGameState('comeOut');
        setPoint(null);
      } else if (sum === 7) {
        // Seven out - pass line loses, don't pass wins
        outcome = `${sum} - Seven out! Don't Pass Wins!`;
        
        // Process pass line loss
        processPassLineBets(false);
        
        // Process other bets
        totalWinnings += processFieldBets(sum);
        totalWinnings += processComeLineBets(sum);
        totalWinnings += processSpecialBets(sum, isHardWay);
        
        // Back to come out roll
        setGameState('comeOut');
        setPoint(null);
      } else {
        // Neither point nor seven - continue game
        outcome = `${sum} - Point is still ${point}`;
        
        // Process field bets
        totalWinnings += processFieldBets(sum);
        
        // Process come/don't come bets
        totalWinnings += processComeLineBets(sum);
        
        // Process special bets
        totalWinnings += processSpecialBets(sum, isHardWay);
      }
    }
    
    // Update history
    setHistory(prev => [{roll, outcome}, ...prev.slice(0, 9)]);
    
    // Update result
    setResult(outcome);
    
    // Pay winnings if any
    if (totalWinnings > 0) {
      const updatedUser = { ...user };
      updatedUser.profile.coins += totalWinnings;
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      setUser(updatedUser);
      
      // Update game stats
      setGameStats(prev => ({
        ...prev,
        totalWon: prev.totalWon + totalWinnings,
        biggestWin: Math.max(prev.biggestWin, totalWinnings)
      }));
      
      // Add to game history
      addGameHistory(user.profile.username, {
        gameId: 'craps-game',
        gameName: 'Craps',
        bet: 0, // We don't track individual bets for craps
        outcome: totalWinnings,
        timestamp: Date.now()
      });
      
      if (totalWinnings > 100) {
        createConfetti();
      }
    }
    
    // Game continues
    setRolling(false);
    setTableOpen(true);
  };
  
  const processPassLineBets = (win: boolean) => {
    const newActiveBets = activeBets.filter(bet => {
      if (bet.type === 'pass') {
        if (win) {
          // Pass line wins
          const winAmount = bet.amount * 2; // Original bet + 1:1 win
          setResult(prev => `${prev} You win ${winAmount} coins on Pass Line!`);
        } else {
          // Pass line loses
          setResult(prev => `${prev} You lose ${bet.amount} coins on Pass Line.`);
        }
        return false; // Remove the bet
      } else if (bet.type === 'dontPass') {
        if (!win) {
          // Don't pass wins
          const winAmount = bet.amount * 2; // Original bet + 1:1 win
          setResult(prev => `${prev} You win ${winAmount} coins on Don't Pass!`);
        } else {
          // Don't pass loses
          setResult(prev => `${prev} You lose ${bet.amount} coins on Don't Pass.`);
        }
        return false; // Remove the bet
      }
      return true; // Keep other bets
    });
    
    setActiveBets(newActiveBets);
  };
  
  const processFieldBets = (roll: number): number => {
    let totalWinnings = 0;
    
    const newActiveBets = activeBets.filter(bet => {
      if (bet.type === 'field') {
        // Field bet is won on 2, 3, 4, 9, 10, 11, 12
        // 2 and 12 pay double
        if ([2, 3, 4, 9, 10, 11, 12].includes(roll)) {
          const multiplier = (roll === 2 || roll === 12) ? 2 : 1;
          const winAmount = bet.amount + (bet.amount * multiplier);
          totalWinnings += winAmount;
          setResult(prev => `${prev} You win ${winAmount} coins on Field!`);
        } else {
          setResult(prev => `${prev} You lose ${bet.amount} coins on Field.`);
        }
        return false; // Remove the bet after processing
      }
      return true; // Keep other bets
    });
    
    setActiveBets(newActiveBets);
    return totalWinnings;
  };
  
  const processComeLineBets = (roll: number): number => {
    let totalWinnings = 0;
    const newActiveBets: Bet[] = [];
    
    // Process existing bets
    activeBets.forEach(bet => {
      if (bet.type === 'come') {
        if (!bet.point) {
          // New come bet
          if (roll === 7 || roll === 11) {
            // Natural win
            totalWinnings += bet.amount * 2; // Original bet + 1:1 win
            setResult(prev => `${prev} You win ${bet.amount * 2} coins on Come!`);
          } else if (roll === 2 || roll === 3 || roll === 12) {
            // Craps - come bet loses
            setResult(prev => `${prev} You lose ${bet.amount} coins on Come.`);
          } else {
            // Establish a come point
            newActiveBets.push({ ...bet, point: roll });
          }
        } else if (bet.point === roll) {
          // Come point is made
          totalWinnings += bet.amount * 2; // Original bet + 1:1 win
          setResult(prev => `${prev} You win ${bet.amount * 2} coins on Come point ${roll}!`);
        } else if (roll === 7) {
          // Seven out - come point bet loses
          setResult(prev => `${prev} You lose ${bet.amount} coins on Come point ${bet.point}.`);
        } else {
          // Keep the bet active
          newActiveBets.push(bet);
        }
      } else if (bet.type === 'dontCome') {
        if (!bet.point) {
          // New don't come bet
          if (roll === 7 || roll === 11) {
            // Natural - don't come loses
            setResult(prev => `${prev} You lose ${bet.amount} coins on Don't Come.`);
          } else if (roll === 2 || roll === 3) {
            // Craps - don't come wins
            totalWinnings += bet.amount * 2; // Original bet + 1:1 win
            setResult(prev => `${prev} You win ${bet.amount * 2} coins on Don't Come!`);
          } else if (roll === 12) {
            // 12 is a push on don't come
            totalWinnings += bet.amount; // Return the original bet
            setResult(prev => `${prev} Push on Don't Come with 12.`);
          } else {
            // Establish a don't come point
            newActiveBets.push({ ...bet, point: roll });
          }
        } else if (bet.point === roll) {
          // Don't come point is made - bet loses
          setResult(prev => `${prev} You lose ${bet.amount} coins on Don't Come point ${roll}.`);
        } else if (roll === 7) {
          // Seven out - don't come point bet wins
          totalWinnings += bet.amount * 2; // Original bet + 1:1 win
          setResult(prev => `${prev} You win ${bet.amount * 2} coins on Don't Come point ${bet.point}!`);
        } else {
          // Keep the bet active
          newActiveBets.push(bet);
        }
      } else {
        // Keep any other bets
        newActiveBets.push(bet);
      }
    });
    
    setActiveBets(newActiveBets);
    return totalWinnings;
  };
  
  const processSpecialBets = (roll: number, isHardWay: boolean): number => {
    let totalWinnings = 0;
    
    const newActiveBets = activeBets.filter(bet => {
      if (bet.type === 'any7' && roll === 7) {
        // Any 7 pays 4:1
        const winAmount = bet.amount * 5; // Original bet + 4:1 win
        totalWinnings += winAmount;
        setResult(prev => `${prev} You win ${winAmount} coins on Any 7!`);
        return false; // Remove the bet
      } else if (bet.type === 'any7' && roll !== 7) {
        // Any 7 loses on any other roll
        setResult(prev => `${prev} You lose ${bet.amount} coins on Any 7.`);
        return false; // Remove the bet
      } else if (bet.type === 'hardway') {
        // Hard way bets (4, 6, 8, or 10 made with doubles)
        if (roll === 4 && isHardWay) {
          totalWinnings += bet.amount * 8; // Original bet + 7:1
          setResult(prev => `${prev} You win ${bet.amount * 8} coins on Hard 4!`);
          return false; // Remove the bet
        } else if (roll === 6 && isHardWay) {
          totalWinnings += bet.amount * 10; // Original bet + 9:1
          setResult(prev => `${prev} You win ${bet.amount * 10} coins on Hard 6!`);
          return false; // Remove the bet
        } else if (roll === 8 && isHardWay) {
          totalWinnings += bet.amount * 10; // Original bet + 9:1
          setResult(prev => `${prev} You win ${bet.amount * 10} coins on Hard 8!`);
          return false; // Remove the bet
        } else if (roll === 10 && isHardWay) {
          totalWinnings += bet.amount * 8; // Original bet + 7:1
          setResult(prev => `${prev} You win ${bet.amount * 8} coins on Hard 10!`);
          return false; // Remove the bet
        } else if (roll === 7) {
          // Hard way bets lose on 7
          setResult(prev => `${prev} You lose ${bet.amount} coins on Hard Way.`);
          return false; // Remove the bet
        } else if ((roll === 4 || roll === 6 || roll === 8 || roll === 10) && !isHardWay) {
          // Making the number the "easy way" (not doubles) loses the hard way bet
          setResult(prev => `${prev} You lose ${bet.amount} coins on Hard Way (easy ${roll}).`);
          return false; // Remove the bet
        }
      }
      return true; // Keep other bets
    });
    
    setActiveBets(newActiveBets);
    return totalWinnings;
  };

  const renderDie = (value: number) => {
    switch(value) {
      case 1: return <Dice1 className="h-12 w-12" />;
      case 2: return <Dice2 className="h-12 w-12" />;
      case 3: return <Dice3 className="h-12 w-12" />;
      case 4: return <Dice4 className="h-12 w-12" />;
      case 5: return <Dice5 className="h-12 w-12" />;
      case 6: return <Dice6 className="h-12 w-12" />;
      default: return <Dice1 className="h-12 w-12" />;
    }
  };
  
  const getBetTypesAvailable = (): BetType[] => {
    if (gameState === 'comeOut') {
      return ['pass', 'dontPass', 'field', 'any7', 'hardway'];
    } else {
      return ['come', 'dontCome', 'field', 'any7', 'hardway'];
    }
  };
  
  const getTotalBetAmount =  (type: BetType): number => {
    return activeBets.filter(bet => bet.type === type).reduce((sum, bet) => sum + bet.amount, 0);
  };
  
  const getNumberFrequency = (num: number): number => {
    return rollHistory.filter(roll => roll === num).length;
  };
  
  const getMostFrequentNumber = (): number | null => {
    if (rollHistory.length === 0) return null;
    
    const counts = rollHistory.reduce((acc, roll) => {
      acc[roll] = (acc[roll] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);
    
    return parseInt(Object.keys(counts).reduce((a, b) => counts[parseInt(a)] > counts[parseInt(b)] ? a : b));
  };

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-card p-8 rounded-lg border-2 border-casino-secondary">
        <h2 className="text-2xl font-bold mb-6 text-center gold-text">CRAPS</h2>
        
        {/* Dice display */}
        <div className={`bg-green-900 p-6 rounded-lg mb-6 ${rolling ? 'animate-pulse' : ''}`}>
          <div className="flex justify-center items-center mb-4 space-x-4">
            {dice.map((die, i) => (
              <div key={i} className="bg-white p-2 rounded-md shadow-inner">
                {renderDie(die)}
              </div>
            ))}
          </div>
          
          <div className="text-center mb-4">
            <span className="font-bold text-2xl">{dice[0] + dice[1]}</span>
            {point !== null && (
              <span className="ml-4 bg-red-600 px-3 py-1 rounded-lg text-white">
                Point: {point}
              </span>
            )}
          </div>
          
          <div className="text-center">
            <p className={`font-bold ${result.includes('win') ? 'text-green-400' : result.includes('lose') ? 'text-red-400' : 'text-white'}`}>
              {result || (gameState === 'comeOut' ? 'Come Out Roll' : `Point is ${point}`)}
            </p>
          </div>
        </div>
        
        {/* Betting controls */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <Button 
              variant="outline" 
              onClick={() => setShowTable(!showTable)}
              className="text-sm"
            >
              {showTable ? 'Hide Table' : 'Show Table'}
            </Button>
            
            <div>
              <span className="font-bold mr-2">Current Bet:</span>
              <span className="gold-text">{betAmount}</span>
            </div>
            
            <div>
              <span className="font-bold mr-2">Balance:</span>
              <span className="gold-text">{user.profile.coins.toLocaleString()}</span>
            </div>
          </div>
          
          {/* Chips for betting */}
          <div className="flex flex-wrap gap-2 mb-4">
            {[5, 10, 25, 50, 100, 500].map(amount => (
              <button
                key={amount}
                onClick={() => handleChipSelect(amount)}
                disabled={user.profile.coins < amount || rolling}
                className={`${
                  betAmount === amount ? 'ring-2 ring-yellow-400' : ''
                } w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm cursor-pointer transition transform hover:scale-110 disabled:opacity-50 disabled:hover:scale-100 ${
                  amount === 5 ? 'bg-red-500' :
                  amount === 10 ? 'bg-blue-500' :
                  amount === 25 ? 'bg-green-500' :
                  amount === 50 ? 'bg-purple-500' :
                  amount === 100 ? 'bg-yellow-500' :
                  'bg-pink-500'
                }`}>
                {amount}
              </button>
            ))}
          </div>
          
          {/* Bet types */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
            {getBetTypesAvailable().map(betType => {
              const totalBet = getTotalBetAmount(betType);
              
              return (
                <Button
                  key={betType}
                  onClick={() => handlePlaceBet(betType)}
                  disabled={betAmount === 0 || rolling || !tableOpen}
                  variant={selectedBet === betType ? "default" : "secondary"}
                  className={`${totalBet > 0 ? 'border-2 border-yellow-400' : ''}`}
                >
                  {getBetName(betType)}
                  {totalBet > 0 && (
                    <Badge className="ml-2 bg-yellow-600">{totalBet}</Badge>
                  )}
                </Button>
              );
            })}
          </div>
        </div>
        
        {/* Roll button */}
        <div className="flex justify-center mb-6">
          <Button
            onClick={rollDice}
            disabled={rolling || activeBets.length === 0}
            className="bg-red-600 hover:bg-red-700 text-white px-8 py-6 text-xl"
          >
            {rolling ? 'Rolling...' : 'Roll Dice!'}
          </Button>
        </div>
        
        {/* Craps table */}
        {showTable && (
          <div className="mb-6 bg-green-900 p-6 rounded-lg">
            <h3 className="font-bold mb-3 text-center">Craps Table Odds</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-bold mb-2">Basic Bets</h4>
                <ul className="space-y-1 text-sm">
                  <li>Pass Line: 1:1</li>
                  <li>Don't Pass: 1:1</li>
                  <li>Come: 1:1</li>
                  <li>Don't Come: 1:1</li>
                </ul>
                
                <h4 className="font-bold mt-4 mb-2">Proposition Bets</h4>
                <ul className="space-y-1 text-sm">
                  <li>Field: 1:1 (2x on 2 and 12)</li>
                  <li>Any 7: 4:1</li>
                  <li>Hard 4 or 10: 7:1</li>
                  <li>Hard 6 or 8: 9:1</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-bold mb-2">Number Frequency</h4>
                <div className="grid grid-cols-6 gap-2">
                  {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(num => (
                    <div key={num} className="text-center">
                      <div className={`rounded-full w-8 h-8 flex items-center justify-center ${
                        num === 7 ? 'bg-red-500' :
                        [2, 3, 12].includes(num) ? 'bg-blue-500' :
                        [4, 5, 6, 8, 9, 10].includes(num) ? 'bg-green-500' :
                        'bg-purple-500'
                      } mx-auto`}>
                        {num}
                      </div>
                      <div className="text-xs mt-1">{getNumberFrequency(num)}</div>
                    </div>
                  ))}
                </div>
                
                {rollHistory.length > 0 && (
                  <div className="mt-3 text-center text-sm">
                    <div>Total Rolls: {rollHistory.length}</div>
                    <div>Most Frequent: {getMostFrequentNumber()}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Recent rolls */}
        <div className="mb-6 bg-muted p-4 rounded-lg">
          <h3 className="font-bold mb-2">Recent Rolls</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {history.slice(0, 6).map((item, i) => (
              <div key={i} className="border-b border-gray-700 pb-2">
                <div className="flex items-center mb-1">
                  <div className="bg-white p-1 rounded mr-1">
                    {renderDie(item.roll[0])}
                  </div>
                  <div className="bg-white p-1 rounded mr-2">
                    {renderDie(item.roll[1])}
                  </div>
                  <span className="font-bold">{item.roll[0] + item.roll[1]}</span>
                </div>
                <div className="text-sm">{item.outcome}</div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Game stats */}
        {gameStats.rollsMade > 0 && (
          <div className="mb-6 bg-muted p-4 rounded-lg">
            <h3 className="font-bold mb-2">Your Stats</h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
              <div>Rolls Made: <span className="font-bold">{gameStats.rollsMade}</span></div>
              <div>Pass Line Wins: <span className="font-bold">{gameStats.passLineWins}</span></div>
              <div>Biggest Win: <span className="font-bold gold-text">{gameStats.biggestWin}</span></div>
              <div>Wagered: <span className="font-bold">{gameStats.totalWagered}</span></div>
              <div>Total Won: <span className="font-bold gold-text">{gameStats.totalWon}</span></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CrapsGame;
