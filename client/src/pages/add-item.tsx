import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { useCreateItem, lookupBarcode } from "@/hooks/use-items";
import { insertItemSchema } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage 
} from "@/components/ui/form";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { PackagePlus, ScanBarcode, Loader2, Mail, Camera } from "lucide-react";
import { BarcodeScannerModal } from "@/components/items/barcode-scanner-modal";

export default function AddItem() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const createMutation = useCreateItem();
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const form = useForm<z.infer<typeof insertItemSchema>>({
    resolver: zodResolver(insertItemSchema),
    defaultValues: {
      name: "",
      expiryDate: "",
      quantity: 1,
      category: "Grocery",
      email: "",
      barcode: "",
      isArchived: false,
    },
  });

  const onSubmit = (data: z.infer<typeof insertItemSchema>) => {
    createMutation.mutate(data, {
      onSuccess: () => {
        setLocation("/");
      }
    });
  };

  const handleLookup = async (barcodeToLookup?: string) => {
    const barcode = barcodeToLookup || form.getValues("barcode");
    if (!barcode) {
      toast({ title: "No Barcode", description: "Please enter a barcode first.", variant: "destructive" });
      return;
    }

    setIsLookingUp(true);
    try {
      const data = await lookupBarcode(barcode);
      form.setValue("name", data.name);
      // Auto-set category to Grocery if it's a food product
      if (data.name) {
        form.setValue("category", "Grocery");
      }
      toast({ title: "Found!", description: `Auto-filled name: ${data.name}` });
    } catch (err: any) {
      toast({ title: "Product Not Found", description: "Please enter details manually.", variant: "default" });
    } finally {
      setIsLookingUp(false);
    }
  };

  const handleScan = (barcode: string) => {
    form.setValue("barcode", barcode);
    setIsScannerOpen(false);
    handleLookup(barcode);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <Card className="glass-card overflow-hidden">
        <CardHeader className="border-b border-border/50 bg-muted/20 pb-8">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 text-primary rounded-xl">
              <PackagePlus className="w-6 h-6" />
            </div>
            <div>
              <CardTitle className="text-2xl font-display text-gradient">Add New Item</CardTitle>
              <CardDescription className="text-base mt-1">Track a new inventory item and its expiration date.</CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              <div className="space-y-4 p-5 rounded-2xl bg-secondary/30 border border-border/50">
                <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <ScanBarcode className="w-4 h-4" /> Smart Entry
                </h3>
                <FormField
                  control={form.control}
                  name="barcode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Barcode (Optional)</FormLabel>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <FormControl>
                          <Input placeholder="Scan or type barcode" className="bg-background flex-1" {...field} value={field.value || ''} />
                        </FormControl>
                        <div className="flex gap-2">
                          <Button 
                            type="button" 
                            variant="secondary" 
                            onClick={() => handleLookup()}
                            disabled={isLookingUp}
                            className="flex-1 sm:w-32 shadow-sm font-semibold"
                          >
                            {isLookingUp ? <Loader2 className="w-4 h-4 animate-spin" /> : "Lookup"}
                          </Button>
                          <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => setIsScannerOpen(true)}
                            className="flex-1 sm:w-32 shadow-sm font-semibold border-primary/20 hover:bg-primary/5 hover:text-primary"
                          >
                            <Camera className="w-4 h-4 mr-2" />
                            Scan
                          </Button>
                        </div>
                      </div>
                      <FormDescription>Lookup existing products by barcode or use your camera to scan.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <BarcodeScannerModal 
                isOpen={isScannerOpen} 
                onClose={() => setIsScannerOpen(false)} 
                onScan={handleScan} 
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Item Name <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Organic Milk" className="bg-background focus-visible:ring-primary/50" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category <span className="text-destructive">*</span></FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-background focus-visible:ring-primary/50">
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Grocery">Grocery</SelectItem>
                          <SelectItem value="Medicine">Medicine</SelectItem>
                          <SelectItem value="Personal Care">Personal Care</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="expiryDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expiry Date <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <Input type="date" className="bg-background focus-visible:ring-primary/50" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantity <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min={1}
                          className="bg-background focus-visible:ring-primary/50" 
                          {...field} 
                          onChange={e => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-primary" />
                        Alert Email (Required)
                      </FormLabel>
                      <FormControl>
                        <Input 
                          type="email" 
                          placeholder="your@email.com" 
                          className="bg-background focus-visible:ring-primary/50" 
                          {...field} 
                          value={field.value || ''} 
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        Expiry alerts will be sent to this email.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="pt-6 border-t border-border/50 flex justify-end gap-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setLocation("/")}
                  className="rounded-xl"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createMutation.isPending}
                  className="rounded-xl px-8 shadow-lg shadow-primary/25 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
                >
                  {createMutation.isPending ? "Saving..." : "Save Item"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
