import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, TrendingUp, TrendingDown } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, AreaChart, Area } from "recharts";
import type { DateRange } from "react-day-picker";

interface MetricDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  metric: {
    title: string;
    value: string | number;
    type: 'spend' | 'impressions' | 'ctr' | 'conversions';
  };
}

const generateMockData = (type: string) => {
  const baseData = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - 29 + i);
    return {
      name: format(date, 'MMM dd'),
      date: date.toISOString().split('T')[0],
    };
  });

  switch (type) {
    case 'spend':
      return baseData.map(item => ({
        ...item,
        value: Math.floor(Math.random() * 150) + 50,
        target: 120,
      }));
    case 'impressions':
      return baseData.map(item => ({
        ...item,
        value: Math.floor(Math.random() * 15000) + 5000,
        target: 10000,
      }));
    case 'ctr':
      return baseData.map(item => ({
        ...item,
        value: (Math.random() * 3 + 1).toFixed(2),
        target: 2.5,
      }));
    case 'conversions':
      return baseData.map(item => ({
        ...item,
        value: Math.floor(Math.random() * 80) + 20,
        target: 50,
      }));
    default:
      return baseData.map(item => ({ ...item, value: 0, target: 0 }));
  }
};

export const MetricDetailModal = ({ isOpen, onClose, metric }: MetricDetailModalProps) => {
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    to: new Date(),
  });

  const data = generateMockData(metric.type);
  const totalValue = data.reduce((sum, item) => sum + Number(item.value), 0);
  const avgValue = (totalValue / data.length).toFixed(1);
  const trend = data[data.length - 1].value > data[data.length - 7].value ? 'up' : 'down';
  const trendPercent = (
    ((Number(data[data.length - 1].value) - Number(data[data.length - 7].value)) / Number(data[data.length - 7].value)) * 100
  ).toFixed(1);

  const renderChart = () => {
    const chartProps = {
      data,
      margin: { top: 10, right: 30, left: 0, bottom: 0 },
    };

    switch (metric.type) {
      case 'spend':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart {...chartProps}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground) / 0.2)" />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip 
                contentStyle={{ 
                  background: "hsl(var(--card))", 
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)"
                }} 
              />
              <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              <Line dataKey="target" stroke="hsl(var(--destructive))" strokeDasharray="3 3" />
            </BarChart>
          </ResponsiveContainer>
        );
      
      case 'impressions':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart {...chartProps}>
              <defs>
                <linearGradient id="impressionsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground) / 0.2)" />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip 
                contentStyle={{ 
                  background: "hsl(var(--card))", 
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)"
                }} 
              />
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke="hsl(var(--primary))" 
                fill="url(#impressionsGradient)" 
                strokeWidth={2} 
              />
            </AreaChart>
          </ResponsiveContainer>
        );
      
      default:
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart {...chartProps}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground) / 0.2)" />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip 
                contentStyle={{ 
                  background: "hsl(var(--card))", 
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)"
                }} 
              />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="hsl(var(--primary))" 
                strokeWidth={3} 
                dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="target" 
                stroke="hsl(var(--muted-foreground))" 
                strokeDasharray="5 5" 
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-2xl">
            {metric.title} Analytics
            <div className={cn(
              "flex items-center gap-1 text-sm px-2 py-1 rounded-full",
              trend === 'up' 
                ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400" 
                : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
            )}>
              {trend === 'up' ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              {trendPercent}%
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Date Range Selector */}
          <div className="flex gap-4 items-center flex-wrap">
            <div className="space-x-2">
              <span className="text-sm text-muted-foreground">Date Range:</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <CalendarIcon className="h-4 w-4" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        `${format(dateRange.from, "MMM dd")} - ${format(dateRange.to, "MMM dd")}`
                      ) : (
                        format(dateRange.from, "MMM dd")
                      )
                    ) : (
                      "Pick a date range"
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={2}
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-card border rounded-lg p-4">
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-2xl font-semibold">
                {metric.type === 'spend' ? `$${totalValue.toFixed(0)}` 
                : metric.type === 'ctr' ? `${avgValue}%`
                : totalValue.toLocaleString()}
              </p>
            </div>
            <div className="bg-card border rounded-lg p-4">
              <p className="text-sm text-muted-foreground">Average</p>
              <p className="text-2xl font-semibold">
                {metric.type === 'spend' ? `$${avgValue}` 
                : metric.type === 'ctr' ? `${avgValue}%`
                : Math.round(Number(avgValue)).toLocaleString()}
              </p>
            </div>
            <div className="bg-card border rounded-lg p-4">
              <p className="text-sm text-muted-foreground">Trend (7 days)</p>
              <p className={cn(
                "text-2xl font-semibold flex items-center gap-1",
                trend === 'up' ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
              )}>
                {trend === 'up' ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                {trendPercent}%
              </p>
            </div>
          </div>

          {/* Chart */}
          <div className="bg-card border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">{metric.title} Trend (Last 30 Days)</h3>
            {renderChart()}
          </div>

          {/* Performance Breakdown */}
          <div className="bg-card border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Performance Breakdown</h3>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-2">Top Performing Days</h4>
                <div className="space-y-2">
                  {data
                    .sort((a, b) => Number(b.value) - Number(a.value))
                    .slice(0, 5)
                    .map((item, index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-muted/50 rounded">
                        <span className="text-sm">{item.name}</span>
                        <span className="text-sm font-medium">
                          {metric.type === 'spend' ? `$${item.value}` 
                          : metric.type === 'ctr' ? `${item.value}%`
                          : item.value.toLocaleString()}
                        </span>
                      </div>
                    ))
                  }
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-2">Weekly Summary</h4>
                <div className="space-y-2">
                  {Array.from({ length: 4 }, (_, i) => {
                    const weekData = data.slice(i * 7, (i + 1) * 7);
                    const weekTotal = weekData.reduce((sum, item) => sum + Number(item.value), 0);
                    const weekAvg = (weekTotal / weekData.length).toFixed(1);
                    return (
                      <div key={i} className="flex justify-between items-center p-2 bg-muted/50 rounded">
                        <span className="text-sm">Week {4 - i}</span>
                        <span className="text-sm font-medium">
                          {metric.type === 'spend' ? `$${weekAvg}` 
                          : metric.type === 'ctr' ? `${weekAvg}%`
                          : Math.round(Number(weekAvg)).toLocaleString()}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};