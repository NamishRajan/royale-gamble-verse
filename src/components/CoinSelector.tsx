
import { Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { getCurrentUser } from "@/utils/authUtils";
import { useState, useEffect } from "react";

const CoinSelector = () => {
  const [coins, setCoins] = useState(0);
  const navigate = useNavigate();
  
  useEffect(() => {
    const currentUser = getCurrentUser();
    if (currentUser) {
      setCoins(currentUser.profile.coins);
    }
    
    // Update coins every second
    const interval = setInterval(() => {
      const user = getCurrentUser();
      if (user) {
        setCoins(user.profile.coins);
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  const handleGetCoins = () => {
    navigate("/minigames");
  };

  return (
    <div className="flex items-center">
      <Button 
        variant="outline"
        className="bg-gradient-to-r from-yellow-500 to-yellow-300 text-black border-none rounded-r-none rounded-l-md px-3"
        onClick={handleGetCoins}
      >
        <span className="flex items-center">
          <Coins size={18} className="mr-2" />
          {coins.toLocaleString()}
        </span>
      </Button>
      <Button
        variant="default"
        className="bg-green-600 hover:bg-green-700 rounded-l-none rounded-r-md px-3"
        onClick={handleGetCoins}
      >
        Get More
      </Button>
    </div>
  );
};

export default CoinSelector;
