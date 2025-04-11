
import { Account, Demand } from '@/types';
import { mockAccounts, mockDemands } from '@/services/mockData';
import { toast } from "sonner";

// Simulate API latency
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// API Response wrapper
interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

// Error handler
const handleApiError = (error: Error): never => {
  console.error("API Error:", error);
  toast.error(`API Error: ${error.message}`);
  throw error;
}

// Account APIs
export const fetchAccounts = async (): Promise<ApiResponse<Account[]>> => {
  try {
    await delay(500);
    return {
      data: mockAccounts,
      success: true
    };
  } catch (error) {
    return handleApiError(error as Error);
  }
};

export const addAccountAPI = async (account: Omit<Account, 'id'>): Promise<ApiResponse<Account>> => {
  try {
    await delay(500);
    const newAccount = {
      ...account,
      id: Date.now().toString(),
    };
    mockAccounts.push(newAccount as Account);
    toast.success("Account added successfully");
    return {
      data: newAccount as Account,
      success: true,
      message: "Account added successfully"
    };
  } catch (error) {
    return handleApiError(error as Error);
  }
};

export const updateAccountAPI = async (account: Account): Promise<ApiResponse<Account>> => {
  try {
    await delay(500);
    const index = mockAccounts.findIndex(a => a.id === account.id);
    if (index >= 0) {
      mockAccounts[index] = account;
      toast.success("Account updated successfully");
      return {
        data: account,
        success: true,
        message: "Account updated successfully"
      };
    }
    throw new Error('Account not found');
  } catch (error) {
    return handleApiError(error as Error);
  }
};

export const deleteAccountAPI = async (id: string): Promise<ApiResponse<boolean>> => {
  try {
    await delay(500);
    const index = mockAccounts.findIndex(a => a.id === id);
    if (index >= 0) {
      mockAccounts.splice(index, 1);
      toast.success("Account deleted successfully");
      return {
        data: true,
        success: true,
        message: "Account deleted successfully"
      };
    }
    return {
      data: false,
      success: false,
      message: "Account not found"
    };
  } catch (error) {
    return handleApiError(error as Error);
  }
};

// Demand APIs
export const fetchDemands = async (): Promise<ApiResponse<Demand[]>> => {
  try {
    await delay(500);
    return {
      data: mockDemands,
      success: true
    };
  } catch (error) {
    return handleApiError(error as Error);
  }
};

export const addDemandAPI = async (demand: Omit<Demand, 'id'>): Promise<ApiResponse<Demand>> => {
  try {
    await delay(500);
    const newDemand = {
      ...demand,
      id: Date.now().toString(),
      sno: mockDemands.length + 1, // Auto increment
    };
    mockDemands.push(newDemand as Demand);
    toast.success("Demand added successfully");
    return {
      data: newDemand as Demand,
      success: true,
      message: "Demand added successfully"
    };
  } catch (error) {
    return handleApiError(error as Error);
  }
};

export const updateDemandAPI = async (demand: Demand): Promise<ApiResponse<Demand>> => {
  try {
    await delay(500);
    const index = mockDemands.findIndex(d => d.id === demand.id);
    if (index >= 0) {
      mockDemands[index] = demand;
      toast.success("Demand updated successfully");
      return {
        data: demand,
        success: true,
        message: "Demand updated successfully"
      };
    }
    throw new Error('Demand not found');
  } catch (error) {
    return handleApiError(error as Error);
  }
};

export const deleteDemandAPI = async (id: string): Promise<ApiResponse<boolean>> => {
  try {
    await delay(500);
    const index = mockDemands.findIndex(d => d.id === id);
    if (index >= 0) {
      mockDemands.splice(index, 1);
      toast.success("Demand deleted successfully");
      return {
        data: true,
        success: true,
        message: "Demand deleted successfully"
      };
    }
    return {
      data: false,
      success: false,
      message: "Demand not found"
    };
  } catch (error) {
    return handleApiError(error as Error);
  }
};

export const cloneDemandAPI = async (demand: Demand, count: number = 1): Promise<ApiResponse<Demand[]>> => {
  try {
    await delay(500);
    const clones: Demand[] = [];
    
    for (let i = 0; i < count; i++) {
      const clone: Demand = {
        ...demand,
        id: `${Date.now()}-${i}`,
        sno: mockDemands.length + i + 1, // Auto increment
      };
      mockDemands.push(clone);
      clones.push(clone);
    }
    
    toast.success(`${count} demand(s) cloned successfully`);
    return {
      data: clones,
      success: true,
      message: `${count} demand(s) cloned successfully`
    };
  } catch (error) {
    return handleApiError(error as Error);
  }
};

// Additional endpoints that would be needed in a real backend
export const searchAPI = async (query: string, entity: 'accounts' | 'demands'): Promise<ApiResponse<Account[] | Demand[]>> => {
  try {
    await delay(300);
    
    if (entity === 'accounts') {
      const results = mockAccounts.filter(account => 
        Object.values(account).some(value => 
          typeof value === 'string' && value.toLowerCase().includes(query.toLowerCase())
        )
      );
      return {
        data: results,
        success: true
      };
    } else {
      const results = mockDemands.filter(demand => 
        Object.values(demand).some(value => 
          typeof value === 'string' && value.toLowerCase().includes(query.toLowerCase())
        )
      );
      return {
        data: results,
        success: true
      };
    }
  } catch (error) {
    return handleApiError(error as Error);
  }
};

// Stats and metrics API
export const fetchDashboardStats = async (): Promise<ApiResponse<any>> => {
  try {
    await delay(700);
    
    // Calculate various statistics from mock data
    const totalAccounts = mockAccounts.length;
    const totalDemands = mockDemands.length;
    
    // Group by status
    const accountsByStatus = mockAccounts.reduce((acc, account) => {
      const status = account.opportunityStatus;
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const demandsByStatus = mockDemands.reduce((acc, demand) => {
      const status = demand.status;
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return {
      data: {
        totalAccounts,
        totalDemands,
        accountsByStatus,
        demandsByStatus,
        // Add more calculated stats as needed
      },
      success: true
    };
  } catch (error) {
    return handleApiError(error as Error);
  }
};
