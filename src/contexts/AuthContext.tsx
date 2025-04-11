
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Role, RolePermissions } from '@/types';

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

interface AuthContextType {
  user: User | null;
  hasPermission: (permission: keyof RolePermissions) => boolean;
  isLoading: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Set a default admin user since we're removing authentication
  const defaultUser: User = {
    id: '1',
    email: 'admin@example.com',
    name: 'Admin User',
    role: 'Admin' as Role,
    avatar: 'https://ui-avatars.com/api/?name=Admin+User&background=random',
  };
  
  const [user] = useState<User>(defaultUser);
  const [isLoading] = useState<boolean>(false);

  const hasPermission = (permission: keyof RolePermissions): boolean => {
    if (!user) return false;
    return rolePermissions[user.role][permission];
  };

  const logout = () => {
    // Since we're removing authentication, this is just a placeholder
    console.log('Logout functionality removed as per requirements');
  };

  return (
    <AuthContext.Provider value={{ user, hasPermission, isLoading, logout }}>
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
