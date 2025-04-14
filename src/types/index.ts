
export type User = {
  id: string;
  email: string;
  name: string;
  role: Role;
  avatar?: string;
};

export type Role = 'Admin' | 'Client Partner' | 'Delivery Partner' | 'Read-Only';

export type RolePermissions = {
  canViewDashboard: boolean;
  canViewAccounts: boolean;
  canEditAccounts: boolean;
  canDeleteAccounts: boolean;
  canAddAccounts: boolean;
  canViewDemand: boolean;
  canEditDemand: boolean;
  canDeleteDemand: boolean;
  canAddDemand: boolean;
  canCloneDemand: boolean;
};

export type Account = {
  id: string;
  opptyId: string;
  client: string;
  project: string;
  vertical: string;
  geo: string;
  startMonth: string;
  revisedStartDate: string;
  plannedStartDate: string;
  plannedEndDate: string;
  probability: number;
  opportunityStatus: OpportunityStatus;
  sowStatus: SOWStatus;
  projectStatus: ProjectStatus;
  clientPartner: string;
  proposalAnchor: string;
  deliveryPartner: string;
  comment?: string;
  lastUpdatedBy: string;
  updatedOn: string;
  addedBy: string;
  addedOn: string;
};

export type Demand = {
  id: string;
  sno: number;
  accountId: string;
  project: string;
  role: string;
  roleCode: string;
  location: string;
  revisedStartDate: string;
  originalStartDate: string;
  allocationEndDate: string;
  allocationPercentage: number;
  probability: number;
  status: DemandStatus;
  resourceMapped?: string;
  comment?: string;
  lastUpdatedBy: string;
  updatedOn: string;
  addedBy: string;
  addedOn: string;
  startMonth: string;
};

export type OpportunityStatus = 'New' | 'Qualified' | 'Proposal' | 'Negotiation' | 'Closed Won' | 'Closed Lost';
export type SOWStatus = 'Draft' | 'In Review' | 'Approved' | 'Signed' | 'Not Started';
export type ProjectStatus = 'Not Started' | 'In Progress' | 'On Hold' | 'Completed' | 'Cancelled';
export type DemandStatus = 'Open' | 'In Progress' | 'Fulfilled' | 'Cancelled';

export type DashboardFilters = {
  geo?: string[];
  vertical?: string[];
  startMonth?: string[];
  opportunityStatus?: OpportunityStatus[];
};

export type AccountFilters = {
  project?: string[];
  client?: string[];
  opportunityStatus?: OpportunityStatus[];
  probability?: number[];
  vertical?: string[];
  startMonth?: string[];
  sowStatus?: SOWStatus[];
  account?: string[];
};

export type DemandFilters = {
  role?: string[];
  location?: string[];
  probability?: number[];
  status?: DemandStatus[];
  startMonth?: string[];
  account?: string[];
};

export type DashboardKPIs = {
  totalOpportunities: number;
  opportunitiesByGeo: Record<string, number>;
  opportunitiesByVertical: Record<string, number>;
  demandFulfillment: {
    mapped: number;
    total: number;
    percentage: number;
  };
  projectStatusBreakdown: Record<string, number>;
  opportunityTrendsByMonth: Record<string, number>;
  
  // Add these fields to make them compatible with DataContext implementation
  totalAccounts: number;
  totalDemands: number;
  activeAccounts: number;
  activeDemands: number;
  probableAccounts: number;
  probableDemands: number;
  accountsByStatus: Record<string, number>;
  demandsByStatus: Record<string, number>;
  accountsByProbability: Record<number, number>;
  demandsByProbability: Record<number, number>;
  accountsByVertical: Record<string, number>;
  accountsByGeo: Record<string, number>;
  demandsByRole: Record<string, number>;
  demandsByLocation: Record<string, number>;
  monthlyDemands: Record<string, number>;
};

// Add ActionMenuItem type export
export type ActionMenuItem<T> = {
  label: string;
  onClick: (item: T) => void;
  icon?: React.ReactNode;
  disabled?: boolean;
  showIf?: (item: T) => boolean;
};
