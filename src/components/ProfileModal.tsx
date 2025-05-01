
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { DEFAULT_AVATARS, getCurrentUser, updateUserProfile } from "@/utils/authUtils";
import { useToast } from "@/components/ui/use-toast";

interface ProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ProfileModal = ({ open, onOpenChange }: ProfileModalProps) => {
  const [selectedAvatar, setSelectedAvatar] = useState("");
  const [user, setUser] = useState(getCurrentUser());
  const { toast } = useToast();
  
  useEffect(() => {
    if (open && user) {
      setSelectedAvatar(user.profile.avatar);
    }
  }, [open, user]);
  
  const handleUpdateProfile = () => {
    if (selectedAvatar) {
      updateUserProfile({ avatar: selectedAvatar });
      
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });
      
      setUser(getCurrentUser());
      onOpenChange(false);
    }
  };
  
  if (!user) return null;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-casino-secondary">
        <DialogHeader>
          <DialogTitle className="gold-text text-2xl">Edit Profile</DialogTitle>
          <DialogDescription>
            Update your profile settings below.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Current Username</h3>
            <p className="text-lg font-bold">{user.profile.username}</p>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Select Avatar</h3>
            <div className="grid grid-cols-3 gap-3">
              {DEFAULT_AVATARS.map((avatar, index) => (
                <div 
                  key={index}
                  className={`cursor-pointer rounded-full overflow-hidden border-2 transition-all ${
                    selectedAvatar === avatar 
                      ? 'border-casino-secondary scale-110' 
                      : 'border-transparent hover:border-muted-foreground'
                  }`}
                  onClick={() => setSelectedAvatar(avatar)}
                >
                  <img 
                    src={avatar} 
                    alt={`Avatar ${index+1}`} 
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Stats</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center border border-border rounded-md p-2">
                <p className="text-sm text-muted-foreground">Total Games</p>
                <p className="text-lg font-bold">{user.profile.gamesPlayed}</p>
              </div>
              <div className="text-center border border-border rounded-md p-2">
                <p className="text-sm text-muted-foreground">Net Winnings</p>
                <p className={`text-lg font-bold ${user.profile.winnings >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {user.profile.winnings} coins
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end gap-3">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleUpdateProfile}
            className="casino-button"
          >
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileModal;
