import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { getCurrentUser } from "@/utils/authUtils";
import { addGameHistory } from "@/utils/gameUtils";
import { useNavigate } from "react-router-dom";

// Card types
type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
type CardValue = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';
type Card = {
  suit: Suit;
  value: CardValue;
};

const BlackjackGame = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(getCurrentUser());
  const [deck, setDeck] = useState<Card[]>([]);
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [dealerHand, setDealerHand] = useState<Card[]>([]);
  const [playerTotal, setPlayerTotal] = useState(0);
  const [dealerTotal, setDealerTotal] = useState(0);
  const [betAmount, setBetAmount] = useState(0);
  const [gameState, setGameState] = useState<'betting' | 'playing' | 'dealerTurn' | 'gameOver'>('betting');
  const [result, setResult] = useState('');
  const [revealDealer, setRevealDealer] = useState(false);

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

  const createConfetti = () => {
    // This would be implemented with a proper confetti library in a real app
    console.log("Confetti effect triggered!");
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
    // Create a copy to avoid mutating the original
    const shuffled = [...deckToShuffle];
    
    // Fisher-Yates shuffle algorithm
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    return shuffled;
  };

  const drawCard = (): Card => {
    if (deck.length === 0) {
      throw new Error("Deck is empty!");
    }
    
    const newDeck = [...deck];
    const card = newDeck.pop() as Card;
    setDeck(newDeck);
    
    return card;
  };

  const calculateHandValue = (hand: Card[]): number => {
    let value = 0;
    let aces = 0;
    
    for (const card of hand) {
      if (card.value === 'A') {
        aces++;
        value += 11;
      } else if (['K', 'Q', 'J'].includes(card.value)) {
        value += 10;
      } else {
        value += parseInt(card.value);
      }
    }
    
    // Adjust for aces
    while (value > 21 && aces > 0) {
      value -= 10;
      aces--;
    }
    
    return value;
  };

  const resetGame = () => {
    setDeck(createDeck());
    setPlayerHand([]);
    setDealerHand([]);
    setPlayerTotal(0);
    setDealerTotal(0);
    setBetAmount(0);
    setGameState('betting');
    setResult('');
    setRevealDealer(false);
  };

  const handleChipSelect = (amount: number) => {
    if (gameState !== 'betting' || !user) return;
    
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

  const handleDeal = () => {
    if (gameState !== 'betting' || betAmount === 0 || !user) return;
    
    // Deal initial cards
    const newDeck = [...deck];
    const pHand = [newDeck.pop() as Card, newDeck.pop() as Card];
    const dHand = [newDeck.pop() as Card, newDeck.pop() as Card];
    
    setDeck(newDeck);
    setPlayerHand(pHand);
    setDealerHand(dHand);
    
    const pTotal = calculateHandValue(pHand);
    const dTotal = calculateHandValue([dHand[0]]); // Only count first dealer card initially
    
    setPlayerTotal(pTotal);
    setDealerTotal(dTotal);
    setGameState('playing');
    
    // Check for blackjack
    if (pTotal === 21) {
      if (calculateHandValue(dHand) === 21) {
        // Both have blackjack - push
        handleGameOver('push');
      } else {
        // Player has blackjack
        handleGameOver('blackjack');
      }
    }
  };

  const handleHit = () => {
    if (gameState !== 'playing' || !user) return;
    
    try {
      const card = drawCard();
      const newHand = [...playerHand, card];
      setPlayerHand(newHand);
      
      const newTotal = calculateHandValue(newHand);
      setPlayerTotal(newTotal);
      
      if (newTotal > 21) {
        // Bust
        handleGameOver('bust');
      } else if (newTotal === 21) {
        // 21 - automatically stand
        handleStand();
      }
    } catch (error) {
      console.error("Error drawing card:", error);
      toast({
        title: "Error",
        description: "Couldn't draw a card. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleStand = () => {
    if (gameState !== 'playing' || !user) return;
    
    setGameState('dealerTurn');
    setRevealDealer(true);
    
    // Calculate dealer's true total with both cards
    const dTotal = calculateHandValue(dealerHand);
    setDealerTotal(dTotal);
    
    // Dealer draws until 17 or higher
    setTimeout(() => {
      dealerPlay(dealerHand, dTotal);
    }, 1000);
  };

  const dealerPlay = (currentHand: Card[], currentTotal: number) => {
    let hand = [...currentHand];
    let total = currentTotal;
    
    // Keep drawing cards until 17 or higher
    while (total < 17) {
      try {
        const card = drawCard();
        hand = [...hand, card];
        total = calculateHandValue(hand);
        
        // Update state after each card drawn
        setDealerHand(hand);
        setDealerTotal(total);
        
        // Add a small delay for visual effect
        if (total < 17) {
          // In a real implementation, we would use timeouts or proper animations
          // This is simplified for the example
        }
      } catch (error) {
        console.error("Error drawing card for dealer:", error);
        break;
      }
    }
    
    // Determine winner after dealer's turn
    const playerScore = playerTotal;
    
    if (total > 21) {
      // Dealer busts
      handleGameOver('dealer_bust');
    } else if (total > playerScore) {
      // Dealer wins
      handleGameOver('dealer_win');
    } else if (total < playerScore) {
      // Player wins
      handleGameOver('player_win');
    } else {
      // Push (tie)
      handleGameOver('push');
    }
  };

  const handleGameOver = (outcome: 'blackjack' | 'bust' | 'dealer_bust' | 'dealer_win' | 'player_win' | 'push') => {
    setRevealDealer(true);
    setGameState('gameOver');
    
    let winAmount = 0;
    let resultText = '';
    
    switch (outcome) {
      case 'blackjack':
        winAmount = Math.floor(betAmount * 2.5);
        resultText = "BLACKJACK! You win 3:2!";
        break;
      case 'bust':
        winAmount = 0;
        resultText = "BUST! You went over 21.";
        break;
      case 'dealer_bust':
        winAmount = betAmount * 2;
        resultText = "Dealer busts! You win!";
        break;
      case 'dealer_win':
        winAmount = 0;
        resultText = "Dealer wins!";
        break;
      case 'player_win':
        winAmount = betAmount * 2;
        resultText = "You win!";
        break;
      case 'push':
        winAmount = betAmount;
        resultText = "Push! It's a tie.";
        break;
    }
    
    setResult(resultText);
    
    if (winAmount > 0) {
      // Update user balance
      const updatedUser = { ...user };
      updatedUser.profile.coins += winAmount;
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      setUser(updatedUser);
      
      // Only show confetti for actual wins, not ties
      if (winAmount > betAmount) {
        createConfetti();
      }
      
      // Show toast for wins
      if (outcome !== 'push') {
        toast({
          title: "Winner!",
          description: `You won ${winAmount} coins!`,
        });
      }
    } else {
      toast({
        title: "Better luck next time!",
        description: "You lost this hand.",
      });
    }
    
    // Add to game history
    addGameHistory(user.profile.username, {
      gameId: 'blackjack-game',
      gameName: 'Blackjack',
      bet: betAmount,
      outcome: winAmount - betAmount, // Net profit or loss
      timestamp: Date.now()
    });
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

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="p-8 rounded-lg border-2 border-casino-secondary bg-card">
        <h2 className="text-2xl font-bold mb-6 text-center gold-text">BLACKJACK</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
          {/* Dealer's hand */}
          <div>
            <h3 className="font-bold mb-2">Dealer's Hand</h3>
            <div className="flex flex-wrap gap-2 min-h-32">
              {dealerHand.map((card, index) => (
                <div key={index} className={`bg-white w-16 h-24 rounded-md relative border ${
                  !revealDealer && index === 0 ? 'bg-blue-800 border-white' : 'border-gray-300'
                }`}>
                  {(!revealDealer && index === 0) ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-yellow-400 text-2xl">?</span>
                    </div>
                  ) : (
                    <>
                      <div className={`absolute top-1 left-1 text-lg font-bold ${getCardColor(card)}`}>
                        {getCardLabel(card)}
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center text-3xl">
                        <span className={getCardColor(card)}>{getSuitSymbol(card.suit)}</span>
                      </div>
                      <div className={`absolute bottom-1 right-1 text-lg font-bold ${getCardColor(card)}`}>
                        {getCardLabel(card)}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
            <p className="mt-2">Dealer's Total: <span className="font-bold">{revealDealer ? dealerTotal : '?'}</span></p>
          </div>
          
          {/* Player's hand */}
          <div>
            <h3 className="font-bold mb-2">Your Hand</h3>
            <div className="flex flex-wrap gap-2 min-h-32">
              {playerHand.map((card, index) => (
                <div key={index} className="bg-white w-16 h-24 rounded-md relative border border-gray-300">
                  <div className={`absolute top-1 left-1 text-lg font-bold ${getCardColor(card)}`}>
                    {getCardLabel(card)}
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center text-3xl">
                    <span className={getCardColor(card)}>{getSuitSymbol(card.suit)}</span>
                  </div>
                  <div className={`absolute bottom-1 right-1 text-lg font-bold ${getCardColor(card)}`}>
                    {getCardLabel(card)}
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-2">Your Total: <span className="font-bold">{playerTotal}</span></p>
          </div>
        </div>
        
        {/* Betting UI */}
        <div className="mb-4">
          <label className="block text-sm font-bold mb-2">Bet Amount: <span className="gold-text">{betAmount}</span></label>
          
          {gameState === 'betting' && (
            <div className="flex space-x-2 flex-wrap mb-2">
              {[10, 50, 100, 500, 1000].map(amount => (
                <button
                  key={amount}
                  onClick={() => handleChipSelect(amount)}
                  disabled={user.profile.coins < amount}
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
          )}
          
          <div>
            <span className="font-bold">Your Balance:</span>
            <span className="ml-2 gold-text">{user.profile.coins.toLocaleString()}</span>
          </div>
        </div>
        
        {/* Game controls */}
        <div className="flex space-x-4">
          {gameState === 'betting' && (
            <Button
              onClick={handleDeal}
              disabled={betAmount === 0}
              className="bg-green-600 hover:bg-green-700">
              Deal Cards
            </Button>
          )}
          
          {gameState === 'playing' && (
            <>
              <Button
                onClick={handleHit}
                className="bg-blue-600 hover:bg-blue-700">
                Hit
              </Button>
              <Button
                onClick={handleStand}
                className="bg-red-600 hover:bg-red-700">
                Stand
              </Button>
            </>
          )}
          
          {gameState === 'gameOver' && (
            <Button
              onClick={resetGame}
              className="bg-purple-600 hover:bg-purple-700">
              New Game
            </Button>
          )}
        </div>
        
        {/* Results */}
        {result && (
          <div className="mt-4 p-3 bg-gray-700 rounded">
            <p className="font-bold gold-text">{result}</p>
          </div>
        )}
        
        {/* Game rules */}
        <div className="mt-6 bg-muted p-4 rounded-lg text-sm">
          <h3 className="font-bold mb-2">Blackjack Rules:</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>Try to get closer to 21 than the dealer without going over</li>
            <li>Face cards are worth 10, Aces are 1 or 11</li>
            <li>Dealer must hit until 17 or higher</li>
            <li>Blackjack pays 3:2</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default BlackjackGame;
