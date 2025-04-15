
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
  
  // Transform frontend model to backend format for accounts
  if (endpoint.includes('/accounts') && (method === 'POST' || method === 'PUT') && body) {
    // Convert camelCase to snake_case for backend compatibility
    body = {
      client: body.client,
      project: body.project,
      vertical: body.vertical,
      geo: body.geo,
      start_month: body.startMonth,
      revised_start_date: body.revisedStartDate,
      planned_start_date: body.plannedStartDate,
      planned_end_date: body.plannedEndDate,
      probability: body.probability,
      opportunity_status: body.opportunityStatus,
      sow_status: body.sowStatus,
      project_status: body.projectStatus,
      client_partner: body.clientPartner,
      proposal_anchor: body.proposalAnchor,
      delivery_partner: body.deliveryPartner,
      comment: body.comment
    };
    
    console.log("Transformed account data:", body);
  }
  
  // Transform frontend model to backend format for demands
  if (endpoint.includes('/demands') && (method === 'POST' || method === 'PUT') && body) {
    body = {
      account_id: body.accountId,
      project: body.project,
      role: body.role,
      role_code: body.roleCode,
      location: body.location,
      revised: body.revisedStartDate,
      original_start_date: body.originalStartDate,
      allocation_end_date: body.allocationEndDate,
      allocation_percentage: body.allocationPercentage,
      probability: body.probability,
      status: body.status,
      resource_mapped: body.resourceMapped,
      comment: body.comment,
      start_month: body.startMonth
    };
    
    console.log("Transformed demand data:", body);
  }
  
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  };

  try {
    console.log(`Making ${method} request to ${url}`, body ? body : 'No body');
    const response = await fetch(url, options);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const statusCode = response.status;
      const errorMessage = errorData.message || `API request failed: ${statusCode}`;
      console.error(`API Error (${statusCode}):`, errorData);
      throw new Error(errorMessage);
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
    
    toast.warning("Using mock data due to API unavailability");
    
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
    return { success: false, data: mockAccounts, message: "Failed to fetch accounts" };
  }
};

export const addAccountAPI = async (account: Omit<Account, 'id'>): Promise<ApiResponse<Account>> => {
  try {
    const response = await apiRequest<Account>('/accounts', 'POST', account);
    // Transform the response back to frontend format if needed
    return response;
  } catch (error) {
    console.error("Failed to add account:", error);
    const mockAccount = {
      ...account,
      id: `MOCK-${Date.now()}`,
      lastUpdatedBy: "system@example.com",
      updatedOn: new Date().toISOString(),
      addedBy: "system@example.com",
      addedOn: new Date().toISOString()
    } as Account;
    return { success: false, data: mockAccount, message: "Failed to add account, using mock data" };
  }
};

export const updateAccountAPI = async (account: Account): Promise<ApiResponse<Account>> => {
  try {
    return await apiRequest<Account>(`/accounts/${account.id}`, 'PUT', account);
  } catch (error) {
    console.error("Failed to update account:", error);
    return { success: false, data: account, message: "Failed to update account, using existing data" };
  }
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
    return { success: false, data: mockDemands, message: "Failed to fetch demands" };
  }
};

export const addDemandAPI = async (demand: Omit<Demand, 'id' | 'sno'>): Promise<ApiResponse<Demand>> => {
  try {
    return await apiRequest<Demand>('/demands', 'POST', demand);
  } catch (error) {
    console.error("Failed to add demand:", error);
    const mockDemand = {
      ...demand,
      id: `MOCK-${Date.now()}`,
      sno: Math.floor(Math.random() * 1000),
      lastUpdatedBy: "system@example.com",
      updatedOn: new Date().toISOString(),
      addedBy: "system@example.com",
      addedOn: new Date().toISOString()
    } as Demand;
    return { success: false, data: mockDemand, message: "Failed to add demand, using mock data" };
  }
};

export const updateDemandAPI = async (demand: Demand): Promise<ApiResponse<Demand>> => {
  try {
    return await apiRequest<Demand>(`/demands/${demand.id}`, 'PUT', demand);
  } catch (error) {
    console.error("Failed to update demand:", error);
    return { success: false, data: demand, message: "Failed to update demand, using existing data" };
  }
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
      // Create a default dashboard stats object with all required properties
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
      
      // Merge the response data with the base stats to ensure all properties exist
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
