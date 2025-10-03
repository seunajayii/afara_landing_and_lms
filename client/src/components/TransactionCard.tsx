import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface TransactionCardProps {
  title: string;
  description: string;
  category: string;
  value?: string;
  location: string;
}

export function TransactionCard({ title, description, category, value, location }: TransactionCardProps) {
  return (
    <Card className="hover-elevate transition-all duration-300" data-testid={`card-transaction-${title.toLowerCase().replace(/\s+/g, "-")}`}>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <Badge variant="secondary" className="text-xs">{category}</Badge>
          {value && <span className="text-sm font-semibold text-primary">{value}</span>}
        </div>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-3">{description}</p>
        <p className="text-xs text-muted-foreground/80">{location}</p>
      </CardContent>
    </Card>
  );
}
