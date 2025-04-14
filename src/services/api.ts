import { Account, Demand, DashboardKPIs } from '@/types';
import { toast } from "sonner";
import { mockAccounts, mockDemands, mockDashboardKPIs } from './mockData';

// API base URL - would point to your FastAPI backend
const API_BASE_URL = 'http://localhost:8000/api';

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

// Generic API request handler with error handling
async function apiRequest<T>(
  endpoint: string, 
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  body?: any
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
    const response = await fetch(url, options);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `API request failed: ${response.status}`);
    }
    
    const jsonResponse = await response.json();
    return {
      success: true,
      data: jsonResponse.data || jsonResponse,
      message: jsonResponse.message
    };
  } catch (error) {
    console.error("API Error:", error);
    
    // Fall back to mock data if API is unavailable
    let mockData: any;
    if (endpoint.includes('/accounts')) {
      mockData = mockAccounts;
    } else if (endpoint.includes('/demands')) {
      mockData = mockDemands;
    } else if (endpoint.includes('/dashboard/stats')) {
      mockData = mockDashboardKPIs;
    } else {
      mockData = [] as unknown as T;
    }
    
    return {
      success: false,
      data: mockData as T,
      message: error instanceof Error ? error.message : 'Using mock data due to API unavailability'
    };
  }
}

// Account APIs
export const fetchAccounts = async (): Promise<ApiResponse<Account[]>> => {
  try {
    return await apiRequest<Account[]>('/accounts');
  } catch (error) {
    console.error("Failed to fetch accounts:", error);
    return { success: false, data: [], message: "Failed to fetch accounts" };
  }
};

export const addAccountAPI = async (account: Omit<Account, 'id'>): Promise<ApiResponse<Account>> => {
  return apiRequest<Account>('/accounts', 'POST', account);
};

export const updateAccountAPI = async (account: Account): Promise<ApiResponse<Account>> => {
  return apiRequest<Account>(`/accounts/${account.id}`, 'PUT', account);
};

export const deleteAccountAPI = async (id: string): Promise<ApiResponse<boolean>> => {
  return apiRequest<boolean>(`/accounts/${id}`, 'DELETE');
};

// Demand APIs
export const fetchDemands = async (): Promise<ApiResponse<Demand[]>> => {
  try {
    return await apiRequest<Demand[]>('/demands');
  } catch (error) {
    console.error("Failed to fetch demands:", error);
    return { success: false, data: [], message: "Failed to fetch demands" };
  }
};

export const addDemandAPI = async (demand: Omit<Demand, 'id' | 'sno'>): Promise<ApiResponse<Demand>> => {
  return apiRequest<Demand>('/demands', 'POST', demand);
};

export const updateDemandAPI = async (demand: Demand): Promise<ApiResponse<Demand>> => {
  return apiRequest<Demand>(`/demands/${demand.id}`, 'PUT', demand);
};

export const deleteDemandAPI = async (id: string): Promise<ApiResponse<boolean>> => {
  return apiRequest<boolean>(`/demands/${id}`, 'DELETE');
};

export const cloneDemandAPI = async (demand: Demand, count: number = 1): Promise<ApiResponse<Demand[]>> => {
  return apiRequest<Demand[]>(`/demands/${demand.id}/clone`, 'POST', { count });
};

// Search API
export const searchAPI = async (query: string, entity: 'accounts' | 'demands'): Promise<ApiResponse<Account[] | Demand[]>> => {
  return apiRequest<Account[] | Demand[]>(`/search?query=${encodeURIComponent(query)}&entity=${entity}`);
};

// Stats and metrics API
export const fetchDashboardStats = async (): Promise<ApiResponse<DashboardKPIs>> => {
  try {
    const response = await apiRequest<DashboardKPIs>('/dashboard/stats');
    
    // Ensure essential properties exist to prevent Object.entries errors
    if (response.success && response.data) {
      const baseStats: DashboardKPIs = {
        totalOpportunities: 0,
        opportunitiesByGeo: {},
        opportunitiesByVertical: {},
        demandFulfillment: { mapped: 0, total: 0, percentage: 0 },
        projectStatusBreakdown: {},
        opportunityTrendsByMonth: {},
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
      };
      
      return {
        ...response,
        data: { ...baseStats, ...response.data }
      };
    }
    
    return response;
  } catch (error) {
    console.error("Failed to fetch dashboard stats:", error);
    // Return a default object with empty objects for properties that use Object.entries
    return { 
      success: false, 
      data: mockDashboardKPIs,
      message: "Failed to fetch dashboard stats, using mock data" 
    };
  }
};
