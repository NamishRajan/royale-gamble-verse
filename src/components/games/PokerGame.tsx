
import { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { getCurrentUser } from "@/utils/authUtils";
import { addGameHistory } from "@/utils/gameUtils";
import { useNavigate } from "react-router-dom";
import { ArrowRight, RefreshCw } from "lucide-react";

// Card types
type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
type CardValue = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';
type Card = {
  suit: Suit;
  value: CardValue;
  hold?: boolean;
};

// Hand ranking types
type HandRank = 
  | 'Royal Flush' 
  | 'Straight Flush'
  | 'Four of a Kind'
  | 'Full House'
  | 'Flush'
  | 'Straight'
  | 'Three of a Kind'
  | 'Two Pair'
  | 'Jacks or Better'
  | 'Nothing';

// Payout table
const payoutTable = {
  'Royal Flush': 800,
  'Straight Flush': 50,
  'Four of a Kind': 25,
  'Full House': 9,
  'Flush': 6,
  'Straight': 4,
  'Three of a Kind': 3,
  'Two Pair': 2,
  'Jacks or Better': 1,
  'Nothing': 0
};

const PokerGame = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(getCurrentUser());
  const [deck, setDeck] = useState<Card[]>([]);
  const [hand, setHand] = useState<Card[]>([]);
  const [betAmount, setBetAmount] = useState(5);
  const [gameState, setGameState] = useState<'betting' | 'first-draw' | 'hold' | 'final'>('betting');
  const [handRank, setHandRank] = useState<HandRank>('Nothing');
  const [payout, setPayout] = useState(0);
  const [winAmount, setWinAmount] = useState(0);
  const [isDealing, setIsDealing] = useState(false);
  const [revealedCards, setRevealedCards] = useState(0);
  const [statistics, setStatistics] = useState({
    gamesPlayed: 0,
    gamesWon: 0,
    royalFlushes: 0,
    totalWagered: 0,
    totalWon: 0,
    highestPayout: 0,
    currentStreak: 0,
    bestStreak: 0
  });
  const animationRef = useRef<number | null>(null);
  
  useEffect(() => {
    if (!user) {
      navigate('/');
    } else {
      resetGame();
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
  
  // Update payout based on bet amount
  useEffect(() => {
    setPayout(payoutTable[handRank] * betAmount);
  }, [handRank, betAmount]);

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

  const createDeck = (): Card[] => {
    const suits: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
    const values: CardValue[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    const newDeck: Card[] = [];
    
    for (const suit of suits) {
      for (const value of values) {
        newDeck.push({ suit, value });
      }
    }
    
    return shuffleDeck(newDeck);
  };

  const shuffleDeck = (deckToShuffle: Card[]): Card[] => {
    const shuffled = [...deckToShuffle];
    
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    return shuffled;
  };
  
  const resetGame = () => {
    setDeck(createDeck());
    setHand([]);
    setGameState('betting');
    setHandRank('Nothing');
    setPayout(0);
    setWinAmount(0);
    setIsDealing(false);
    setRevealedCards(0);
  };

  const getCardValue = (card: Card) => {
    if (card.value === 'A') return 14;
    if (card.value === 'K') return 13;
    if (card.value === 'Q') return 12;
    if (card.value === 'J') return 11;
    return parseInt(card.value);
  };
  
  const evaluateHand = (cards: Card[]): HandRank => {
    // Sort cards by value (high to low)
    const sortedCards = [...cards].sort((a, b) => getCardValue(b) - getCardValue(a));
    
    // Check for flush (all same suit)
    const isFlush = cards.every(card => card.suit === cards[0].suit);
    
    // Check for straight (sequential values)
    let isStraight = false;
    const values = sortedCards.map(card => getCardValue(card));
    
    // Handle special case: A-5-4-3-2 straight
    if (values.join(',') === '14,5,4,3,2') {
      isStraight = true;
    } else {
      // Normal straight check
      isStraight = values.every((val, i) => {
        return i === 0 || val === values[i - 1] - 1;
      });
    }
    
    // Check for royal flush
    if (isFlush && values.join(',') === '14,13,12,11,10') {
      return 'Royal Flush';
    }
    
    // Check for straight flush
    if (isFlush && isStraight) {
      return 'Straight Flush';
    }
    
    // Count occurrences of each value
    const valueCounts: Record<number, number> = {};
    values.forEach(val => {
      valueCounts[val] = (valueCounts[val] || 0) + 1;
    });
    
    const counts = Object.values(valueCounts).sort((a, b) => b - a);
    
    // Four of a kind
    if (counts[0] === 4) {
      return 'Four of a Kind';
    }
    
    // Full house (three of a kind + pair)
    if (counts[0] === 3 && counts[1] === 2) {
      return 'Full House';
    }
    
    // Flush
    if (isFlush) {
      return 'Flush';
    }
    
    // Straight
    if (isStraight) {
      return 'Straight';
    }
    
    // Three of a kind
    if (counts[0] === 3) {
      return 'Three of a Kind';
    }
    
    // Two pair
    if (counts[0] === 2 && counts[1] === 2) {
      return 'Two Pair';
    }
    
    // Jacks or better (pair of J, Q, K, or A)
    if (counts[0] === 2) {
      // Find which value has a pair
      const pairValue = parseInt(Object.keys(valueCounts).find(key => valueCounts[parseInt(key)] === 2) || '0');
      if (pairValue >= 11) { // J=11, Q=12, K=13, A=14
        return 'Jacks or Better';
      }
    }
    
    // Nothing
    return 'Nothing';
  };

  const handleDeal = () => {
    if (gameState !== 'betting' || !user || isDealing) return;
    
    // Check if player has enough coins
    if (user.profile.coins < betAmount) {
      toast({
        title: "Not enough coins!",
        description: `You need at least ${betAmount} coins to play.`,
        variant: "destructive",
      });
      return;
    }
    
    // Deduct bet amount
    const updatedUser = { ...user };
    updatedUser.profile.coins -= betAmount;
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    setUser(updatedUser);
    
    // Update statistics
    setStatistics(prev => ({
      ...prev,
      gamesPlayed: prev.gamesPlayed + 1,
      totalWagered: prev.totalWagered + betAmount
    }));
    
    // Deal initial hand
    setIsDealing(true);
    setGameState('first-draw');
    setRevealedCards(0);
    
    // Draw cards one by one with animation
    const newDeck = [...deck];
    const newHand: Card[] = [];
    
    const dealNextCard = (cardIndex: number) => {
      if (cardIndex >= 5) {
        // All cards dealt
        setIsDealing(false);
        setGameState('hold');
        
        // Evaluate initial hand
        const rank = evaluateHand(newHand);
        setHandRank(rank);
        return;
      }
      
      setTimeout(() => {
        const card = newDeck.pop() as Card;
        newHand.push(card);
        setHand([...newHand]);
        setRevealedCards(cardIndex + 1);
        
        // Continue with next card
        dealNextCard(cardIndex + 1);
      }, 300);
    };
    
    // Start dealing
    dealNextCard(0);
    setDeck(newDeck);
  };

  const toggleHold = (index: number) => {
    if (gameState !== 'hold' || isDealing) return;
    
    const newHand = [...hand];
    newHand[index].hold = !newHand[index].hold;
    setHand(newHand);
  };

  const handleDraw = () => {
    if (gameState !== 'hold' || isDealing || !user) return;
    
    setIsDealing(true);
    
    // Draw new cards for non-held positions
    const newDeck = [...deck];
    const newHand = [...hand];
    
    // Draw cards sequentially with animation
    const cardsToReplace = newHand.reduce((acc, card, i) => {
      if (!card.hold) acc.push(i);
      return acc;
    }, [] as number[]);
    
    const replaceNextCard = (index: number) => {
      if (index >= cardsToReplace.length) {
        // All cards replaced
        finalizeHand(newHand);
        return;
      }
      
      setTimeout(() => {
        const position = cardsToReplace[index];
        const newCard = newDeck.pop() as Card;
        newHand[position] = newCard;
        setHand([...newHand]);
        
        // Continue with next card
        replaceNextCard(index + 1);
      }, 300);
    };
    
    // Start replacing cards
    replaceNextCard(0);
    setDeck(newDeck);
  };
  
  const finalizeHand = (finalHand: Card[]) => {
    setIsDealing(false);
    setGameState('final');
    
    // Clear holds for visual clarity
    const cleanHand = finalHand.map(card => ({...card, hold: false}));
    setHand(cleanHand);
    
    // Evaluate final hand
    const finalRank = evaluateHand(finalHand);
    setHandRank(finalRank);
    
    // Calculate winnings
    const winMultiplier = payoutTable[finalRank];
    const finalWinAmount = betAmount * winMultiplier;
    setWinAmount(finalWinAmount);
    
    // Update stats
    const isWin = finalWinAmount > 0;
    setStatistics(prev => {
      const newStats = { 
        ...prev,
        gamesWon: isWin ? prev.gamesWon + 1 : prev.gamesWon,
        totalWon: prev.totalWon + finalWinAmount,
        highestPayout: Math.max(prev.highestPayout, finalWinAmount),
      };
      
      // Handle streak
      if (isWin) {
        newStats.currentStreak = prev.currentStreak + 1;
        newStats.bestStreak = Math.max(prev.bestStreak, newStats.currentStreak);
      } else {
        newStats.currentStreak = 0;
      }
      
      // Track royal flushes
      if (finalRank === 'Royal Flush') {
        newStats.royalFlushes = prev.royalFlushes + 1;
      }
      
      return newStats;
    });
    
    if (finalWinAmount > 0) {
      // Add winnings to player's balance
      const updatedUser = { ...user };
      updatedUser.profile.coins += finalWinAmount;
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      setUser(updatedUser);
      
      // Show win animation for significant wins
      if (winMultiplier >= 4) {
        createConfetti();
      }
      
      // Show toast
      toast({
        title: finalRank,
        description: `You won ${finalWinAmount} coins!`,
      });
      
      // Add to game history
      addGameHistory(user.profile.username, {
        gameId: 'video-poker',
        gameName: 'Video Poker',
        bet: betAmount,
        outcome: finalWinAmount,
        timestamp: Date.now()
      });
    } else {
      // Show loss toast
      toast({
        title: "Better luck next time!",
        description: `${finalRank !== 'Nothing' ? finalRank : 'No winning hand'}.`,
      });
      
      // Add to game history
      addGameHistory(user.profile.username, {
        gameId: 'video-poker',
        gameName: 'Video Poker',
        bet: betAmount,
        outcome: -betAmount,
        timestamp: Date.now()
      });
    }
  };

  const getCardLabel = (card: Card): string => {
    return card.value;
  };

  const getCardColor = (card: Card): string => {
    return card.suit === 'hearts' || card.suit === 'diamonds' ? 'text-red-500' : 'text-black';
  };

  const getSuitSymbol = (suit: Suit): string => {
    switch(suit) {
      case 'hearts': return '♥';
      case 'diamonds': return '♦';
      case 'clubs': return '♣';
      case 'spades': return '♠';
    }
  };

  const getRankColor = (rank: HandRank): string => {
    switch(rank) {
      case 'Royal Flush': return 'text-purple-500 font-bold';
      case 'Straight Flush': return 'text-purple-400 font-bold';
      case 'Four of a Kind': return 'text-red-500 font-bold';
      case 'Full House': return 'text-yellow-500 font-bold';
      case 'Flush': return 'text-blue-500 font-bold';
      case 'Straight': return 'text-green-500 font-bold';
      case 'Three of a Kind': return 'text-orange-500 font-bold';
      case 'Two Pair': return 'text-teal-500';
      case 'Jacks or Better': return 'text-gray-300';
      default: return 'text-gray-500';
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-card p-8 rounded-lg border-2 border-casino-secondary">
        <h2 className="text-2xl font-bold mb-6 text-center gold-text">VIDEO POKER</h2>
        
        {/* Pay Table */}
        <div className="mb-6 bg-gray-800 p-4 rounded-lg overflow-x-auto">
          <h3 className="font-bold mb-3 text-center">Pay Table</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-600">
                <th className="text-left py-1">Hand</th>
                <th className="text-right py-1">Payout</th>
                <th className="text-right py-1">Win</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(payoutTable).map(([rank, multiplier]) => (
                <tr key={rank} className={`${rank === handRank ? 'bg-gray-700' : ''}`}>
                  <td className={`py-1 ${getRankColor(rank as HandRank)}`}>{rank}</td>
                  <td className="text-right py-1">{multiplier}x</td>
                  <td className="text-right py-1">{multiplier ? multiplier * betAmount : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Cards */}
        <div className="bg-green-900 p-6 rounded-lg mb-6">
          <div className="flex justify-center space-x-2 mb-4">
            {[0, 1, 2, 3, 4].map((index) => (
              hand[index] ? (
                <div key={index} className="relative">
                  <div className={`bg-white w-20 h-28 rounded-md relative border ${
                    hand[index].hold ? 'ring-2 ring-yellow-500' : ''
                  }`}>
                    <div className={`absolute top-1 left-1 text-lg font-bold ${getCardColor(hand[index])}`}>
                      {getCardLabel(hand[index])}
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center text-3xl">
                      <span className={getCardColor(hand[index])}>{getSuitSymbol(hand[index].suit)}</span>
                    </div>
                    <div className={`absolute bottom-1 right-1 text-lg font-bold ${getCardColor(hand[index])}`}>
                      {getCardLabel(hand[index])}
                    </div>
                  </div>
                  {gameState === 'hold' && (
                    <Button 
                      size="sm" 
                      variant={hand[index].hold ? "default" : "outline"}
                      className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 mt-1 text-xs py-0 px-3"
                      onClick={() => toggleHold(index)}
                    >
                      {hand[index].hold ? "HELD" : "HOLD"}
                    </Button>
                  )}
                </div>
              ) : (
                <div key={index} className="w-20 h-28 bg-blue-900 rounded-md border border-blue-800 flex items-center justify-center">
                  <span className="text-blue-300">♠♥♦♣</span>
                </div>
              )
            ))}
          </div>
          
          {/* Current hand evaluation */}
          {handRank !== 'Nothing' && (
            <div className="text-center mb-4">
              <span className={`text-xl ${getRankColor(handRank)}`}>{handRank}</span>
              {payout > 0 && gameState === 'final' && (
                <span className="ml-2 gold-text text-xl">- Win {payout} coins!</span>
              )}
            </div>
          )}
          
          {/* Bet controls */}
          <div className="flex justify-between items-center">
            <div>
              <span className="font-bold">Bet:</span>
              <span className="ml-2 gold-text">{betAmount}</span>
              
              {gameState === 'betting' && (
                <div className="flex items-center mt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="p-0 w-8 h-8" 
                    onClick={() => setBetAmount(Math.max(1, betAmount - 1))}
                    disabled={betAmount <= 1}
                  >
                    -
                  </Button>
                  <div className="w-32 mx-2">
                    <Slider
                      value={[betAmount]}
                      min={1}
                      max={100}
                      step={1}
                      onValueChange={(vals) => setBetAmount(vals[0])}
                    />
                  </div>
                  <Button 
                    variant="outline"
                    size="sm"
                    className="p-0 w-8 h-8"
                    onClick={() => setBetAmount(Math.min(100, betAmount + 1))}
                    disabled={betAmount >= 100}
                  >
                    +
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="ml-2"
                    onClick={() => setBetAmount(5)}
                  >
                    5
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="ml-2"
                    onClick={() => setBetAmount(10)}
                  >
                    10
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="ml-2"
                    onClick={() => setBetAmount(25)}
                  >
                    25
                  </Button>
                </div>
              )}
            </div>
            
            <div>
              <span className="font-bold">Balance:</span>
              <span className="ml-2 gold-text">{user.profile.coins.toLocaleString()}</span>
            </div>
          </div>
        </div>
        
        {/* Game controls */}
        <div className="flex justify-center space-x-4 mb-4">
          {gameState === 'betting' && (
            <Button
              onClick={handleDeal}
              disabled={isDealing || user.profile.coins < betAmount}
              className="bg-green-600 hover:bg-green-700 px-8"
            >
              Deal
            </Button>
          )}
          
          {gameState === 'hold' && (
            <Button
              onClick={handleDraw}
              disabled={isDealing}
              className="bg-blue-600 hover:bg-blue-700 px-8"
            >
              Draw
            </Button>
          )}
          
          {gameState === 'final' && (
            <Button
              onClick={resetGame}
              className="bg-purple-600 hover:bg-purple-700 px-8"
            >
              New Game
            </Button>
          )}
        </div>
        
        {/* Statistics */}
        {statistics.gamesPlayed > 0 && (
          <div className="bg-muted p-4 rounded-lg mb-4">
            <h3 className="font-bold mb-2">Your Stats:</h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <div>Games Played: <span className="font-bold">{statistics.gamesPlayed}</span></div>
              <div>Games Won: <span className="font-bold">{statistics.gamesWon} ({Math.round((statistics.gamesWon / statistics.gamesPlayed) * 100)}%)</span></div>
              <div>Royal Flushes: <span className="font-bold">{statistics.royalFlushes}</span></div>
              <div>Total Wagered: <span className="font-bold">{statistics.totalWagered}</span></div>
              <div>Total Won: <span className="font-bold gold-text">{statistics.totalWon}</span></div>
              <div>Highest Payout: <span className="font-bold text-green-400">{statistics.highestPayout}</span></div>
              {statistics.currentStreak > 0 && (
                <div>Current Streak: <span className="font-bold text-green-400">{statistics.currentStreak}</span></div>
              )}
              {statistics.bestStreak > 0 && (
                <div>Best Streak: <span className="font-bold text-green-400">{statistics.bestStreak}</span></div>
              )}
            </div>
          </div>
        )}
        
        {/* Game rules */}
        <div className="bg-muted p-4 rounded-lg text-sm">
          <h3 className="font-bold mb-2">How to Play:</h3>
          <ul className="space-y-1">
            <li><ArrowRight className="inline h-4 w-4 mr-1" /> Make your bet and click "Deal" to get 5 cards</li>
            <li><ArrowRight className="inline h-4 w-4 mr-1" /> Select which cards to HOLD and which to discard</li>
            <li><ArrowRight className="inline h-4 w-4 mr-1" /> Click "Draw" to replace the discarded cards</li>
            <li><ArrowRight className="inline h-4 w-4 mr-1" /> Get paid according to the pay table above</li>
            <li><ArrowRight className="inline h-4 w-4 mr-1" /> Higher bets offer higher potential payouts</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PokerGame;
