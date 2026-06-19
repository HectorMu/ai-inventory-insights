"use client";

import { useState } from "react";
import { useSales } from "@/hooks/use-sales";
import { useSaleDetail } from "@/hooks/use-sale-detail";
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
import { formatCurrency, formatDate } from "@/lib/utils";
import { ChevronDown, ChevronRight, X, Package } from "lucide-react";

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

export function SalesTable() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [category, setCategory] = useState("");
  const [expandedSale, setExpandedSale] = useState<number | null>(null);

  const { data: sales, isLoading, error } = useSales({ from, to, category: category || undefined });

  const hasFilters = from || to || category;

  const toggleExpand = (saleId: number) => {
    setExpandedSale(expandedSale === saleId ? null : saleId);
  };

  return (
    <div className="space-y-4">
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
              </TableRow>
            </TableHeader>
            <TableBody>
              {sales && sales.length > 0 ? (
                sales.map((sale) => (
                  <>
                    <TableRow
                      key={sale.id}
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
                    </TableRow>
                    {expandedSale === sale.id && (
                      <TableRow key={`${sale.id}-detail`}>
                        <TableCell colSpan={4} className="p-0">
                          <SaleDetail saleId={sale.id} />
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
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
