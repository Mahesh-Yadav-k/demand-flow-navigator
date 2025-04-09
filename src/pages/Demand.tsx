
import { useState, useEffect } from "react";
import { useData } from "@/contexts/DataContext";
import { useAuth } from "@/contexts/AuthContext";
import { Demand, DemandFilters } from "@/types";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { FilterDropdown } from "@/components/ui/filter-dropdown";
import { FormModal } from "@/components/ui/form-modal";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Filter, Trash, Edit, Eye, Copy, MoreHorizontal } from "lucide-react";
import { Label } from "@/components/ui/label";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const DemandPage = () => {
  const { accounts, demands, filterDemands, addDemand, updateDemand, deleteDemand, getAccountById } = useData();
  const { user, hasPermission } = useAuth();
  
  // State for filters and modals
  const [filters, setFilters] = useState<DemandFilters>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedDemand, setSelectedDemand] = useState<Demand | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [numberOfClones, setNumberOfClones] = useState<number>(1);
  
  // New demand form state
  const [formData, setFormData] = useState<Partial<Demand>>({
    accountId: "",
    project: "",
    role: "",
    roleCode: "",
    location: "",
    revisedStartDate: "",
    originalStartDate: "",
    allocationEndDate: "",
    allocationPercentage: 100,
    probability: 50,
    status: "Open",
    resourceMapped: "Unassigned",
    comment: "",
  });

  // Role to RoleCode mapping
  const roleToCodeMap = {
    "Software Engineer": "SE",
    "Project Manager": "PM",
    "Business Analyst": "BA",
    "UX Designer": "UX",
    "DevOps Engineer": "DO",
    "Data Scientist": "DS",
    "QA Engineer": "QA"
  };
  
  // Filter options
  const roleOptions = [...new Set(demands.map(demand => demand.role))].map(role => ({
    label: role,
    value: role,
  }));
  
  const locationOptions = [...new Set(demands.map(demand => demand.location))].map(location => ({
    label: location,
    value: location,
  }));
  
  const probabilityOptions = [...new Set(demands.map(demand => demand.probability))].map(prob => ({
    label: `${prob}%`,
    value: prob,
  }));
  
  const statusOptions = [...new Set(demands.map(demand => demand.status))].map(status => ({
    label: status,
    value: status,
  }));
  
  const startMonthOptions = [...new Set(demands.map(demand => demand.startMonth))].map(month => ({
    label: month,
    value: month,
  }));

  const accountOptions = [...new Set(accounts.map(account => account.client))].map(client => ({
    label: client,
    value: client,
  }));
  
  // Handle filter changes
  const handleFilterChange = (filterName: keyof DemandFilters, values: (string | number)[]) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: values.length > 0 ? values : undefined,
    }));
  };
  
  // Apply filters and search
  const filteredDemands = filterDemands(filters).filter(demand => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      demand.project.toLowerCase().includes(query) ||
      demand.role.toLowerCase().includes(query) ||
      demand.location.toLowerCase().includes(query) ||
      (demand.resourceMapped && demand.resourceMapped.toLowerCase().includes(query))
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
  
  const handleSelectChange = (name: string, value: string) => {
    if (name === 'role') {
      // Auto-select role code based on role
      setFormData(prev => ({
        ...prev,
        [name]: value,
        roleCode: roleToCodeMap[value as keyof typeof roleToCodeMap] || ""
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };
  
  // Populate project details when account is selected
  const handleAccountSelect = (accountId: string) => {
    const account = getAccountById(accountId);
    if (account) {
      setFormData(prev => ({
        ...prev,
        accountId: account.id,
        project: account.project,
        probability: account.probability,
        revisedStartDate: account.revisedStartDate,
        originalStartDate: account.plannedStartDate,
        allocationEndDate: account.plannedEndDate,
        startMonth: account.startMonth,
      }));
    }
  };
  
  // Handle form submission
  const handleAddSubmit = async () => {
    if (!formData.accountId || !formData.role) {
      // Show error - required fields missing
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const clonesToCreate = numberOfClones || 1;
      const clonePromises = [];
      
      for (let i = 0; i < clonesToCreate; i++) {
        const newDemand: Omit<Demand, 'id' | 'sno'> = {
          ...(formData as any),
          lastUpdatedBy: user?.name || "Unknown",
          updatedOn: new Date().toISOString().split('T')[0],
          addedBy: user?.name || "Unknown",
          addedOn: new Date().toISOString().split('T')[0],
        };
        
        clonePromises.push(addDemand(newDemand));
      }
      
      await Promise.all(clonePromises);
      
      setIsAddModalOpen(false);
      setFormData({
        accountId: "",
        project: "",
        role: "",
        roleCode: "",
        location: "",
        revisedStartDate: "",
        originalStartDate: "",
        allocationEndDate: "",
        allocationPercentage: 100,
        probability: 50,
        status: "Open",
        resourceMapped: "Unassigned",
        comment: "",
      });
      setNumberOfClones(1);
    } catch (error) {
      console.error("Failed to add demand:", error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleEditSubmit = async () => {
    if (!selectedDemand || !formData.accountId || !formData.role) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const updatedDemand: Demand = {
        ...selectedDemand,
        ...formData as any,
        lastUpdatedBy: user?.name || "Unknown",
        updatedOn: new Date().toISOString().split('T')[0],
      };
      
      await updateDemand(updatedDemand);
      setIsEditModalOpen(false);
    } catch (error) {
      console.error("Failed to update demand:", error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDelete = async () => {
    if (!selectedDemand) return;
    
    setIsSubmitting(true);
    
    try {
      await deleteDemand(selectedDemand.id);
      setIsDeleteDialogOpen(false);
      setSelectedDemand(null);
    } catch (error) {
      console.error("Failed to delete demand:", error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Clone demand
  const handleCloneDemand = async (demand: Demand) => {
    setIsSubmitting(true);
    
    try {
      const cloneDemand: Omit<Demand, 'id' | 'sno'> = {
        ...demand,
        lastUpdatedBy: user?.name || "Unknown",
        updatedOn: new Date().toISOString().split('T')[0],
        addedBy: user?.name || "Unknown",
        addedOn: new Date().toISOString().split('T')[0],
      };
      
      delete (cloneDemand as any).id;
      delete (cloneDemand as any).sno;
      
      await addDemand(cloneDemand);
    } catch (error) {
      console.error("Failed to clone demand:", error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // View demand details
  const handleViewDemand = (demand: Demand) => {
    setSelectedDemand(demand);
    setIsViewModalOpen(true);
  };
  
  // Edit demand
  const handleEditDemand = (demand: Demand) => {
    setSelectedDemand(demand);
    setFormData(demand);
    setIsEditModalOpen(true);
  };
  
  // Delete demand
  const handleDeleteDemand = (demand: Demand) => {
    setSelectedDemand(demand);
    setIsDeleteDialogOpen(true);
  };

  // Get account name by id
  const getAccountName = (accountId: string) => {
    const account = accounts.find(a => a.id === accountId);
    return account ? account.client : "Unknown";
  };
  
  // Table columns
  const columns = [
    {
      header: "S.No",
      accessor: "sno" as keyof Demand,
      className: "font-medium w-16",
    },
    {
      header: "Account",
      accessor: (row: Demand) => getAccountName(row.accountId),
    },
    {
      header: "Project",
      accessor: "project" as keyof Demand,
      className: "max-w-xs",
      cell: (value: string) => (
        <div className="truncate-text">{value}</div>
      ),
    },
    {
      header: "Role Code",
      accessor: "roleCode" as keyof Demand,
      className: "w-24",
    },
    {
      header: "Location",
      accessor: "location" as keyof Demand,
    },
    {
      header: "Start Month",
      accessor: "startMonth" as keyof Demand,
    },
    {
      header: "Probability",
      accessor: "probability" as keyof Demand,
      cell: (value: number) => `${value}%`,
    },
    {
      header: "Status",
      accessor: "status" as keyof Demand,
    },
    {
      header: "Resource Mapped",
      accessor: "resourceMapped" as keyof Demand,
      cell: (value: string) => value || "Unassigned",
    },
    {
      header: "Actions",
      accessor: (row: Demand) => (
        <div className="flex items-center justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleViewDemand(row)}>
                <Eye className="mr-2 h-4 w-4" />
                View
              </DropdownMenuItem>
              
              {hasPermission('canEditDemand') && (
                <DropdownMenuItem onClick={() => handleEditDemand(row)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
              )}
              
              {(hasPermission('canCloneDemand') || user?.role === 'Admin' || user?.role === 'Client Partner') && (
                <DropdownMenuItem onClick={() => handleCloneDemand(row)}>
                  <Copy className="mr-2 h-4 w-4" />
                  Clone
                </DropdownMenuItem>
              )}
              
              {hasPermission('canDeleteDemand') && (
                <DropdownMenuItem 
                  className="text-destructive"
                  onClick={() => handleDeleteDemand(row)}
                >
                  <Trash className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];
  
  // Get accounts as options for select dropdown
  const accountSelectOptions = accounts.map(account => ({
    value: account.id,
    label: `${account.client} - ${account.project}`,
  }));
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold">Demand Management</h1>
        
        {hasPermission('canAddDemand') && (
          <Button onClick={() => setIsAddModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Demand
          </Button>
        )}
      </div>
      
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search demands..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex flex-wrap gap-2">
          <FilterDropdown
            label="Role"
            options={roleOptions}
            selectedValues={filters.role || []}
            onChange={(values) => handleFilterChange('role', values)}
          />
          <FilterDropdown
            label="Location"
            options={locationOptions}
            selectedValues={filters.location || []}
            onChange={(values) => handleFilterChange('location', values)}
          />
          <FilterDropdown
            label="Status"
            options={statusOptions}
            selectedValues={filters.status || []}
            onChange={(values) => handleFilterChange('status', values)}
          />
          <FilterDropdown
            label="Account"
            options={accountOptions}
            selectedValues={filters.account || []}
            onChange={(values) => handleFilterChange('account', values)}
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
        data={filteredDemands}
        columns={columns}
        keyField="id"
        onRowClick={handleViewDemand}
        emptyMessage="No demands found. Adjust your filters or add a new demand."
      />
      
      {/* Add Demand Modal */}
      <FormModal
        title="Add New Demand"
        description="Fill in the demand details below."
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        onSubmit={handleAddSubmit}
        isSubmitting={isSubmitting}
        size="lg"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="accountId">Account/Project*</Label>
            <Select
              value={formData.accountId || ''}
              onValueChange={handleAccountSelect}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select account" />
              </SelectTrigger>
              <SelectContent>
                {accountSelectOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="role">Role*</Label>
            <Select
              value={formData.role || ''}
              onValueChange={(value) => handleSelectChange('role', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Software Engineer">Software Engineer</SelectItem>
                <SelectItem value="Project Manager">Project Manager</SelectItem>
                <SelectItem value="Business Analyst">Business Analyst</SelectItem>
                <SelectItem value="UX Designer">UX Designer</SelectItem>
                <SelectItem value="DevOps Engineer">DevOps Engineer</SelectItem>
                <SelectItem value="Data Scientist">Data Scientist</SelectItem>
                <SelectItem value="QA Engineer">QA Engineer</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="roleCode">Role Code (Auto-selected)</Label>
            <Input
              id="roleCode"
              name="roleCode"
              value={formData.roleCode || ''}
              disabled
              className="bg-muted"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Select
              value={formData.location || ''}
              onValueChange={(value) => handleSelectChange('location', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Remote">Remote</SelectItem>
                <SelectItem value="Onsite">Onsite</SelectItem>
                <SelectItem value="Hybrid">Hybrid</SelectItem>
              </SelectContent>
            </Select>
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
            <Label htmlFor="originalStartDate">Original Start Date</Label>
            <Input
              id="originalStartDate"
              name="originalStartDate"
              type="date"
              value={formData.originalStartDate || ''}
              onChange={handleFormChange}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="allocationEndDate">Allocation End Date</Label>
            <Input
              id="allocationEndDate"
              name="allocationEndDate"
              type="date"
              value={formData.allocationEndDate || ''}
              onChange={handleFormChange}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="allocationPercentage">Allocation Percentage</Label>
            <Select
              value={String(formData.allocationPercentage) || ''}
              onValueChange={(value) => handleSelectChange('allocationPercentage', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select allocation percentage" />
              </SelectTrigger>
              <SelectContent>
                {[25, 50, 75, 100].map(value => (
                  <SelectItem key={value} value={String(value)}>{value}%</SelectItem>
                ))}
              </SelectContent>
            </Select>
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
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status || ''}
              onValueChange={(value) => handleSelectChange('status', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Open">Open</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Fulfilled">Fulfilled</SelectItem>
                <SelectItem value="Cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="resourceMapped">Resource Mapped</Label>
            <Select
              value={formData.resourceMapped || ''}
              onValueChange={(value) => handleSelectChange('resourceMapped', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select resource" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Unassigned">Unassigned</SelectItem>
                <SelectItem value="Alice Chen">Alice Chen</SelectItem>
                <SelectItem value="Bob Taylor">Bob Taylor</SelectItem>
                <SelectItem value="Carlos Rodriguez">Carlos Rodriguez</SelectItem>
                <SelectItem value="Diana Kim">Diana Kim</SelectItem>
                <SelectItem value="Ethan Wright">Ethan Wright</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="numberOfClones">Number of Clones</Label>
            <Input
              id="numberOfClones"
              name="numberOfClones"
              type="number"
              min="1"
              max="20"
              value={numberOfClones}
              onChange={(e) => setNumberOfClones(parseInt(e.target.value) || 1)}
            />
            <p className="text-xs text-muted-foreground">
              Number of identical demands to create (includes this one)
            </p>
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
      
      {/* View Demand Modal */}
      <FormModal
        title="Demand Details"
        open={isViewModalOpen}
        onOpenChange={setIsViewModalOpen}
        size="lg"
      >
        {selectedDemand && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Project</h3>
                <p>{selectedDemand.project}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Role</h3>
                <p>{selectedDemand.role}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Role Code</h3>
                <p>{selectedDemand.roleCode}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Location</h3>
                <p>{selectedDemand.location}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Revised Start Date</h3>
                <p>{selectedDemand.revisedStartDate}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Original Start Date</h3>
                <p>{selectedDemand.originalStartDate}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Allocation End Date</h3>
                <p>{selectedDemand.allocationEndDate}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Allocation Percentage</h3>
                <p>{selectedDemand.allocationPercentage}%</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Probability</h3>
                <p>{selectedDemand.probability}%</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
                <p>{selectedDemand.status}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Resource Mapped</h3>
                <p>{selectedDemand.resourceMapped || "Unassigned"}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Start Month</h3>
                <p>{selectedDemand.startMonth}</p>
              </div>
            </div>
            
            {selectedDemand.comment && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Comment</h3>
                <p>{selectedDemand.comment}</p>
              </div>
            )}
            
            <div className="pt-4 border-t space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Added by {selectedDemand.addedBy} on {selectedDemand.addedOn}</span>
                <span>Last updated by {selectedDemand.lastUpdatedBy} on {selectedDemand.updatedOn}</span>
              </div>
              
              <div className="flex justify-end gap-2">
                {hasPermission('canEditDemand') && (
                  <Button
                    onClick={() => {
                      setIsViewModalOpen(false);
                      handleEditDemand(selectedDemand);
                    }}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Demand
                  </Button>
                )}
                
                {(hasPermission('canCloneDemand') || user?.role === 'Admin' || user?.role === 'Client Partner') && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsViewModalOpen(false);
                      handleCloneDemand(selectedDemand);
                    }}
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Clone Demand
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </FormModal>
      
      {/* Edit Demand Modal */}
      <FormModal
        title="Edit Demand"
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        onSubmit={handleEditSubmit}
        isSubmitting={isSubmitting}
        size="lg"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="accountId">Account/Project*</Label>
            <Select
              value={formData.accountId || ''}
              onValueChange={handleAccountSelect}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select account" />
              </SelectTrigger>
              <SelectContent>
                {accountSelectOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="role">Role*</Label>
            <Select
              value={formData.role || ''}
              onValueChange={(value) => handleSelectChange('role', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Software Engineer">Software Engineer</SelectItem>
                <SelectItem value="Project Manager">Project Manager</SelectItem>
                <SelectItem value="Business Analyst">Business Analyst</SelectItem>
                <SelectItem value="UX Designer">UX Designer</SelectItem>
                <SelectItem value="DevOps Engineer">DevOps Engineer</SelectItem>
                <SelectItem value="Data Scientist">Data Scientist</SelectItem>
                <SelectItem value="QA Engineer">QA Engineer</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="roleCode">Role Code (Auto-selected)</Label>
            <Input
              id="roleCode"
              name="roleCode"
              value={formData.roleCode || ''}
              disabled
              className="bg-muted"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Select
              value={formData.location || ''}
              onValueChange={(value) => handleSelectChange('location', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Remote">Remote</SelectItem>
                <SelectItem value="Onsite">Onsite</SelectItem>
                <SelectItem value="Hybrid">Hybrid</SelectItem>
              </SelectContent>
            </Select>
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
            <Label htmlFor="originalStartDate">Original Start Date</Label>
            <Input
              id="originalStartDate"
              name="originalStartDate"
              type="date"
              value={formData.originalStartDate || ''}
              onChange={handleFormChange}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="allocationEndDate">Allocation End Date</Label>
            <Input
              id="allocationEndDate"
              name="allocationEndDate"
              type="date"
              value={formData.allocationEndDate || ''}
              onChange={handleFormChange}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="allocationPercentage">Allocation Percentage</Label>
            <Select
              value={String(formData.allocationPercentage) || ''}
              onValueChange={(value) => handleSelectChange('allocationPercentage', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select allocation percentage" />
              </SelectTrigger>
              <SelectContent>
                {[25, 50, 75, 100].map(value => (
                  <SelectItem key={value} value={String(value)}>{value}%</SelectItem>
                ))}
              </SelectContent>
            </Select>
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
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status || ''}
              onValueChange={(value) => handleSelectChange('status', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Open">Open</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Fulfilled">Fulfilled</SelectItem>
                <SelectItem value="Cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="resourceMapped">Resource Mapped</Label>
            <Select
              value={formData.resourceMapped || ''}
              onValueChange={(value) => handleSelectChange('resourceMapped', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select resource" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Unassigned">Unassigned</SelectItem>
                <SelectItem value="Alice Chen">Alice Chen</SelectItem>
                <SelectItem value="Bob Taylor">Bob Taylor</SelectItem>
                <SelectItem value="Carlos Rodriguez">Carlos Rodriguez</SelectItem>
                <SelectItem value="Diana Kim">Diana Kim</SelectItem>
                <SelectItem value="Ethan Wright">Ethan Wright</SelectItem>
              </SelectContent>
            </Select>
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
              This will permanently delete the demand for
              {selectedDemand ? ` "${selectedDemand.role}" in the "${selectedDemand.project}"` : ''} project. 
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

export default DemandPage;
