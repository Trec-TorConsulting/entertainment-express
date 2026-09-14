import React, { useEffect, useState } from "react";
import { Card, Badge, Button, Skeleton, EmptyState, call, useToast } from "@portal-kit";
import { ShoppingBag, Clock, AlertTriangle, CheckCircle2, ArrowRight, ExternalLink } from "lucide-react";

interface SubRentalItem {
  name: string;
  booking: string;
  vendor: string;
  delivery_date: string;
  return_deadline: string;
  total_cost: number;
  customer_price: number;
  status: string;
  purchase_order_ref?: string;
}

export const SubRentalTracker: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<SubRentalItem[]>([]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await call("entertainment_express.api.logistics.list_sub_rentals", {});
      setOrders(res || []);
    } catch (err: any) {
      toast({
        title: "Sub-Rental Orders",
        description: err?.message || "Failed to load sub-rentals.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const getDaysRemaining = (deadlineStr: string) => {
    if (!deadlineStr) return null;
    const deadline = new Date(deadlineStr).getTime();
    const now = new Date().getTime();
    const diffHours = Math.round((deadline - now) / (1000 * 60 * 60));
    return diffHours;
  };

  if (loading) {
    return (
      <Card className="p-4 border border-slate-200 dark:border-slate-800">
        <Skeleton height="100px" />
      </Card>
    );
  }

  if (orders.length === 0) {
    return null;
  }

  return (
    <Card className="p-5 border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-900/60 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-amber-500/10 text-amber-600 rounded-lg">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">
              Sub-Rental Equipment Procurement ({orders.length})
            </h3>
            <p className="text-xs text-slate-500">
              Third-party gear orders, venue delivery dates, and return deadlines
            </p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={fetchOrders} className="text-xs">
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {orders.map((order) => {
          const hoursLeft = getDaysRemaining(order.return_deadline);
          const isUrgent = hoursLeft !== null && hoursLeft <= 24 && hoursLeft >= 0;
          const isOverdue = hoursLeft !== null && hoursLeft < 0;

          return (
            <div
              key={order.name}
              className={`p-3.5 rounded-xl border transition-all ${
                isOverdue
                  ? "border-red-300 bg-red-50/40 dark:bg-red-950/20"
                  : isUrgent
                  ? "border-amber-300 bg-amber-50/40 dark:bg-amber-950/20"
                  : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80"
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-bold text-sm text-slate-900 dark:text-white block">
                    {order.vendor}
                  </span>
                  <span className="text-xs text-slate-500">Booking: {order.booking}</span>
                </div>
                <Badge
                  variant={isOverdue ? "destructive" : isUrgent ? "default" : "outline"}
                  className="text-[10px]"
                >
                  {order.status}
                </Badge>
              </div>

              <div className="mt-3 space-y-1 text-xs">
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                  <span>Delivery:</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {order.delivery_date}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                  <span>Return By:</span>
                  <span
                    className={`font-semibold ${
                      isOverdue
                        ? "text-red-600"
                        : isUrgent
                        ? "text-amber-600"
                        : "text-slate-800 dark:text-slate-200"
                    }`}
                  >
                    {order.return_deadline}
                    {isUrgent && " (Due < 24h)"}
                    {isOverdue && " (Overdue!)"}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">Cost / Billed:</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    ${(order.total_cost || 0).toLocaleString()} / ${(order.customer_price || 0).toLocaleString()}
                  </span>
                </div>
                {order.purchase_order_ref && (
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono pt-1">
                    <span>PO Ref:</span>
                    <span>{order.purchase_order_ref}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

export default SubRentalTracker;
