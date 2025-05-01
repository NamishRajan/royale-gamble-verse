
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface MemoryMiniGameProps {
  difficulty: 'easy' | 'medium' | 'hard';
  onGameEnd: (score: number) => void;
  duration: number;
}

interface Card {
  id: number;
  emoji: string;
  flipped: boolean;
  matched: boolean;
}

const MemoryMiniGame = ({ difficulty, onGameEnd, duration }: MemoryMiniGameProps) => {
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [matchedPairs, setMatchedPairs] = useState(0);
  const [score, setScore] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(duration);
  const [movesMade, setMovesMade] = useState(0);
  
  // Game size based on difficulty
  const getGridSize = () => {
    switch (difficulty) {
      case 'easy': return { rows: 3, cols: 4 }; // 12 cards (6 pairs)
      case 'medium': return { rows: 4, cols: 4 }; // 16 cards (8 pairs)
      case 'hard': return { rows: 4, cols: 5 }; // 20 cards (10 pairs)
      default: return { rows: 3, cols: 4 };
    }
  };
  
  const { rows, cols } = getGridSize();
  const totalPairs = (rows * cols) / 2;
  
  // Setup game
  useEffect(() => {
    const emojis = [
      '🎰', '🎲', '🃏', '🎯', '🎪', '🎭', '🎨', '🎬',
      '🎤', '🎧', '🎸', '🎮', '🎯', '🏆', '💰', '💎',
      '👑', '🔔', '🎁', '🎩', '🎭', '🎪', '🎢', '🎡'
    ];
    
    // Shuffle and select emojis based on needed pairs
    const selectedEmojis = emojis
      .sort(() => Math.random() - 0.5)
      .slice(0, totalPairs);
    
    // Create pairs
    const cardPairs = [...selectedEmojis, ...selectedEmojis];
    
    // Shuffle cards
    const shuffledCards = cardPairs
      .sort(() => Math.random() - 0.5)
      .map((emoji, index) => ({
        id: index,
        emoji,
        flipped: false,
        matched: false
      }));
    
    setCards(shuffledCards);
    setMatchedPairs(0);
    setFlippedCards([]);
    setMovesMade(0);
    setScore(0);
  }, [difficulty, totalPairs]);
  
  // Timer
  useEffect(() => {
    if (timeRemaining <= 0 || matchedPairs === totalPairs) {
      // Calculate final score
      const timeBonus = timeRemaining * 2;
      const difficultyMultiplier = difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3;
      const movePenalty = Math.max(0, movesMade - totalPairs * 2) * -2;
      const finalScore = score + timeBonus + movePenalty;
      
      // End game
      onGameEnd(finalScore > 0 ? finalScore : 0);
      return;
    }
    
    const timer = setInterval(() => {
      setTimeRemaining(prev => prev - 1);
    }, 1000);
    
    return () => clearInterval(timer);
  }, [timeRemaining, matchedPairs, totalPairs, onGameEnd, score, difficulty, movesMade]);
  
  // Check for matches
  useEffect(() => {
    if (flippedCards.length === 2) {
      const [firstId, secondId] = flippedCards;
      
      // Update moves
      setMovesMade(prev => prev + 1);
      
      if (cards[firstId].emoji === cards[secondId].emoji) {
        // Match found!
        setCards(prev => prev.map(card => 
          card.id === firstId || card.id === secondId 
            ? { ...card, matched: true, flipped: true } 
            : card
        ));
        
        // Update matched pairs
        setMatchedPairs(prev => prev + 1);
        
        // Award points - more for harder difficulty
        const difficultyMultiplier = difficulty === 'easy' ? 10 : difficulty === 'medium' ? 20 : 30;
        setScore(prev => prev + difficultyMultiplier);
        
        // Reset flipped cards
        setFlippedCards([]);
      } else {
        // No match, flip back after delay
        setTimeout(() => {
          setCards(prev => prev.map(card => 
            card.id === firstId || card.id === secondId 
              ? { ...card, flipped: false } 
              : card
          ));
          setFlippedCards([]);
        }, 1000);
      }
    }
  }, [flippedCards, cards, difficulty]);
  
  // Handle card click
  const handleCardClick = (id: number) => {
    // Prevent clicking if already 2 cards flipped or card already matched/flipped
    if (flippedCards.length >= 2 || cards[id].matched || cards[id].flipped) return;
    
    // Flip the card
    setCards(prev => prev.map(card => 
      card.id === id ? { ...card, flipped: true } : card
    ));
    
    // Add to flipped cards
    setFlippedCards(prev => [...prev, id]);
  };
  
  // Grid styles based on difficulty
  const gridStyles = {
    easy: 'grid-cols-4',
    medium: 'grid-cols-4',
    hard: 'grid-cols-5'
  };
  
  return (
    <div className="bg-muted rounded-lg p-4">
      {/* Timer and Score */}
      <div className="mb-4">
        <div className="flex justify-between mb-1">
          <span className="text-xs">Time: {timeRemaining}s</span>
          <span className="text-xs">Score: {score}</span>
        </div>
        <Progress value={(timeRemaining / duration) * 100} />
      </div>
      
      {/* Game stats */}
      <div className="flex justify-between text-xs mb-2">
        <span>Pairs: {matchedPairs}/{totalPairs}</span>
        <span>Moves: {movesMade}</span>
      </div>
      
      {/* Game grid */}
      <div className={`grid ${gridStyles[difficulty]} gap-2`}>
        {cards.map(card => (
          <Button
            key={card.id}
            variant={card.flipped ? (card.matched ? "success" : "default") : "outline"} 
            className={`aspect-square flex items-center justify-center p-0 ${
              card.flipped ? "" : "bg-blue-900 hover:bg-blue-800"
            }`}
            onClick={() => handleCardClick(card.id)}
            disabled={card.matched || card.flipped || flippedCards.length >= 2}
          >
            {card.flipped ? (
              <span className="text-2xl">{card.emoji}</span>
            ) : (
              <span className="text-xl">?</span>
            )}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default MemoryMiniGame;
