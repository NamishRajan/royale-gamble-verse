
import { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface ReactionMiniGameProps {
  difficulty: 'easy' | 'medium' | 'hard';
  onGameEnd: (score: number) => void;
  duration: number;
}

interface Target {
  id: number;
  x: number;
  y: number;
  size: number;
  type: 'regular' | 'bonus' | 'penalty';
}

const ReactionMiniGame = ({ difficulty, onGameEnd, duration }: ReactionMiniGameProps) => {
  const [score, setScore] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(duration);
  const [targets, setTargets] = useState<Target[]>([]);
  const [gameActive, setGameActive] = useState(true);
  const [streak, setStreak] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [clicksMade, setClicksMade] = useState(0);
  const [clicksHit, setClicksHit] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  
  // Set difficulty parameters
  const difficultyParams = {
    easy: {
      targetCount: 1,
      minSize: 40,
      maxSize: 80,
      spawnInterval: 1500,
      bonusChance: 0.1,
      penaltyChance: 0.05
    },
    medium: {
      targetCount: 2,
      minSize: 30,
      maxSize: 60,
      spawnInterval: 1200,
      bonusChance: 0.15,
      penaltyChance: 0.1
    },
    hard: {
      targetCount: 3,
      minSize: 20,
      maxSize: 40,
      spawnInterval: 800,
      bonusChance: 0.2,
      penaltyChance: 0.15
    }
  };
  
  const params = difficultyParams[difficulty];
  
  // Get container size
  useEffect(() => {
    if (containerRef.current) {
      setContainerSize({
        width: containerRef.current.clientWidth,
        height: containerRef.current.clientHeight
      });
    }
    
    const handleResize = () => {
      if (containerRef.current) {
        setContainerSize({
          width: containerRef.current.clientWidth, 
          height: containerRef.current.clientHeight
        });
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Timer
  useEffect(() => {
    if (timeRemaining <= 0) {
      setGameActive(false);
      
      // Calculate final score with accuracy bonus
      const accuracyBonus = Math.floor(score * (accuracy / 100) * 0.2);
      const finalScore = score + accuracyBonus;
      
      onGameEnd(finalScore);
      return;
    }
    
    const timer = setInterval(() => {
      setTimeRemaining(prev => prev - 1);
    }, 1000);
    
    return () => clearInterval(timer);
  }, [timeRemaining, onGameEnd, score, accuracy]);
  
  // Spawn targets
  useEffect(() => {
    if (!gameActive || containerSize.width === 0) return;
    
    const spawnTarget = () => {
      // Generate a random target
      const newTargets = [...targets];
      
      // Remove old targets if we have too many
      while (newTargets.length >= params.targetCount) {
        newTargets.shift();
      }
      
      // Determine target type
      const rand = Math.random();
      let targetType: 'regular' | 'bonus' | 'penalty' = 'regular';
      
      if (rand < params.bonusChance) {
        targetType = 'bonus';
      } else if (rand < params.bonusChance + params.penaltyChance) {
        targetType = 'penalty';
      }
      
      // Generate size based on difficulty
      const size = Math.floor(Math.random() * (params.maxSize - params.minSize)) + params.minSize;
      
      // Ensure target is fully within container
      const x = Math.floor(Math.random() * (containerSize.width - size));
      const y = Math.floor(Math.random() * (containerSize.height - size));
      
      const newTarget: Target = {
        id: Date.now(),
        x,
        y,
        size,
        type: targetType
      };
      
      setTargets([...newTargets, newTarget]);
    };
    
    // Spawn targets at regular intervals
    const interval = setInterval(spawnTarget, params.spawnInterval);
    
    return () => clearInterval(interval);
  }, [targets, gameActive, difficulty, containerSize, params]);
  
  // Handle click on target
  const handleTargetClick = (targetId: number, targetType: 'regular' | 'bonus' | 'penalty') => {
    // Remove the clicked target
    setTargets(prev => prev.filter(target => target.id !== targetId));
    
    // Calculate points based on target type
    let points = 10;
    
    if (targetType === 'bonus') {
      points = 25;
    } else if (targetType === 'penalty') {
      points = -15;
    }
    
    // Apply streak bonus for consecutive hits
    if (points > 0) {
      const newStreak = streak + 1;
      setStreak(newStreak);
      
      // 10% bonus per hit in streak
      const streakMultiplier = 1 + (newStreak * 0.1);
      points = Math.floor(points * streakMultiplier);
    } else {
      setStreak(0);
    }
    
    // Update score
    setScore(prev => prev + points);
    
    // Update accuracy
    setClicksHit(prev => prev + 1);
  };
  
  // Handle miss (click on container but not on target)
  const handleContainerClick = () => {
    setClicksMade(prev => prev + 1);
    setStreak(0);
    
    // Update accuracy
    const newAccuracy = Math.floor((clicksHit / (clicksMade + 1)) * 100);
    setAccuracy(newAccuracy);
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
        <span>Accuracy: {accuracy}%</span>
        {streak > 1 && (
          <span className="gold-text">Streak: {streak}x</span>
        )}
      </div>
      
      {/* Game area */}
      <div 
        ref={containerRef}
        className="bg-gray-900 rounded-lg relative h-64 overflow-hidden cursor-crosshair"
        onClick={handleContainerClick}
      >
        {targets.map(target => (
          <button
            key={target.id}
            className={`absolute rounded-full focus:outline-none transform transition-transform hover:scale-95 ${
              target.type === 'regular' ? 'bg-blue-500 hover:bg-blue-600' :
              target.type === 'bonus' ? 'bg-green-500 hover:bg-green-600' :
              'bg-red-500 hover:bg-red-600'
            }`}
            style={{
              left: `${target.x}px`,
              top: `${target.y}px`,
              width: `${target.size}px`,
              height: `${target.size}px`
            }}
            onClick={(e) => {
              e.stopPropagation();
              handleTargetClick(target.id, target.type);
            }}
          >
            {target.type === 'bonus' ? '+25' : 
             target.type === 'penalty' ? '-15' : ''}
          </button>
        ))}
        
        {!gameActive && (
          <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center">
            <div className="text-center">
              <h3 className="text-xl font-bold">Time's Up!</h3>
              <p>Final Score: {score}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReactionMiniGame;
