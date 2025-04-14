import { Account, Demand } from '@/types';
import { mockAccounts, mockDemands } from '@/services/mockData';
import { toast } from "sonner";

// Simulate API latency
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// API base URL - would point to your FastAPI backend
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

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

// Generic API request handler with error handling and mock fallback
async function apiRequest<T>(
  endpoint: string, 
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  body?: any,
  mockResponse?: () => Promise<ApiResponse<T>>
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`;
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  };

  try {
    // If we're in a development environment with no backend, use the mock data
    if (!import.meta.env.VITE_USE_REAL_API || import.meta.env.VITE_USE_REAL_API === 'false') {
      console.log(`Using mock data for ${method} ${endpoint}`);
      if (mockResponse) {
        return await mockResponse();
      }
      throw new Error('No mock response provided');
    }

    // Otherwise make a real API request
    const response = await fetch(url, options);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `API request failed: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    if (mockResponse) {
      console.warn(`Real API request failed, falling back to mock data`, error);
      return await mockResponse();
    }
    return handleApiError(error as Error);
  }
}

// Account APIs
export const fetchAccounts = async (): Promise<ApiResponse<Account[]>> => {
  return apiRequest<Account[]>(
    '/accounts', 
    'GET',
    undefined,
    async () => {
      await delay(500);
      return {
        data: mockAccounts,
        success: true
      };
    }
  );
};

export const addAccountAPI = async (account: Omit<Account, 'id'>): Promise<ApiResponse<Account>> => {
  return apiRequest<Account>(
    '/accounts', 
    'POST',
    account,
    async () => {
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
    }
  );
};

export const updateAccountAPI = async (account: Account): Promise<ApiResponse<Account>> => {
  return apiRequest<Account>(
    `/accounts/${account.id}`, 
    'PUT',
    account,
    async () => {
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
    }
  );
};

export const deleteAccountAPI = async (id: string): Promise<ApiResponse<boolean>> => {
  return apiRequest<boolean>(
    `/accounts/${id}`, 
    'DELETE',
    undefined,
    async () => {
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
    }
  );
};

// Demand APIs
export const fetchDemands = async (): Promise<ApiResponse<Demand[]>> => {
  return apiRequest<Demand[]>(
    '/demands', 
    'GET',
    undefined,
    async () => {
      await delay(500);
      return {
        data: mockDemands,
        success: true
      };
    }
  );
};

export const addDemandAPI = async (demand: Omit<Demand, 'id'>): Promise<ApiResponse<Demand>> => {
  return apiRequest<Demand>(
    '/demands', 
    'POST',
    demand,
    async () => {
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
    }
  );
};

export const updateDemandAPI = async (demand: Demand): Promise<ApiResponse<Demand>> => {
  return apiRequest<Demand>(
    `/demands/${demand.id}`, 
    'PUT',
    demand,
    async () => {
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
    }
  );
};

export const deleteDemandAPI = async (id: string): Promise<ApiResponse<boolean>> => {
  return apiRequest<boolean>(
    `/demands/${id}`, 
    'DELETE',
    undefined,
    async () => {
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
    }
  );
};

export const cloneDemandAPI = async (demand: Demand, count: number = 1): Promise<ApiResponse<Demand[]>> => {
  return apiRequest<Demand[]>(
    `/demands/${demand.id}/clone`, 
    'POST',
    { count },
    async () => {
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
    }
  );
};

// Additional endpoints that would be needed in a real backend
export const searchAPI = async (query: string, entity: 'accounts' | 'demands'): Promise<ApiResponse<Account[] | Demand[]>> => {
  return apiRequest<Account[] | Demand[]>(
    `/search?query=${encodeURIComponent(query)}&entity=${entity}`, 
    'GET',
    undefined,
    async () => {
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
    }
  );
};

// Stats and metrics API
export const fetchDashboardStats = async (): Promise<ApiResponse<any>> => {
  return apiRequest<any>(
    '/dashboard/stats', 
    'GET',
    undefined,
    async () => {
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
    }
  );
};
