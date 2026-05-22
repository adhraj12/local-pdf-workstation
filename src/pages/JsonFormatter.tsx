import React, { useState, useEffect } from 'react';
import { 
  Braces, 
  Trash2, 
  Copy, 
  Check, 
  Sparkles, 
  AlertCircle,
  FileCode2,
  Minimize,
  Expand
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Simple JSON to YAML converter
function jsonToYaml(obj: any, indent = 0): string {
  const spaces = ' '.repeat(indent);
  if (obj === null) return 'null';
  if (typeof obj === 'undefined') return '';
  if (typeof obj !== 'object') {
    return String(obj);
  }

  if (Array.isArray(obj)) {
    if (obj.length === 0) return '[]';
    return obj.map(item => {
      const formattedItem = jsonToYaml(item, indent + 2);
      if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
        const lines = formattedItem.split('\n');
        const firstLine = lines[0].trim();
        const otherLines = lines.slice(1).map(l => '  ' + l).join('\n');
        return `${spaces}- ${firstLine}\n${otherLines}`;
      }
      return `${spaces}- ${formattedItem}`;
    }).join('\n');
  }

  const keys = Object.keys(obj);
  if (keys.length === 0) return '{}';
  
  return keys.map(key => {
    const val = obj[key];
    const keyStr = key.includes(' ') || key.includes(':') ? `"${key}"` : key;
    if (val === null) {
      return `${spaces}${keyStr}: null`;
    }
    if (typeof val === 'object') {
      if (Array.isArray(val) && val.length === 0) {
        return `${spaces}${keyStr}: []`;
      }
      if (!Array.isArray(val) && Object.keys(val).length === 0) {
        return `${spaces}${keyStr}: {}`;
      }
      return `${spaces}${keyStr}:\n${jsonToYaml(val, indent + 2)}`;
    }
    const escapedVal = typeof val === 'string' ? `"${val.replace(/"/g, '\\"')}"` : val;
    return `${spaces}${keyStr}: ${escapedVal}`;
  }).join('\n');
}

// Simple JSON to XML converter
function jsonToXml(obj: any, rootName = 'root'): string {
  const formatValue = (key: string, val: any): string => {
    // Replace spaces or invalid characters for XML tags
    const cleanKey = key.replace(/[^a-zA-Z0-9_-]/g, '_');
    if (val === null) return `<${cleanKey}/>`;
    if (typeof val === 'object') {
      if (Array.isArray(val)) {
        // Singularize array key or use 'item'
        const singularKey = cleanKey.endsWith('s') ? cleanKey.slice(0, -1) : 'item';
        return val.map(item => formatValue(singularKey, item)).join('\n');
      }
      const children = Object.keys(val).map(k => formatValue(k, val[k])).join('\n');
      return `<${cleanKey}>\n${children}\n</${cleanKey}>`;
    }
    const escaped = String(val)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
    return `<${cleanKey}>${escaped}</${cleanKey}>`;
  };

  try {
    return `<?xml version="1.0" encoding="UTF-8"?>\n` + formatValue(rootName, obj);
  } catch (err) {
    return '<!-- Error converting to XML -->';
  }
}

// Recursive Tree Node Component
interface JsonTreeNodeProps {
  label: string | number;
  value: any;
  depth: number;
  initialExpand: boolean;
}

function JsonTreeNode({ label, value, depth, initialExpand }: JsonTreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(initialExpand);

  useEffect(() => {
    setIsExpanded(initialExpand);
  }, [initialExpand]);

  const isObject = typeof value === 'object' && value !== null;
  const isArray = Array.isArray(value);
  const type = isObject ? (isArray ? 'array' : 'object') : typeof value;

  const toggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  // Render Primitives
  if (!isObject) {
    let valStr = String(value);
    let colorClass = 'text-blue-600'; // numbers
    if (value === null) {
      valStr = 'null';
      colorClass = 'text-gray-400 font-bold';
    } else if (type === 'string') {
      valStr = `"${value}"`;
      colorClass = 'text-emerald-600';
    } else if (type === 'boolean') {
      valStr = value ? 'true' : 'false';
      colorClass = 'text-amber-600 font-semibold';
    }

    return (
      <div className="flex items-start py-0.5 text-xs hover:bg-slate-50 rounded px-1 transition-colors pl-4 select-text">
        <span className="text-purple-600 font-semibold mr-1 font-mono">{label}:</span>
        <span className={`font-mono break-all ${colorClass}`}>{valStr}</span>
      </div>
    );
  }

  // Render Objects/Arrays
  const keys = isArray ? value : Object.keys(value);
  const count = keys.length;
  const opener = isArray ? '[' : '{';
  const closer = isArray ? ']' : '}';

  return (
    <div className="pl-4 select-text">
      <div 
        onClick={toggleExpand}
        className="flex items-center py-0.5 text-xs cursor-pointer hover:bg-slate-50 rounded px-1 transition-colors font-mono"
      >
        <span className="text-slate-400 mr-1 select-none text-[10px] w-3 text-center">
          {isExpanded ? '▼' : '▶'}
        </span>
        {label !== '' && <span className="text-purple-700 font-bold mr-1">{label}:</span>}
        <span className="text-slate-500 font-semibold">
          {opener} <span className="text-[10px] text-indigo-500 font-extrabold bg-indigo-50 px-1.5 py-0.2 rounded-full">{count} {count === 1 ? 'item' : 'items'}</span>
        </span>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-l border-slate-100 ml-1.5"
          >
            <div className="py-0.5">
              {keys.map((key: any, idx: number) => {
                const nodeLabel = isArray ? idx : key;
                const nodeValue = isArray ? key : value[key];
                return (
                  <JsonTreeNode 
                    key={nodeLabel} 
                    label={nodeLabel} 
                    value={nodeValue} 
                    depth={depth + 1}
                    initialExpand={initialExpand}
                  />
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="text-xs font-mono text-slate-500 pl-4 select-none">{closer}</div>
    </div>
  );
}

export function JsonFormatter() {
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'editor' | 'tree' | 'yaml' | 'xml'>('editor');
  const [treeExpandAll, setTreeExpandAll] = useState(true);
  const [parsedObj, setParsedObj] = useState<any>(null);

  const loadSample = () => {
    const sample = {
      status: "success",
      queryTimeMs: 14,
      resultsCount: 2,
      filters: {
        activeOnly: true,
        categories: ["development", "productivity"]
      },
      data: [
        {
          id: 101,
          name: "JSON Workspace",
          isAwesome: true,
          dependencies: null,
          rating: 4.9
        },
        {
          id: 102,
          name: "Code Editor Mode",
          isAwesome: true,
          dependencies: ["react", "tailwind"],
          rating: 4.8
        }
      ]
    };
    const str = JSON.stringify(sample, null, 2);
    setInputText(str);
    setOutputText(str);
    setParsedObj(sample);
    setError(null);
  };

  const handleClear = () => {
    setInputText('');
    setOutputText('');
    setParsedObj(null);
    setError(null);
  };

  const handleCopy = async () => {
    let contentToCopy = outputText;
    if (activeTab === 'yaml' && parsedObj) {
      contentToCopy = jsonToYaml(parsedObj);
    } else if (activeTab === 'xml' && parsedObj) {
      contentToCopy = jsonToXml(parsedObj);
    }

    if (!contentToCopy) return;
    try {
      await navigator.clipboard.writeText(contentToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  // Run formatting and syntax verification
  const handleFormat = (spaces: number | 'minify') => {
    if (!inputText.trim()) {
      setError(null);
      return;
    }

    try {
      const parsed = JSON.parse(inputText);
      setParsedObj(parsed);
      setError(null);
      
      let formatted: string;
      if (spaces === 'minify') {
        formatted = JSON.stringify(parsed);
      } else {
        formatted = JSON.stringify(parsed, null, spaces);
      }

      setOutputText(formatted);
      // Auto synchronize input editor if they beautify
      setInputText(formatted);
    } catch (err: any) {
      setError(err.message || 'Invalid JSON syntax');
    }
  };

  // Monitor input text for syntax errors in real-time
  useEffect(() => {
    if (!inputText.trim()) {
      setError(null);
      setParsedObj(null);
      return;
    }
    try {
      const parsed = JSON.parse(inputText);
      setParsedObj(parsed);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Invalid JSON syntax');
      setParsedObj(null);
    }
  }, [inputText]);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-2.5">
            <Braces className="w-8 h-8 text-indigo-600" />
            JSON Formatter & Validator
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Format, minify, and validate JSON data instantly. Explore values using an interactive collapsible tree outline.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={loadSample}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-indigo-100 bg-indigo-50/50 hover:bg-indigo-50 text-indigo-600 text-xs font-bold transition-all shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Load Sample
          </button>
          <button
            onClick={handleClear}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-red-100 bg-red-50/50 hover:bg-red-50 text-red-600 text-xs font-bold transition-all shadow-sm"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear
          </button>
        </div>
      </div>

      {/* Editor & View Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        
        {/* Left Side: Input Textarea (Editor) */}
        <div className="lg:col-span-6 flex flex-col">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col flex-1 min-h-[450px]">
            <div className="bg-slate-50 px-5 py-3 border-b border-slate-100 flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-500 tracking-wider uppercase flex items-center gap-1.5">
                <FileCode2 className="w-4 h-4 text-indigo-500" />
                Raw JSON Editor
              </span>
              {error && (
                <span className="text-[10px] text-red-600 font-extrabold bg-red-50 border border-red-100 px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                  <AlertCircle className="w-3 h-3" />
                  Syntax Error
                </span>
              )}
            </div>
            
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Paste raw minified or unformatted JSON text here..."
              className="flex-1 w-full p-5 font-mono text-sm leading-relaxed border-0 focus:ring-0 focus:outline-none bg-white text-slate-800 resize-none min-h-[380px]"
            />

            {error && (
              <div className="bg-red-50 border-t border-red-100 p-4 text-xs font-semibold text-red-700 flex items-start gap-2 select-text font-mono">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <div className="font-extrabold uppercase text-[10px] tracking-wider text-red-600">Parser Details:</div>
                  <div className="mt-0.5">{error}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Output Render Mode Tabs */}
        <div className="lg:col-span-6 flex flex-col">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col flex-1 min-h-[450px]">
            {/* View tabs */}
            <div className="bg-slate-50 border-b border-slate-100 px-4 py-2 flex flex-wrap items-center justify-between gap-2">
              <div className="flex gap-1.5">
                <button
                  onClick={() => setActiveTab('editor')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeTab === 'editor' ? 'bg-white text-indigo-700 shadow-sm ring-1 ring-slate-100' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Formatted Code
                </button>
                <button
                  onClick={() => setActiveTab('tree')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeTab === 'tree' ? 'bg-white text-indigo-700 shadow-sm ring-1 ring-slate-100' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Tree Explorer
                </button>
                <button
                  onClick={() => setActiveTab('yaml')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeTab === 'yaml' ? 'bg-white text-indigo-700 shadow-sm ring-1 ring-slate-100' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  YAML
                </button>
                <button
                  onClick={() => setActiveTab('xml')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeTab === 'xml' ? 'bg-white text-indigo-700 shadow-sm ring-1 ring-slate-100' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  XML
                </button>
              </div>

              <div className="flex gap-1.5">
                {parsedObj && (
                  <button
                    onClick={handleCopy}
                    className="p-1.5 hover:bg-slate-150 rounded-lg text-slate-500 hover:text-slate-800 transition-colors"
                    title="Copy formatted content"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                )}
              </div>
            </div>

            {/* Content view body */}
            <div className="p-5 flex-1 overflow-auto bg-white flex flex-col min-h-[350px]">
              {!parsedObj ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                  <Braces className="w-12 h-12 text-slate-300 mb-3" />
                  <p className="text-slate-400 text-xs font-semibold leading-relaxed">
                    Write valid JSON in the editor to activate formatting, schema trees, YAML conversions, and exports.
                  </p>
                </div>
              ) : (
                <div className="w-full h-full">
                  {activeTab === 'editor' && (
                    <div className="flex flex-col h-full gap-4">
                      {/* Formatter control buttons */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleFormat(2)}
                          className="px-3 py-1.5 bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all hover:bg-slate-100"
                        >
                          2-Space Tab
                        </button>
                        <button
                          onClick={() => handleFormat(4)}
                          className="px-3 py-1.5 bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all hover:bg-slate-100"
                        >
                          4-Space Tab
                        </button>
                        <button
                          onClick={() => handleFormat('minify')}
                          className="px-3 py-1.5 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-lg text-xs font-bold transition-all hover:bg-indigo-100"
                        >
                          Minify JSON
                        </button>
                      </div>

                      <pre className="flex-1 p-4 font-mono text-sm leading-relaxed bg-slate-50/50 rounded-xl border border-slate-100 overflow-x-auto max-h-[350px] select-text text-slate-800">
                        {outputText}
                      </pre>
                    </div>
                  )}

                  {activeTab === 'tree' && (
                    <div className="space-y-4">
                      {/* Tree actions */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => setTreeExpandAll(true)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all hover:bg-slate-100"
                        >
                          <Expand className="w-3.5 h-3.5" />
                          Expand All
                        </button>
                        <button
                          onClick={() => setTreeExpandAll(false)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all hover:bg-slate-100"
                        >
                          <Minimize className="w-3.5 h-3.5" />
                          Collapse All
                        </button>
                      </div>
                      
                      {/* Tree Output view */}
                      <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-100 max-h-[350px] overflow-auto select-none">
                        <JsonTreeNode 
                          label="" 
                          value={parsedObj} 
                          depth={0} 
                          initialExpand={treeExpandAll} 
                        />
                      </div>
                    </div>
                  )}

                  {activeTab === 'yaml' && (
                    <pre className="p-4 font-mono text-sm leading-relaxed bg-slate-50/50 rounded-xl border border-slate-100 overflow-x-auto max-h-[380px] select-text text-slate-800">
                      {jsonToYaml(parsedObj)}
                    </pre>
                  )}

                  {activeTab === 'xml' && (
                    <pre className="p-4 font-mono text-sm leading-relaxed bg-slate-50/50 rounded-xl border border-slate-100 overflow-x-auto max-h-[380px] select-text text-slate-800">
                      {jsonToXml(parsedObj)}
                    </pre>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
