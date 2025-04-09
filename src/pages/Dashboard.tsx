
import { useState } from "react";
import { useData } from "@/contexts/DataContext";
import { DashboardFilters } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { FilterDropdown } from "@/components/ui/filter-dropdown";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { Users, DollarSign, BarChart as BarChartIcon, PieChart as PieChartIcon } from "lucide-react";

const Dashboard = () => {
  const { accounts, demands, dashboardKPIs, filterDashboardData } = useData();
  const [filters, setFilters] = useState<DashboardFilters>({});
  
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
    </div>
  );
};

export default Dashboard;
