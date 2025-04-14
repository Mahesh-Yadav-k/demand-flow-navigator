import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Account, Demand, DashboardKPIs, AccountFilters, DemandFilters, DashboardFilters } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { 
  fetchAccounts, 
  fetchDemands, 
  addAccountAPI, 
  updateAccountAPI, 
  deleteAccountAPI,
  addDemandAPI,
  updateDemandAPI,
  deleteDemandAPI,
  fetchDashboardStats
} from '@/services/api';

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
  const [dashboardKPIs, setDashboardKPIs] = useState<DashboardKPIs>({
    totalAccounts: 0,
    totalDemands: 0,
    activeAccounts: 0,
    activeDemands: 0,
    probableAccounts: 0,
    probableDemands: 0,
    accountsByStatus: {},
    demandsByStatus: {},
    accountsByProbability: {},
    demandsByProbability: {},
    accountsByVertical: {},
    accountsByGeo: {},
    demandsByRole: {},
    demandsByLocation: {},
    monthlyDemands: {}
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { toast } = useToast();

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const accountsResponse = await fetchAccounts();
        if (accountsResponse.success) {
          setAccounts(accountsResponse.data);
        }

        const demandsResponse = await fetchDemands();
        if (demandsResponse.success) {
          setDemands(demandsResponse.data);
        }

        const statsResponse = await fetchDashboardStats();
        if (statsResponse.success) {
          const apiStats = statsResponse.data;
          setDashboardKPIs({
            totalAccounts: apiStats.totalAccounts || 0,
            totalDemands: apiStats.totalDemands || 0,
            activeAccounts: Object.values(apiStats.accountsByStatus || {})
              .reduce((sum: number, count: number) => sum + count, 0),
            activeDemands: Object.values(apiStats.demandsByStatus || {})
              .reduce((sum: number, count: number) => sum + count, 0),
            probableAccounts: accounts.filter(a => a.probability >= 75).length,
            probableDemands: demands.filter(d => d.probability >= 75).length,
            accountsByStatus: apiStats.accountsByStatus || {},
            demandsByStatus: apiStats.demandsByStatus || {},
            accountsByProbability: {},
            demandsByProbability: {},
            accountsByVertical: {},
            accountsByGeo: {},
            demandsByRole: {},
            demandsByLocation: {},
            monthlyDemands: {}
          });
        }
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

  const addAccount = async (accountData: Omit<Account, 'id'>): Promise<Account> => {
    setIsLoading(true);
    try {
      const response = await addAccountAPI(accountData);
      
      if (response.success && response.data) {
        setAccounts(prev => [...prev, response.data]);
        
        toast({
          title: "Account Added",
          description: `Successfully added account for ${response.data.client}.`,
        });
        
        return response.data;
      } else {
        throw new Error(response.message || "Failed to add account");
      }
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
      const response = await updateAccountAPI(account);
      
      if (response.success && response.data) {
        setAccounts(prev => prev.map(a => a.id === account.id ? response.data : a));
        
        toast({
          title: "Account Updated",
          description: `Successfully updated account for ${account.client}.`,
        });
        
        return response.data;
      } else {
        throw new Error(response.message || "Failed to update account");
      }
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
      const linkedDemands = demands.filter(d => d.accountId === id);
      if (linkedDemands.length > 0) {
        toast({
          title: "Cannot Delete Account",
          description: `This account has ${linkedDemands.length} linked demand entries. Remove them first.`,
          variant: "destructive",
        });
        return false;
      }
      
      const response = await deleteAccountAPI(id);
      
      if (response.success && response.data) {
        setAccounts(prev => prev.filter(a => a.id !== id));
        
        toast({
          title: "Account Deleted",
          description: "The account has been successfully deleted.",
        });
        
        return true;
      } else {
        throw new Error(response.message || "Failed to delete account");
      }
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

  const addDemand = async (demandData: Omit<Demand, 'id' | 'sno'>): Promise<Demand> => {
    setIsLoading(true);
    try {
      const response = await addDemandAPI(demandData);
      
      if (response.success && response.data) {
        setDemands(prev => [...prev, response.data]);
        
        toast({
          title: "Demand Added",
          description: `Successfully added demand for ${response.data.role}.`,
        });
        
        return response.data;
      } else {
        throw new Error(response.message || "Failed to add demand");
      }
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
      const response = await updateDemandAPI(demand);
      
      if (response.success && response.data) {
        setDemands(prev => prev.map(d => d.id === demand.id ? response.data : d));
        
        toast({
          title: "Demand Updated",
          description: `Successfully updated demand for ${demand.role}.`,
        });
        
        return response.data;
      } else {
        throw new Error(response.message || "Failed to update demand");
      }
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
      const response = await deleteDemandAPI(id);
      
      if (response.success && response.data) {
        setDemands(prev => prev.filter(d => d.id !== id));
        
        toast({
          title: "Demand Deleted",
          description: "The demand has been successfully deleted.",
        });
        
        return true;
      } else {
        throw new Error(response.message || "Failed to delete demand");
      }
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

  const filterAccounts = (filters: AccountFilters): Account[] => {
    return accounts.filter(account => {
      if (filters.project && filters.project.length > 0 && !filters.project.includes(account.project)) {
        return false;
      }
      
      if (filters.client && filters.client.length > 0 && !filters.client.includes(account.client)) {
        return false;
      }
      
      if (filters.opportunityStatus && filters.opportunityStatus.length > 0 && !filters.opportunityStatus.includes(account.opportunityStatus)) {
        return false;
      }
      
      if (filters.probability && filters.probability.length > 0 && !filters.probability.includes(account.probability)) {
        return false;
      }
      
      if (filters.vertical && filters.vertical.length > 0 && !filters.vertical.includes(account.vertical)) {
        return false;
      }
      
      if (filters.startMonth && filters.startMonth.length > 0 && !filters.startMonth.includes(account.startMonth)) {
        return false;
      }
      
      return true;
    });
  };

  const filterDemands = (filters: DemandFilters): Demand[] => {
    return demands.filter(demand => {
      if (filters.role && filters.role.length > 0 && !filters.role.includes(demand.role)) {
        return false;
      }
      
      if (filters.location && filters.location.length > 0 && !filters.location.includes(demand.location)) {
        return false;
      }
      
      if (filters.probability && filters.probability.length > 0 && !filters.probability.includes(demand.probability)) {
        return false;
      }
      
      if (filters.status && filters.status.length > 0 && !filters.status.includes(demand.status)) {
        return false;
      }
      
      if (filters.startMonth && filters.startMonth.length > 0 && !filters.startMonth.includes(demand.startMonth)) {
        return false;
      }
      
      return true;
    });
  };

  const filterDashboardData = (filters: DashboardFilters): DashboardKPIs => {
    const filteredAccounts = accounts.filter(account => {
      if (filters.geo && filters.geo.length > 0 && !filters.geo.includes(account.geo)) {
        return false;
      }
      
      if (filters.vertical && filters.vertical.length > 0 && !filters.vertical.includes(account.vertical)) {
        return false;
      }
      
      if (filters.startMonth && filters.startMonth.length > 0 && !filters.startMonth.includes(account.startMonth)) {
        return false;
      }
      
      if (filters.opportunityStatus && filters.opportunityStatus.length > 0 && !filters.opportunityStatus.includes(account.opportunityStatus)) {
        return false;
      }
      
      return true;
    });
    
    const filteredAccountIds = filteredAccounts.map(a => a.id);
    
    const filteredDemands = demands.filter(demand => filteredAccountIds.includes(demand.accountId));
    
    return {
      totalAccounts: filteredAccounts.length,
      totalDemands: filteredDemands.length,
      activeAccounts: filteredAccounts.filter(a => a.opportunityStatus === 'Active').length,
      activeDemands: filteredDemands.filter(d => d.status === 'Active').length,
      probableAccounts: filteredAccounts.filter(a => a.probability >= 75).length,
      probableDemands: filteredDemands.filter(d => d.probability >= 75).length,
      
      accountsByStatus: filteredAccounts.reduce((acc, account) => {
        const status = account.opportunityStatus;
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      
      demandsByStatus: filteredDemands.reduce((acc, demand) => {
        const status = demand.status;
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      
      accountsByProbability: filteredAccounts.reduce((acc, account) => {
        const probability = account.probability;
        acc[probability] = (acc[probability] || 0) + 1;
        return acc;
      }, {} as Record<number, number>),
      
      demandsByProbability: filteredDemands.reduce((acc, demand) => {
        const probability = demand.probability;
        acc[probability] = (acc[probability] || 0) + 1;
        return acc;
      }, {} as Record<number, number>),
      
      accountsByVertical: filteredAccounts.reduce((acc, account) => {
        const vertical = account.vertical;
        acc[vertical] = (acc[vertical] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      
      accountsByGeo: filteredAccounts.reduce((acc, account) => {
        const geo = account.geo;
        acc[geo] = (acc[geo] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      
      demandsByRole: filteredDemands.reduce((acc, demand) => {
        const role = demand.role;
        acc[role] = (acc[role] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      
      demandsByLocation: filteredDemands.reduce((acc, demand) => {
        const location = demand.location;
        acc[location] = (acc[location] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      
      monthlyDemands: filteredDemands.reduce((acc, demand) => {
        const month = demand.startMonth;
        acc[month] = (acc[month] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };
  };

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
