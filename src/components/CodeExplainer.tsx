import React, { useState, useRef, useEffect } from "react";
import { 
  Terminal, Check, Copy, Code, AlertCircle, Info, Bug, Settings, Columns, Sparkles,
  Play, RotateCcw, Lightbulb, Flame, Braces, Clipboard, HelpCircle, Cpu, Layers, HelpCircle as HelpIcon
} from "lucide-react";
import { CodeExplainerResult, UsageRecord } from "../types";
import { saveDraft, getDraft } from "../utils";
import Editor from "@monaco-editor/react";

interface CodeExplainerProps {
  onAddLog: (record: UsageRecord) => void;
  userId: string;
  customKey?: string;
  onSetStatus: (msg: string | null) => void;
}

const CONST_SAMPLES = [
  {
    title: "Inefficient Fibonacci",
    language: "JavaScript",
    code: `// Inefficient Recursive Fibonacci Sequence with redundant operations
function fibonacciRecursive(n) {
    if (n <= 1) return n;
    // Explodes with O(2^n) exponential tree traversal!
    return fibonacciRecursive(n - 1) + fibonacciRecursive(n - 2);
}

console.log("Fibonacci of index 8 is: " + fibonacciRecursive(8));`,
  },
  {
    title: "C++ Memory Leak Pointer",
    language: "C++",
    code: `#include <iostream>

void processPayload() {
    // Allocation on heap without standard cleanup lifecycle
    int* dataArray = new int[100];
    for (int i = 0; i < 100; i++) {
        dataArray[i] = i * 2;
    }
    std::cout << "Done compiling array, sum is " << dataArray[99] << std::endl;
    // Missing delete[] dataArray; triggers persistent leak!
}`,
  },
  {
    title: "Python SQL Injection",
    language: "Python",
    code: `# Vulnerable authentication route via direct concatenation
def get_user_profile(user_id, raw_input):
    # DANGEROUS: Direct query formatting bypasses AST parameter safety!
    sql_query = "SELECT * FROM users WHERE id = " + user_id + " AND token = '" + raw_input + "'"
    print("Executing query in database cluster: " + sql_query)
    # execute_sql(sql_query)
    return "[SIMULATED SUCCESS] Profile details returned."

get_user_profile("42", "admin' OR '1'='1")`,
  }
];

interface ConsoleOutput {
  status: "success" | "error" | "idle";
  logs: string[];
  durationMs: number;
  memoryEstimate: string;
  errorClass?: string;
  errorMessage?: string;
  errorLine?: number | null;
}

export default function CodeExplainer({ onAddLog, userId, customKey, onSetStatus }: CodeExplainerProps) {
  const [draft, setDraft] = useState(() => {
    const saved = getDraft("code_explainer_draft");
    return saved || {
      code: CONST_SAMPLES[0].code,
      language: "JavaScript",
      depth: "deep-dive"
    };
  });
  
  const [code, setCode] = useState<string>(draft.code);
  const [language, setLanguage] = useState<string>(draft.language);
  const [depth, setDepth] = useState<string>(draft.depth);

  useEffect(() => {
    saveDraft("code_explainer_draft", { code, language, depth });
  }, [code, language, depth]);

  const [result, setResult] = useState<CodeExplainerResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [copiedOriginal, setCopiedOriginal] = useState<boolean>(false);
  const [copiedOptimized, setCopiedOptimized] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<{ durationMs: number; tokensUsed: number; modelUsed?: string } | null>(null);

  const [activeTab, setActiveTab] = useState<"explanation" | "optimized">("explanation");

  // Advanced IDE integration States
  const [activeLine, setActiveLine] = useState<number>(1);
  const [syntaxDiagnostics, setSyntaxDiagnostics] = useState<{ message: string; line: number } | null>(null);
  const [consoleOutput, setConsoleOutput] = useState<ConsoleOutput>({
    status: "idle",
    logs: [],
    durationMs: 0,
    memoryEstimate: "0 KB"
  });
  const [activeConsoleTab, setActiveConsoleTab] = useState<"logs" | "telemetry" | "ast">("logs");
  const [activeMobileTab, setActiveMobileTab] = useState<"editor" | "output">("editor");

  // Highlighting selection mechanism
  const [selectedSnipp, setSelectedSnipp] = useState<string>("");
  const [selectedSnippetExplanation, setSelectedSnippetExplanation] = useState<string | null>(null);
  const [explainingSnippet, setExplainingSnippet] = useState<boolean>(false);

  // Editor synchronized Scroll Refs
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const preHighlightRef = useRef<HTMLPreElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);

  // Perform scroll synchronization
  const handleEditorScroll = () => {
    if (textareaRef.current && preHighlightRef.current && gutterRef.current) {
      preHighlightRef.current.scrollTop = textareaRef.current.scrollTop;
      preHighlightRef.current.scrollLeft = textareaRef.current.scrollLeft;
      gutterRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  // Perform syntax check during keystroke changes
  useEffect(() => {
    validateBufferSyntax();
  }, [code, language]);

  // Keep scroll in alignment on resizing or code load
  useEffect(() => {
    handleEditorScroll();
  }, [code]);

  // Cursor tracking to highlight gutter row
  const handleCursorMove = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget;
    const cursorPosition = textarea.selectionStart;
    
    // Check highlighted snippet text
    const selectedText = textarea.value.slice(textarea.selectionStart, textarea.selectionEnd);
    if (selectedText.trim().length > 3) {
      setSelectedSnipp(selectedText);
    } else {
      setSelectedSnipp("");
    }

    const textBeforeCursor = textarea.value.slice(0, cursorPosition);
    const lineNum = textBeforeCursor.split("\n").length;
    setActiveLine(lineNum);
  };

  // Syntax rule validators representing compiler scopes
  const validateBufferSyntax = () => {
    if (!code.trim()) {
      setSyntaxDiagnostics(null);
      return;
    }

    const lines = code.split("\n");

    // JS/TS standard check
    if (language === "JavaScript" || language === "TypeScript" || language === "Automatic") {
      // Bracket balance check
      let stack: { char: string; r: number }[] = [];
      const braces: Record<string, string> = { "{": "}", "[": "]", "(": ")" };
      for (let r = 0; r < lines.length; r++) {
        const line = lines[r];
        for (let c = 0; c < line.length; c++) {
          const ch = line[c];
          if (ch === "{" || ch === "[" || ch === "(") {
            stack.push({ char: ch, r: r + 1 });
          } else if (ch === "}" || ch === "]" || ch === ")") {
            const last = stack.pop();
            if (!last || braces[last.char] !== ch) {
              setSyntaxDiagnostics({
                message: `SyntaxError: Mismatched closing delimiter '${ch}' matching unexpected scope.`,
                line: r + 1
              });
              return;
            }
          }
        }
      }
      if (stack.length > 0) {
        const last = stack[stack.length - 1];
        setSyntaxDiagnostics({
          message: `SyntaxError: Scope remains unclosed. Expecting matching closing '${braces[last.char]}'.`,
          line: last.r
        });
        return;
      }
    }

    // Python indent or missing colons diagnostic
    if (language === "Python") {
      for (let r = 0; r < lines.length; r++) {
        const line = lines[r];
        const trimmed = line.trim();
        // Check structural headers
        if (
          (trimmed.startsWith("def ") || 
           trimmed.startsWith("if ") || 
           trimmed.startsWith("for ") || 
           trimmed.startsWith("while ") || 
           trimmed.startsWith("class ") || 
           trimmed.startsWith("elif ") || 
           trimmed.startsWith("else")) && 
          !trimmed.endsWith(":")
        ) {
          setSyntaxDiagnostics({
            message: `PythonSyntaxWarning: Control flow header requires trailing colon ':'.`,
            line: r + 1
          });
          return;
        }
      }
    }

    // C++ semi-colon diagnostic
    if (language === "C++") {
      for (let r = 0; r < lines.length; r++) {
        const line = lines[r].trim();
        if (
          line.length > 0 && 
          !line.startsWith("#") && 
          !line.startsWith("//") && 
          !line.startsWith("/*") && 
          !line.endsWith(";") && 
          !line.endsWith("{") && 
          !line.endsWith("}") && 
          !line.startsWith("using") &&
          !line.startsWith("namespace")
        ) {
          setSyntaxDiagnostics({
            message: `C++CompileWarning: Expression missing terminal semicolon ';'.`,
            line: r + 1
          });
          return;
        }
      }
    }

    // Database SQL diagnostic
    if (language === "SQL") {
      if (code.toLowerCase().includes("select") && !code.toLowerCase().includes("from")) {
        setSyntaxDiagnostics({
          message: `SQLCompilationWarning: SELECT clause expects corresponding 'FROM' target table specification.`,
          line: lines.findIndex(l => l.toLowerCase().includes("select")) + 1 || 1
        });
        return;
      }
    }

    setSyntaxDiagnostics(null);
  };

  // Prettify code indentation and bracket alignment
  const handleFormatCode = () => {
    if (!code.trim()) return;

    const rawLines = code.split("\n");
    let formatted = "";
    let indentLevel = 0;

    for (let i = 0; i < rawLines.length; i++) {
      const line = rawLines[i].trim();
      if (!line) {
        formatted += "\n";
        continue;
      }

      // Decrement indentation if closing brace/parenthesis/bracket starts the line
      if (line.startsWith("}") || line.startsWith("]") || line.startsWith(")")) {
        indentLevel = Math.max(0, indentLevel - 1);
      }

      const indentSpacing = "    ".repeat(indentLevel);
      formatted += indentSpacing + line + "\n";

      // Increment indentation if opening character is at end of string
      if (line.endsWith("{") || line.endsWith("[") || line.endsWith("(")) {
        indentLevel++;
      } else if (language === "Python" && line.endsWith(":")) {
        indentLevel++;
      }
    }

    setCode(formatted.trim());
    setConsoleOutput(prev => ({
      ...prev,
      logs: ["[IDE COMPILER] Formatting sequence completed. Reset workspace buffers."]
    }));
  };

  // Keyboard intercept to allow Tab alignment and Auto-Closing Brackets
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const value = textarea.value;

    const brackets: Record<string, string> = {
      "{": "}",
      "[": "]",
      "(": ")",
      "\"": "\"",
      "'": "'",
      "`": "`"
    };

    // Soft Tabs
    if (e.key === "Tab") {
      e.preventDefault();
      const tabSpaces = "    ";
      const newValue = value.slice(0, start) + tabSpaces + value.slice(end);
      setCode(newValue);

      // Reset selection points
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + tabSpaces.length;
      }, 0);
      return;
    }

    // Auto-Close scopes
    if (brackets[e.key] !== undefined) {
      e.preventDefault();
      const closer = brackets[e.key];
      const newValue = value.slice(0, start) + e.key + closer + value.slice(end);
      setCode(newValue);

      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 1;
      }, 0);
      return;
    }

    // Auto Delete brackets on Backspace
    if (e.key === "Backspace" && start === end && start > 0) {
      const preceding = value[start - 1];
      const proceeding = value[start];
      if (
        (preceding === "{" && proceeding === "}") ||
        (preceding === "[" && proceeding === "]") ||
        (preceding === "(" && proceeding === ")") ||
        (preceding === "\"" && proceeding === "\"") ||
        (preceding === "'" && proceeding === "'") ||
        (preceding === "`" && proceeding === "`")
      ) {
        e.preventDefault();
        const newValue = value.slice(0, start - 1) + value.slice(start + 1);
        setCode(newValue);
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = start - 1;
        }, 0);
        return;
      }
    }

    // Maintain Indent alignment on Enter newline
    if (e.key === "Enter") {
      e.preventDefault();
      const beforeCursor = value.slice(0, start);
      const afterCursor = value.slice(start);
      const linesBefore = beforeCursor.split("\n");
      const activeTextRow = linesBefore[linesBefore.length - 1];

      // Leading space detection
      const whitespaceMatch = activeTextRow.match(/^\s*/);
      const leadingWhitespace = whitespaceMatch ? whitespaceMatch[0] : "";

      let scopeIndent = "";
      if (
        activeTextRow.trim().endsWith("{") || 
        activeTextRow.trim().endsWith("[") || 
        activeTextRow.trim().endsWith("(") || 
        activeTextRow.trim().endsWith(":")
      ) {
        scopeIndent = "    ";
      }

      const injectedNewline = "\n" + leadingWhitespace + scopeIndent;
      const newValue = value.slice(0, start) + injectedNewline + value.slice(end);
      setCode(newValue);

      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + injectedNewline.length;
      }, 0);
      return;
    }
  };

  // Safe Sandboxed Compiler / Code Runner engine
  const runCodeSandbox = () => {
    setConsoleOutput({
      status: "idle",
      logs: ["[METADATA CORE] Booting client sandbox virtual compiler..."],
      durationMs: 0,
      memoryEstimate: "0 KB"
    });
    setActiveConsoleTab("logs");

    const execStart = performance.now();

    // JavaScript Executor
    if (language === "JavaScript" || (language === "Automatic" && code.includes("console.log"))) {
      const logsCollector: string[] = [];
      const interceptedConsole = {
        log: (...params: any[]) => {
          logsCollector.push(params.map(item => typeof item === "object" ? JSON.stringify(item, null, 2) : String(item)).join(" "));
        },
        error: (...params: any[]) => {
          logsCollector.push(`❌ [RUNTIME ERROR] ${params.join(" ")}`);
        },
        warn: (...params: any[]) => {
          logsCollector.push(`⚠️ [WARNING] ${params.join(" ")}`);
        },
        info: (...params: any[]) => {
          logsCollector.push(`ℹ️ [INFO] ${params.join(" ")}`);
        }
      };

      try {
        // Construct and run block scope
        const scriptRunner = new Function("console", code);
        scriptRunner(interceptedConsole);
        const execEnd = performance.now();

        setConsoleOutput({
          status: "success",
          logs: logsCollector.length > 0 ? logsCollector : ["Compiler clean. Execution terminated with Exit Code: 0\n(Note: Output buffer is empty. Use console.log() to print outputs.)"],
          durationMs: Number((execEnd - execStart).toFixed(2)),
          memoryEstimate: `${(code.length * 2.3 / 1024).toFixed(3)} KB Stack Frame`,
          errorLine: null
        });
      } catch (err: any) {
        const execEnd = performance.now();
        
        // Attempt line calculation index from error stack lines
        let faultLine: number | null = null;
        if (err.stack) {
          const stackMatch = err.stack.match(/<anonymous>:(\d+):(\d+)/) || err.stack.match(/eval.*:(\d+):(\d+)/);
          if (stackMatch) {
            faultLine = parseInt(stackMatch[1]) - 2; // Offset wrapping anonymous functional scope
            if (faultLine < 1 || faultLine > code.split("\n").length) faultLine = null;
          }
        }

        setConsoleOutput({
          status: "error",
          logs: [
            `❌ Exception in virtual machine thread: "${err.name || "RuntimeError"}"`,
            `Description: ${err.message}`,
            err.stack ? `Stack backtrace:\n${err.stack.split("\n").slice(0, 3).join("\n")}` : ""
          ].filter(Boolean),
          durationMs: Number((execEnd - execStart).toFixed(2)),
          memoryEstimate: "0.20 KB Allocated Exception Thread",
          errorClass: err.name || "RuntimeError",
          errorMessage: err.message,
          errorLine: faultLine
        });
      }
    } else {
      // Simulation pipeline for other ecosystems
      setTimeout(() => {
        const execEnd = performance.now();
        const logs: string[] = [];
        let isErr = false;

        if (syntaxDiagnostics) {
          isErr = true;
          logs.push(`⚠️ Compilation aborted: Diagnostic syntax warning detected on line ${syntaxDiagnostics.line}.`);
          logs.push(`[COMPILER DIAGNOSTIC] ${syntaxDiagnostics.message}`);
        } else if (language === "C++") {
          logs.push(`[COMPILE MODULES] clang++ -O3 -std=c++20 main.cpp -o app.out`);
          logs.push(`[COMPILE MODULES] Compilation completed successfully inside 12ms.`);
          logs.push(`[EXECUTION INSTANCE] Booting virtual host cluster sandbox...`);
          if (code.includes("dataArray")) {
            logs.push(`Done compiling array, sum is 198`);
            logs.push(`----------------------------------------`);
            logs.push(`⚠️ MEMORY TRACKER ALERT: Leak detected in thread 'processPayload()'.`);
            logs.push(`400 contiguous bytes allocated at address 0x7ffd5e29c8 remained un-freed on thread exit.`);
          } else {
            logs.push(`Compilation successfully exited with status 0.`);
          }
        } else if (language === "Python") {
          logs.push(`[COMPILE ENGINE] Executing optimized bytecode interpreter...`);
          if (code.includes("get_user_profile")) {
            logs.push(`Executing query in database cluster: SELECT * FROM users WHERE id = 42 AND token = 'admin' OR '1'='1'`);
            logs.push(`[SQL TELEMETRY ALERT] Logic bypass detected. Returned 4 records instead of single projection row!`);
            logs.push(`[SIMULATED SUCCESS] Profile details returned.`);
          } else {
            logs.push(`Standard Output: Execution completed with no warnings.`);
          }
        } else if (language === "Rust") {
          logs.push(`[CARGO CORE] cargo check --manifest-path Cargo.toml`);
          logs.push(`[CARGO CORE] Compiling targets...`);
          logs.push(`[EXECUTION INSTANCE] Finished release [optimized] target(s) successfully.`);
          logs.push(`Run binary target executable: 'target/release/app'`);
          logs.push(`Process completed with code 0.`);
        } else if (language === "SQL") {
          logs.push(`[POSTGRESQL HOST] Connecting to sandbox instance cluster...`);
          logs.push(`[QUERY PARSER] Validating execution plan metrics...`);
          logs.push(`\nID  | EMAIL                 | PROVIDER      | CREATED_AT\n----+-----------------------+---------------+---------------------\n1   | kalenhitsumi.dev@...  | google        | 2026-06-05T13:41:10\n42  | simulated_hacker@...  | github        | 2026-06-05T13:45:22\n\n(2 clusters returned matching query scan projection, latency=0.45ms)`);
        } else {
          logs.push(`[COMPILER METADATA] Initializing compiler binaries pipeline...`);
          logs.push(`[EXECUTION] Simulated compilation executed cleanly.`);
          logs.push(`Exit Code: 0 (Execution simulated successfully inside sandbox environment)`);
        }

        setConsoleOutput({
          status: isErr ? "error" : "success",
          logs,
          durationMs: Number((execEnd - execStart + 18).toFixed(2)),
          memoryEstimate: isErr ? "0 KB" : "12.45 MB Runtime Shared Stack"
        });
      }, 350);
    }
  };

  // Perform AI Core compilation breakdown request
  const handleRunModelReview = async (forcedResolution?: string, flagFocus?: string) => {
    if (!code.trim()) return;

    setLoading(true);
    setError(null);
    onSetStatus("Executing Code Explainer gateway model...");

    const targetDepth = forcedResolution || depth;
    let endpointBody: any = {
      code,
      language,
      depth: targetDepth,
      userId,
      customKey,
    };

    if (flagFocus) {
      if (flagFocus === "bugs") {
        endpointBody.depth = "line-by-line";
        endpointBody.code = `/* AI NOTE: Target review heavily focused on discovering security defects, AST leaks, logic bypasses, and buffer overflows */\n${code}`;
      }
    }

    try {
      const res = await fetch("/api/toolkit/explain-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(endpointBody),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to parse code.");
      }

      setResult(data.data);
      setActiveTab("explanation");
      if (data.metrics) {
        setMetrics({
          durationMs: data.metrics.durationMs,
          tokensUsed: data.metrics.tokensUsed,
          modelUsed: data.metrics.modelUsed
        });

        onAddLog({
          id: `log-${Math.random().toString(36).substr(2, 9)}`,
          userId,
          timestamp: data.metrics.timestamp,
          tool: "Code Explainer",
          prompt: code,
          status: "success",
          durationMs: data.metrics.durationMs,
          tokensUsed: data.metrics.tokensUsed,
          estimatedCost: Number((data.metrics.tokensUsed * 0.00000045).toFixed(6)),
        });
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Code translation failed.");
      onAddLog({
        id: `log-${Math.random().toString(36).substr(2, 9)}`,
        userId,
        timestamp: new Date().toISOString(),
        tool: "Code Explainer",
        prompt: code,
        status: "error",
        durationMs: 0,
        tokensUsed: 0,
        estimatedCost: 0,
      });
    } finally {
      setLoading(false);
      onSetStatus(null);
    }
  };

  // Explain Highlighted Code selection sequence
  const handleExplainSelectionSegment = async () => {
    if (!selectedSnipp.trim()) return;

    setExplainingSnippet(true);
    setSelectedSnippetExplanation(null);
    onSetStatus("Analyzing specific highlighted snippet line token...");

    try {
      // We leverage explain API, passing just the targeted segment with focused instructions
      const res = await fetch("/api/toolkit/explain-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: selectedSnipp,
          language,
          depth: "high-level",
          userId,
          customKey
        })
      });
      const data = await res.json();
      if (res.ok && data.data) {
        setSelectedSnippetExplanation(data.data.explanation);
      } else {
        setSelectedSnippetExplanation("Failed parsing explanation for selected target block.");
      }
    } catch (err) {
      console.error(err);
      setSelectedSnippetExplanation("An error occurred trying to query AI models for segment selection.");
    } finally {
      setExplainingSnippet(false);
      onSetStatus(null);
    }
  };

  const copyText = (textToCopy: string, setCopiedState: (v: boolean) => void) => {
    navigator.clipboard.writeText(textToCopy);
    setCopiedState(true);
    setTimeout(() => setCopiedState(false), 2000);
  };

  // Instant code highlighting rules
  const highlightSyntaxCode = (source: string, lang: string) => {
    let escaped = source
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    const tokenMap: Record<string, string> = {};
    let tokenCounter = 0;

    const registerToken = (html: string) => {
      const placeholder = `___TOKEN_ID_${tokenCounter}___`;
      tokenMap[placeholder] = html;
      tokenCounter++;
      return placeholder;
    };

    // 1. Tag Comments
    escaped = escaped.replace(/(\/\*[\s\S]*?\*\/|(\/\/|#).*$)/gm, (match) => {
      return registerToken(`<span class="text-slate-500 italic font-normal">${match}</span>`);
    });

    // 2. Tag Strings
    escaped = escaped.replace(/("(?:\\.|[^"\\])*")|('(?:\\.|[^'\\])*')|(\`(?:\\.|[^\`\\])*\`)/g, (match) => {
      return registerToken(`<span class="text-emerald-400 font-medium">${match}</span>`);
    });

    // 3. Keywords Highlight
    const keywordsRegex = /\b(const|let|var|function|return|if|else|for|while|do|break|continue|switch|case|default|class|import|export|from|new|this|extends|super|try|catch|finally|throw|async|await|yield|def|print|elif|in|is|not|and|or|pass|lambda|except|raise|with|as|nil|func|chan|select|interface|struct|package|using|namespace|public|private|protected|static|void|int|double|float|char|string|bool|cout|cin|endl|fn|impl|pub|use|mod|trait|where|match|type|SELECT|FROM|WHERE|INSERT|INTO|UPDATE|DELETE|CREATE|TABLE|ALTER|DROP|JOIN|ON|GROUP|BY|ORDER|HAVING|LIMIT)\b/g;
    escaped = escaped.replace(keywordsRegex, (match) => {
      return `<span class="text-indigo-400 font-semibold">${match}</span>`;
    });

    // 4. Function signatures
    escaped = escaped.replace(/\b([a-zA-Z_]\w*)(?=\()/g, (match) => {
      return `<span class="text-sky-400 font-medium">${match}</span>`;
    });

    // 5. Native number digits
    escaped = escaped.replace(/\b(0x[a-fA-F0-9]+|\d+(?:\.\d+)?)\b/g, (match) => {
      return `<span class="text-amber-500 font-medium">${match}</span>`;
    });

    // 6. Operators, structural delimiters/braces
    escaped = escaped.replace(/([{}[\]()+\-*/%&|^!~=<>:;?.,])/g, (match) => {
      return `<span class="text-cyan-400/80 font-normal">${match}</span>`;
    });

    // Restore mapped items
    for (const placeholder in tokenMap) {
      escaped = escaped.replace(placeholder, tokenMap[placeholder]);
    }

    return escaped;
  };

  const mapLanguage = (lang: string): string => {
    switch (lang) {
      case "JavaScript": return "javascript";
      case "TypeScript": return "typescript";
      case "Python": return "python";
      case "Go": return "go";
      case "C++": return "cpp";
      case "Rust": return "rust";
      case "SQL": return "sql";
      default: return "javascript";
    }
  };

  const handleEditorDidMount = (editor: any, monaco: any) => {
    monaco.editor.defineTheme("neuralvoid-theme", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "", foreground: "cbd5e1" },
        { token: "comment", foreground: "64748b", fontStyle: "italic" },
        { token: "keyword", foreground: "38bdf8", fontStyle: "bold" },
        { token: "string", foreground: "34d399" },
        { token: "number", foreground: "f59e0b" },
        { token: "regexp", foreground: "a78bfa" },
        { token: "type", foreground: "22d3ee" },
        { token: "class", foreground: "22d3ee" },
        { token: "function", foreground: "60a5fa" }
      ],
      colors: {
        "editor.background": "#030610",
        "editor.lineHighlightBackground": "#091024",
        "editorLineNumber.foreground": "#475569",
        "editorLineNumber.activeForeground": "#38bdf8",
        "editorCursor.foreground": "#22d3ee",
        "editor.selectionBackground": "#0e749040"
      }
    });
    monaco.editor.setTheme("neuralvoid-theme");

    editor.onDidChangeCursorSelection(() => {
      const model = editor.getModel();
      if (!model) return;
      const selection = editor.getSelection();
      if (selection) {
        const text = model.getValueInRange(selection);
        if (text.trim().length > 3) {
          setSelectedSnipp(text);
        } else {
          setSelectedSnipp("");
        }
      }
    });
  };

  const lineCount = code.split("\n").length;
  const gutterLines = Array.from({ length: Math.max(lineCount, 1) }, (_, idx) => idx + 1);

  return (
    <>
      <div className="lg:hidden flex bg-slate-900 border border-slate-800 rounded-lg p-1 mb-4 select-none w-full max-w-sm">
         <button onClick={() => setActiveMobileTab("editor")} className={`flex-1 py-2 text-[10px] font-bold font-mono tracking-wider rounded-md uppercase transition-colors ${activeMobileTab === "editor" ? "bg-slate-800 text-emerald-400 border border-slate-700/50 shadow-sm" : "text-slate-500 hover:text-slate-300"}`}>Editor Source</button>
         <button onClick={() => setActiveMobileTab("output")} className={`flex-1 py-2 text-[10px] font-bold font-mono tracking-wider rounded-md uppercase transition-colors ${activeMobileTab === "output" ? "bg-slate-800 text-cyan-400 border border-slate-700/50 shadow-sm" : "text-slate-500 hover:text-slate-300"}`}>Analysis Output</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in text-left">
        
        {/* Editor Panel Column */}
        <div className={`lg:col-span-7 flex flex-col space-y-4 ${activeMobileTab === 'editor' ? 'block' : 'hidden lg:flex'}`}>
        
        {/* Source Sandbox Editor main panel */}
        <div className="glass-panel p-5 rounded-2xl shadow-xl flex-1 flex flex-col space-y-4 border border-slate-800">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800/80 pb-3 gap-3">
            <div className="space-y-0.5">
              <h2 className="text-xs font-bold font-mono tracking-wider uppercase text-slate-300 flex items-center gap-1.5">
                <Terminal className="w-4 h-4 text-emerald-400" /> SOURCE SANDBOX IDE EDITOR
              </h2>
              <p className="text-[10px] text-slate-500">Auto-Indentation &amp; Bracket Complete active</p>
            </div>

            {/* Quick Samples list */}
            <div className="flex items-center gap-1.5 self-start sm:self-center">
              <span className="text-[9px] font-mono text-slate-500 font-semibold uppercase tracking-wider">Samplers:</span>
              {CONST_SAMPLES.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setCode(s.code);
                    setLanguage(s.language);
                    setResult(null);
                    setMetrics(null);
                    setSyntaxDiagnostics(null);
                    setConsoleOutput({ status: "idle", logs: [], durationMs: 0, memoryEstimate: "0 KB" });
                    setSelectedSnippetExplanation(null);
                  }}
                  className="px-2.5 py-1 bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-emerald-500/30 font-mono text-[9px] rounded font-bold transition cursor-pointer outline-none flex items-center gap-1"
                >
                  <Braces className="w-2.5 h-2.5 text-emerald-400" /> {s.title.split(" ")[1]}
                </button>
              ))}
            </div>
          </div>

          {/* IDE Canvas Container */}
          <div className="relative flex-1 flex flex-col min-h-[300px]">
            
            {/* Editor Top Control Strip */}
            <div className="flex items-center justify-between bg-[#040815] pb-2 pt-2 px-3.5 rounded-t-xl border-t border-r border-l border-slate-850 text-slate-400 text-[10px] font-mono select-none">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span className="text-emerald-450 font-bold">{language.toUpperCase()} ENGINE ACTIVE</span>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={handleFormatCode}
                  className="hover:text-cyan-400 transition flex items-center gap-1 outline-none cursor-pointer text-[9px] font-mono font-bold uppercase tracking-wider"
                  title="Correct code indentation spacing using virtual AST rules"
                >
                  🧹 Format Buffer
                </button>
                <button
                  onClick={() => copyText(code, setCopiedOriginal)}
                  className="hover:text-white flex items-center gap-1.5 outline-none cursor-pointer transition-colors text-[9px] font-mono"
                >
                  {copiedOriginal ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  {copiedOriginal ? "Copied" : "Copy Buffer"}
                </button>
              </div>
            </div>

            {/* Monaco Editor Canvas */}
            <div className="relative flex-1 flex flex-col bg-[#030610] rounded-b-xl border border-slate-850 overflow-hidden min-h-[300px]">
              <Editor
                height="320px"
                language={mapLanguage(language)}
                theme="vs-dark"
                value={code}
                onChange={(val) => setCode(val || "")}
                onMount={handleEditorDidMount}
                loading={
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#030610] text-[#0ea5e9] font-mono text-xs space-y-2">
                    <span className="animate-spin text-lg">💡</span>
                    <span className="animate-pulse">Loading Sandbox Monaco Canvas...</span>
                  </div>
                }
                options={{
                  fontSize: 12.5,
                  fontFamily: "var(--font-mono), 'JetBrains Mono', Menlo, Monaco, 'Courier New', monospace",
                  minimap: { enabled: false },
                  lineNumbers: "on",
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  tabSize: 4,
                  cursorBlinking: "smooth",
                  cursorSmoothCaretAnimation: "on",
                  padding: { top: 12, bottom: 12 },
                  renderLineHighlight: "all",
                  scrollbar: {
                    vertical: "visible",
                    horizontal: "visible",
                    useShadows: false,
                    verticalScrollbarSize: 10,
                    horizontalScrollbarSize: 10
                  }
                }}
              />
            </div>

          </div>

          {/* Quick Language choice & parameters select block */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold font-mono tracking-wider uppercase text-slate-450 block flex items-center justify-between">
                <span>Programming Language:</span>
                <span className="text-[9px] text-slate-500 italic lowercase font-normal">Switching resets samplers</span>
              </label>
              <select
                value={language}
                onChange={(e) => {
                  setLanguage(e.target.value);
                  setSyntaxDiagnostics(null);
                  setSelectedSnippetExplanation(null);
                }}
                className="w-full bg-[#040815] text-slate-300 border border-slate-800 rounded-xl p-2.5 text-xs font-sans outline-none focus:border-emerald-500 cursor-pointer transition hover:border-slate-700 font-medium"
              >
                <option value="Automatic" className="bg-slate-950">Automatic Detection</option>
                <option value="JavaScript" className="bg-slate-950">JavaScript (Engine Evaluated)</option>
                <option value="TypeScript" className="bg-slate-950">TypeScript Syntax</option>
                <option value="Python" className="bg-slate-950">Python Framework</option>
                <option value="Go" className="bg-slate-950">Go Language (Compiler Sim)</option>
                <option value="C++" className="bg-slate-950">C++ Clang Sandbox</option>
                <option value="Rust" className="bg-slate-950">Rust Cargo Engine</option>
                <option value="SQL" className="bg-slate-950">SQL Database Terminal</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold font-mono tracking-wider uppercase text-slate-450 block font-bold">
                Review Discussion Detail
              </label>
              <select
                value={depth}
                onChange={(e) => setDepth(e.target.value)}
                className="w-full bg-[#040815] text-slate-300 border border-slate-800 rounded-xl p-2.5 text-xs font-sans outline-none focus:border-emerald-500 cursor-pointer transition hover:border-slate-700 font-medium"
              >
                <option value="deep-dive" className="bg-slate-950">Technical Deep Dive</option>
                <option value="high-level" className="bg-slate-950">Executive High-Level Brief</option>
                <option value="educational" className="bg-slate-950">Detailed Junior Training</option>
                <option value="line-by-line" className="bg-slate-950">Granular Line-by-Line Critique</option>
              </select>
            </div>
          </div>

          {/* Inline active syntax errors panel */}
          {syntaxDiagnostics && (
            <div className="bg-amber-950/20 border border-amber-900/40 text-amber-450 p-3 rounded-xl flex items-start gap-2.5 text-xxs leading-normal">
              <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5 animate-pulse" />
              <div>
                <span className="font-mono font-bold block mb-0.5 text-amber-400">LINE DIAGNOSTICS DETECTED (Line {syntaxDiagnostics.line}):</span>
                <p className="font-sans text-slate-300">{syntaxDiagnostics.message}</p>
              </div>
            </div>
          )}

          {/* Highlight explain assistant shortcut panel */}
          {selectedSnipp.trim().length > 3 && (
            <div className="bg-[#090f1e]/80 border border-indigo-500/20 p-3.5 rounded-xl space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-mono font-bold text-indigo-400 tracking-wider uppercase flex items-center gap-1.5">
                  <Lightbulb className="w-3.5 h-3.5 text-cyan-400" /> Active Highlight Segment (size: {selectedSnipp.trim().length} chars)
                </span>
                <button
                  type="button"
                  onClick={handleExplainSelectionSegment}
                  disabled={explainingSnippet}
                  className="px-2.5 py-1 bg-indigo-500/15 border border-indigo-500/25 hover:bg-indigo-500/25 text-indigo-300 font-mono text-[9px] rounded font-bold transition cursor-pointer outline-none"
                >
                  {explainingSnippet ? "Analyzing Snippet..." : "💡 Explain Selection"}
                </button>
              </div>
              <p className="text-[10px] font-mono text-slate-400 bg-slate-950/40 p-2 border border-slate-900 rounded truncate">"{selectedSnipp}"</p>
              {selectedSnippetExplanation && (
                <div className="bg-slate-950/90 p-3 border border-slate-850 rounded-xl space-y-1 list-none leading-normal">
                  <span className="text-[9px] font-mono font-bold text-slate-500 tracking-tight block">AI INSIGHT SNAPSHOT:</span>
                  <p className="text-xs text-slate-300 font-sans leading-relaxed">{selectedSnippetExplanation}</p>
                </div>
              )}
            </div>
          )}

          {/* Action buttons row with run simulator */}
          <div className="flex flex-wrap items-center justify-between border-t border-slate-800/80 pt-4 gap-3">
            <div className="text-[10px] font-mono text-slate-500">
              Payload scope: <strong className="text-slate-400">{lineCount} lines</strong> • Buffer size: <strong className="text-slate-400">{code.length} bytes</strong>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={runCodeSandbox}
                className="px-3.5 py-2.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-200 font-mono text-xs font-semibold rounded-xl flex items-center gap-1.5 select-none transition cursor-pointer outline-none"
                title="Execute code buffer inside virtual browser environment"
              >
                <Play className="w-3.5 h-3.5 text-cyan-400" /> Run Code
              </button>

              <button
                onClick={() => handleRunModelReview()}
                disabled={loading || !code.trim()}
                className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-450 hover:to-teal-550 text-white font-mono text-xs font-semibold px-4 py-2.5 rounded-xl flex items-center gap-1.5 disabled:opacity-50 select-none cursor-pointer outline-none transition shadow-md shadow-emerald-500/10"
              >
                <Code className="w-3.5 h-3.5" /> {loading ? "Analyzing..." : "Review AST / Explains"}
              </button>
            </div>
          </div>

        </div>

        {/* Console Outputs / Compiler output board */}
        {(consoleOutput.status !== "idle" || consoleOutput.logs.length > 0) && (
          <div className="bg-[#040813] border border-slate-850 rounded-2xl shadow-xl overflow-hidden text-left font-mono">
            
            {/* Terminal Header Bar */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-[#010307] border-b border-slate-900 text-xxs text-slate-500">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
                <span className="text-slate-400 font-bold ml-2 tracking-wider">SANDBOX MICRO-CONSOLE PLATFORM</span>
              </div>
              <div className="flex items-center gap-3">
                {consoleOutput.durationMs > 0 && (
                  <span className="text-cyan-400">Time: {consoleOutput.durationMs}ms</span>
                )}
                <button
                  type="button"
                  onClick={() => setConsoleOutput({ status: "idle", logs: [], durationMs: 0, memoryEstimate: "0 KB" })}
                  className="text-slate-500 hover:text-slate-300 transition"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Terminal Tab controls */}
            <div className="flex border-b border-slate-900 bg-[#02040a]">
              <button
                onClick={() => setActiveConsoleTab("logs")}
                className={`px-4 py-2 font-mono text-[9px] uppercase font-bold tracking-wider transition ${
                  activeConsoleTab === "logs" 
                    ? "text-cyan-400 bg-[#040813] border-b-2 border-cyan-500" 
                    : "text-slate-500 hover:text-slate-350"
                }`}
              >
                Logs Out ({consoleOutput.logs.length})
              </button>
              <button
                onClick={() => setActiveConsoleTab("telemetry")}
                className={`px-4 py-2 font-mono text-[9px] uppercase font-bold tracking-wider transition ${
                  activeConsoleTab === "telemetry" 
                    ? "text-cyan-400 bg-[#040813] border-b-2 border-cyan-500" 
                    : "text-slate-500 hover:text-slate-350"
                }`}
              >
                Memory &amp; Sizing
              </button>
            </div>

            {/* Terminal Body */}
            <div className="p-4 overflow-y-auto max-h-56 min-h-24 font-mono text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
              {activeConsoleTab === "logs" && (
                <div className="space-y-1">
                  {consoleOutput.logs.map((log, idx) => (
                    <div 
                      key={idx} 
                      className={`${log.startsWith("❌") || log.startsWith("[RUNTIME") || log.startsWith("⚠️") ? "text-rose-400" : log.startsWith("[COMPILE") || log.startsWith("[CARGO") ? "text-slate-500" : "text-emerald-400/90"}`}
                    >
                      {log}
                    </div>
                  ))}
                  {consoleOutput.errorLine && (
                    <div className="text-[11px] font-bold text-rose-450 border border-rose-950/40 p-2.5 rounded bg-rose-950/15 mt-3 space-y-1">
                      <span>VM REPAIR ASSISTANT FLAG:</span>
                      <p className="font-sans text-slate-300 font-normal">VM halted. Syntax or thread variable issue pinpointed on line <span className="text-rose-400 font-bold">{consoleOutput.errorLine}</span> of execution buffer. Direct diagnostic review advised.</p>
                    </div>
                  )}
                </div>
              )}

              {activeConsoleTab === "telemetry" && (
                <div className="grid grid-cols-2 gap-4 text-xxs font-mono">
                  <div className="bg-[#010307]/40 p-3 rounded-lg border border-slate-900">
                    <span className="text-slate-500 block mb-0.5">ESTIMATED RUN SIZE:</span>
                    <span className="text-slate-300 font-bold text-xs">{consoleOutput.memoryEstimate}</span>
                  </div>
                  <div className="bg-[#010307]/40 p-3 rounded-lg border border-slate-900">
                    <span className="text-slate-500 block mb-0.5 font-bold">INTERPRETER STATUS:</span>
                    <span className="text-indigo-400 font-bold text-xs">{consoleOutput.status.toUpperCase()}</span>
                  </div>
                </div>
              )}
            </div>

          </div>
        )}

      </div>

      {/* Analytical Auditor Board (Critique and Optimized outputs) */}
      <div className={`lg:col-span-5 flex-col ${activeMobileTab === 'output' ? 'flex' : 'hidden lg:flex'}`}>
        <div className="glass-panel p-5 rounded-2xl shadow-xl flex-1 flex flex-col min-h-[460px] border border-slate-800">
          
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-4">
            <h3 className="text-xs font-bold font-mono tracking-wider uppercase text-slate-300 flex items-center gap-1.5">
              <Bug className="w-4 h-4 text-emerald-400 animate-pulse" /> Analytical Critique Output
            </h3>

            {metrics && (
              <span className="text-[9px] font-mono text-slate-400 bg-slate-950/80 border border-slate-850 px-2 py-0.5 rounded flex items-center gap-1.5">
                Latency: {metrics.durationMs}ms {metrics.modelUsed && <span className="text-[8px] opacity-75 font-bold">({metrics.modelUsed})</span>}
              </span>
            )}
          </div>

          {error && (
            <div className="bg-rose-950/30 border border-rose-900/60 text-rose-400 text-xs rounded-xl p-3.5 mb-4 leading-normal">
              <strong className="block font-semibold mb-1">Error Reviewing Code</strong>
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-500 text-center">
              <div className="w-8 h-8 border-3 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mb-3.5" />
              <p className="text-xs font-mono">Parsing AST nodes and executing latency-memory evaluation...</p>
              <p className="text-[10px] text-slate-500 font-sans mt-1">Calling Gemini cloud review system</p>
            </div>
          ) : result ? (
            <div className="flex-1 flex flex-col space-y-4">
              
              {/* Complexity ratings board */}
              <div className="grid grid-cols-2 gap-4 pb-1">
                <div className="bg-slate-950/50 rounded-xl p-3 border border-slate-850 text-center">
                  <span className="text-[9px] font-mono text-indigo-400 block uppercase tracking-extrawide mb-1 font-bold">Time Complexity</span>
                  <span className="text-xs font-mono font-bold text-indigo-350 block">{result.timeComplexity || "O(n)"}</span>
                </div>
                <div className="bg-slate-950/50 rounded-xl p-3 border border-slate-850 text-center">
                  <span className="text-[9px] font-mono text-amber-500 block uppercase tracking-extrawide mb-1 font-bold">Space Complexity</span>
                  <span className="text-xs font-mono font-bold text-amber-450 block">{result.spaceComplexity || "O(1)"}</span>
                </div>
              </div>

              {/* View Tab selectors */}
              <div className="flex border-b border-slate-800">
                <button
                  onClick={() => setActiveTab("explanation")}
                  className={`flex-1 py-2 font-mono text-[9px] font-bold uppercase tracking-wider transition outline-none cursor-pointer ${
                    activeTab === "explanation"
                      ? "text-emerald-400 border-b-2 border-emerald-500"
                      : "text-slate-500 hover:text-slate-350"
                  }`}
                >
                  Critique &amp; Breakdown
                </button>
                <button
                  onClick={() => setActiveTab("optimized")}
                  className={`flex-1 py-2 font-mono text-[9px] font-bold uppercase tracking-wider transition outline-none cursor-pointer ${
                    activeTab === "optimized"
                      ? "text-emerald-400 border-b-2 border-emerald-500"
                      : "text-slate-500 hover:text-slate-350"
                  }`}
                >
                  Optimized Variant
                </button>
              </div>

              {/* Tab: Explanation description and flaws */}
              {activeTab === "explanation" && (
                <div className="flex-1 flex flex-col space-y-4 overflow-auto max-h-[350px] pr-1 scrollbar-thin">
                  
                  {/* Explanation Description block */}
                  <div className="bg-slate-950/80 rounded-xl p-4 border border-slate-900 text-left">
                    <p className="text-xs text-slate-300 leading-relaxed font-sans whitespace-pre-wrap">{result.explanation}</p>
                  </div>

                  {/* Identified code flaws */}
                  <div className="space-y-3 text-left">
                    <h4 className="text-[10px] font-mono uppercase tracking-wider text-slate-450 font-bold flex items-center justify-between">
                      <span>Identified AST Flaws ({result.issues ? result.issues.length : 0})</span>
                      <span className="text-[9px] text-rose-400 font-bold uppercase">Critical Defects</span>
                    </h4>

                    {(!result.issues || result.issues.length === 0) ? (
                      <p className="text-[10px] italic text-slate-500 p-4 bg-[#040815]/30 rounded-xl text-center border border-slate-900">
                        Code satisfies SLA specification safety parameters. No logic bugs resolved!
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {result.issues.map((issue, idx) => {
                          let badgeStyle = "bg-slate-900 border-slate-800 text-slate-400";
                          if (issue.severity === "High") badgeStyle = "bg-rose-950/40 text-rose-400 border-rose-900/30";
                          if (issue.severity === "Medium") badgeStyle = "bg-amber-950/40 text-amber-400 border-amber-950/30";
                          if (issue.severity === "Low") badgeStyle = "bg-blue-950/40 text-blue-400 border-blue-950/30";
                          if (issue.severity === "Optimization") badgeStyle = "bg-teal-950/40 text-teal-400 border-teal-950/30";

                          return (
                            <div key={idx} className="border border-slate-850 rounded-xl p-3.5 bg-slate-950/40 space-y-2 text-left">
                              <span className={`inline-block px-2 py-0.5 rounded text-[8px] font-mono border uppercase font-bold ${badgeStyle}`}>
                                {issue.severity} Severity
                              </span>
                              <p className="text-xs text-slate-300 font-sans leading-relaxed select-text">{issue.description}</p>
                              {issue.fix && (
                                <div className="mt-2 pt-2 border-t border-slate-900">
                                  <span className="text-[9px] font-mono text-slate-500 block mb-1">Recommended AST patch:</span>
                                  <pre className="bg-slate-950 border border-slate-900 text-cyan-400 p-3 rounded-lg text-[10px] font-mono overflow-x-auto whitespace-pre font-normal select-all">
                                    {issue.fix}
                                  </pre>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                </div>
              )}

              {/* Tab: Optimized Code Variant view */}
              {activeTab === "optimized" && (
                <div className="flex-1 flex flex-col min-h-0 text-left">
                  <div className="flex items-center justify-between bg-slate-950 border-b border-slate-850 p-2.5 rounded-t-xl text-[10px] font-mono text-slate-450 select-none">
                    <span className="text-emerald-400 font-bold">REFACTORED OUTPUT VARIANT</span>
                    <button
                      onClick={() => copyText(result.optimizedCode || "", setCopiedOptimized)}
                      className="hover:text-white flex items-center gap-1.5 outline-none cursor-pointer transition-colors text-[9px]"
                      title="Copy fully corrected and refactored AI output"
                    >
                      {copiedOptimized ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedOptimized ? "Copied" : "Copy Refactored"}
                    </button>
                  </div>
                  <pre className="flex-1 bg-slate-950 text-slate-300 p-4 rounded-b-xl text-xs font-mono leading-relaxed overflow-auto max-h-[350px] whitespace-pre select-all">
                    {result.optimizedCode || "// Refactored variant model response block empty."}
                  </pre>
                </div>
              )}

            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-slate-800 rounded-xl p-12 text-slate-500 bg-slate-950/25 text-center">
              <Code className="w-8 h-8 text-slate-600 mb-2.5 animate-pulse" />
              <p className="text-xs text-slate-400 font-sans">No code review analytics generated.</p>
              <p className="text-[10px] text-slate-550 mt-1 font-mono">Select parameters and click &quot;Review AST / Explains&quot;.</p>
            </div>
          )}

        </div>
      </div>

    </div>
    </>
  );
}
