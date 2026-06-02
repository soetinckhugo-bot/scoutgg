"use client";

import { useState } from "react";
import { FileDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { logger } from "@/lib/logger";

interface ExportPdfButtonProps {
  targetId: string;
  fileName?: string;
}

export default function ExportPdfButton({ targetId, fileName }: ExportPdfButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const generatePdf = async () => {
    setIsLoading(true);
    try {
      const element = document.getElementById(targetId);
      if (!element) {
        toast.error("Print element not found");
        setIsLoading(false);
        return;
      }

      // Wait for fonts to load before capturing
      await document.fonts.ready;

      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(element, {
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: "#ffffff",
      });

      const jsPDF = (await import("jspdf")).jsPDF;
      const doc = new jsPDF({ unit: "pt", format: "a4" });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 0;

      const img = new Image();
      img.src = dataUrl;
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = reject;
      });

      const imgWidth = img.naturalWidth;
      const imgHeight = img.naturalHeight;
      const scale = (pageWidth - margin * 2) / imgWidth;
      const scaledHeight = imgHeight * scale;

      let position = 0;
      let currentPage = 0;

      while (position < scaledHeight) {
        if (currentPage > 0) {
          doc.addPage();
        }
        doc.addImage(
          dataUrl,
          "PNG",
          margin,
          margin - position,
          pageWidth - margin * 2,
          scaledHeight,
          undefined,
          "FAST"
        );
        position += pageHeight - margin * 2;
        currentPage++;
      }

      const name = fileName || "scouting-report";
      doc.save(`${name}.pdf`);
      toast.success("Scouting report downloaded");
    } catch (error) {
      logger.error("PDF generation error", { error });
      toast.error("Failed to generate PDF");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={generatePdf}
      disabled={isLoading}
      variant="outline"
      size="sm"
      className="gap-2 border-border text-text-body hover:text-text-heading hover:border-white"
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <FileDown className="h-4 w-4" />
      )}
      Export PDF
    </Button>
  );
}
