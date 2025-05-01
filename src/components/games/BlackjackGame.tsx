import { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { getCurrentUser } from "@/utils/authUtils";
import { addGameHistory } from "@/utils/gameUtils";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { ArrowRight } from "lucide-react";

// Card types
type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
type CardValue = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';
type Card = {
  suit: Suit;
  value: CardValue;
  hidden?: boolean;
  flipping?: boolean;
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
  const [insuranceOffer, setInsuranceOffer] = useState(false);
  const [insuranceBet, setInsuranceBet] = useState(0);
  const [doubleDownAvailable, setDoubleDownAvailable] = useState(false);
  const [splitAvailable, setSplitAvailable] = useState(false);
  const [splitHand, setSplitHand] = useState<Card[]>([]);
  const [splitTotal, setSplitTotal] = useState(0);
  const [activeSplitHand, setActiveSplitHand] = useState(false);
  const [lastHandWinner, setLastHandWinner] = useState<'player' | 'dealer' | 'push' | null>(null);
  const [cardCounter, setCardCounter] = useState(0);
  const [showCount, setShowCount] = useState(false);
  const [tableColor, setTableColor] = useState<'green' | 'blue' | 'red'>('green');
  const [streakCount, setStreakCount] = useState(0);
  const animationRef = useRef<number | null>(null);
  const [dealSpeed, setDealSpeed] = useState<'slow' | 'normal' | 'fast'>('normal');
  const [sessionStats, setSessionStats] = useState({
    handsPlayed: 0,
    handsWon: 0,
    blackjacks: 0,
    totalWagered: 0,
    totalWon: 0,
    biggestWin: 0
  });
  
  const dealSpeedDelays = {
    slow: 1000,
    normal: 600,
    fast: 300
  };

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
    
    // Create a 6-deck shoe for more realistic blackjack
    for (let d = 0; d < 6; d++) {
      for (const suit of suits) {
        for (const value of values) {
          newDeck.push({ suit, value });
        }
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
    
    // Reset card counter when shuffling
    setCardCounter(0);
    
    return shuffled;
  };

  const drawCard = (): Card => {
    if (deck.length === 0) {
      // Reshuffle if deck is empty
      const newDeck = createDeck();
      setDeck(newDeck);
      return newDeck.pop() as Card;
    }
    
    const newDeck = [...deck];
    const card = newDeck.pop() as Card;
    setDeck(newDeck);
    
    // Update card counter (basic card counting system: +1 for 2-6, -1 for 10-A)
    if (['2', '3', '4', '5', '6'].includes(card.value)) {
      setCardCounter(prev => prev + 1);
    } else if (['10', 'J', 'Q', 'K', 'A'].includes(card.value)) {
      setCardCounter(prev => prev - 1);
    }
    
    return card;
  };

  const calculateHandValue = (hand: Card[]): number => {
    let value = 0;
    let aces = 0;
    
    for (const card of hand) {
      if (!card.hidden) {
        if (card.value === 'A') {
          aces++;
          value += 11;
        } else if (['K', 'Q', 'J'].includes(card.value)) {
          value += 10;
        } else {
          value += parseInt(card.value);
        }
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
    // If deck is almost depleted, create a new shuffled deck
    if (deck.length < 52) {
      setDeck(createDeck());
    }
    
    setPlayerHand([]);
    setDealerHand([]);
    setSplitHand([]);
    setPlayerTotal(0);
    setDealerTotal(0);
    setSplitTotal(0);
    setBetAmount(0);
    setGameState('betting');
    setResult('');
    setRevealDealer(false);
    setInsuranceOffer(false);
    setInsuranceBet(0);
    setDoubleDownAvailable(false);
    setSplitAvailable(false);
    setActiveSplitHand(false);
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
    
    // Update session stats
    setSessionStats(prev => ({
      ...prev,
      handsPlayed: prev.handsPlayed + 1,
      totalWagered: prev.totalWagered + betAmount
    }));
    
    // Deal initial cards
    let newDeck = [...deck];
    if (newDeck.length < 10) {
      // Reshuffle if running low on cards
      newDeck = createDeck();
      setDeck(newDeck);
      toast({
        title: "Deck Reshuffled",
        description: "The dealer reshuffles the cards.",
      });
    }
    
    // Deal cards one at a time as in real blackjack
    dealCards(newDeck);
  };
  
  const dealCards = (currentDeck: Card[]) => {
    setGameState('playing');
    
    // Create deep copies to avoid reference issues
    const newDeck = [...currentDeck];
    let pHand: Card[] = [];
    let dHand: Card[] = [];
    
    // Deal first card to player
    setTimeout(() => {
      const playerCard1 = newDeck.pop() as Card;
      pHand = [playerCard1];
      setPlayerHand(pHand);
      setPlayerTotal(calculateHandValue(pHand));
    }, dealSpeedDelays[dealSpeed]);
    
    // Deal first card to dealer
    setTimeout(() => {
      const dealerCard1 = newDeck.pop() as Card;
      dHand = [dealerCard1];
      setDealerHand(dHand);
      setDealerTotal(calculateHandValue(dHand));
    }, dealSpeedDelays[dealSpeed] * 2);
    
    // Deal second card to player
    setTimeout(() => {
      const playerCard2 = newDeck.pop() as Card;
      pHand = [...pHand, playerCard2];
      setPlayerHand([...pHand]);
      const playerValue = calculateHandValue(pHand);
      setPlayerTotal(playerValue);
      
      // Check for split opportunity
      if (pHand[0].value === playerCard2.value || 
         ((['J', 'Q', 'K', '10'].includes(pHand[0].value)) && 
          (['J', 'Q', 'K', '10'].includes(playerCard2.value)))) {
        setSplitAvailable(true);
      }
    }, dealSpeedDelays[dealSpeed] * 3);
    
    // Deal second card to dealer (face down)
    setTimeout(() => {
      const dealerCard2 = newDeck.pop() as Card;
      dealerCard2.hidden = true;
      dHand = [...dHand, dealerCard2];
      setDealerHand(dHand);
      
      // Save deck state
      setDeck(newDeck);
      
      // Check for dealer ace and insurance
      if (dHand[0].value === 'A') {
        setInsuranceOffer(true);
      }
      
      // Check for player blackjack
      const playerValue = calculateHandValue(pHand);
      if (playerValue === 21) {
        // Natural blackjack!
        setTimeout(() => {
          handleNaturalBlackjack();
        }, dealSpeedDelays[dealSpeed]);
      } else {
        // Enable double down if total is 9, 10, or 11
        if (playerValue >= 9 && playerValue <= 11) {
          setDoubleDownAvailable(true);
        }
      }
    }, dealSpeedDelays[dealSpeed] * 4);
  };
  
  const handleNaturalBlackjack = () => {
    // Reveal dealer's hole card
    setRevealDealer(true);
    
    // Get a copy of dealer's hand with hole card revealed
    const revealedDealerHand = dealerHand.map(card => ({ ...card, hidden: false }));
    setDealerHand(revealedDealerHand);
    
    // Calculate dealer's total with revealed card
    const dealerValue = calculateHandValue(revealedDealerHand);
    setDealerTotal(dealerValue);
    
    // Check if dealer also has blackjack (push)
    if (dealerValue === 21) {
      handleGameOver('push');
    } else {
      handleGameOver('blackjack');
      
      // Update session stats
      setSessionStats(prev => ({
        ...prev,
        blackjacks: prev.blackjacks + 1
      }));
    }
  };
  
  const handleInsurance = (takeInsurance: boolean) => {
    if (takeInsurance) {
      const insuranceAmount = Math.floor(betAmount / 2);
      
      // Deduct insurance bet
      if (user && user.profile.coins >= insuranceAmount) {
        const updatedUser = { ...user };
        updatedUser.profile.coins -= insuranceAmount;
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        setUser(updatedUser);
        setInsuranceBet(insuranceAmount);
        
        toast({
          title: "Insurance Bet Placed",
          description: `You placed an insurance bet of ${insuranceAmount} coins.`,
        });
      } else {
        toast({
          title: "Not enough coins for insurance",
          variant: "destructive",
        });
      }
    }
    
    setInsuranceOffer(false);
    
    // Check dealer blackjack if insurance was taken
    if (takeInsurance) {
      setTimeout(() => {
        // Peek at hole card
        const dealerValue = calculateHandValue(dealerHand.map(card => ({ ...card, hidden: false })));
        
        if (dealerValue === 21) {
          // Dealer has blackjack - insurance pays 2:1
          const insurancePayout = insuranceAmount * 3; // Original bet + 2:1 payout
          setRevealDealer(true);
          
          // Update user balance for insurance win
          const updatedUser = { ...user };
          updatedUser.profile.coins += insurancePayout;
          localStorage.setItem('currentUser', JSON.stringify(updatedUser));
          setUser(updatedUser);
          
          setTimeout(() => {
            handleGameOver('dealer_blackjack');
          }, 1000);
          
          toast({
            title: "Insurance Wins!",
            description: `You won ${insurancePayout} coins from your insurance bet.`,
          });
        }
      }, 1000);
    }
  };

  const handleHit = () => {
    if (gameState !== 'playing' || !user) return;
    
    try {
      const card = drawCard();
      let newHand;
      
      if (activeSplitHand) {
        // Hit on split hand
        newHand = [...splitHand, card];
        setSplitHand(newHand);
        
        const newTotal = calculateHandValue(newHand);
        setSplitTotal(newTotal);
        
        if (newTotal > 21) {
          // Bust on split hand - switch back to main hand or end if both played
          if (playerTotal <= 21) {
            setActiveSplitHand(false);
          } else {
            handleGameOver('both_bust');
          }
        } else if (newTotal === 21) {
          // 21 on split hand - auto stand and switch
          setActiveSplitHand(false);
        }
      } else {
        // Hit on main hand
        newHand = [...playerHand, card];
        setPlayerHand(newHand);
        
        const newTotal = calculateHandValue(newHand);
        setPlayerTotal(newTotal);
        
        if (newTotal > 21) {
          // Check if player has a split hand that's still in play
          if (splitHand.length > 0 && splitTotal <= 21) {
            setActiveSplitHand(true);
          } else {
            // Bust
            handleGameOver('bust');
          }
        } else if (newTotal === 21) {
          // 21 - automatically stand
          handleStand();
        }
      }
      
      // Disable double down after hitting
      setDoubleDownAvailable(false);
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
    
    if (activeSplitHand || (splitHand.length > 0 && !activeSplitHand && splitTotal < 21)) {
      // If we're on the main hand and have a split hand to play
      if (!activeSplitHand && splitHand.length > 0) {
        setActiveSplitHand(true);
        return;
      }
      
      // If we're standing on the split hand, move to dealer's turn
      setGameState('dealerTurn');
    } else {
      // Regular stand
      setGameState('dealerTurn');
    }
    
    // Reveal dealer's hole card
    setRevealDealer(true);
    
    // Get a copy of dealer's hand with hole card revealed
    const revealedDealerHand = dealerHand.map(card => ({ ...card, hidden: false }));
    setDealerHand(revealedDealerHand);
    
    // Calculate dealer's true total with revealed card
    const dTotal = calculateHandValue(revealedDealerHand);
    setDealerTotal(dTotal);
    
    // Dealer draws until 17 or higher
    setTimeout(() => {
      dealerPlay(revealedDealerHand, dTotal);
    }, 1000);
  };
  
  const handleDoubleDown = () => {
    if (gameState !== 'playing' || !doubleDownAvailable || !user) return;
    
    // Check if player has enough coins to double their bet
    if (user.profile.coins < betAmount) {
      toast({
        title: "Not enough coins!",
        description: "You need enough coins to double your bet.",
        variant: "destructive",
      });
      return;
    }
    
    // Deduct additional bet
    const updatedUser = { ...user };
    updatedUser.profile.coins -= betAmount;
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    setUser(updatedUser);
    
    // Double the bet
    setBetAmount(betAmount * 2);
    
    // Update session stats
    setSessionStats(prev => ({
      ...prev,
      totalWagered: prev.totalWagered + betAmount
    }));
    
    // Draw exactly one card, then stand
    try {
      const card = drawCard();
      const newHand = [...playerHand, card];
      setPlayerHand(newHand);
      
      const newTotal = calculateHandValue(newHand);
      setPlayerTotal(newTotal);
      
      toast({
        title: "Double Down",
        description: "Bet doubled! Drawing one card and standing.",
      });
      
      // Always stand after double down, even if busted
      setTimeout(() => {
        handleStand();
      }, 1000);
    } catch (error) {
      console.error("Error in double down:", error);
    }
  };
  
  const handleSplit = () => {
    if (gameState !== 'playing' || !splitAvailable || !user) return;
    
    // Check if player has enough coins to match the bet
    if (user.profile.coins < betAmount) {
      toast({
        title: "Not enough coins!",
        description: "You need enough coins to place a bet on the split hand.",
        variant: "destructive",
      });
      return;
    }
    
    // Deduct additional bet
    const updatedUser = { ...user };
    updatedUser.profile.coins -= betAmount;
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    setUser(updatedUser);
    
    // Update session stats
    setSessionStats(prev => ({
      ...prev,
      totalWagered: prev.totalWagered + betAmount
    }));
    
    // Split the hand
    const firstHand = [playerHand[0]];
    const secondHand = [playerHand[1]];
    
    // Draw a card for each hand
    const card1 = drawCard();
    const card2 = drawCard();
    
    firstHand.push(card1);
    secondHand.push(card2);
    
    setPlayerHand(firstHand);
    setSplitHand(secondHand);
    
    // Calculate new totals
    setPlayerTotal(calculateHandValue(firstHand));
    setSplitTotal(calculateHandValue(secondHand));
    
    // No longer available to split again
    setSplitAvailable(false);
    
    toast({
      title: "Split Hands",
      description: "You split your hand! Play the first hand now.",
    });
    
    // Check for naturals in split aces (if implemented)
    const isSplittingAces = playerHand[0].value === 'A';
    if (isSplittingAces) {
      // In most casinos, only one card is dealt to each split ace
      if (calculateHandValue(firstHand) === 21 || calculateHandValue(secondHand) === 21) {
        toast({
          title: "21 on Split Aces",
          description: "You got 21 with split aces! (Not counted as a natural blackjack)",
        });
      }
      
      // Automatically stand on both hands after split aces
      setTimeout(() => {
        handleStand();
      }, 1000);
    }
  };

  const dealerPlay = (currentHand: Card[], currentTotal: number) => {
    let hand = [...currentHand];
    let total = currentTotal;
    let dealerDrawing = true;
    
    const drawDelayedCard = () => {
      // Keep drawing cards until 17 or higher
      if (total < 17) {
        try {
          const card = drawCard();
          hand = [...hand, card];
          total = calculateHandValue(hand);
          
          // Update state after each card drawn
          setDealerHand(hand);
          setDealerTotal(total);
          
          if (total < 17) {
            // Continue drawing after delay
            setTimeout(drawDelayedCard, dealSpeedDelays[dealSpeed]);
          } else {
            dealerDrawing = false;
            // Determine winner after dealer's turn
            setTimeout(() => {
              determineWinner(total);
            }, dealSpeedDelays[dealSpeed]);
          }
        } catch (error) {
          console.error("Error drawing card for dealer:", error);
          dealerDrawing = false;
          determineWinner(total);
        }
      } else {
        dealerDrawing = false;
        // Determine winner after dealer's turn
        determineWinner(total);
      }
    };
    
    // Start the dealer's draw sequence
    drawDelayedCard();
  };
  
  const determineWinner = (dealerFinalTotal: number) => {
    const playerScore = playerTotal;
    const splitScore = splitTotal;
    
    // Handle split hands first if they exist
    if (splitHand.length > 0) {
      handleSplitResults(dealerFinalTotal, playerScore, splitScore);
      return;
    }
    
    // Regular single hand results
    if (dealerFinalTotal > 21) {
      // Dealer busts
      handleGameOver('dealer_bust');
    } else if (dealerFinalTotal > playerScore) {
      // Dealer wins
      handleGameOver('dealer_win');
    } else if (dealerFinalTotal < playerScore) {
      // Player wins
      handleGameOver('player_win');
    } else {
      // Push (tie)
      handleGameOver('push');
    }
  };
  
  const handleSplitResults = (dealerTotal: number, mainHandTotal: number, splitHandTotal: number) => {
    let mainHandResult: 'win' | 'lose' | 'push' = 'lose';
    let splitHandResult: 'win' | 'lose' | 'push' = 'lose';
    let winAmount = 0;
    
    // Check main hand result
    if (mainHandTotal > 21) {
      mainHandResult = 'lose';
    } else if (dealerTotal > 21) {
      mainHandResult = 'win';
      winAmount += betAmount * 2;
    } else if (mainHandTotal > dealerTotal) {
      mainHandResult = 'win';
      winAmount += betAmount * 2;
    } else if (mainHandTotal === dealerTotal) {
      mainHandResult = 'push';
      winAmount += betAmount;
    }
    
    // Check split hand result
    if (splitHandTotal > 21) {
      splitHandResult = 'lose';
    } else if (dealerTotal > 21) {
      splitHandResult = 'win';
      winAmount += betAmount * 2;
    } else if (splitHandTotal > dealerTotal) {
      splitHandResult = 'win';
      winAmount += betAmount * 2;
    } else if (splitHandTotal === dealerTotal) {
      splitHandResult = 'push';
      winAmount += betAmount;
    }
    
    // Determine overall result for messaging
    let overallResult = 'split_mixed';
    if (mainHandResult === 'win' && splitHandResult === 'win') {
      overallResult = 'split_both_win';
    } else if (mainHandResult === 'lose' && splitHandResult === 'lose') {
      overallResult = 'split_both_lose';
    } else if (mainHandResult === 'push' && splitHandResult === 'push') {
      overallResult = 'split_both_push';
    }
    
    // Handle the game over with split results
    handleGameOver(overallResult as any, winAmount);
  };

  const handleGameOver = (
    outcome: 
      'blackjack' | 'bust' | 'dealer_bust' | 'dealer_win' | 'player_win' | 'push' | 
      'dealer_blackjack' | 'both_bust' | 'split_both_win' | 'split_both_lose' | 'split_both_push' | 'split_mixed',
    overrideWinAmount?: number
  ) => {
    setRevealDealer(true);
    setGameState('gameOver');
    
    let winAmount = overrideWinAmount !== undefined ? overrideWinAmount : 0;
    let resultText = '';
    let isWin = false;
    
    if (overrideWinAmount === undefined) {
      switch (outcome) {
        case 'blackjack':
          winAmount = Math.floor(betAmount * 2.5);
          resultText = "BLACKJACK! You win 3:2!";
          isWin = true;
          setLastHandWinner('player');
          setStreakCount(prev => (prev > 0 ? prev + 1 : 1));
          break;
        case 'bust':
          winAmount = 0;
          resultText = "BUST! You went over 21.";
          setLastHandWinner('dealer');
          setStreakCount(prev => (prev < 0 ? prev - 1 : -1));
          break;
        case 'both_bust':
          winAmount = 0;
          resultText = "Both hands BUST! You went over 21.";
          setLastHandWinner('dealer');
          setStreakCount(prev => (prev < 0 ? prev - 1 : -1));
          break;
        case 'dealer_bust':
          winAmount = betAmount * 2;
          resultText = "Dealer busts! You win!";
          isWin = true;
          setLastHandWinner('player');
          setStreakCount(prev => (prev > 0 ? prev + 1 : 1));
          break;
        case 'dealer_win':
          winAmount = 0;
          resultText = "Dealer wins!";
          setLastHandWinner('dealer');
          setStreakCount(prev => (prev < 0 ? prev - 1 : -1));
          break;
        case 'player_win':
          winAmount = betAmount * 2;
          resultText = "You win!";
          isWin = true;
          setLastHandWinner('player');
          setStreakCount(prev => (prev > 0 ? prev + 1 : 1));
          break;
        case 'push':
          winAmount = betAmount;
          resultText = "Push! It's a tie.";
          setLastHandWinner('push');
          setStreakCount(0);
          break;
        case 'dealer_blackjack':
          if (insuranceBet > 0) {
            resultText = "Dealer has Blackjack! Your insurance bet won.";
          } else {
            resultText = "Dealer has Blackjack! You lose.";
          }
          winAmount = 0; // Insurance payout handled separately
          setLastHandWinner('dealer');
          setStreakCount(prev => (prev < 0 ? prev - 1 : -1));
          break;
        case 'split_both_win':
          winAmount = betAmount * 4; // Win on both hands
          resultText = "Both split hands win!";
          isWin = true;
          setLastHandWinner('player');
          setStreakCount(prev => (prev > 0 ? prev + 1 : 1));
          break;
        case 'split_both_lose':
          winAmount = 0;
          resultText = "Both split hands lose.";
          setLastHandWinner('dealer');
          setStreakCount(prev => (prev < 0 ? prev - 1 : -1));
          break;
        case 'split_both_push':
          winAmount = betAmount * 2; // Return both bets
          resultText = "Both split hands push.";
          setLastHandWinner('push');
          setStreakCount(0);
          break;
        case 'split_mixed':
          // This is a placeholder - the actual win amount is passed in overrideWinAmount
          resultText = "Split hands: one win, one loss.";
          isWin = winAmount > betAmount * 2; // Win if we got more than both bets back
          setLastHandWinner(isWin ? 'player' : 'dealer');
          setStreakCount(isWin ? (prev => (prev > 0 ? prev + 1 : 1)) : (prev => (prev < 0 ? prev - 1 : -1)));
          break;
      }
    }
    
    setResult(resultText);
    
    if (winAmount > 0) {
      // Update user balance
      const updatedUser = { ...user };
      updatedUser.profile.coins += winAmount;
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      setUser(updatedUser);
      
      // Only show confetti for actual wins, not ties
      if (isWin) {
        createConfetti();
        
        // Update session stats for wins
        setSessionStats(prev => {
          const netWin = winAmount - (outcome === 'blackjack' ? betAmount : (outcome.includes('split') ? betAmount * 2 : betAmount));
          return {
            ...prev,
            handsWon: prev.handsWon + 1,
            totalWon: prev.totalWon + netWin,
            biggestWin: Math.max(prev.biggestWin, netWin)
          };
        });
      }
      
      // Show toast for wins
      if (outcome !== 'push' && isWin) {
        toast({
          title: "Winner!",
          description: `You won ${winAmount} coins!`,
        });
      }
    } else {
      toast({
        title: "Better luck next time!",
        description: outcome === 'bust' ? "You went over 21." : "You lost this hand.",
      });
    }
    
    // Add to game history
    addGameHistory(user.profile.username, {
      gameId: 'blackjack-game',
      gameName: 'Blackjack',
      bet: outcome.includes('split') ? betAmount * 2 : betAmount,
      outcome: winAmount - (outcome.includes('split') ? betAmount * 2 : betAmount), // Net profit or loss
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
  
  const handleChangeTableColor = (color: 'green' | 'blue' | 'red') => {
    setTableColor(color);
  };
  
  const getTableColorClass = () => {
    switch(tableColor) {
      case 'green': return 'bg-green-900';
      case 'blue': return 'bg-blue-900';
      case 'red': return 'bg-red-900';
      default: return 'bg-green-900';
    }
  };
  
  const getWinRatePercentage = () => {
    if (sessionStats.handsPlayed === 0) return 0;
    return Math.round((sessionStats.handsWon / sessionStats.handsPlayed) * 100);
  };

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto">
      <div className={`p-8 rounded-lg border-2 border-casino-secondary bg-card`}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold gold-text">BLACKJACK</h2>
          
          <div className="flex items-center space-x-2">
            <Button 
              size="sm" 
              variant="outline" 
              className="text-xs"
              onClick={() => setShowCount(!showCount)}
            >
              {showCount ? "Hide Count" : "Show Count"}
            </Button>
            
            <div className="flex space-x-1">
              {['green', 'blue', 'red'].map((color) => (
                <Button
                  key={color}
                  size="sm"
                  variant={tableColor === color ? "default" : "outline"}
                  className={`w-6 h-6 p-0 rounded-full bg-${color}-600`}
                  onClick={() => handleChangeTableColor(color as any)}
                />
              ))}
            </div>
            
            <div className="flex space-x-1">
              {['slow', 'normal', 'fast'].map((speed) => (
                <Button
                  key={speed}
                  size="sm"
                  variant={dealSpeed === speed ? "default" : "outline"}
                  className="text-xs py-0 px-2 h-6"
                  onClick={() => setDealSpeed(speed as any)}
                >
                  {speed}
                </Button>
              ))}
            </div>
          </div>
        </div>
        
        <div className={`${getTableColorClass()} p-6 rounded-lg mb-6`}>
          {/* Dealer's hand */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-bold">Dealer's Hand</h3>
              <div className="text-sm">
                {showCount && cardCounter !== 0 && (
                  <Badge 
                    variant={cardCounter > 0 ? "default" : "destructive"}
                    className="ml-2"
                  >
                    Count: {cardCounter}
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-2 min-h-32">
              {dealerHand.map((card, index) => (
                <div key={index} className={`bg-white w-16 h-24 rounded-md relative border ${
                  card.hidden ? 'bg-blue-800 border-white' : 'border-gray-300'
                } ${card.flipping ? 'animate-flip' : ''}`}>
                  {card.hidden ? (
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
          
          {/* Player's hand(s) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Main hand */}
            <div>
              <h3 className={`font-bold mb-2 ${activeSplitHand ? 'opacity-50' : 'gold-text'}`}>Your Hand {splitHand.length > 0 && "(1)"}</h3>
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
            
            {/* Split hand (if exists) */}
            {splitHand.length > 0 && (
              <div>
                <h3 className={`font-bold mb-2 ${!activeSplitHand ? 'opacity-50' : 'gold-text'}`}>Split Hand (2)</h3>
                <div className="flex flex-wrap gap-2 min-h-32">
                  {splitHand.map((card, index) => (
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
                <p className="mt-2">Split Total: <span className="font-bold">{splitTotal}</span></p>
              </div>
            )}
          </div>
          
          {/* Insurance offer */}
          {insuranceOffer && (
            <div className="mt-4 p-3 bg-yellow-800 rounded-lg text-center">
              <p className="font-bold mb-2">Dealer shows an Ace. Do you want insurance?</p>
              <p className="text-sm mb-3">Insurance costs {Math.floor(betAmount / 2)} coins and pays 2:1 if dealer has blackjack</p>
              <div className="flex justify-center space-x-4">
                <Button 
                  onClick={() => handleInsurance(true)}
                  variant="default"
                  disabled={user.profile.coins < Math.floor(betAmount / 2)}
                >
                  Yes, buy insurance
                </Button>
                <Button 
                  onClick={() => handleInsurance(false)}
                  variant="secondary"
                >
                  No thanks
                </Button>
              </div>
            </div>
          )}
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
            
            {streakCount !== 0 && (
              <Badge className={`ml-3 ${streakCount > 0 ? 'bg-green-600' : 'bg-red-600'}`}>
                {Math.abs(streakCount)} {streakCount > 0 ? 'Win' : 'Loss'} Streak
              </Badge>
            )}
          </div>
        </div>
        
        {/* Game controls */}
        <div className="flex flex-wrap gap-2 mb-6">
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
              {doubleDownAvailable && (
                <Button
                  onClick={handleDoubleDown}
                  disabled={user.profile.coins < betAmount}
                  className="bg-purple-600 hover:bg-purple-700">
                  Double Down
                </Button>
              )}
              {splitAvailable && (
                <Button
                  onClick={handleSplit}
                  disabled={user.profile.coins < betAmount}
                  className="bg-yellow-600 hover:bg-yellow-700">
                  Split
                </Button>
              )}
            </>
          )}
          
          {gameState === 'gameOver' && (
            <Button
              onClick={resetGame}
              className="bg-purple-600 hover:bg-purple-700">
              New Hand
            </Button>
          )}
        </div>
        
        {/* Results */}
        {result && (
          <div className="mt-4 p-3 bg-gray-700 rounded mb-4">
            <p className="font-bold gold-text text-center">{result}</p>
          </div>
        )}
        
        {/* Session Stats */}
        {sessionStats.handsPlayed > 0 && (
          <div className="bg-muted p-3 rounded-lg mb-4">
            <h4 className="font-bold mb-1">Session Stats:</h4>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
              <div>Hands: <span className="font-bold">{sessionStats.handsPlayed}</span></div>
              <div>Win Rate: <span className="font-bold">{getWinRatePercentage()}%</span></div>
              <div>Blackjacks: <span className="font-bold">{sessionStats.blackjacks}</span></div>
              <div>Wagered: <span className="font-bold">{sessionStats.totalWagered}</span></div>
              <div>Profit/Loss: <span className={`font-bold ${sessionStats.totalWon >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {sessionStats.totalWon >= 0 ? '+' : ''}{sessionStats.totalWon}
              </span></div>
              <div>Biggest Win: <span className="font-bold text-green-500">{sessionStats.biggestWin > 0 ? sessionStats.biggestWin : '-'}</span></div>
            </div>
          </div>
        )}
        
        {/* Game rules */}
        <div className="mt-4 bg-muted p-4 rounded-lg text-sm">
          <h3 className="font-bold mb-2">Blackjack Rules:</h3>
          <ul className="space-y-1">
            <li><ArrowRight className="inline h-4 w-4 mr-1" /> Try to get closer to 21 than the dealer without going over</li>
            <li><ArrowRight className="inline h-4 w-4 mr-1" /> Face cards are worth 10, Aces are 1 or 11</li>
            <li><ArrowRight className="inline h-4 w-4 mr-1" /> Dealer must hit until 17 or higher</li>
            <li><ArrowRight className="inline h-4 w-4 mr-1" /> Blackjack pays 3:2</li>
            <li><ArrowRight className="inline h-4 w-4 mr-1" /> Insurance pays 2:1 when dealer has blackjack</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default BlackjackGame;
