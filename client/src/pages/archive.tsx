import { useItems, useUpdateItem, useDeleteItem } from "@/hooks/use-items";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { RefreshCcw, Trash2, ArchiveRestore, Package } from "lucide-react";
import { format, parseISO } from "date-fns";
import { Badge } from "@/components/ui/badge";

export default function ArchivePage() {
  const { data: items = [], isLoading } = useItems();
  const updateMutation = useUpdateItem();
  const deleteMutation = useDeleteItem();

  const archivedItems = items.filter(item => item.isArchived);

  const handleRestore = (id: number) => {
    updateMutation.mutate({ id, isArchived: false });
  };

  const handlePermanentDelete = (id: number) => {
    if (confirm("Are you sure you want to permanently delete this item? This cannot be undone.")) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) {
    return <div className="flex h-[50vh] items-center justify-center">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
    </div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-display font-bold inline-block text-muted-foreground flex items-center gap-3">
          <ArchiveRestore className="w-8 h-8" /> Archived Items
        </h2>
        <p className="text-muted-foreground mt-2 text-lg">Review or restore items that were previously archived.</p>
      </div>

      <Card className="glass-card border-t-4 border-t-muted">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/10">
              <TableRow className="border-border/50">
                <TableHead className="font-semibold px-6">Item Info</TableHead>
                <TableHead className="font-semibold">Category</TableHead>
                <TableHead className="font-semibold">Original Expiry</TableHead>
                <TableHead className="text-right font-semibold px-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {archivedItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-16 text-muted-foreground">
                    <div className="flex flex-col items-center justify-center">
                      <Package className="w-12 h-12 mb-3 text-muted-foreground/30" />
                      <p className="text-lg">Archive is empty.</p>
                      <p className="text-sm mt-1 opacity-70">Archived items will appear here.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                archivedItems.map((item) => (
                  <TableRow key={item.id} className="border-border/50 bg-muted/5 hover:bg-muted/20 transition-colors group">
                    <TableCell className="px-6">
                      <div className="font-medium text-foreground opacity-80 line-through decoration-muted-foreground/50">{item.name}</div>
                      <div className="text-xs text-muted-foreground mt-1 font-mono">
                        {item.barcode ? `Barcode: ${item.barcode}` : "No Barcode"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="opacity-80">
                        {item.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="opacity-80">
                      {format(parseISO(item.expiryDate), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell className="text-right px-6">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRestore(item.id)}
                          className="hover:text-primary hover:bg-primary/10 transition-all rounded-lg"
                          disabled={updateMutation.isPending}
                        >
                          <RefreshCcw className="w-4 h-4 mr-2" />
                          Restore
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handlePermanentDelete(item.id)}
                          className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all rounded-lg opacity-50 group-hover:opacity-100"
                          disabled={deleteMutation.isPending}
                          title="Permanently Delete"
                        >
                          <Trash2 className="w-4 h-4" />
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
    </div>
  );
}
