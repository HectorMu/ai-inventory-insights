"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useOrders, useCreateOrder, useFulfillOrder, useDeleteOrder } from "@/hooks/use-orders";
import { useProducts } from "@/hooks/use-products";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { formatDate } from "@/lib/utils";
import { ClipboardList, Package, Plus, Trash2, CheckCircle2 } from "lucide-react";
import type { Order } from "@/types/db";

const statusColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "destructive",
  ordered: "secondary",
  received: "default",
  fulfilled: "default",
  cancelled: "outline",
};

const orderSchema = z.object({
  productId: z.number().positive("Select a product"),
  quantity: z.number().int().positive("Qty must be positive"),
});

type OrderFormData = z.infer<typeof orderSchema>;

function NewOrderDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: products } = useProducts();
  const createOrder = useCreateOrder();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<OrderFormData>({
    resolver: zodResolver(orderSchema),
    defaultValues: { productId: 0, quantity: 1 },
  });

  const onSubmit = (data: OrderFormData) => {
    createOrder.mutate(
      { productId: data.productId, quantity: data.quantity },
      {
        onSuccess: () => {
          reset({ productId: 0, quantity: 1 });
          onOpenChange(false);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Restock Order</DialogTitle>
          <DialogDescription>
            Create a new order to restock a product.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="productId">Product</Label>
              <select
                id="productId"
                {...register("productId", { valueAsNumber: true })}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              >
              <option value="">Select a product...</option>
              {products?.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (Stock: {p.stock})
                </option>
              ))}
            </select>
            {errors.productId && <p className="text-xs text-destructive">{errors.productId.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity</Label>
            <Input id="quantity" type="number" min="1" {...register("quantity", { valueAsNumber: true })} />
            {errors.quantity && <p className="text-xs text-destructive">{errors.quantity.message}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createOrder.isPending}>
              Create Order
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteOrderDialog({
  open,
  onOpenChange,
  order,
  onConfirm,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order | null;
  onConfirm: () => void;
  isPending: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Order</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete order #{order?.id} for {order?.productName}?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" variant="destructive" onClick={onConfirm} disabled={isPending}>
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function OrdersPage() {
  const { data: orders, isLoading, error } = useOrders();
  const fulfillOrder = useFulfillOrder();
  const deleteOrder = useDeleteOrder();
  const [newOrderOpen, setNewOrderOpen] = useState(false);
  const [deletingOrder, setDeletingOrder] = useState<Order | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleFulfill = (id: number) => {
    fulfillOrder.mutate(id);
  };

  const handleDelete = () => {
    if (deletingOrder) {
      deleteOrder.mutate(deletingOrder.id);
      setDeleteDialogOpen(false);
      setDeletingOrder(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Restock Orders</h1>
          <p className="text-muted-foreground">
            Track and manage inventory restock orders
          </p>
        </div>
        <Button onClick={() => setNewOrderOpen(true)}>
          <Plus className="h-4 w-4 mr-1" />
          New Order
        </Button>
      </div>

      <NewOrderDialog open={newOrderOpen} onOpenChange={setNewOrderOpen} />

      <DeleteOrderDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        order={deletingOrder}
        onConfirm={handleDelete}
        isPending={deleteOrder.isPending}
      />

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-10 bg-muted rounded animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="text-destructive">Failed to load orders</div>
      ) : orders && orders.length > 0 ? (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="w-32">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-mono text-xs">#{order.id}</TableCell>
                  <TableCell className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    {order.productName}
                  </TableCell>
                  <TableCell>{order.quantity}</TableCell>
                  <TableCell>
                    <Badge variant={statusColors[order.status] ?? "secondary"}>
                      {order.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(order.createdAt)}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {(order.status === "pending" || order.status === "ordered") && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleFulfill(order.id)}
                          disabled={fulfillOrder.isPending}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          Fulfill
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setDeletingOrder(order);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
          <ClipboardList className="h-12 w-12 mb-3" />
          <p className="text-lg font-medium">No orders yet</p>
          <p className="text-sm">
            Ask the AI Analyst to create restock orders for low-stock items.
          </p>
        </div>
      )}
    </div>
  );
}
