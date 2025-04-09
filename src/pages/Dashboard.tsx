
import { useState } from "react";
import { useData } from "@/contexts/DataContext";
import { DashboardFilters, Demand } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { FilterDropdown } from "@/components/ui/filter-dropdown";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { Users, DollarSign, BarChart as BarChartIcon, PieChart as PieChartIcon } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";

const Dashboard = () => {
  const { accounts, demands, dashboardKPIs, filterDashboardData, filterDemands } = useData();
  const [filters, setFilters] = useState<DashboardFilters>({});
  const [pivotView, setPivotView] = useState<"role" | "account" | "both">("role");
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [roleFilter, setRoleFilter] = useState<(string | number)[]>([]);
  const [accountFilter, setAccountFilter] = useState<(string | number)[]>([]);
  
  // Calculate filtered KPIs based on current filters
  const filteredKPIs = filterDashboardData(filters);
  
  // Get unique options for filters
  const geoOptions = [...new Set(accounts.map(account => account.geo))].map(geo => ({
    label: geo,
    value: geo,
  }));
  
  const verticalOptions = [...new Set(accounts.map(account => account.vertical))].map(vertical => ({
    label: vertical,
    value: vertical,
  }));
  
  const startMonthOptions = [...new Set(accounts.map(account => account.startMonth))].map(month => ({
    label: month,
    value: month,
  }));
  
  const opportunityStatusOptions = [...new Set(accounts.map(account => account.opportunityStatus))].map(status => ({
    label: status,
    value: status,
  }));
  
  const roleCodeOptions = [...new Set(demands.map(demand => demand.roleCode))].filter(Boolean).map(code => ({
    label: code || "Unknown",
    value: code || "",
  }));
  
  const accountOptions = [...new Set(accounts.map(account => account.client))].filter(Boolean).map(client => ({
    label: client || "Unknown",
    value: client || "",
  }));

  const statusOptions = [
    { label: "Open", value: "Open" },
    { label: "In Progress", value: "In Progress" },
    { label: "Fulfilled", value: "Fulfilled" },
    { label: "Cancelled", value: "Cancelled" }
  ];
  
  // Handle filter changes
  const handleFilterChange = (filterName: keyof DashboardFilters, values: (string | number)[]) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: values.length > 0 ? values as string[] : undefined,
    }));
  };
  
  // Format data for charts
  const geoData = Object.entries(filteredKPIs.opportunitiesByGeo).map(([name, value]) => ({
    name,
    value,
  }));
  
  const verticalData = Object.entries(filteredKPIs.opportunitiesByVertical).map(([name, value]) => ({
    name,
    value,
  }));
  
  const projectStatusData = Object.entries(filteredKPIs.projectStatusBreakdown).map(([name, value]) => ({
    name,
    value,
  }));
  
  const trendData = Object.entries(filteredKPIs.opportunityTrendsByMonth)
    .sort((a, b) => {
      // Sort by month and year
      const [aMonth, aYear] = a[0].split(' ');
      const [bMonth, bYear] = b[0].split(' ');
      if (aYear !== bYear) return Number(aYear) - Number(bYear);
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return months.indexOf(aMonth) - months.indexOf(bMonth);
    })
    .map(([name, value]) => ({
      name,
      count: value,
    }));
  
  // Colors for charts
  const COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#6366f1'];
  
  // Generate Demand Pivot Data
  const generateDemandPivotData = () => {
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
    
    if (pivotView === "role") {
      // Group by role code
      const demandsByRoleCode = filteredDemandsData.reduce((acc, demand) => {
        const key = demand.roleCode || "Unknown";
        if (!acc[key]) {
          acc[key] = [];
        }
        acc[key].push(demand);
        return acc;
      }, {} as Record<string, Demand[]>);
      
      // Create pivot data by month
      return Object.entries(demandsByRoleCode).map(([roleCode, demands]) => {
        // Group by months
        const monthGroups = demands.reduce((acc, demand) => {
          const month = demand.startMonth || "Unknown";
          if (!acc[month]) {
            acc[month] = [];
          }
          acc[month].push(demand);
          return acc;
        }, {} as Record<string, Demand[]>);
        
        // Create the data object
        const dataObj: any = {
          name: roleCode,
          count: demands.length,
        };
        
        // Add counts for each month
        Object.entries(monthGroups).forEach(([month, monthDemands]) => {
          dataObj[month] = monthDemands.length;
        });
        
        // Add status counts for filter display
        dataObj.open = demands.filter(d => d.status === "Open").length;
        dataObj.inProgress = demands.filter(d => d.status === "In Progress").length;
        dataObj.fulfilled = demands.filter(d => d.status === "Fulfilled").length;
        
        return dataObj;
      });
    } else if (pivotView === "account") {
      // Group by account
      const demandsByAccount = filteredDemandsData.reduce((acc, demand) => {
        const account = accounts.find(a => a.id === demand.accountId);
        const key = account ? account.client : "Unknown";
        if (!acc[key]) {
          acc[key] = [];
        }
        acc[key].push(demand);
        return acc;
      }, {} as Record<string, Demand[]>);
      
      // Create pivot data by month
      return Object.entries(demandsByAccount).map(([account, demands]) => {
        // Group by months
        const monthGroups = demands.reduce((acc, demand) => {
          const month = demand.startMonth || "Unknown";
          if (!acc[month]) {
            acc[month] = [];
          }
          acc[month].push(demand);
          return acc;
        }, {} as Record<string, Demand[]>);
        
        // Create the data object
        const dataObj: any = {
          name: account,
          count: demands.length,
        };
        
        // Add counts for each month
        Object.entries(monthGroups).forEach(([month, monthDemands]) => {
          dataObj[month] = monthDemands.length;
        });
        
        // Add status counts
        dataObj.open = demands.filter(d => d.status === "Open").length;
        dataObj.inProgress = demands.filter(d => d.status === "In Progress").length;
        dataObj.fulfilled = demands.filter(d => d.status === "Fulfilled").length;
        
        return dataObj;
      });
    } else {
      // Create a matrix of role code × account
      const pivotMatrix: Record<string, Record<string, number>> = {};
      
      filteredDemandsData.forEach(demand => {
        const account = accounts.find(a => a.id === demand.accountId);
        const accountName = account ? account.client : "Unknown";
        const roleCode = demand.roleCode || "Unknown";
        
        if (!pivotMatrix[roleCode]) {
          pivotMatrix[roleCode] = {};
        }
        
        if (!pivotMatrix[roleCode][accountName]) {
          pivotMatrix[roleCode][accountName] = 0;
        }
        
        pivotMatrix[roleCode][accountName]++;
      });
      
      // Transform to table data
      const accountNames = [...new Set(filteredDemandsData.map(d => {
        const account = accounts.find(a => a.id === d.accountId);
        return account ? account.client : "Unknown";
      }))];
      
      return Object.entries(pivotMatrix).map(([roleCode, accounts]) => {
        const row: any = { name: roleCode };
        accountNames.forEach(accountName => {
          row[accountName] = accounts[accountName] || 0;
        });
        row.total = Object.values(accounts).reduce((sum, count) => sum + count, 0);
        return row;
      });
    }
  };
  
  const pivotData = generateDemandPivotData();
  
  // Get all months from demands for pivot columns
  const allMonths = [...new Set(demands.map(d => d.startMonth).filter(Boolean))];
  
  const pivotColumns = pivotView === "both" 
    ? ["name", ...new Set(demands.map(d => {
        const account = accounts.find(a => a.id === d.accountId);
        return account ? account.client : "Unknown";
      })), "total"]
    : ["name", "count", ...allMonths];
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        
        <div className="flex flex-wrap gap-2">
          <FilterDropdown
            label="Geo"
            options={geoOptions}
            selectedValues={filters.geo || []}
            onChange={(values) => handleFilterChange('geo', values)}
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
            label="Status"
            options={opportunityStatusOptions}
            selectedValues={filters.opportunityStatus || []}
            onChange={(values) => handleFilterChange('opportunityStatus', values)}
          />
        </div>
      </div>
      
      <Tabs defaultValue="accounts">
        <TabsList>
          <TabsTrigger value="accounts">Accounts Dashboard</TabsTrigger>
          <TabsTrigger value="demands">Demands Dashboard</TabsTrigger>
        </TabsList>
        
        <TabsContent value="accounts" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <StatCard
              title="Total Opportunities"
              value={filteredKPIs.totalOpportunities}
              icon={Users}
              description="Total number of projects and opportunities"
            />
            <StatCard
              title="Demand Fulfillment"
              value={`${filteredKPIs.demandFulfillment.percentage}%`}
              icon={DollarSign}
              description={`${filteredKPIs.demandFulfillment.mapped} out of ${filteredKPIs.demandFulfillment.total} demands fulfilled`}
              valueClassName={
                filteredKPIs.demandFulfillment.percentage > 75
                  ? "text-success"
                  : filteredKPIs.demandFulfillment.percentage > 50
                  ? "text-warning"
                  : "text-destructive"
              }
            />
            <StatCard
              title="Active Projects"
              value={filteredKPIs.projectStatusBreakdown["In Progress"] || 0}
              icon={BarChartIcon}
              description="Number of projects currently in progress"
            />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Opportunities by Geo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={geoData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="value" fill="#3b82f6" name="Opportunities" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Opportunities by Vertical</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={verticalData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {verticalData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value, name, props) => [value, props.payload.name]}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Project Status Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={projectStatusData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {projectStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value, name, props) => [value, props.payload.name]}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Opportunity Trends by Start Month</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={trendData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="count" stroke="#8b5cf6" name="Opportunities" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="demands" className="space-y-6">
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
                  <SelectItem value="both">Role × Account</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Month:</span>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All months" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All months</SelectItem>
                  {startMonthOptions.map(option => (
                    <SelectItem key={option.value} value={String(option.value)}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
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
                label="Start Month"
                options={startMonthOptions}
                selectedValues={selectedMonth ? [selectedMonth] : []}
                onChange={(values) => setSelectedMonth(values.length > 0 ? String(values[0]) : "")}
                disabled={!!selectedMonth}
              />
            </div>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>
                {pivotView === "role" 
                  ? "Demand by Role Code" 
                  : pivotView === "account" 
                  ? "Demand by Account" 
                  : "Demand by Role Code and Account"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {pivotColumns.map((column, index) => (
                        <TableHead key={index} className={column === "name" ? "font-bold" : ""}>
                          {column === "name" 
                            ? (pivotView === "role" ? "Role Code" : pivotView === "account" ? "Account" : "Role Code") 
                            : column === "count" ? "Total" 
                            : column === "total" ? "Total" 
                            : column}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pivotData.map((row, i) => (
                      <TableRow key={i}>
                        {pivotColumns.map((column, j) => (
                          <TableCell key={j} className={column === "name" ? "font-medium" : ""}>
                            {row[column] !== undefined ? row[column] : 0}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>
                  {pivotView === "role" 
                    ? "Demand Distribution by Role Code" 
                    : "Demand Distribution by Account"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={pivotData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      {pivotView !== "both" && allMonths.slice(0, 3).map((month, index) => (
                        <Bar key={month} dataKey={month} fill={COLORS[index % COLORS.length]} name={month} />
                      ))}
                      {pivotView === "both" && (
                        <Bar dataKey="total" fill="#8b5cf6" name="Total" />
                      )}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: "Open", value: demands.filter(d => d.status === "Open").length },
                          { name: "In Progress", value: demands.filter(d => d.status === "In Progress").length },
                          { name: "Fulfilled", value: demands.filter(d => d.status === "Fulfilled").length },
                          { name: "Cancelled", value: demands.filter(d => d.status === "Cancelled").length },
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {COLORS.map((color, index) => (
                          <Cell key={`cell-${index}`} fill={color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;
