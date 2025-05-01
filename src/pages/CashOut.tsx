
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, isLoggedIn } from '@/utils/authUtils';
import CasinoNavbar from '@/components/CasinoNavbar';
import { Button } from '@/components/ui/button';
import { ArrowLeft, QrCode } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const CashOut = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showQR, setShowQR] = useState(false);
  const [user, setUser] = useState(getCurrentUser());
  const [cashoutAmount, setCashoutAmount] = useState(0);
  
  // Rickroll URL for the QR code
  const rickrollUrl = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
  
  // QR code image (using a third-party service to generate QR)
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(rickrollUrl)}`;

  useEffect(() => {
    if (!isLoggedIn()) {
      navigate('/');
    } else if (user) {
      // Default to cashing out all coins
      setCashoutAmount(user.profile.coins);
    }
  }, [navigate, user]);

  const handleCashout = () => {
    if (!user) return;
    
    if (cashoutAmount <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid amount to cash out.",
        variant: "destructive",
      });
      return;
    }
    
    if (cashoutAmount > user.profile.coins) {
      toast({
        title: "Error",
        description: "You don't have enough coins to cash out this amount.",
        variant: "destructive",
      });
      return;
    }
    
    // Show QR code
    setShowQR(true);
    
    toast({
      title: "Processing Cashout",
      description: "Scan the QR code to complete your cashout.",
    });
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <CasinoNavbar />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header with back button */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <Button 
              variant="outline"
              className="mr-4"
              onClick={() => navigate('/dashboard')}
            >
              <ArrowLeft size={16} className="mr-1" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold gold-text">Cash Out</h1>
              <p className="text-gray-400">Convert your casino coins to real rewards!</p>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-card rounded-lg p-6 border-2 border-casino-secondary">
            <h2 className="text-xl font-bold mb-4">Your Balance</h2>
            
            <div className="flex items-center justify-between mb-6 p-4 bg-muted rounded-lg">
              <span className="text-gray-400">Available Coins:</span>
              <span className="text-2xl font-bold gold-text">{user.profile.coins}</span>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">
                Cashout Amount:
              </label>
              <div className="flex items-center">
                <input 
                  type="number"
                  className="casino-input w-full"
                  min="1"
                  max={user.profile.coins}
                  value={cashoutAmount}
                  onChange={(e) => setCashoutAmount(parseInt(e.target.value) || 0)}
                />
              </div>
              
              <div className="flex justify-between mt-2 text-sm text-gray-400">
                <span>Min: 1</span>
                <span>Max: {user.profile.coins}</span>
              </div>
            </div>
            
            {!showQR && (
              <Button 
                className="casino-button w-full mb-4"
                onClick={handleCashout}
              >
                <QrCode size={16} className="mr-2" />
                Generate Cashout QR
              </Button>
            )}
            
            <p className="text-sm text-gray-400 text-center">
              Cashouts are typically processed within 24 hours.
            </p>
          </div>
          
          <div className="bg-card rounded-lg p-6 border-2 border-casino-secondary">
            {showQR ? (
              <div className="text-center">
                <h2 className="text-xl font-bold mb-4">Scan QR Code to Complete Cashout</h2>
                
                <div className="bg-white p-4 rounded-lg inline-block mb-4">
                  <img 
                    src={qrImageUrl}
                    alt="Cashout QR Code" 
                    className="w-48 h-48"
                  />
                </div>
                
                <p className="text-lg mb-2">
                  Amount: <span className="font-bold gold-text">{cashoutAmount} coins</span>
                </p>
                
                <p className="text-gray-400 text-sm mb-4">
                  Scan this code with your banking app to receive your funds
                </p>
                
                <Button 
                  variant="outline"
                  onClick={() => setShowQR(false)}
                  className="mx-auto"
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <div>
                <h2 className="text-xl font-bold mb-4">Cashout Information</h2>
                
                <div className="space-y-4 text-gray-300">
                  <div className="bg-muted p-4 rounded-lg">
                    <h3 className="font-medium mb-2">Exchange Rate</h3>
                    <p className="text-gray-400">1,000 coins = $1.00 USD</p>
                  </div>
                  
                  <div className="bg-muted p-4 rounded-lg">
                    <h3 className="font-medium mb-2">Processing Time</h3>
                    <p className="text-gray-400">Cashouts are typically processed within 24 hours.</p>
                  </div>
                  
                  <div className="bg-muted p-4 rounded-lg">
                    <h3 className="font-medium mb-2">Cashout Methods</h3>
                    <ul className="list-disc pl-5 text-gray-400">
                      <li>Bank Transfer</li>
                      <li>E-Wallet</li>
                      <li>Cryptocurrency</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <div className="bg-casino-dark py-4 border-t border-casino-secondary mt-8">
        <div className="container mx-auto text-center text-sm text-gray-400">
          <p>&copy; 2025 ROYALE CASINO - All Rights Reserved</p>
          <p className="mt-1">For entertainment purposes only. No real money involved.</p>
        </div>
      </div>
    </div>
  );
};

export default CashOut;
