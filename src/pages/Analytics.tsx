import { useState } from "react";
import { useData } from "@/contexts/DataContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FilterDropdown } from "@/components/ui/filter-dropdown";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const AnalyticsPage = () => {
  const { accounts, demands } = useData();
  
  // State for filters
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [selectedAccount, setSelectedAccount] = useState<string>("");
  const [pivotView, setPivotView] = useState<"role" | "account" | "both">("role");
  
  // Colors for charts
  const COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#6366f1'];
  
  // Filter options
  const roleOptions = [...new Set(demands.map(demand => demand.role))].map(role => ({
    label: role,
    value: role,
  }));
  
  const accountOptions = [...new Set(accounts.map(account => account.client))].map(client => ({
    label: client,
    value: client,
  }));
  
  const startMonthOptions = [...new Set(demands.map(demand => demand.startMonth))].map(month => ({
    label: month,
    value: month,
  }));
  
  // Filter demands based on selections
  const filteredDemands = demands.filter(demand => {
    if (selectedMonth && demand.startMonth !== selectedMonth) return false;
    if (selectedRole && demand.role !== selectedRole) return false;
    if (selectedAccount) {
      const account = accounts.find(a => a.id === demand.accountId);
      if (!account || account.client !== selectedAccount) return false;
    }
    return true;
  });
  
  // Prepare data for Role Distribution chart
  const roleDistribution = filteredDemands.reduce((acc, demand) => {
    acc[demand.role] = (acc[demand.role] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const roleDistributionData = Object.entries(roleDistribution)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
  
  // Prepare data for Geo Distribution chart
  const geoDistribution = accounts.reduce((acc, account) => {
    acc[account.geo] = (acc[account.geo] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const geoDistributionData = Object.entries(geoDistribution)
    .map(([name, value]) => ({ name, value }));
  
  // Prepare data for Fulfillment by Role chart
  const fulfillmentByRole = filteredDemands.reduce((acc, demand) => {
    if (!acc[demand.role]) {
      acc[demand.role] = { total: 0, fulfilled: 0 };
    }
    
    acc[demand.role].total += 1;
    
    if (demand.status === 'Fulfilled') {
      acc[demand.role].fulfilled += 1;
    }
    
    return acc;
  }, {} as Record<string, { total: number; fulfilled: number }>);
  
  const fulfillmentByRoleData = Object.entries(fulfillmentByRole)
    .map(([name, { total, fulfilled }]) => ({
      name,
      total,
      fulfilled,
      percentage: Math.round((fulfilled / total) * 100),
    }))
    .sort((a, b) => b.total - a.total);
  
  // Prepare data for Start Month Trend chart
  const startMonthTrend = accounts.reduce((acc, account) => {
    acc[account.startMonth] = (acc[account.startMonth] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const startMonthTrendData = Object.entries(startMonthTrend)
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
      value,
    }));
  
  // Prepare data for Opportunity Status chart
  const statusDistribution = accounts.reduce((acc, account) => {
    acc[account.opportunityStatus] = (acc[account.opportunityStatus] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const statusDistributionData = Object.entries(statusDistribution)
    .map(([name, value]) => ({ name, value }));
  
  // Calculate overall fulfillment percentage
  const totalDemands = filteredDemands.length;
  const fulfilledDemands = filteredDemands.filter(d => d.status === 'Fulfilled').length;
  const fulfillmentPercentage = totalDemands > 0 ? Math.round((fulfilledDemands / totalDemands) * 100) : 0;
  
  // Generate Pivot Data
  const generatePivotData = () => {
    if (pivotView === "role") {
      // Group by role code
      const demandsByRoleCode = filteredDemands.reduce((acc, demand) => {
        const key = demand.roleCode;
        if (!acc[key]) {
          acc[key] = [];
        }
        acc[key].push(demand);
        return acc;
      }, {} as Record<string, typeof filteredDemands>);
      
      return Object.entries(demandsByRoleCode).map(([roleCode, demands]) => ({
        name: roleCode,
        count: demands.length,
        open: demands.filter(d => d.status === "Open").length,
        inProgress: demands.filter(d => d.status === "In Progress").length,
        fulfilled: demands.filter(d => d.status === "Fulfilled").length,
      }));
    } else if (pivotView === "account") {
      // Group by account
      const demandsByAccount = filteredDemands.reduce((acc, demand) => {
        const account = accounts.find(a => a.id === demand.accountId);
        const key = account ? account.client : "Unknown";
        if (!acc[key]) {
          acc[key] = [];
        }
        acc[key].push(demand);
        return acc;
      }, {} as Record<string, typeof filteredDemands>);
      
      return Object.entries(demandsByAccount).map(([account, demands]) => ({
        name: account,
        count: demands.length,
        open: demands.filter(d => d.status === "Open").length,
        inProgress: demands.filter(d => d.status === "In Progress").length,
        fulfilled: demands.filter(d => d.status === "Fulfilled").length,
      }));
    } else {
      // Create a matrix of role code × account
      const pivotMatrix: Record<string, Record<string, number>> = {};
      
      filteredDemands.forEach(demand => {
        const account = accounts.find(a => a.id === demand.accountId);
        const accountName = account ? account.client : "Unknown";
        const roleCode = demand.roleCode;
        
        if (!pivotMatrix[roleCode]) {
          pivotMatrix[roleCode] = {};
        }
        
        if (!pivotMatrix[roleCode][accountName]) {
          pivotMatrix[roleCode][accountName] = 0;
        }
        
        pivotMatrix[roleCode][accountName]++;
      });
      
      // Transform to table data
      const accountNames = [...new Set(filteredDemands.map(d => {
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
  
  const pivotData = generatePivotData();
  const pivotColumns = pivotView === "both" 
    ? ["name", ...new Set(filteredDemands.map(d => {
        const account = accounts.find(a => a.id === d.accountId);
        return account ? account.client : "Unknown";
      })), "total"]
    : ["name", "count", "open", "inProgress", "fulfilled"];
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold">Analytics</h1>
        
        <div className="flex flex-wrap gap-2">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Month" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Months</SelectItem>
              {startMonthOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={selectedRole} onValueChange={setSelectedRole}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Roles</SelectItem>
              {roleOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={selectedAccount} onValueChange={setSelectedAccount}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Account" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Accounts</SelectItem>
              {accountOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Total Accounts</p>
              <h3 className="text-3xl font-bold">{accounts.length}</h3>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Total Demands</p>
              <h3 className="text-3xl font-bold">{filteredDemands.length}</h3>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Fulfillment Rate</p>
              <h3 className="text-3xl font-bold">{fulfillmentPercentage}%</h3>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Avg. Probability</p>
              <h3 className="text-3xl font-bold">
                {filteredDemands.length > 0 
                  ? Math.round(filteredDemands.reduce((acc, d) => acc + d.probability, 0) / filteredDemands.length) 
                  : 0}%
              </h3>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="demands">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="demands">Demand Analysis</TabsTrigger>
          <TabsTrigger value="accounts">Account Analysis</TabsTrigger>
          <TabsTrigger value="pivot">Pivot Analysis</TabsTrigger>
          <TabsTrigger value="forecasting">Forecasting</TabsTrigger>
        </TabsList>
        
        <TabsContent value="demands" className="space-y-6 pt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Role Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={roleDistributionData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="value" fill="#3b82f6" name="Count" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Fulfillment by Role</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={fulfillmentByRoleData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="total" fill="#3b82f6" name="Total" />
                      <Bar dataKey="fulfilled" fill="#10b981" name="Fulfilled" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Fulfillment Percentage by Role</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={fulfillmentByRoleData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <XAxis dataKey="name" />
                    <YAxis
                      label={{ value: 'Percentage (%)', angle: -90, position: 'insideLeft' }}
                      domain={[0, 100]}
                    />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="percentage" fill="#8b5cf6" name="Fulfillment %" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="accounts" className="space-y-6 pt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Geo Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={geoDistributionData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {geoDistributionData.map((entry, index) => (
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
                <CardTitle>Opportunity Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusDistributionData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {statusDistributionData.map((entry, index) => (
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
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Start Month Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={startMonthTrendData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="value" stroke="#8b5cf6" name="Opportunities" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="pivot" className="space-y-6 pt-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
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
                            : column === "open" ? "Open" 
                            : column === "inProgress" ? "In Progress" 
                            : column === "fulfilled" ? "Fulfilled" 
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
                            {row[column]}
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
                      {pivotView !== "both" && (
                        <>
                          <Bar dataKey="open" fill="#f59e0b" name="Open" />
                          <Bar dataKey="inProgress" fill="#3b82f6" name="In Progress" />
                          <Bar dataKey="fulfilled" fill="#10b981" name="Fulfilled" />
                        </>
                      )}
                      {pivotView === "both" && (
                        <Bar dataKey="total" fill="#8b5cf6" name="Total" />
                      )}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="forecasting" className="space-y-6 pt-4">
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <h3 className="text-lg font-medium">Forecasting Module</h3>
              <p className="text-muted-foreground mt-2">
                This advanced analytics feature will be available in the next release.
              </p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalyticsPage;
