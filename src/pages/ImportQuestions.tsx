import { useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Upload, FileSpreadsheet, FileText, File, Loader2, CheckCircle2, X, AlertCircle, Download } from "lucide-react";
import { DarkModeToggle } from "@/components/DarkModeToggle";
import * as XLSX from "xlsx";

interface ParsedQuestion {
  topic: string;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
}

const ACCEPTED_TYPES = [
  ".xlsx", ".xls", ".csv", ".txt", ".docx", ".pdf", ".json"
];

const SAMPLE_DATA = [
  ["topic", "question", "option_a", "option_b", "option_c", "option_d", "correct_answer"],
  ["Networking", "What does HTTP stand for?", "HyperText Transfer Protocol", "High Tech Transfer Protocol", "HyperText Transmission Protocol", "High Transfer Text Protocol", "A"],
];

function normalizeHeaders(headers: string[]): Record<string, number> {
  const map: Record<string, number> = {};
  const aliases: Record<string, string[]> = {
    topic: ["topic", "subject", "category", "chapter"],
    question: ["question", "question_text", "q", "questiontext", "ques"],
    option_a: ["option_a", "a", "optiona", "opt_a", "option a", "choice_a"],
    option_b: ["option_b", "b", "optionb", "opt_b", "option b", "choice_b"],
    option_c: ["option_c", "c", "optionc", "opt_c", "option c", "choice_c"],
    option_d: ["option_d", "d", "optiond", "opt_d", "option d", "choice_d"],
    correct_answer: ["correct_answer", "answer", "correct", "ans", "correctanswer", "correct answer", "key"],
  };

  headers.forEach((h, i) => {
    const clean = h.trim().toLowerCase().replace(/[^a-z0-9_\s]/g, "");
    for (const [field, names] of Object.entries(aliases)) {
      if (names.includes(clean) && !(field in map)) {
        map[field] = i;
      }
    }
  });
  return map;
}

function rowsToQuestions(rows: string[][]): { questions: ParsedQuestion[]; errors: string[] } {
  if (rows.length < 2) return { questions: [], errors: ["File has no data rows"] };

  const headerMap = normalizeHeaders(rows[0]);
  const required = ["topic", "question", "option_a", "option_b", "option_c", "option_d", "correct_answer"];
  const missing = required.filter((f) => !(f in headerMap));

  if (missing.length > 0) {
    return { questions: [], errors: [`Missing columns: ${missing.join(", ")}. Headers found: ${rows[0].join(", ")}`] };
  }

  const questions: ParsedQuestion[] = [];
  const errors: string[] = [];

  rows.slice(1).forEach((row, idx) => {
    const get = (field: string) => (row[headerMap[field]] || "").trim();
    const q = get("question");
    if (!q) {
      errors.push(`Row ${idx + 2}: Missing question text`);
      return;
    }
    const answer = get("correct_answer").toUpperCase();
    if (!["A", "B", "C", "D"].includes(answer)) {
      errors.push(`Row ${idx + 2}: Invalid answer "${answer}" (must be A/B/C/D)`);
      return;
    }
    questions.push({
      topic: get("topic") || "General",
      question: q,
      option_a: get("option_a"),
      option_b: get("option_b"),
      option_c: get("option_c"),
      option_d: get("option_d"),
      correct_answer: answer,
    });
  });

  return { questions, errors };
}

async function parseFile(file: File): Promise<{ rows: string[][]; errors: string[] }> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "";
  const errors: string[] = [];

  // JSON
  if (ext === "json") {
    const text = await file.text();
    try {
      const arr = JSON.parse(text);
      if (!Array.isArray(arr)) return { rows: [], errors: ["JSON must be an array of objects"] };
      if (arr.length === 0) return { rows: [], errors: ["JSON array is empty"] };
      const headers = Object.keys(arr[0]);
      const rows = [headers, ...arr.map((obj: Record<string, unknown>) => headers.map((h) => String(obj[h] ?? "")))];
      return { rows, errors };
    } catch {
      return { rows: [], errors: ["Invalid JSON format"] };
    }
  }

  // Excel / CSV
  if (["xlsx", "xls", "csv"].includes(ext)) {
    const buffer = await file.arrayBuffer();
    const wb = XLSX.read(buffer, { type: "array" });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const rows: string[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
    return { rows: rows.map((r) => r.map(String)), errors };
  }

  // Text
  if (ext === "txt") {
    const text = await file.text();
    // Try tab-delimited first, then comma
    const lines = text.split("\n").filter((l) => l.trim());
    if (lines.length === 0) return { rows: [], errors: ["File is empty"] };
    const delim = lines[0].includes("\t") ? "\t" : ",";
    const rows = lines.map((l) => l.split(delim).map((c) => c.trim().replace(/^"|"$/g, "")));
    return { rows, errors };
  }

  // Word (.docx) via mammoth
  if (ext === "docx") {
    try {
      const mammoth = await import("mammoth");
      const buffer = await file.arrayBuffer();
      const result = await mammoth.convertToHtml({ arrayBuffer: buffer });
      // Try to extract table data from HTML
      const parser = new DOMParser();
      const doc = parser.parseFromString(result.value, "text/html");
      const table = doc.querySelector("table");
      if (table) {
        const rows: string[][] = [];
        table.querySelectorAll("tr").forEach((tr) => {
          const cells: string[] = [];
          tr.querySelectorAll("td, th").forEach((td) => cells.push(td.textContent?.trim() || ""));
          if (cells.length > 0) rows.push(cells);
        });
        return { rows, errors };
      }
      return { rows: [], errors: ["No table found in Word document. Please format questions as a table."] };
    } catch {
      return { rows: [], errors: ["Failed to parse Word document"] };
    }
  }

  return { rows: [], errors: [`Unsupported file type: .${ext}`] };
}

const ImportQuestions = () => {
  const [parsedQuestions, setParsedQuestions] = useState<ParsedQuestion[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [fileName, setFileName] = useState("");
  const [imported, setImported] = useState(false);
  const [importCount, setImportCount] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    setParsing(true);
    setFileName(file.name);
    setParsedQuestions([]);
    setParseErrors([]);
    setImported(false);

    try {
      const { rows, errors: fileErrors } = await parseFile(file);
      if (fileErrors.length > 0 && rows.length === 0) {
        setParseErrors(fileErrors);
        setParsing(false);
        return;
      }
      const { questions, errors: rowErrors } = rowsToQuestions(rows);
      setParsedQuestions(questions);
      setParseErrors([...fileErrors, ...rowErrors]);
    } catch (err) {
      setParseErrors(["Failed to read file. Please check the format."]);
    }
    setParsing(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleImport = async () => {
    if (parsedQuestions.length === 0) return;
    setUploading(true);
    try {
      // Batch insert in chunks of 100
      for (let i = 0; i < parsedQuestions.length; i += 100) {
        const chunk = parsedQuestions.slice(i, i + 100);
        const { error } = await supabase.from("quiz_questions").insert(chunk);
        if (error) throw error;
      }
      setImportCount(parsedQuestions.length);
      setImported(true);
      toast.success(`${parsedQuestions.length} questions imported!`);
    } catch (err: any) {
      toast.error("Import failed: " + (err.message || "Unknown error"));
    }
    setUploading(false);
  };

  const downloadTemplate = (format: "xlsx" | "csv") => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(SAMPLE_DATA);
    ws["!cols"] = SAMPLE_DATA[0].map(() => ({ wch: 20 }));
    XLSX.utils.book_append_sheet(wb, ws, "Questions");
    if (format === "xlsx") {
      XLSX.writeFile(wb, "question_template.xlsx");
    } else {
      XLSX.writeFile(wb, "question_template.csv");
    }
  };

  const reset = () => {
    setParsedQuestions([]);
    setParseErrors([]);
    setFileName("");
    setImported(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="min-h-screen px-4 py-6 max-w-2xl mx-auto">
      <div className="fixed top-4 right-4 z-20">
        <DarkModeToggle />
      </div>

      <Link to="/admin" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mb-4">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
      </Link>

      <div className="mb-6">
        <h1 className="text-xl font-bold mb-1">Import Questions</h1>
        <p className="text-xs text-muted-foreground">Upload questions from Excel, CSV, Word, Text, or JSON files</p>
      </div>

      {/* Template download */}
      <Card className="glass-card mb-4">
        <CardContent className="py-3 px-4">
          <p className="text-xs font-medium mb-2">Download Template</p>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" className="text-xs h-8 gap-1.5" onClick={() => downloadTemplate("xlsx")}>
              <FileSpreadsheet className="w-3.5 h-3.5" /> Excel Template
            </Button>
            <Button variant="outline" size="sm" className="text-xs h-8 gap-1.5" onClick={() => downloadTemplate("csv")}>
              <FileText className="w-3.5 h-3.5" /> CSV Template
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground mt-2">
            Required columns: topic, question, option_a, option_b, option_c, option_d, correct_answer (A/B/C/D)
          </p>
        </CardContent>
      </Card>

      {/* Upload area */}
      {!imported ? (
        <>
          <Card
            className="glass-card mb-4 border-dashed border-2 cursor-pointer hover:border-primary/50 transition-colors"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
          >
            <CardContent className="py-10 flex flex-col items-center text-center">
              {parsing ? (
                <Loader2 className="w-10 h-10 text-primary animate-spin mb-3" />
              ) : (
                <Upload className="w-10 h-10 text-muted-foreground/30 mb-3" />
              )}
              <p className="text-sm font-medium">
                {parsing ? "Parsing file…" : fileName ? fileName : "Drop file here or tap to browse"}
              </p>
              <p className="text-[10px] text-muted-foreground mt-1">
                Supports: .xlsx, .xls, .csv, .txt, .docx, .json
              </p>
              <Input
                ref={fileRef}
                type="file"
                className="hidden"
                accept={ACCEPTED_TYPES.join(",")}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file);
                }}
              />
            </CardContent>
          </Card>

          {/* Errors */}
          {parseErrors.length > 0 && (
            <Card className="mb-4 border-destructive/30 bg-destructive/5">
              <CardContent className="py-3 px-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-medium text-destructive mb-1">Issues found</p>
                    <ul className="space-y-0.5">
                      {parseErrors.slice(0, 10).map((err, i) => (
                        <li key={i} className="text-[10px] text-destructive/80">{err}</li>
                      ))}
                      {parseErrors.length > 10 && (
                        <li className="text-[10px] text-destructive/60">…and {parseErrors.length - 10} more</li>
                      )}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Preview */}
          {parsedQuestions.length > 0 && (
            <Card className="glass-card mb-4">
              <CardHeader className="py-3 px-4 pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm">Preview</CardTitle>
                    <CardDescription className="text-[10px]">
                      {parsedQuestions.length} questions ready to import
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" className="text-xs h-7" onClick={reset}>
                      <X className="w-3 h-3 mr-1" /> Clear
                    </Button>
                    <Button size="sm" className="text-xs h-7 font-semibold" onClick={handleImport} disabled={uploading}>
                      {uploading ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Upload className="w-3 h-3 mr-1" />}
                      Import All
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="py-0 px-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-[10px] w-8">#</TableHead>
                        <TableHead className="text-[10px]">Topic</TableHead>
                        <TableHead className="text-[10px] min-w-[200px]">Question</TableHead>
                        <TableHead className="text-[10px] text-center">Ans</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parsedQuestions.slice(0, 20).map((q, i) => (
                        <TableRow key={i}>
                          <TableCell className="text-[10px] text-muted-foreground">{i + 1}</TableCell>
                          <TableCell className="text-[10px]">
                            <span className="inline-block bg-primary/10 text-primary px-1.5 py-0.5 rounded text-[9px] font-medium">
                              {q.topic}
                            </span>
                          </TableCell>
                          <TableCell className="text-[10px] max-w-[300px] truncate">{q.question}</TableCell>
                          <TableCell className="text-[10px] text-center font-bold text-success">{q.correct_answer}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {parsedQuestions.length > 20 && (
                  <p className="text-center text-[10px] text-muted-foreground py-2">
                    Showing 20 of {parsedQuestions.length} questions
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        /* Success */
        <Card className="glass-card">
          <CardContent className="py-12 text-center">
            <CheckCircle2 className="w-16 h-16 text-success mx-auto mb-4" />
            <h2 className="text-lg font-bold mb-1">{importCount} Questions Imported!</h2>
            <p className="text-xs text-muted-foreground mb-6">Questions are now available in your question bank</p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Link to="/questions">
                <Button size="sm" className="gap-1.5 text-xs">View Question Bank</Button>
              </Link>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={reset}>
                Import More
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ImportQuestions;
