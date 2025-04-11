
import { Account, Demand } from '@/types';
import { mockAccounts, mockDemands } from '@/services/mockData';

// Simulate API latency
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Account APIs
export const fetchAccounts = async (): Promise<Account[]> => {
  await delay(500);
  return mockAccounts;
};

export const addAccountAPI = async (account: Omit<Account, 'id'>): Promise<Account> => {
  await delay(500);
  const newAccount = {
    ...account,
    id: Date.now().toString(),
  };
  mockAccounts.push(newAccount as Account);
  return newAccount as Account;
};

export const updateAccountAPI = async (account: Account): Promise<Account> => {
  await delay(500);
  const index = mockAccounts.findIndex(a => a.id === account.id);
  if (index >= 0) {
    mockAccounts[index] = account;
    return account;
  }
  throw new Error('Account not found');
};

export const deleteAccountAPI = async (id: string): Promise<boolean> => {
  await delay(500);
  const index = mockAccounts.findIndex(a => a.id === id);
  if (index >= 0) {
    mockAccounts.splice(index, 1);
    return true;
  }
  return false;
};

// Demand APIs
export const fetchDemands = async (): Promise<Demand[]> => {
  await delay(500);
  return mockDemands;
};

export const addDemandAPI = async (demand: Omit<Demand, 'id'>): Promise<Demand> => {
  await delay(500);
  const newDemand = {
    ...demand,
    id: Date.now().toString(),
  };
  mockDemands.push(newDemand as Demand);
  return newDemand as Demand;
};

export const updateDemandAPI = async (demand: Demand): Promise<Demand> => {
  await delay(500);
  const index = mockDemands.findIndex(d => d.id === demand.id);
  if (index >= 0) {
    mockDemands[index] = demand;
    return demand;
  }
  throw new Error('Demand not found');
};

export const deleteDemandAPI = async (id: string): Promise<boolean> => {
  await delay(500);
  const index = mockDemands.findIndex(d => d.id === id);
  if (index >= 0) {
    mockDemands.splice(index, 1);
    return true;
  }
  return false;
};

export const cloneDemandAPI = async (demand: Demand, count: number = 1): Promise<Demand[]> => {
  await delay(500);
  const clones: Demand[] = [];
  
  for (let i = 0; i < count; i++) {
    const clone: Demand = {
      ...demand,
      id: `${Date.now()}-${i}`,
    };
    mockDemands.push(clone);
    clones.push(clone);
  }
  
  return clones;
};
