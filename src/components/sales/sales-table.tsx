"use client";

import React, { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSales } from "@/hooks/use-sales";
import { useSaleDetail } from "@/hooks/use-sale-detail";
import { useCreateSale, useDeleteSale } from "@/hooks/use-sales";
import { useProducts } from "@/hooks/use-products";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ChevronDown, ChevronRight, X, Package, Plus, Trash2 } from "lucide-react";

const saleItemSchema = z.object({
  productId: z.number().positive(),
  quantity: z.number().int().positive("Qty must be positive"),
  unitPrice: z.number().nonnegative(),
});

const saleSchema = z.object({
  items: z.array(saleItemSchema).min(1, "At least one item is required"),
});

type SaleFormData = z.infer<typeof saleSchema>;

function SaleDetail({ saleId }: { saleId: number }) {
  const { data: sale, isLoading } = useSaleDetail(saleId);

  if (isLoading) {
    return (
      <div className="p-4 bg-muted/30">
        <div className="h-8 bg-muted rounded animate-pulse w-full" />
      </div>
    );
  }

  if (!sale || sale.items.length === 0) {
    return (
      <div className="p-4 text-sm text-muted-foreground bg-muted/30">
        No items found for this sale.
      </div>
    );
  }

  return (
    <div className="p-4 bg-muted/30">
      <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
        <Package className="h-3 w-3" />
        {sale.items.length} item{sale.items.length !== 1 ? "s" : ""} in this sale
      </p>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Product</TableHead>
            <TableHead>Category</TableHead>
            <TableHead className="text-right">Qty</TableHead>
            <TableHead className="text-right">Unit Price</TableHead>
            <TableHead className="text-right">Line Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sale.items.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-medium">{item.productName}</TableCell>
              <TableCell>
                <Badge variant="secondary">{item.productCategory}</Badge>
              </TableCell>
              <TableCell className="text-right">{item.quantity}</TableCell>
              <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
              <TableCell className="text-right font-medium">
                {formatCurrency(item.quantity * item.unitPrice)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function RecordSaleDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: products } = useProducts();
  const createSale = useCreateSale();

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<SaleFormData>({
    resolver: zodResolver(saleSchema),
    defaultValues: { items: [{ productId: 0, quantity: 1, unitPrice: 0 }] },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });
  const watchedItems = watch("items");

  const total = (watchedItems ?? []).reduce(
    (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0),
    0
  );

  const handleProductChange = (index: number, productId: number) => {
    const product = products?.find((p) => p.id === Number(productId));
    if (product) {
      setValue(`items.${index}.unitPrice`, product.price);
    }
  };

  const onSubmit = (data: SaleFormData) => {
    createSale.mutate(data.items, {
      onSuccess: () => {
        reset({ items: [{ productId: 0, quantity: 1, unitPrice: 0 }] });
        onOpenChange(false);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Record Sale</DialogTitle>
          <DialogDescription>
            Add the items sold in this transaction.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-3">
            {fields.map((field, index) => (
              <div key={field.id} className="flex gap-2 items-end">
                <div className="flex-1 space-y-1">
                  <Label className="text-xs">Product</Label>
                  <select
                    {...register(`items.${index}.productId`, { valueAsNumber: true })}
                    onChange={(e) => {
                      register(`items.${index}.productId`, { valueAsNumber: true }).onChange(e);
                      handleProductChange(index, Number(e.target.value));
                    }}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                  >
                    <option value="">Select...</option>
                    {products?.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({formatCurrency(p.price)})
                      </option>
                    ))}
                  </select>
                  {errors.items?.[index]?.productId && (
                    <p className="text-xs text-destructive">Required</p>
                  )}
                </div>
                <div className="w-20 space-y-1">
                  <Label className="text-xs">Qty</Label>
                  <Input
                    id={`items.${index}.quantity`}
                    type="number"
                    min="1"
                    {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                  />
                  {errors.items?.[index]?.quantity && (
                    <p className="text-xs text-destructive">Invalid</p>
                  )}
                </div>
                <div className="w-24 space-y-1">
                  <Label className="text-xs">Unit Price</Label>
                  <Input
                    type="number"
                    step="0.01"
                    {...register(`items.${index}.unitPrice`, { valueAsNumber: true })}
                  />
                </div>
                {fields.length > 1 && (
                  <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ productId: 0, quantity: 1, unitPrice: 0 })}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Item
          </Button>

          {errors.items && (
            <p className="text-xs text-destructive">{errors.items.message || errors.items.root?.message}</p>
          )}

          <div className="text-right text-sm font-medium">
            Total: {formatCurrency(total)}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createSale.isPending}>
              Record Sale
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteSaleDialog({
  open,
  onOpenChange,
  saleId,
  onConfirm,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  saleId: number | null;
  onConfirm: () => void;
  isPending: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Sale</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete sale #{saleId}? This will restore the products&apos; stock.
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

export function SalesTable() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [category, setCategory] = useState("");
  const [expandedSale, setExpandedSale] = useState<number | null>(null);
  const [recordDialogOpen, setRecordDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingSaleId, setDeletingSaleId] = useState<number | null>(null);

  const { data: sales, isLoading, error } = useSales({ from, to, category: category || undefined });
  const deleteSale = useDeleteSale();

  const hasFilters = from || to || category;

  const toggleExpand = (saleId: number) => {
    setExpandedSale(expandedSale === saleId ? null : saleId);
  };

  const handleDelete = () => {
    if (deletingSaleId) {
      deleteSale.mutate(deletingSaleId);
      setDeleteDialogOpen(false);
      setDeletingSaleId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-end justify-between">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">From</label>
            <Input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="w-40"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">To</label>
            <Input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-40"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="flex h-9 w-40 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
            >
              <option value="">All categories</option>
              <option value="Electronics">Electronics</option>
              <option value="Clothing">Clothing</option>
              <option value="Food & Beverages">Food & Beverages</option>
              <option value="Home & Garden">Home & Garden</option>
            </select>
          </div>
          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFrom("");
                setTo("");
                setCategory("");
              }}
            >
              <X className="h-4 w-4 mr-1" />
              Clear
            </Button>
          )}
        </div>
        <Button onClick={() => setRecordDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Record Sale
        </Button>
      </div>

      <RecordSaleDialog open={recordDialogOpen} onOpenChange={setRecordDialogOpen} />

      <DeleteSaleDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        saleId={deletingSaleId}
        onConfirm={handleDelete}
        isPending={deleteSale.isPending}
      />

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-10 bg-muted rounded animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="text-destructive">Failed to load sales</div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8"></TableHead>
                <TableHead>Sale ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Total</TableHead>
                <TableHead className="w-20">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sales && sales.length > 0 ? (
                sales.map((sale) => (
                  <React.Fragment key={sale.id}>
                    <TableRow
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => toggleExpand(sale.id)}
                    >
                      <TableCell>
                        {expandedSale === sale.id ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-xs">#{sale.id}</TableCell>
                      <TableCell>{formatDate(sale.createdAt)}</TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(sale.total)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeletingSaleId(sale.id);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                    {expandedSale === sale.id && (
                      <TableRow>
                        <TableCell colSpan={5} className="p-0">
                          <SaleDetail saleId={sale.id} />
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No sales found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
