
import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MiniGame, calculateReward } from "@/utils/gameUtils";
import { useToast } from "@/components/ui/use-toast";
import { updateCoins } from "@/utils/authUtils";
import { Gamepad } from "lucide-react";
import QuizMiniGame from "./minigames/QuizMiniGame";
import MemoryMiniGame from "./minigames/MemoryMiniGame";
import ReactionMiniGame from "./minigames/ReactionMiniGame";

interface MiniGameCardProps {
  miniGame: MiniGame;
}

const MiniGameCard = ({ miniGame }: MiniGameCardProps) => {
  const { toast } = useToast();
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameComplete, setGameComplete] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-600';
      case 'medium': return 'bg-yellow-600';
      case 'hard': return 'bg-red-600';
      default: return 'bg-blue-600';
    }
  };
  
  const handleGameStart = () => {
    toast({
      title: `Playing ${miniGame.name}`,
      description: `Game starting in 3...2...1...`,
    });
    
    setIsPlaying(true);
    setGameComplete(false);
  };
  
  const handleGameEnd = (score: number) => {
    const reward = calculateReward(score, miniGame);
    updateCoins(reward);
    
    setFinalScore(score);
    setGameComplete(true);
    setIsPlaying(false);
    
    toast({
      title: `${miniGame.name} Completed!`,
      description: `Your score: ${score}. You earned ${reward} coins!`,
    });
  };
  
  const renderMiniGame = () => {
    switch (miniGame.type) {
      case 'quiz':
        return <QuizMiniGame 
          difficulty={miniGame.difficulty}
          onGameEnd={handleGameEnd}
          duration={miniGame.duration}
        />;
      case 'memory':
        return <MemoryMiniGame 
          difficulty={miniGame.difficulty}
          onGameEnd={handleGameEnd}
          duration={miniGame.duration}
        />;
      case 'reaction':
        return <ReactionMiniGame 
          difficulty={miniGame.difficulty}
          onGameEnd={handleGameEnd}
          duration={miniGame.duration}
        />;
      default:
        return <div>Game type not supported</div>;
    }
  };
  
  return (
    <Card className="casino-card h-full flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg gold-text">{miniGame.name}</CardTitle>
          <Badge className={getDifficultyColor(miniGame.difficulty)}>
            {miniGame.difficulty.toUpperCase()}
          </Badge>
        </div>
        <CardDescription>{miniGame.description}</CardDescription>
      </CardHeader>
      
      <CardContent className="flex-grow pb-2">
        {isPlaying ? (
          renderMiniGame()
        ) : (
          <>
            <div className="relative h-40 mb-3 overflow-hidden rounded-md bg-gradient-to-br from-casino-primary to-black">
              <img
                src={miniGame.image}
                alt={miniGame.name}
                className="object-cover w-full h-full opacity-60"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-4xl font-bold text-casino-secondary drop-shadow-lg">
                  {miniGame.type.charAt(0).toUpperCase() + miniGame.type.slice(1)}
                </span>
              </div>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span>Duration: <span className="font-bold">{miniGame.duration}s</span></span>
              <span>Reward: <span className="font-bold">x{miniGame.rewardFactor}</span></span>
            </div>
            
            {gameComplete && (
              <div className="mt-3 bg-muted p-2 rounded text-center">
                <p className="text-sm">Last Score: <span className="font-bold">{finalScore}</span></p>
                <p className="text-xs">Earned: <span className="font-bold gold-text">
                  {calculateReward(finalScore, miniGame)} coins
                </span></p>
              </div>
            )}
          </>
        )}
      </CardContent>
      
      <CardFooter className="pt-2">
        <Button 
          onClick={handleGameStart} 
          className="casino-button w-full"
          disabled={isPlaying}
        >
          {isPlaying ? 'Playing...' : (
            <>
              <Gamepad className="mr-2 h-4 w-4" />
              Play Now
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default MiniGameCard;
