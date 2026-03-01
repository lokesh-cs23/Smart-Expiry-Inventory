import { useItemStats, useItems } from "@/hooks/use-items";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts";
import { Loader2 } from "lucide-react";

export default function Analytics() {
  const { data: stats, isLoading: statsLoading } = useItemStats();
  const { data: items = [], isLoading: itemsLoading } = useItems();

  if (statsLoading || itemsLoading) {
    return <div className="flex h-[50vh] items-center justify-center">
      <Loader2 className="w-10 h-10 animate-spin text-primary" />
    </div>;
  }

  const activeItems = items.filter(i => !i.isArchived);

  // Pie Chart Data (Status)
  const pieData = [
    { name: 'Safe', value: stats?.safe || 0, color: '#10b981' },        // emerald-500
    { name: 'Expiring Soon', value: stats?.expiringSoon || 0, color: '#f59e0b' }, // amber-500
    { name: 'Expired', value: stats?.expired || 0, color: '#ef4444' },     // red-500
  ].filter(d => d.value > 0); // Hide empty slices

  // Bar Chart Data (Category Distribution)
  const categoryCounts = activeItems.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const barData = Object.keys(categoryCounts).map(category => ({
    name: category,
    count: categoryCounts[category]
  })).sort((a, b) => b.count - a.count);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-display font-bold text-gradient inline-block">Inventory Analytics</h2>
        <p className="text-muted-foreground mt-2 text-lg">Visual breakdown of your current stock health and categories.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Status Pie Chart */}
        <Card className="glass-card">
          <CardHeader className="border-b border-border/50">
            <CardTitle>Expiry Status Overview</CardTitle>
            <CardDescription>Proportion of items by safety status</CardDescription>
          </CardHeader>
          <CardContent className="pt-8 h-[400px]">
            {pieData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                No data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} 
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Category Bar Chart */}
        <Card className="glass-card">
          <CardHeader className="border-b border-border/50">
            <CardTitle>Items per Category</CardTitle>
            <CardDescription>Distribution of active inventory across categories</CardDescription>
          </CardHeader>
          <CardContent className="pt-8 h-[400px]">
            {barData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                No data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888833" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#888' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#888' }} allowDecimals={false} />
                  <RechartsTooltip 
                    cursor={{ fill: '#88888811' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} 
                  />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]}>
                    {barData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={`hsl(var(--primary) / ${0.7 + (index * 0.1)})`} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
