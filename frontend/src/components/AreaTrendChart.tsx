import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

interface Point { name: string; value: number }
interface AreaTrendChartProps { data: Point[]; }

export const AreaTrendChart = ({ data }: AreaTrendChartProps) => {
  const stroke = "hsl(var(--primary))";
  const fill = "hsla(var(--primary) / 0.15)";
  return (
    <div className="h-72 w-full rounded-lg border bg-card p-4 shadow-elevated">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorPrimary" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={stroke} stopOpacity={0.25}/>
              <stop offset="95%" stopColor={stroke} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground) / 0.2)"/>
          <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))"/>
          <YAxis stroke="hsl(var(--muted-foreground))"/>
          <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
          <Area type="monotone" dataKey="value" stroke={stroke} fill="url(#colorPrimary)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
