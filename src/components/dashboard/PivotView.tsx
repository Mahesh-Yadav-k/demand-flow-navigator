
import { useState } from "react";
import { useData } from "@/contexts/DataContext";
import { Demand } from "@/types";
import { FilterDropdown } from "@/components/ui/filter-dropdown";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface PivotViewProps {
  showDemandStatusFilter?: boolean;
}

export const PivotView = ({ showDemandStatusFilter = false }: PivotViewProps) => {
  const { accounts, demands, filterDemands } = useData();
  const [pivotView, setPivotView] = useState<"role" | "account" | "both">("both");
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [roleFilter, setRoleFilter] = useState<(string | number)[]>([]);
  const [accountFilter, setAccountFilter] = useState<(string | number)[]>([]);
  
  // Get unique options for filters
  const roleCodeOptions = [...new Set(demands.map(demand => demand.roleCode))].filter(Boolean).map(code => ({
    label: code || "Unknown",
    value: code || "",
  }));
  
  const accountOptions = [...new Set(accounts.map(account => account.client))].filter(Boolean).map(client => ({
    label: client || "Unknown",
    value: client || "",
  }));
  
  const startMonthOptions = [...new Set(demands.map(demand => demand.startMonth))].filter(Boolean).map(month => ({
    label: month || "Unknown",
    value: month || "",
  }));
  
  const statusOptions = [
    { label: "Open", value: "Open" },
    { label: "In Progress", value: "In Progress" },
    { label: "Fulfilled", value: "Fulfilled" },
    { label: "Cancelled", value: "Cancelled" }
  ];
  
  // Apply filters
  let filteredDemandsData = filterDemands({});
  
  // Apply role code filter
  if (roleFilter && roleFilter.length > 0) {
    filteredDemandsData = filteredDemandsData.filter(d => roleFilter.includes(d.roleCode));
  }
  
  // Apply account filter
  if (accountFilter && accountFilter.length > 0) {
    filteredDemandsData = filteredDemandsData.filter(d => {
      const account = accounts.find(a => a.id === d.accountId);
      return account && accountFilter.includes(account.client);
    });
  }
  
  // Apply month filter
  if (selectedMonth) {
    filteredDemandsData = filteredDemandsData.filter(d => d.startMonth === selectedMonth);
  }
  
  // Apply status filter
  if (selectedStatus) {
    filteredDemandsData = filteredDemandsData.filter(d => d.status === selectedStatus);
  }
  
  // Get all months for pivot columns
  const allMonths = [...new Set(demands.map(d => d.startMonth).filter(Boolean))].sort();
  
  // Generate Account × Role × Month pivot data
  const generatePivotData = () => {
    // First group by account
    const demandsByAccount = filteredDemandsData.reduce((acc, demand) => {
      const account = accounts.find(a => a.id === demand.accountId);
      const accountName = account ? account.client : "Unknown";
      
      if (!acc[accountName]) {
        acc[accountName] = {};
      }
      
      const roleCode = demand.roleCode || "Unknown";
      if (!acc[accountName][roleCode]) {
        acc[accountName][roleCode] = {};
      }
      
      const month = demand.startMonth || "Unknown";
      if (!acc[accountName][roleCode][month]) {
        acc[accountName][roleCode][month] = 0;
      }
      
      acc[accountName][roleCode][month]++;
      return acc;
    }, {} as Record<string, Record<string, Record<string, number>>>);
    
    // Transform to table structure
    const pivotData = Object.keys(demandsByAccount).map(account => {
      const row: Record<string, any> = { name: account };
      
      // Add role columns for each account
      const roleTotals: Record<string, number> = {};
      
      Object.keys(demandsByAccount[account]).forEach(role => {
        const roleMonths = demandsByAccount[account][role];
        
        // Create a column for each role+month combination
        Object.keys(roleMonths).forEach(month => {
          const count = roleMonths[month];
          const columnKey = `${role}__${month}`;
          row[columnKey] = count;
          
          // Track role totals
          if (!roleTotals[role]) {
            roleTotals[role] = 0;
          }
          roleTotals[role] += count;
        });
        
        // Add role total
        row[`${role}__total`] = roleTotals[role];
      });
      
      // Calculate account total
      row.total = Object.values(roleTotals).reduce((sum, count) => sum + count, 0);
      
      return row;
    });
    
    return pivotData;
  };
  
  const pivotData = generatePivotData();
  
  // Generate column headers structure for the matrix
  const generateColumnHeaders = () => {
    const uniqueRoles = [...new Set(filteredDemandsData.map(d => d.roleCode || "Unknown"))];
    
    // Group headers by role and months
    return uniqueRoles.map(role => ({
      role,
      months: allMonths.map(month => ({
        month,
        key: `${role}__${month}`
      })),
      totalKey: `${role}__total`
    }));
  };
  
  const columnHeaders = generateColumnHeaders();
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">View By:</span>
          <Select value={pivotView} onValueChange={(value) => setPivotView(value as any)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select view" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="role">Role Code</SelectItem>
              <SelectItem value="account">Account</SelectItem>
              <SelectItem value="both">Accounts × Roles × Months</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {showDemandStatusFilter && (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Status:</span>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All statuses</SelectItem>
                {statusOptions.map(option => (
                  <SelectItem key={option.value} value={String(option.value)}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        
        <div className="flex flex-wrap gap-2 mt-2 sm:mt-0">
          <FilterDropdown
            label="Role Code"
            options={roleCodeOptions}
            selectedValues={roleFilter}
            onChange={setRoleFilter}
          />
          
          <FilterDropdown
            label="Account"
            options={accountOptions}
            selectedValues={accountFilter}
            onChange={setAccountFilter}
          />

          <FilterDropdown
            label="Month"
            options={startMonthOptions}
            selectedValues={selectedMonth ? [selectedMonth] : []}
            onChange={(values) => setSelectedMonth(values.length > 0 ? String(values[0]) : "")}
          />
          
          {showDemandStatusFilter && (
            <FilterDropdown
              label="Status"
              options={statusOptions}
              selectedValues={selectedStatus ? [selectedStatus] : []}
              onChange={(values) => setSelectedStatus(values.length > 0 ? String(values[0]) : "")}
            />
          )}
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>
            Demand by Account × Role × Month
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead rowSpan={2} className="font-bold border-r border-b sticky left-0 bg-background z-10">
                    Account
                  </TableHead>
                  
                  {columnHeaders.map((roleGroup, i) => (
                    <TableHead 
                      key={`role-${i}`} 
                      colSpan={roleGroup.months.length + 1} 
                      className="text-center border-x"
                    >
                      {roleGroup.role}
                    </TableHead>
                  ))}
                  
                  <TableHead rowSpan={2} className="text-center font-bold border-l">
                    Total
                  </TableHead>
                </TableRow>
                
                <TableRow>
                  {columnHeaders.map(roleGroup => (
                    <>
                      {roleGroup.months.map((monthData, j) => (
                        <TableHead key={`${roleGroup.role}-${monthData.month}`} className="text-center text-xs p-1">
                          {monthData.month}
                        </TableHead>
                      ))}
                      <TableHead className="text-center bg-muted/30 border-l text-xs p-1">
                        Total
                      </TableHead>
                    </>
                  ))}
                </TableRow>
              </TableHeader>
              
              <TableBody>
                {pivotData.map((row, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium sticky left-0 bg-background">
                      {row.name}
                    </TableCell>
                    
                    {columnHeaders.map(roleGroup => (
                      <>
                        {roleGroup.months.map((monthData) => (
                          <TableCell key={monthData.key} className="text-center p-1">
                            {row[monthData.key] || 0}
                          </TableCell>
                        ))}
                        <TableCell className="text-center font-medium bg-muted/30 border-l p-1">
                          {row[roleGroup.totalKey] || 0}
                        </TableCell>
                      </>
                    ))}
                    
                    <TableCell className="text-center font-bold bg-muted/20">
                      {row.total || 0}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
