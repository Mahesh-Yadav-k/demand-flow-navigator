
import { useState } from "react";
import { useData } from "@/contexts/DataContext";
import { useAuth } from "@/contexts/AuthContext";
import { Account, AccountFilters } from "@/types";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { FilterDropdown } from "@/components/ui/filter-dropdown";
import { Plus, Search, Filter, Trash, Edit, Eye } from "lucide-react";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { FormModal } from "@/components/ui/form-modal";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const AccountsPage = () => {
  const { accounts, filterAccounts, addAccount, updateAccount, deleteAccount } = useData();
  const { user, hasPermission } = useAuth();
  
  // State for filters and modals
  const [filters, setFilters] = useState<AccountFilters>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // New account form state
  const [formData, setFormData] = useState<Partial<Account>>({
    opptyId: "",
    client: "",
    project: "",
    vertical: "Technology",
    geo: "NA",
    startMonth: new Date().toLocaleString('default', { month: 'short' }) + ' ' + new Date().getFullYear(),
    revisedStartDate: "",
    plannedStartDate: "",
    plannedEndDate: "",
    probability: 50,
    opportunityStatus: "New",
    sowStatus: "Draft",
    projectStatus: "Not Started",
    clientPartner: "",
    proposalAnchor: "",
    deliveryPartner: "",
    comment: "",
  });
  
  // Filter options
  const clientOptions = [...new Set(accounts.map(account => account.client))].map(client => ({
    label: client,
    value: client,
  }));
  
  const projectOptions = [...new Set(accounts.map(account => account.project))].map(project => ({
    label: project,
    value: project,
  }));
  
  const statusOptions = [...new Set(accounts.map(account => account.opportunityStatus))].map(status => ({
    label: status,
    value: status,
  }));
  
  const sowStatusOptions = [...new Set(accounts.map(account => account.sowStatus))].map(status => ({
    label: status,
    value: status,
  }));
  
  const probabilityOptions = [...new Set(accounts.map(account => account.probability))].map(prob => ({
    label: `${prob}%`,
    value: prob,
  }));

  const verticalOptions = [...new Set(accounts.map(account => account.vertical))].map(vertical => ({
    label: vertical,
    value: vertical,
  }));

  const startMonthOptions = [...new Set(accounts.map(account => account.startMonth))].map(month => ({
    label: month,
    value: month,
  }));
  
  // Handle filter changes
  const handleFilterChange = (filterName: keyof AccountFilters, values: (string | number)[]) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: values.length > 0 ? values : undefined,
    }));
  };
  
  // Apply filters and search
  const filteredAccounts = filterAccounts(filters).filter(account => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      account.project.toLowerCase().includes(query) ||
      account.client.toLowerCase().includes(query) ||
      account.opptyId.toLowerCase().includes(query)
    );
  });
  
  // Handle form changes
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };
  
  const handleSelectChange = (name: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };
  
  // Handle form submission
  const handleAddSubmit = async () => {
    if (!formData.client || !formData.project) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const newAccount: Omit<Account, 'id'> = {
        ...(formData as any),
        lastUpdatedBy: user?.name || "Unknown",
        updatedOn: new Date().toISOString().split('T')[0],
        addedBy: user?.name || "Unknown",
        addedOn: new Date().toISOString().split('T')[0],
      };
      
      await addAccount(newAccount);
      setIsAddModalOpen(false);
      setFormData({
        opptyId: "",
        client: "",
        project: "",
        vertical: "Technology",
        geo: "NA",
        startMonth: new Date().toLocaleString('default', { month: 'short' }) + ' ' + new Date().getFullYear(),
        revisedStartDate: "",
        plannedStartDate: "",
        plannedEndDate: "",
        probability: 50,
        opportunityStatus: "New",
        sowStatus: "Draft",
        projectStatus: "Not Started",
        clientPartner: "",
        proposalAnchor: "",
        deliveryPartner: "",
        comment: "",
      });
    } catch (error) {
      console.error("Failed to add account:", error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleEditSubmit = async () => {
    if (!selectedAccount || !formData.client || !formData.project) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const updatedAccount: Account = {
        ...selectedAccount,
        ...formData as any,
        lastUpdatedBy: user?.name || "Unknown",
        updatedOn: new Date().toISOString().split('T')[0],
      };
      
      await updateAccount(updatedAccount);
      setIsEditModalOpen(false);
    } catch (error) {
      console.error("Failed to update account:", error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDelete = async () => {
    if (!selectedAccount) return;
    
    setIsSubmitting(true);
    
    try {
      const success = await deleteAccount(selectedAccount.id);
      if (success) {
        setIsDeleteDialogOpen(false);
        setSelectedAccount(null);
      }
    } catch (error) {
      console.error("Failed to delete account:", error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // View account details
  const handleViewAccount = (account: Account) => {
    setSelectedAccount(account);
    setIsViewModalOpen(true);
  };
  
  // Edit account
  const handleEditAccount = (account: Account) => {
    setSelectedAccount(account);
    setFormData(account);
    setIsEditModalOpen(true);
  };
  
  // Delete account
  const handleDeleteAccount = (account: Account) => {
    setSelectedAccount(account);
    setIsDeleteDialogOpen(true);
  };
  
  // Table columns
  const columns = [
    {
      header: "Oppty ID",
      accessor: "opptyId" as keyof Account,
      className: "font-medium",
    },
    {
      header: "Client",
      accessor: "client" as keyof Account,
    },
    {
      header: "Project",
      accessor: "project" as keyof Account,
      className: "max-w-xs",
      cell: (value: string) => (
        <div className="truncate-text">{value}</div>
      ),
    },
    {
      header: "Vertical",
      accessor: "vertical" as keyof Account,
    },
    {
      header: "Geo",
      accessor: "geo" as keyof Account,
    },
    {
      header: "Start Month",
      accessor: "startMonth" as keyof Account,
    },
    {
      header: "Probability",
      accessor: "probability" as keyof Account,
      cell: (value: number) => `${value}%`,
    },
    {
      header: "Opportunity Status",
      accessor: "opportunityStatus" as keyof Account,
    },
    {
      header: "SOW Status",
      accessor: "sowStatus" as keyof Account,
    },
    {
      header: "Project Status",
      accessor: "projectStatus" as keyof Account,
    },
    {
      header: "Actions",
      accessor: (row: Account) => (
        <div className="flex space-x-2">
          <Button variant="ghost" size="icon" onClick={(e) => {
            e.stopPropagation();
            handleViewAccount(row);
          }}>
            <Eye className="h-4 w-4" />
          </Button>
          
          {hasPermission('canEditAccount') && (
            <Button variant="ghost" size="icon" onClick={(e) => {
              e.stopPropagation();
              handleEditAccount(row);
            }}>
              <Edit className="h-4 w-4" />
            </Button>
          )}
          
          {hasPermission('canDeleteAccount') && (
            <Button variant="ghost" size="icon" onClick={(e) => {
              e.stopPropagation();
              handleDeleteAccount(row);
            }}>
              <Trash className="h-4 w-4" />
            </Button>
          )}
        </div>
      ),
    },
  ];
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold">Account Management</h1>
        
        {hasPermission('canAddAccount') && (
          <Button onClick={() => setIsAddModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Account
          </Button>
        )}
      </div>
      
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search accounts..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex flex-wrap gap-2">
          <FilterDropdown
            label="Client"
            options={clientOptions}
            selectedValues={filters.client || []}
            onChange={(values) => handleFilterChange('client', values)}
          />
          <FilterDropdown
            label="Project"
            options={projectOptions}
            selectedValues={filters.project || []}
            onChange={(values) => handleFilterChange('project', values)}
          />
          <FilterDropdown
            label="Opportunity Status"
            options={statusOptions}
            selectedValues={filters.opportunityStatus || []}
            onChange={(values) => handleFilterChange('opportunityStatus', values)}
          />
          <FilterDropdown
            label="SOW Status"
            options={sowStatusOptions}
            selectedValues={filters.sowStatus || []}
            onChange={(values) => handleFilterChange('sowStatus', values)}
          />
          <FilterDropdown
            label="Vertical"
            options={verticalOptions}
            selectedValues={filters.vertical || []}
            onChange={(values) => handleFilterChange('vertical', values)}
          />
          <FilterDropdown
            label="Start Month"
            options={startMonthOptions}
            selectedValues={filters.startMonth || []}
            onChange={(values) => handleFilterChange('startMonth', values)}
          />
          <FilterDropdown
            label="Probability"
            options={probabilityOptions}
            selectedValues={filters.probability || []}
            onChange={(values) => handleFilterChange('probability', values)}
          />
        </div>
      </div>
      
      <DataTable
        data={filteredAccounts}
        columns={columns}
        keyField="id"
        onRowClick={handleViewAccount}
        emptyMessage="No accounts found. Adjust your filters or add a new account."
      />
      
      {/* Add Account Modal */}
      <FormModal
        title="Add New Account"
        description="Fill in the account details below."
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        onSubmit={handleAddSubmit}
        isSubmitting={isSubmitting}
        size="lg"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="opptyId">Opportunity ID*</Label>
            <Input
              id="opptyId"
              name="opptyId"
              value={formData.opptyId || ''}
              onChange={handleFormChange}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="client">Client*</Label>
            <Input
              id="client"
              name="client"
              value={formData.client || ''}
              onChange={handleFormChange}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="project">Project*</Label>
            <Input
              id="project"
              name="project"
              value={formData.project || ''}
              onChange={handleFormChange}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="vertical">Vertical</Label>
            <Select
              value={formData.vertical || ''}
              onValueChange={(value) => handleSelectChange('vertical', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select vertical" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Finance">Finance</SelectItem>
                <SelectItem value="Healthcare">Healthcare</SelectItem>
                <SelectItem value="Retail">Retail</SelectItem>
                <SelectItem value="Technology">Technology</SelectItem>
                <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                <SelectItem value="Energy">Energy</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="geo">Geo</Label>
            <Select
              value={formData.geo || ''}
              onValueChange={(value) => handleSelectChange('geo', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select geo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="APAC">APAC</SelectItem>
                <SelectItem value="EMEA">EMEA</SelectItem>
                <SelectItem value="NA">NA</SelectItem>
                <SelectItem value="LATAM">LATAM</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="startMonth">Start Month</Label>
            <Input
              id="startMonth"
              name="startMonth"
              value={formData.startMonth || ''}
              onChange={handleFormChange}
              placeholder="e.g. Jan 2024"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="plannedStartDate">Planned Start Date</Label>
            <Input
              id="plannedStartDate"
              name="plannedStartDate"
              type="date"
              value={formData.plannedStartDate || ''}
              onChange={handleFormChange}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="revisedStartDate">Revised Start Date</Label>
            <Input
              id="revisedStartDate"
              name="revisedStartDate"
              type="date"
              value={formData.revisedStartDate || ''}
              onChange={handleFormChange}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="plannedEndDate">Planned End Date</Label>
            <Input
              id="plannedEndDate"
              name="plannedEndDate"
              type="date"
              value={formData.plannedEndDate || ''}
              onChange={handleFormChange}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="probability">Probability</Label>
            <Select
              value={String(formData.probability) || ''}
              onValueChange={(value) => handleSelectChange('probability', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select probability" />
              </SelectTrigger>
              <SelectContent>
                {[10, 20, 30, 50, 70, 90, 100].map(value => (
                  <SelectItem key={value} value={String(value)}>{value}%</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="opportunityStatus">Opportunity Status</Label>
            <Select
              value={formData.opportunityStatus || ''}
              onValueChange={(value) => handleSelectChange('opportunityStatus', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="New">New</SelectItem>
                <SelectItem value="Qualified">Qualified</SelectItem>
                <SelectItem value="Proposal">Proposal</SelectItem>
                <SelectItem value="Negotiation">Negotiation</SelectItem>
                <SelectItem value="Closed Won">Closed Won</SelectItem>
                <SelectItem value="Closed Lost">Closed Lost</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="sowStatus">SOW Status</Label>
            <Select
              value={formData.sowStatus || ''}
              onValueChange={(value) => handleSelectChange('sowStatus', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select SOW status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Draft">Draft</SelectItem>
                <SelectItem value="In Review">In Review</SelectItem>
                <SelectItem value="Approved">Approved</SelectItem>
                <SelectItem value="Signed">Signed</SelectItem>
                <SelectItem value="Not Started">Not Started</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="projectStatus">Project Status</Label>
            <Select
              value={formData.projectStatus || ''}
              onValueChange={(value) => handleSelectChange('projectStatus', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select project status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Not Started">Not Started</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="On Hold">On Hold</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
                <SelectItem value="Cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="clientPartner">Client Partner</Label>
            <Input
              id="clientPartner"
              name="clientPartner"
              value={formData.clientPartner || ''}
              onChange={handleFormChange}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="proposalAnchor">Proposal Anchor</Label>
            <Input
              id="proposalAnchor"
              name="proposalAnchor"
              value={formData.proposalAnchor || ''}
              onChange={handleFormChange}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="deliveryPartner">Delivery Partner</Label>
            <Input
              id="deliveryPartner"
              name="deliveryPartner"
              value={formData.deliveryPartner || ''}
              onChange={handleFormChange}
            />
          </div>
          
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="comment">Comment</Label>
            <Textarea
              id="comment"
              name="comment"
              value={formData.comment || ''}
              onChange={handleFormChange}
              rows={3}
            />
          </div>
        </div>
      </FormModal>
      
      {/* View Account Modal */}
      <FormModal
        title="Account Details"
        open={isViewModalOpen}
        onOpenChange={setIsViewModalOpen}
        size="lg"
      >
        {selectedAccount && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Opportunity ID</h3>
                <p>{selectedAccount.opptyId}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Client</h3>
                <p>{selectedAccount.client}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Project</h3>
                <p>{selectedAccount.project}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Vertical</h3>
                <p>{selectedAccount.vertical}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Geo</h3>
                <p>{selectedAccount.geo}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Start Month</h3>
                <p>{selectedAccount.startMonth}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Planned Start Date</h3>
                <p>{selectedAccount.plannedStartDate}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Revised Start Date</h3>
                <p>{selectedAccount.revisedStartDate}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Planned End Date</h3>
                <p>{selectedAccount.plannedEndDate}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Probability</h3>
                <p>{selectedAccount.probability}%</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Opportunity Status</h3>
                <p>{selectedAccount.opportunityStatus}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">SOW Status</h3>
                <p>{selectedAccount.sowStatus}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Project Status</h3>
                <p>{selectedAccount.projectStatus}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Client Partner</h3>
                <p>{selectedAccount.clientPartner}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Proposal Anchor</h3>
                <p>{selectedAccount.proposalAnchor}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Delivery Partner</h3>
                <p>{selectedAccount.deliveryPartner}</p>
              </div>
            </div>
            
            {selectedAccount.comment && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Comment</h3>
                <p>{selectedAccount.comment}</p>
              </div>
            )}
            
            <div className="pt-4 border-t space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Added by {selectedAccount.addedBy} on {selectedAccount.addedOn}</span>
                <span>Last updated by {selectedAccount.lastUpdatedBy} on {selectedAccount.updatedOn}</span>
              </div>
              
              {hasPermission('canEditAccounts') && (
                <div className="flex justify-end gap-2">
                  <Button
                    onClick={() => {
                      setIsViewModalOpen(false);
                      handleEditAccount(selectedAccount);
                    }}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Account
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </FormModal>
      
      {/* Edit Account Modal */}
      <FormModal
        title="Edit Account"
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        onSubmit={handleEditSubmit}
        isSubmitting={isSubmitting}
        size="lg"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="opptyId">Opportunity ID*</Label>
            <Input
              id="opptyId"
              name="opptyId"
              value={formData.opptyId || ''}
              onChange={handleFormChange}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="client">Client*</Label>
            <Input
              id="client"
              name="client"
              value={formData.client || ''}
              onChange={handleFormChange}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="project">Project*</Label>
            <Input
              id="project"
              name="project"
              value={formData.project || ''}
              onChange={handleFormChange}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="vertical">Vertical</Label>
            <Select
              value={formData.vertical || ''}
              onValueChange={(value) => handleSelectChange('vertical', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select vertical" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Finance">Finance</SelectItem>
                <SelectItem value="Healthcare">Healthcare</SelectItem>
                <SelectItem value="Retail">Retail</SelectItem>
                <SelectItem value="Technology">Technology</SelectItem>
                <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                <SelectItem value="Energy">Energy</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="geo">Geo</Label>
            <Select
              value={formData.geo || ''}
              onValueChange={(value) => handleSelectChange('geo', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select geo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="APAC">APAC</SelectItem>
                <SelectItem value="EMEA">EMEA</SelectItem>
                <SelectItem value="NA">NA</SelectItem>
                <SelectItem value="LATAM">LATAM</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="startMonth">Start Month</Label>
            <Input
              id="startMonth"
              name="startMonth"
              value={formData.startMonth || ''}
              onChange={handleFormChange}
              placeholder="e.g. Jan 2024"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="plannedStartDate">Planned Start Date</Label>
            <Input
              id="plannedStartDate"
              name="plannedStartDate"
              type="date"
              value={formData.plannedStartDate || ''}
              onChange={handleFormChange}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="revisedStartDate">Revised Start Date</Label>
            <Input
              id="revisedStartDate"
              name="revisedStartDate"
              type="date"
              value={formData.revisedStartDate || ''}
              onChange={handleFormChange}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="plannedEndDate">Planned End Date</Label>
            <Input
              id="plannedEndDate"
              name="plannedEndDate"
              type="date"
              value={formData.plannedEndDate || ''}
              onChange={handleFormChange}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="probability">Probability</Label>
            <Select
              value={String(formData.probability) || ''}
              onValueChange={(value) => handleSelectChange('probability', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select probability" />
              </SelectTrigger>
              <SelectContent>
                {[10, 20, 30, 50, 70, 90, 100].map(value => (
                  <SelectItem key={value} value={String(value)}>{value}%</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="opportunityStatus">Opportunity Status</Label>
            <Select
              value={formData.opportunityStatus || ''}
              onValueChange={(value) => handleSelectChange('opportunityStatus', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="New">New</SelectItem>
                <SelectItem value="Qualified">Qualified</SelectItem>
                <SelectItem value="Proposal">Proposal</SelectItem>
                <SelectItem value="Negotiation">Negotiation</SelectItem>
                <SelectItem value="Closed Won">Closed Won</SelectItem>
                <SelectItem value="Closed Lost">Closed Lost</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="sowStatus">SOW Status</Label>
            <Select
              value={formData.sowStatus || ''}
              onValueChange={(value) => handleSelectChange('sowStatus', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select SOW status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Draft">Draft</SelectItem>
                <SelectItem value="In Review">In Review</SelectItem>
                <SelectItem value="Approved">Approved</SelectItem>
                <SelectItem value="Signed">Signed</SelectItem>
                <SelectItem value="Not Started">Not Started</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="projectStatus">Project Status</Label>
            <Select
              value={formData.projectStatus || ''}
              onValueChange={(value) => handleSelectChange('projectStatus', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select project status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Not Started">Not Started</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="On Hold">On Hold</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
                <SelectItem value="Cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="clientPartner">Client Partner</Label>
            <Input
              id="clientPartner"
              name="clientPartner"
              value={formData.clientPartner || ''}
              onChange={handleFormChange}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="proposalAnchor">Proposal Anchor</Label>
            <Input
              id="proposalAnchor"
              name="proposalAnchor"
              value={formData.proposalAnchor || ''}
              onChange={handleFormChange}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="deliveryPartner">Delivery Partner</Label>
            <Input
              id="deliveryPartner"
              name="deliveryPartner"
              value={formData.deliveryPartner || ''}
              onChange={handleFormChange}
            />
          </div>
          
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="comment">Comment</Label>
            <Textarea
              id="comment"
              name="comment"
              value={formData.comment || ''}
              onChange={handleFormChange}
              rows={3}
            />
          </div>
        </div>
      </FormModal>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the account 
              {selectedAccount ? ` "${selectedAccount.project}"` : ''}. 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isSubmitting}>
              {isSubmitting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AccountsPage;
