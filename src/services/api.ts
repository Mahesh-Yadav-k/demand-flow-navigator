
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
    
    return await response.json();
  } catch (error) {
    return handleApiError(error as Error);
  }
}

// Account APIs
export const fetchAccounts = async (): Promise<ApiResponse<Account[]>> => {
  return apiRequest<Account[]>('/accounts');
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
  return apiRequest<Demand[]>('/demands');
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
  return apiRequest<any>('/dashboard/stats');
};
