
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Account, Demand, DashboardKPIs, AccountFilters, DemandFilters, DashboardFilters } from '@/types';
import { mockAccounts, mockDemands, mockDashboardKPIs, calculateDashboardKPIs } from '@/services/mockData';
import { useToast } from '@/hooks/use-toast';

interface DataContextType {
  accounts: Account[];
  demands: Demand[];
  dashboardKPIs: DashboardKPIs;
  addAccount: (account: Omit<Account, 'id'>) => Promise<Account>;
  updateAccount: (account: Account) => Promise<Account>;
  deleteAccount: (id: string) => Promise<boolean>;
  addDemand: (demand: Omit<Demand, 'id' | 'sno'>) => Promise<Demand>;
  updateDemand: (demand: Demand) => Promise<Demand>;
  deleteDemand: (id: string) => Promise<boolean>;
  filterAccounts: (filters: AccountFilters) => Account[];
  filterDemands: (filters: DemandFilters) => Demand[];
  filterDashboardData: (filters: DashboardFilters) => DashboardKPIs;
  getAccountById: (id: string) => Account | undefined;
  getDemandById: (id: string) => Demand | undefined;
  getDemandsByAccountId: (accountId: string) => Demand[];
  isLoading: boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [demands, setDemands] = useState<Demand[]>([]);
  const [dashboardKPIs, setDashboardKPIs] = useState<DashboardKPIs>(mockDashboardKPIs);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { toast } = useToast();

  useEffect(() => {
    // Load initial data
    setIsLoading(true);
    const loadData = async () => {
      try {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Set state with mock data
        setAccounts(mockAccounts);
        setDemands(mockDemands);
        setDashboardKPIs(mockDashboardKPIs);
      } catch (error) {
        console.error('Error loading data:', error);
        toast({
          title: "Data Loading Error",
          description: "Failed to load application data. Please refresh the page.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [toast]);

  // Recalculate dashboard KPIs whenever accounts or demands change
  useEffect(() => {
    if (accounts.length > 0 && demands.length > 0) {
      setDashboardKPIs(calculateDashboardKPIs(accounts, demands));
    }
  }, [accounts, demands]);

  // CRUD operations for accounts
  const addAccount = async (accountData: Omit<Account, 'id'>): Promise<Account> => {
    setIsLoading(true);
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const newAccount: Account = {
        ...accountData,
        id: `acc-${accounts.length + 1}`,
      };
      
      setAccounts(prev => [...prev, newAccount]);
      
      toast({
        title: "Account Added",
        description: `Successfully added account for ${newAccount.client}.`,
      });
      
      return newAccount;
    } catch (error) {
      console.error('Error adding account:', error);
      toast({
        title: "Error",
        description: "Failed to add account. Please try again.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateAccount = async (account: Account): Promise<Account> => {
    setIsLoading(true);
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setAccounts(prev => prev.map(a => a.id === account.id ? account : a));
      
      toast({
        title: "Account Updated",
        description: `Successfully updated account for ${account.client}.`,
      });
      
      return account;
    } catch (error) {
      console.error('Error updating account:', error);
      toast({
        title: "Error",
        description: "Failed to update account. Please try again.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteAccount = async (id: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Check if there are any demands linked to this account
      const linkedDemands = demands.filter(d => d.accountId === id);
      if (linkedDemands.length > 0) {
        toast({
          title: "Cannot Delete Account",
          description: `This account has ${linkedDemands.length} linked demand entries. Remove them first.`,
          variant: "destructive",
        });
        return false;
      }
      
      setAccounts(prev => prev.filter(a => a.id !== id));
      
      toast({
        title: "Account Deleted",
        description: "The account has been successfully deleted.",
      });
      
      return true;
    } catch (error) {
      console.error('Error deleting account:', error);
      toast({
        title: "Error",
        description: "Failed to delete account. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // CRUD operations for demands
  const addDemand = async (demandData: Omit<Demand, 'id' | 'sno'>): Promise<Demand> => {
    setIsLoading(true);
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const newDemand: Demand = {
        ...demandData,
        id: `dem-${demands.length + 1}`,
        sno: demands.length + 1,
      };
      
      setDemands(prev => [...prev, newDemand]);
      
      toast({
        title: "Demand Added",
        description: `Successfully added demand for ${newDemand.role}.`,
      });
      
      return newDemand;
    } catch (error) {
      console.error('Error adding demand:', error);
      toast({
        title: "Error",
        description: "Failed to add demand. Please try again.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateDemand = async (demand: Demand): Promise<Demand> => {
    setIsLoading(true);
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setDemands(prev => prev.map(d => d.id === demand.id ? demand : d));
      
      toast({
        title: "Demand Updated",
        description: `Successfully updated demand for ${demand.role}.`,
      });
      
      return demand;
    } catch (error) {
      console.error('Error updating demand:', error);
      toast({
        title: "Error",
        description: "Failed to update demand. Please try again.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteDemand = async (id: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setDemands(prev => prev.filter(d => d.id !== id));
      
      toast({
        title: "Demand Deleted",
        description: "The demand has been successfully deleted.",
      });
      
      return true;
    } catch (error) {
      console.error('Error deleting demand:', error);
      toast({
        title: "Error",
        description: "Failed to delete demand. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Filter operations
  const filterAccounts = (filters: AccountFilters): Account[] => {
    return accounts.filter(account => {
      // Project filter
      if (filters.project && filters.project.length > 0 && !filters.project.includes(account.project)) {
        return false;
      }
      
      // Client filter
      if (filters.client && filters.client.length > 0 && !filters.client.includes(account.client)) {
        return false;
      }
      
      // Status filter
      if (filters.opportunityStatus && filters.opportunityStatus.length > 0 && !filters.opportunityStatus.includes(account.opportunityStatus)) {
        return false;
      }
      
      // Probability filter
      if (filters.probability && filters.probability.length > 0 && !filters.probability.includes(account.probability)) {
        return false;
      }
      
      // Vertical filter
      if (filters.vertical && filters.vertical.length > 0 && !filters.vertical.includes(account.vertical)) {
        return false;
      }
      
      // Start Month filter
      if (filters.startMonth && filters.startMonth.length > 0 && !filters.startMonth.includes(account.startMonth)) {
        return false;
      }
      
      return true;
    });
  };

  const filterDemands = (filters: DemandFilters): Demand[] => {
    return demands.filter(demand => {
      // Role filter
      if (filters.role && filters.role.length > 0 && !filters.role.includes(demand.role)) {
        return false;
      }
      
      // Location filter
      if (filters.location && filters.location.length > 0 && !filters.location.includes(demand.location)) {
        return false;
      }
      
      // Probability filter
      if (filters.probability && filters.probability.length > 0 && !filters.probability.includes(demand.probability)) {
        return false;
      }
      
      // Status filter
      if (filters.status && filters.status.length > 0 && !filters.status.includes(demand.status)) {
        return false;
      }
      
      // Start Month filter
      if (filters.startMonth && filters.startMonth.length > 0 && !filters.startMonth.includes(demand.startMonth)) {
        return false;
      }
      
      return true;
    });
  };

  const filterDashboardData = (filters: DashboardFilters): DashboardKPIs => {
    // Filter accounts based on dashboard filters
    const filteredAccounts = accounts.filter(account => {
      // Geo filter
      if (filters.geo && filters.geo.length > 0 && !filters.geo.includes(account.geo)) {
        return false;
      }
      
      // Vertical filter
      if (filters.vertical && filters.vertical.length > 0 && !filters.vertical.includes(account.vertical)) {
        return false;
      }
      
      // Start Month filter
      if (filters.startMonth && filters.startMonth.length > 0 && !filters.startMonth.includes(account.startMonth)) {
        return false;
      }
      
      // Opportunity Status filter
      if (filters.opportunityStatus && filters.opportunityStatus.length > 0 && !filters.opportunityStatus.includes(account.opportunityStatus)) {
        return false;
      }
      
      return true;
    });
    
    // Get account IDs after filtering
    const filteredAccountIds = filteredAccounts.map(a => a.id);
    
    // Filter demands based on filtered accounts
    const filteredDemands = demands.filter(demand => filteredAccountIds.includes(demand.accountId));
    
    // Recalculate KPIs with filtered data
    return calculateDashboardKPIs(filteredAccounts, filteredDemands);
  };

  // Lookup operations
  const getAccountById = (id: string): Account | undefined => {
    return accounts.find(a => a.id === id);
  };

  const getDemandById = (id: string): Demand | undefined => {
    return demands.find(d => d.id === id);
  };

  const getDemandsByAccountId = (accountId: string): Demand[] => {
    return demands.filter(d => d.accountId === accountId);
  };

  return (
    <DataContext.Provider
      value={{
        accounts,
        demands,
        dashboardKPIs,
        addAccount,
        updateAccount,
        deleteAccount,
        addDemand,
        updateDemand,
        deleteDemand,
        filterAccounts,
        filterDemands,
        filterDashboardData,
        getAccountById,
        getDemandById,
        getDemandsByAccountId,
        isLoading,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
