"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Upload, FileSpreadsheet, Check, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function OracleImportTab() {
  const [csvContent, setCsvContent] = useState("");
  const [preview, setPreview] = useState<any[]>([]);
  const [importing, setImporting] = useState(false);

  function parseCSV(content: string) {
    const lines = content.trim().split("\n");
    if (lines.length < 2) return [];

    const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
    const rows = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
      const row: any = {};
      headers.forEach((h, idx) => {
        row[h] = values[idx] || "";
      });
      rows.push(row);
    }

    return rows;
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setCsvContent(content);
      const parsed = parseCSV(content);
      setPreview(parsed.slice(0, 5));
      toast.success(`Parsed ${parsed.length} rows from CSV`);
    };
    reader.readAsText(file);
  }

  function handlePaste(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const content = e.target.value;
    setCsvContent(content);
    if (content.trim()) {
      const parsed = parseCSV(content);
      setPreview(parsed.slice(0, 5));
    } else {
      setPreview([]);
    }
  }

  async function handleImport() {
    if (!csvContent.trim()) {
      toast.error("No CSV data to import");
      return;
    }

    setImporting(true);
    try {
      const res = await fetch("/api/import/oracle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv: csvContent }),
      });

      if (res.ok) {
        const data = await res.json();
        toast.success(`Imported ${data.imported} player stats`);
        setCsvContent("");
        setPreview([]);
      } else {
        toast.error("Import failed");
      }
    } catch {
      toast.error("Import failed");
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Upload Card */}
      <Card className="border-[#E9ECEF] dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-[#0F3460]" />
            Import Oracle&apos;s Elixir CSV
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Upload CSV file</Label>
            <Input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="dark:bg-[#1e293b] dark:border-gray-700"
            />
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#E9ECEF] dark:border-gray-700" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white dark:bg-[#0f172a] px-2 text-[#6C757D] dark:text-gray-400">
                or paste CSV content
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label>CSV Content</Label>
            <Textarea
              value={csvContent}
              onChange={handlePaste}
              placeholder={`player,team,position,games,kills,deaths,assists,kda,csdAt15,gdAt15,dpm...
Adam,Team BDS,TOP,15,45,23,89,5.8,12.5,850,720...`}
              rows={8}
              className="dark:bg-[#1e293b] dark:border-gray-700 font-mono text-xs"
            />
          </div>

          <div className="bg-[#F8F9FA] dark:bg-[#1e293b] p-3 rounded-lg">
            <p className="text-xs text-[#6C757D] dark:text-gray-400">
              <AlertCircle className="h-3 w-3 inline mr-1" />
              Expected columns: <strong>player, team, position, games, kda, csdAt15, gdAt15, dpm, kpPercent, visionScore</strong>
            </p>
          </div>

          <Button
            onClick={handleImport}
            disabled={importing || !csvContent}
            className="bg-[#1A1A2E] text-white hover:bg-[#16213E]"
          >
            <Upload className="h-4 w-4 mr-2" />
            {importing ? "Importing..." : "Import Stats"}
          </Button>
        </CardContent>
      </Card>

      {/* Preview */}
      {preview.length > 0 && (
        <Card className="border-[#E9ECEF] dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-lg">Preview (first 5 rows)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#E9ECEF] dark:border-gray-700">
                    {Object.keys(preview[0]).map((key) => (
                      <th key={key} className="text-left p-2 text-xs font-semibold text-[#6C757D] dark:text-gray-400 uppercase">
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.map((row, i) => (
                    <tr key={i} className="border-b border-[#E9ECEF] dark:border-gray-700">
                      {Object.values(row).map((val: any, j) => (
                        <td key={j} className="p-2 text-[#1A1A2E] dark:text-white">
                          {val}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

