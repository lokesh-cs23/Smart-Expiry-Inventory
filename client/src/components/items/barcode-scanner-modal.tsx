import { useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Camera } from "lucide-react";

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (barcode: string) => void;
}

export function BarcodeScannerModal({
  isOpen,
  onClose,
  onScan,
}: BarcodeScannerModalProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const regionId = "reader";

  useEffect(() => {
    if (isOpen) {
      const scanner = new Html5Qrcode(regionId);
      scannerRef.current = scanner;

      scanner
        .start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 150 },
          },
          (decodedText) => {
            onScan(decodedText);
            stopScanner();
          },
          () => {
            // Error scanning, just continue
          }
        )
        .catch((err) => {
          console.error("Failed to start scanner:", err);
        });
    }

    return () => {
      stopScanner();
    };
  }, [isOpen]);

  const stopScanner = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (err) {
        console.error("Failed to stop scanner:", err);
      }
    }
  };

  const handleClose = async () => {
    await stopScanner();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md glass-panel border-t-4 border-t-primary">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-primary" />
            Scan Barcode
          </DialogTitle>
          <DialogDescription>
            Point your camera at a product barcode to scan it.
          </DialogDescription>
        </DialogHeader>

        <div className="relative aspect-video bg-black/5 rounded-xl overflow-hidden border border-border/50">
          <div id={regionId} className="w-full h-full" />
        </div>

        <div className="flex justify-end gap-3 mt-4">
          <Button variant="outline" onClick={handleClose} className="rounded-xl">
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
