
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Role, RolePermissions } from '@/types';
import { useToast } from '@/hooks/use-toast';

// Define the role permissions
const rolePermissions: Record<Role, RolePermissions> = {
  'Admin': {
    canViewDashboard: true,
    canViewAccounts: true,
    canEditAccounts: true,
    canDeleteAccounts: true,
    canAddAccounts: true,
    canViewDemand: true,
    canEditDemand: true,
    canDeleteDemand: true,
    canAddDemand: true,
    canCloneDemand: true,
  },
  'Client Partner': {
    canViewDashboard: true,
    canViewAccounts: true,
    canEditAccounts: true,
    canDeleteAccounts: false,
    canAddAccounts: true,
    canViewDemand: true,
    canEditDemand: true,
    canDeleteDemand: false,
    canAddDemand: true,
    canCloneDemand: true,
  },
  'Delivery Partner': {
    canViewDashboard: true,
    canViewAccounts: true,
    canEditAccounts: false,
    canDeleteAccounts: false,
    canAddAccounts: false,
    canViewDemand: true,
    canEditDemand: true,
    canDeleteDemand: false,
    canAddDemand: false,
    canCloneDemand: false,
  },
  'Read-Only': {
    canViewDashboard: true,
    canViewAccounts: true,
    canEditAccounts: false,
    canDeleteAccounts: false,
    canAddAccounts: false,
    canViewDemand: true,
    canEditDemand: false,
    canDeleteDemand: false,
    canAddDemand: false,
    canCloneDemand: false,
  },
};

// Sample users for the demo
const sampleUsers = [
  {
    id: '1',
    email: 'admin@example.com',
    password: 'password123',
    name: 'Admin User',
    role: 'Admin' as Role,
    avatar: 'https://ui-avatars.com/api/?name=Admin+User&background=random',
  },
  {
    id: '2',
    email: 'client@example.com',
    password: 'password123',
    name: 'Client Partner',
    role: 'Client Partner' as Role,
    avatar: 'https://ui-avatars.com/api/?name=Client+Partner&background=random',
  },
  {
    id: '3', 
    email: 'delivery@example.com',
    password: 'password123',
    name: 'Delivery Partner',
    role: 'Delivery Partner' as Role,
    avatar: 'https://ui-avatars.com/api/?name=Delivery+Partner&background=random',
  },
  {
    id: '4',
    email: 'readonly@example.com',
    password: 'password123',
    name: 'Read Only User',
    role: 'Read-Only' as Role,
    avatar: 'https://ui-avatars.com/api/?name=Read+Only+User&background=random',
  },
];

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  hasPermission: (permission: keyof RolePermissions) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { toast } = useToast();

  useEffect(() => {
    // Check for saved user in localStorage
    const savedUser = localStorage.getItem('dmp_user');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
      } catch (error) {
        console.error('Failed to parse saved user:', error);
        localStorage.removeItem('dmp_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const foundUser = sampleUsers.find(u => u.email === email && u.password === password);
      
      if (foundUser) {
        // Strip the password before saving to state and localStorage
        const { password, ...userWithoutPassword } = foundUser;
        setUser(userWithoutPassword as User);
        localStorage.setItem('dmp_user', JSON.stringify(userWithoutPassword));
        
        toast({
          title: "Login Successful",
          description: `Welcome back, ${userWithoutPassword.name}!`,
        });
        return true;
      } else {
        toast({
          title: "Login Failed",
          description: "Invalid email or password. Please try again.",
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Login Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('dmp_user');
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
  };

  const hasPermission = (permission: keyof RolePermissions): boolean => {
    if (!user) return false;
    return rolePermissions[user.role][permission];
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
