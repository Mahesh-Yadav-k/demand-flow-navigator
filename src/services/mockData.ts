
import { Account, Demand, DashboardKPIs, OpportunityStatus, SOWStatus, ProjectStatus, DemandStatus } from '@/types';

// Helper function to generate a random date within a range
const randomDate = (start: Date, end: Date): string => {
  const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  return date.toISOString().split('T')[0];
};

// Helper function to pick a random item from an array
const randomItem = <T>(array: T[]): T => {
  return array[Math.floor(Math.random() * array.length)];
};

// Generate mock accounts
export const generateMockAccounts = (count: number = 20): Account[] => {
  const clients = ['Acme Corp', 'TechGiant', 'InnoSystems', 'GlobalFinance', 'MegaRetail', 'HealthPlus'];
  const verticals = ['Finance', 'Healthcare', 'Retail', 'Technology', 'Manufacturing', 'Energy'];
  const geos = ['APAC', 'EMEA', 'NA', 'LATAM'];
  const opportunityStatuses: OpportunityStatus[] = ['New', 'Qualified', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'];
  const sowStatuses: SOWStatus[] = ['Draft', 'In Review', 'Approved', 'Signed', 'Not Started'];
  const projectStatuses: ProjectStatus[] = ['Not Started', 'In Progress', 'On Hold', 'Completed', 'Cancelled'];
  const partners = ['John Smith', 'Emma Johnson', 'Michael Brown', 'Sarah Davis', 'Robert Wilson'];
  
  const accounts: Account[] = [];
  
  for (let i = 0; i < count; i++) {
    const today = new Date();
    const client = randomItem(clients);
    const project = `${client} ${randomItem(['Transformation', 'Upgrade', 'Implementation', 'Migration'])}`; 
    const startDate = randomDate(new Date(2023, 0, 1), new Date(2024, 11, 31));
    const startMonth = new Date(startDate).toLocaleString('default', { month: 'short' }) + ' ' + new Date(startDate).getFullYear();
    
    accounts.push({
      id: `acc-${i + 1}`,
      opptyId: `OPP-${100000 + i}`,
      client,
      project,
      vertical: randomItem(verticals),
      geo: randomItem(geos),
      startMonth,
      revisedStartDate: randomDate(new Date(startDate), new Date(new Date(startDate).setMonth(new Date(startDate).getMonth() + 1))),
      plannedStartDate: startDate,
      plannedEndDate: randomDate(new Date(startDate).setMonth(new Date(startDate).getMonth() + 3), new Date(startDate).setMonth(new Date(startDate).getMonth() + 12)),
      probability: randomItem([10, 20, 30, 50, 70, 90, 100]),
      opportunityStatus: randomItem(opportunityStatuses),
      sowStatus: randomItem(sowStatuses),
      projectStatus: randomItem(projectStatuses),
      clientPartner: randomItem(partners),
      proposalAnchor: randomItem(partners),
      deliveryPartner: randomItem(partners),
      comment: Math.random() > 0.7 ? `Comment for opportunity ${i + 1}` : undefined,
      lastUpdatedBy: randomItem(partners),
      updatedOn: randomDate(new Date(2023, 6, 1), today).toString(),
      addedBy: randomItem(partners),
      addedOn: randomDate(new Date(2023, 0, 1), new Date(2023, 6, 1)).toString(),
    });
  }
  
  return accounts;
};

// Generate mock demand entries linked to accounts
export const generateMockDemand = (accounts: Account[], count: number = 50): Demand[] => {
  const roles = ['Software Engineer', 'Project Manager', 'Business Analyst', 'UX Designer', 'DevOps Engineer', 'Data Scientist', 'QA Engineer'];
  const roleCodes = ['SE', 'PM', 'BA', 'UX', 'DO', 'DS', 'QA'];
  const locations = ['Remote', 'Onsite', 'Hybrid'];
  const statuses: DemandStatus[] = ['Open', 'In Progress', 'Fulfilled', 'Cancelled'];
  const resources = ['Unassigned', 'Alice Chen', 'Bob Taylor', 'Carlos Rodriguez', 'Diana Kim', 'Ethan Wright'];
  
  const demands: Demand[] = [];
  
  for (let i = 0; i < count; i++) {
    const account = randomItem(accounts);
    const roleIndex = Math.floor(Math.random() * roles.length);
    const role = roles[roleIndex];
    const roleCode = roleCodes[roleIndex];
    const today = new Date();
    const status = randomItem(statuses);
    const resourceMapped = status === 'Fulfilled' ? randomItem(resources.filter(r => r !== 'Unassigned')) : (Math.random() > 0.7 ? randomItem(resources) : 'Unassigned');
    
    demands.push({
      id: `dem-${i + 1}`,
      sno: i + 1,
      accountId: account.id,
      project: account.project,
      role,
      roleCode,
      location: randomItem(locations),
      revisedStartDate: account.revisedStartDate,
      originalStartDate: account.plannedStartDate,
      allocationEndDate: account.plannedEndDate,
      allocationPercentage: randomItem([25, 50, 75, 100]),
      probability: account.probability,
      status,
      resourceMapped,
      comment: Math.random() > 0.7 ? `Notes for ${role} role` : undefined,
      lastUpdatedBy: account.lastUpdatedBy,
      updatedOn: randomDate(new Date(2023, 6, 1), today).toString(),
      addedBy: account.addedBy,
      addedOn: account.addedOn,
      startMonth: account.startMonth
    });
  }
  
  return demands;
};

// Calculate dashboard KPIs based on account and demand data
export const calculateDashboardKPIs = (accounts: Account[], demands: Demand[]): DashboardKPIs => {
  // Total opportunities
  const totalOpportunities = accounts.length;
  
  // Opportunities by Geo
  const opportunitiesByGeo = accounts.reduce((acc, account) => {
    acc[account.geo] = (acc[account.geo] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  // Opportunities by Vertical
  const opportunitiesByVertical = accounts.reduce((acc, account) => {
    acc[account.vertical] = (acc[account.vertical] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  // Demand Fulfillment
  const totalDemand = demands.length;
  const mappedDemand = demands.filter(d => d.resourceMapped && d.resourceMapped !== 'Unassigned').length;
  const demandFulfillmentPercentage = totalDemand ? Math.round((mappedDemand / totalDemand) * 100) : 0;
  
  // Project Status Breakdown
  const projectStatusBreakdown = accounts.reduce((acc, account) => {
    acc[account.projectStatus] = (acc[account.projectStatus] || 0) + 1;
    return acc;
  }, {} as Record<ProjectStatus, number>);
  
  // Opportunity Trends by Start Month
  const opportunityTrendsByMonth = accounts.reduce((acc, account) => {
    acc[account.startMonth] = (acc[account.startMonth] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  return {
    totalOpportunities,
    opportunitiesByGeo,
    opportunitiesByVertical,
    demandFulfillment: {
      mapped: mappedDemand,
      total: totalDemand,
      percentage: demandFulfillmentPercentage
    },
    projectStatusBreakdown,
    opportunityTrendsByMonth
  };
};

// Initial data generation
export const mockAccounts = generateMockAccounts();
export const mockDemands = generateMockDemand(mockAccounts);
export const mockDashboardKPIs = calculateDashboardKPIs(mockAccounts, mockDemands);
