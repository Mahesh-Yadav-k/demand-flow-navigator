
import { useState } from "react";
import { useData } from "@/contexts/DataContext";
import { Demand } from "@/types";
import { FilterDropdown } from "@/components/ui/filter-dropdown";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ExportButton } from "@/components/demands/ExportButton";

interface PivotViewProps {
  showDemandStatusFilter?: boolean;
}

export const PivotView = ({ showDemandStatusFilter = false }: PivotViewProps) => {
  const { accounts, demands, filterDemands } = useData();
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
  
  // Get all months for pivot columns (sorted chronologically)
  const allMonths = [...new Set(demands.map(d => d.startMonth).filter(Boolean))].sort();
  
  // Generate Account × Role × Month pivot data
  const generatePivotData = () => {
    // First group by account
    const accountGroups = filteredDemandsData.reduce((acc, demand) => {
      const account = accounts.find(a => a.id === demand.accountId);
      const accountName = account ? account.client : "Unknown";
      
      if (!acc[accountName]) {
        acc[accountName] = [];
      }
      
      acc[accountName].push(demand);
      return acc;
    }, {} as Record<string, Demand[]>);
    
    // Process data for each account
    return Object.entries(accountGroups).map(([accountName, accountDemands]) => {
      // For each account, group demands by role code
      const roleGroups = accountDemands.reduce((acc, demand) => {
        const roleCode = demand.roleCode || "Unknown";
        
        if (!acc[roleCode]) {
          acc[roleCode] = [];
        }
        
        acc[roleCode].push(demand);
        return acc;
      }, {} as Record<string, Demand[]>);
      
      // For each role code, count demands by month
      const roleData: Record<string, Record<string, number>> = {};
      let accountTotal = 0;
      
      Object.entries(roleGroups).forEach(([roleCode, roleDemands]) => {
        roleData[roleCode] = {
          total: roleDemands.length
        };
        accountTotal += roleDemands.length;
        
        // Count by month
        roleDemands.forEach(demand => {
          const month = demand.startMonth || "Unknown";
          if (!roleData[roleCode][month]) {
            roleData[roleCode][month] = 0;
          }
          roleData[roleCode][month]++;
        });
      });
      
      return {
        accountName,
        roles: roleData,
        total: accountTotal
      };
    });
  };
  
  const pivotData = generatePivotData();
  
  // Get unique role codes from all demands for column headers
  const uniqueRoleCodes = [...new Set(filteredDemandsData.map(d => d.roleCode || "Unknown"))].sort();
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4 flex-wrap">
        <div className="flex flex-wrap gap-2">
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
        
        <div className="ml-auto">
          <ExportButton 
            filteredDemands={filteredDemandsData} 
            filters={{ 
              role: roleFilter as string[], 
              status: selectedStatus ? [selectedStatus] as any : undefined,
              startMonth: selectedMonth ? [selectedMonth] : undefined,
              account: accountFilter as string[]
            }} 
          />
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
                  
                  {uniqueRoleCodes.map((roleCode) => (
                    <TableHead 
                      key={`role-${roleCode}`} 
                      colSpan={allMonths.length + 1} 
                      className="text-center border-x"
                    >
                      {roleCode}
                    </TableHead>
                  ))}
                  
                  <TableHead rowSpan={2} className="text-center font-bold border-l">
                    Total
                  </TableHead>
                </TableRow>
                
                <TableRow>
                  {uniqueRoleCodes.map(roleCode => (
                    <>
                      {allMonths.map((month) => (
                        <TableHead key={`${roleCode}-${month}`} className="text-center text-xs p-1">
                          {month}
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
                {pivotData.map((accountData, index) => (
                  <TableRow key={`account-${index}`}>
                    <TableCell className="font-medium sticky left-0 bg-background">
                      {accountData.accountName}
                    </TableCell>
                    
                    {uniqueRoleCodes.map(roleCode => (
                      <>
                        {allMonths.map((month) => (
                          <TableCell key={`${accountData.accountName}-${roleCode}-${month}`} className="text-center p-1">
                            {accountData.roles[roleCode]?.[month] || 0}
                          </TableCell>
                        ))}
                        <TableCell className="text-center font-medium bg-muted/30 border-l p-1">
                          {accountData.roles[roleCode]?.total || 0}
                        </TableCell>
                      </>
                    ))}
                    
                    <TableCell className="text-center font-bold bg-muted/20">
                      {accountData.total}
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
