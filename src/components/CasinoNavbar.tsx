
import { Button } from "@/components/ui/button";
import { getCurrentUser, logoutUser } from "@/utils/authUtils";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { useState, useEffect } from "react";
import { Coins, Award, Gift, QrCode, Settings } from "lucide-react";
import CoinSelector from "./CoinSelector";

const CasinoNavbar = () => {
  const [user, setUser] = useState(getCurrentUser());
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Update user data when it changes
    const interval = setInterval(() => {
      const currentUser = getCurrentUser();
      if (JSON.stringify(currentUser) !== JSON.stringify(user)) {
        setUser(currentUser);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [user]);

  const handleLogout = () => {
    logoutUser();
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
    navigate("/");
  };

  if (!user) {
    navigate("/");
    return null;
  }

  return (
    <div className="sticky top-0 z-50 w-full bg-casino-dark border-b border-casino-secondary">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <h1 
            className="text-2xl font-bold text-casino-secondary cursor-pointer" 
            onClick={() => navigate('/dashboard')}
          >
            ROYALE CASINO
          </h1>
        </div>

        <div className="flex items-center space-x-4">
          <CoinSelector />
          
          <div className="flex items-center space-x-3">
            <Button 
              variant="ghost" 
              className="flex flex-col items-center space-y-1"
              onClick={() => navigate('/dashboard')}
            >
              <Award size={20} className="text-casino-secondary" />
              <span className="text-xs">Games</span>
            </Button>
            
            <Button 
              variant="ghost" 
              className="flex flex-col items-center space-y-1"
              onClick={() => navigate('/cashout')}
            >
              <QrCode size={20} className="text-casino-secondary" />
              <span className="text-xs">Cashout</span>
            </Button>
            
            <div className="flex items-center space-x-2">
              <div className="h-10 w-10 rounded-full overflow-hidden border-2 border-casino-secondary">
                <img 
                  src={user.profile.avatar} 
                  alt="Profile" 
                  className="h-full w-full object-cover"
                />
              </div>
              
              <div className="hidden md:block">
                <p className="font-medium text-sm">{user.profile.username}</p>
                <div className="flex items-center text-muted-foreground">
                  <Gift size={14} className="mr-1" />
                  <span className="text-xs">Level 1</span>
                </div>
              </div>
              
              <Button 
                variant="ghost" 
                size="icon"
                onClick={handleLogout}
              >
                <Settings size={20} />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CasinoNavbar;
