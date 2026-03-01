import { useState } from "react";
import { useItems, useItemStats, useBulkDeleteItems, useUpdateItem } from "@/hooks/use-items";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { 
  Package, AlertTriangle, XOctagon, CheckCircle, Search, Download, Trash2, Archive, Edit2 
} from "lucide-react";
import { ItemStatusBadge } from "@/components/items/item-status-badge";
import { format, parseISO } from "date-fns";
import { EditItemModal } from "@/components/items/edit-item-modal";
import { type Item } from "@shared/schema";

export default function Dashboard() {
  const { data: items = [], isLoading } = useItems();
  const { data: stats } = useItemStats();
  const bulkDeleteMutation = useBulkDeleteItems();
  const updateMutation = useUpdateItem();
  
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Filter only unarchived items for dashboard
  const activeItems = items.filter(item => !item.isArchived);
  
  const filteredItems = activeItems.filter(item => 
    item.name.toLowerCase().includes(search.toLowerCase()) ||
    item.category.toLowerCase().includes(search.toLowerCase()) ||
    (item.barcode && item.barcode.includes(search))
  );

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredItems.length && filteredItems.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredItems.map(i => i.id)));
    }
  };

  const toggleSelect = (id: number) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    if (confirm(`Are you sure you want to delete ${selectedIds.size} items?`)) {
      bulkDeleteMutation.mutate(Array.from(selectedIds), {
        onSuccess: () => setSelectedIds(new Set())
      });
    }
  };
  
  const handleArchive = (id: number) => {
    updateMutation.mutate({ id, isArchived: true });
  };

  const handleExportCSV = () => {
    const headers = ['ID', 'Name', 'Category', 'Quantity', 'Expiry Date', 'Barcode'];
    const rows = filteredItems.map(i => [
      i.id, 
      `"${i.name.replace(/"/g, '""')}"`, 
      i.category, 
      i.quantity, 
      i.expiryDate, 
      i.barcode || ''
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `inventory-export-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const statCards = [
    { title: "Total Items", value: stats?.total || 0, icon: Package, color: "text-blue-500", bg: "bg-blue-500/10" },
    { title: "Safe", value: stats?.safe || 0, icon: CheckCircle, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { title: "Expiring Soon", value: stats?.expiringSoon || 0, icon: AlertTriangle, color: "text-amber-500", bg: "bg-amber-500/10" },
    { title: "Expired", value: stats?.expired || 0, icon: XOctagon, color: "text-red-500", bg: "bg-red-500/10" },
  ];

  if (isLoading) {
    return <div className="flex h-[50vh] items-center justify-center">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
    </div>;
  }

  return (
    <div className="space-y-8">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <Card key={i} className="glass-card hover:-translate-y-1 transition-transform duration-300">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                <h3 className="text-3xl font-display font-bold mt-2">{stat.value}</h3>
              </div>
              <div className={`p-4 rounded-2xl ${stat.bg} ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Inventory Table Area */}
      <Card className="glass-card border-t-4 border-t-primary overflow-hidden">
        <div className="p-6 border-b border-border/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input 
              placeholder="Search items by name, category, or barcode..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-background/50 border-border focus-visible:ring-primary/50 rounded-xl"
            />
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {selectedIds.size > 0 && (
              <Button 
                variant="destructive" 
                onClick={handleBulkDelete}
                disabled={bulkDeleteMutation.isPending}
                className="shadow-md shadow-destructive/20 rounded-xl w-full sm:w-auto"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete ({selectedIds.size})
              </Button>
            )}
            <Button 
              variant="outline" 
              onClick={handleExportCSV}
              className="rounded-xl w-full sm:w-auto border-border/50 hover:bg-primary/5 hover:text-primary transition-colors"
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="border-border/50 hover:bg-transparent">
                <TableHead className="w-12 text-center">
                  <Checkbox 
                    checked={selectedIds.size === filteredItems.length && filteredItems.length > 0}
                    onCheckedChange={toggleSelectAll}
                    aria-label="Select all"
                  />
                </TableHead>
                <TableHead className="font-semibold">Item Info</TableHead>
                <TableHead className="font-semibold">Category</TableHead>
                <TableHead className="font-semibold">Expiry & Status</TableHead>
                <TableHead className="text-right font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                    <div className="flex flex-col items-center justify-center">
                      <Package className="w-12 h-12 mb-3 text-muted-foreground/50" />
                      <p>No active items found.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredItems.map((item) => (
                  <TableRow key={item.id} className="border-border/50 transition-colors hover:bg-muted/30 group">
                    <TableCell className="text-center align-middle">
                      <Checkbox 
                        checked={selectedIds.has(item.id)}
                        onCheckedChange={() => toggleSelect(item.id)}
                        aria-label={`Select ${item.name}`}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-foreground">{item.name}</div>
                      <div className="text-xs text-muted-foreground mt-1 font-mono">
                        {item.barcode ? `Barcode: ${item.barcode}` : "No Barcode"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
                        {item.category}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="mb-1.5 text-sm font-medium">
                        {format(parseISO(item.expiryDate), 'MMM d, yyyy')}
                      </div>
                      <ItemStatusBadge 
                        expiryDate={item.expiryDate} 
                        quantity={item.quantity} 
                        category={item.category} 
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingItem(item);
                            setIsEditModalOpen(true);
                          }}
                          className="text-muted-foreground hover:text-primary opacity-0 group-hover:opacity-100 transition-all rounded-lg"
                          title="Edit Item"
                        >
                          <Edit2 className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleArchive(item.id)}
                          className="text-muted-foreground hover:text-primary opacity-0 group-hover:opacity-100 transition-all rounded-lg"
                          title="Archive Item"
                        >
                          <Archive className="w-4 h-4 mr-2" />
                          Archive
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <EditItemModal 
        item={editingItem} 
        isOpen={isEditModalOpen} 
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingItem(null);
        }} 
      />
    </div>
  );
}
