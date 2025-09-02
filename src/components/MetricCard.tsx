import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface MetricCardProps {
  title: string;
  value: string | number;
  hint?: string;
  onClick?: () => void;
}

export const MetricCard = ({ title, value, hint, onClick }: MetricCardProps) => {
  return (
    <Card 
      className="shadow-elevated cursor-pointer transition-all duration-200 hover:shadow-glow hover:scale-105" 
      onClick={onClick}
    >
      <CardHeader>
        <CardTitle className="text-sm text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-semibold tracking-tight">{value}</div>
        {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  );
};
