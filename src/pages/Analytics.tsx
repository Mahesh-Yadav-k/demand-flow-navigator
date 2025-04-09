
import { useState } from "react";
import { useData } from "@/contexts/DataContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, LineChart, Line, PieChart, Pie, Cell } from "recharts";

const AnalyticsPage = () => {
  const { accounts, demands } = useData();
  
  // Colors for charts
  const COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#6366f1'];
  
  // Prepare data for Role Distribution chart
  const roleDistribution = demands.reduce((acc, demand) => {
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
  const fulfillmentByRole = demands.reduce((acc, demand) => {
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
  const totalDemands = demands.length;
  const fulfilledDemands = demands.filter(d => d.status === 'Fulfilled').length;
  const fulfillmentPercentage = Math.round((fulfilledDemands / totalDemands) * 100);
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold">Analytics</h1>
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
              <h3 className="text-3xl font-bold">{demands.length}</h3>
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
                {Math.round(accounts.reduce((acc, a) => acc + a.probability, 0) / accounts.length)}%
              </h3>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="demands">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="demands">Demand Analysis</TabsTrigger>
          <TabsTrigger value="accounts">Account Analysis</TabsTrigger>
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
