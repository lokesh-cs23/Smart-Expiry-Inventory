import { differenceInDays, parseISO, startOfDay } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, Clock, PackageX } from "lucide-react";

interface ItemStatusBadgeProps {
  expiryDate: string;
  quantity: number;
  category: string;
}

export function ItemStatusBadge({ expiryDate, quantity, category }: ItemStatusBadgeProps) {
  const today = startOfDay(new Date());
  const expDate = startOfDay(parseISO(expiryDate));
  const daysLeft = differenceInDays(expDate, today);
  
  const isMedicine = category.toLowerCase() === 'medicine';
  const isLowStock = quantity < 3;

  if (daysLeft < 0) {
    return (
      <div className="flex flex-col gap-1.5 items-start">
        <Badge variant="destructive" className={`px-2.5 py-1 ${isMedicine ? 'font-bold uppercase tracking-wider shadow-sm shadow-red-500/50' : ''}`}>
          <PackageX className="w-3.5 h-3.5 mr-1.5" />
          Expired {Math.abs(daysLeft)}d ago
          {isMedicine && " - DO NOT USE"}
        </Badge>
        {isLowStock && (
          <Badge variant="outline" className="text-warning border-warning/50 bg-warning/10 px-2 py-0.5 text-xs">
            Low Stock: {quantity}
          </Badge>
        )}
      </div>
    );
  }

  if (daysLeft <= 3) {
    return (
      <div className="flex flex-col gap-1.5 items-start">
        <Badge className={`bg-warning hover:bg-warning/90 text-warning-foreground px-2.5 py-1 ${isMedicine ? 'font-bold bg-red-500 text-white hover:bg-red-600 shadow-sm shadow-red-500/50' : ''}`}>
          <AlertCircle className="w-3.5 h-3.5 mr-1.5" />
          Expiring in {daysLeft}d
          {isMedicine && " - URGENT"}
        </Badge>
        {isLowStock && (
          <Badge variant="outline" className="text-warning border-warning/50 bg-warning/10 px-2 py-0.5 text-xs">
            Low Stock: {quantity}
          </Badge>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5 items-start">
      <Badge className="bg-success/10 text-success hover:bg-success/20 border border-success/20 px-2.5 py-1">
        <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
        Safe ({daysLeft}d left)
      </Badge>
      {isLowStock && (
        <Badge variant="outline" className="text-warning border-warning/50 bg-warning/10 px-2 py-0.5 text-xs">
          Low Stock: {quantity}
        </Badge>
      )}
    </div>
  );
}
