
import { Account, Demand } from '@/types';
import { toast } from "sonner";

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
    
    // Instead of throwing, return an error response with empty data
    // This helps prevent null/undefined propagation to components
    return {
      success: false,
      data: [] as unknown as T,
      message: error instanceof Error ? error.message : 'Unknown error occurred'
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
export const fetchDashboardStats = async (): Promise<ApiResponse<any>> => {
  try {
    const response = await apiRequest<any>('/dashboard/stats');
    
    // Ensure essential properties exist to prevent Object.entries errors
    if (response.success && response.data) {
      const baseStats = {
        totalOpportunities: 0,
        opportunitiesByGeo: {},
        opportunitiesByVertical: {},
        demandFulfillment: { mapped: 0, total: 0, percentage: 0 },
        projectStatusBreakdown: {},
        opportunityTrendsByMonth: {},
        totalAccounts: 0,
        totalDemands: 0,
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
      data: {
        totalOpportunities: 0,
        opportunitiesByGeo: {},
        opportunitiesByVertical: {},
        demandFulfillment: { mapped: 0, total: 0, percentage: 0 },
        projectStatusBreakdown: {},
        opportunityTrendsByMonth: {},
        totalAccounts: 0,
        totalDemands: 0,
        accountsByStatus: {},
        demandsByStatus: {},
        accountsByProbability: {},
        demandsByProbability: {},
        accountsByVertical: {},
        accountsByGeo: {},
        demandsByRole: {},
        demandsByLocation: {},
        monthlyDemands: {}
      }, 
      message: "Failed to fetch dashboard stats" 
    };
  }
};
