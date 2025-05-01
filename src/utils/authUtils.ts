
interface UserProfile {
  username: string;
  avatar: string;
  coins: number;
  gamesPlayed: number;
  winnings: number;
  createdAt: number;
}

interface User {
  username: string;
  password: string;
  profile: UserProfile;
}

// Local storage keys
const USERS_KEY = 'royale_casino_users';
const CURRENT_USER_KEY = 'royale_casino_current_user';

// Get all users from local storage
export const getUsers = (): User[] => {
  const users = localStorage.getItem(USERS_KEY);
  return users ? JSON.parse(users) : [];
};

// Save users to local storage
export const saveUsers = (users: User[]) => {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

// Register a new user
export const registerUser = (username: string, password: string, avatar: string): boolean => {
  const users = getUsers();
  
  // Check if username already exists
  if (users.some(user => user.username === username)) {
    return false;
  }
  
  // Create new user with default profile
  const newUser: User = {
    username,
    password,
    profile: {
      username,
      avatar,
      coins: 1000, // Starting coins
      gamesPlayed: 0,
      winnings: 0,
      createdAt: Date.now()
    }
  };
  
  users.push(newUser);
  saveUsers(users);
  
  // Set as current user
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(newUser));
  
  return true;
};

// Login a user
export const loginUser = (username: string, password: string): boolean => {
  const users = getUsers();
  const user = users.find(user => user.username === username && user.password === password);
  
  if (user) {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    return true;
  }
  
  return false;
};

// Get current logged in user
export const getCurrentUser = (): User | null => {
  const currentUser = localStorage.getItem(CURRENT_USER_KEY);
  return currentUser ? JSON.parse(currentUser) : null;
};

// Check if user is logged in
export const isLoggedIn = (): boolean => {
  return getCurrentUser() !== null;
};

// Logout current user
export const logoutUser = (): void => {
  localStorage.removeItem(CURRENT_USER_KEY);
};

// Update user profile
export const updateUserProfile = (updatedProfile: Partial<UserProfile>): void => {
  const currentUser = getCurrentUser();
  
  if (currentUser) {
    const users = getUsers();
    const userIndex = users.findIndex(user => user.username === currentUser.username);
    
    if (userIndex !== -1) {
      // Update profile
      users[userIndex].profile = {
        ...users[userIndex].profile,
        ...updatedProfile
      };
      
      // Update in storage
      saveUsers(users);
      
      // Update current user
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(users[userIndex]));
    }
  }
};

// Update user coins
export const updateCoins = (amount: number): void => {
  const currentUser = getCurrentUser();
  
  if (currentUser) {
    updateUserProfile({ 
      coins: Math.max(0, currentUser.profile.coins + amount) 
    });
  }
};

// Default avatars
export const DEFAULT_AVATARS = [
  'https://api.dicebear.com/7.x/personas/svg?seed=Felix',
  'https://api.dicebear.com/7.x/personas/svg?seed=Aneka',
  'https://api.dicebear.com/7.x/personas/svg?seed=Zoe',
  'https://api.dicebear.com/7.x/personas/svg?seed=Alex',
  'https://api.dicebear.com/7.x/personas/svg?seed=Mia',
  'https://api.dicebear.com/7.x/personas/svg?seed=Jack',
];
