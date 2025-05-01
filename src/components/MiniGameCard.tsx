
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MiniGame, calculateReward } from "@/utils/gameUtils";
import { useToast } from "@/components/ui/use-toast";
import { updateCoins } from "@/utils/authUtils";

interface MiniGameCardProps {
  miniGame: MiniGame;
}

const MiniGameCard = ({ miniGame }: MiniGameCardProps) => {
  const { toast } = useToast();
  
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-600';
      case 'medium': return 'bg-yellow-600';
      case 'hard': return 'bg-red-600';
      default: return 'bg-blue-600';
    }
  };
  
  const handlePlayMiniGame = () => {
    // Simulate playing a mini game and earning a score
    toast({
      title: `Playing ${miniGame.name}`,
      description: `Game starting in 3...2...1...`,
    });
    
    setTimeout(() => {
      // Simulate random score between 50-100 for easy games
      // 30-80 for medium games
      // 10-60 for hard games
      let minScore, maxScore;
      
      switch (miniGame.difficulty) {
        case 'easy':
          minScore = 50;
          maxScore = 100;
          break;
        case 'medium':
          minScore = 30;
          maxScore = 80;
          break;
        case 'hard':
          minScore = 10;
          maxScore = 60;
          break;
        default:
          minScore = 10;
          maxScore = 100;
      }
      
      const score = Math.floor(Math.random() * (maxScore - minScore + 1)) + minScore;
      const reward = calculateReward(score, miniGame);
      
      updateCoins(reward);
      
      toast({
        title: `${miniGame.name} Completed!`,
        description: `Your score: ${score}. You earned ${reward} coins!`,
      });
    }, 1500);
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
      </CardContent>
      <CardFooter className="pt-2">
        <Button onClick={handlePlayMiniGame} className="casino-button w-full">
          Play Now
        </Button>
      </CardFooter>
    </Card>
  );
};

export default MiniGameCard;
