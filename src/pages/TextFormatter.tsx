import { useState, useEffect } from 'react';
import { 
  Type, 
  Trash2, 
  Copy, 
  Check, 
  SortAsc, 
  Shuffle, 
  RefreshCw, 
  FileText, 
  Search, 
  ListOrdered
} from 'lucide-react';

export function TextFormatter() {
  const [text, setText] = useState('');
  const [copied, setCopied] = useState(false);
  
  // Find & Replace state
  const [searchQuery, setSearchQuery] = useState('');
  const [replaceQuery, setReplaceQuery] = useState('');
  const [isRegex, setIsRegex] = useState(false);
  const [isCaseSensitive, setIsCaseSensitive] = useState(false);
  const [matchCount, setMatchCount] = useState(0);

  // Prefix & Suffix state
  const [prefix, setPrefix] = useState('');
  const [suffix, setSuffix] = useState('');

  // Handle regex and string matching count
  useEffect(() => {
    if (!searchQuery || !text) {
      setMatchCount(0);
      return;
    }

    try {
      let regex: RegExp;
      if (isRegex) {
        const flags = isCaseSensitive ? 'g' : 'gi';
        regex = new RegExp(searchQuery, flags);
      } else {
        // Escape regex special chars for literal search
        const escaped = searchQuery.replace(/[/\-\\^$*+?.()|[\]{}]/g, '\\$&');
        const flags = isCaseSensitive ? 'g' : 'gi';
        regex = new RegExp(escaped, flags);
      }
      const matches = text.match(regex);
      setMatchCount(matches ? matches.length : 0);
    } catch {
      setMatchCount(0);
    }
  }, [searchQuery, text, isRegex, isCaseSensitive]);

  const handleCopy = async () => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleClear = () => {
    setText('');
  };

  // Case Conversion functions
  const convertToUpperCase = () => {
    setText(prev => prev.toUpperCase());
  };

  const convertToLowerCase = () => {
    setText(prev => prev.toLowerCase());
  };

  const convertToTitleCase = () => {
    setText(prev => {
      return prev.replace(/\b[a-z]/gi, char => char.toUpperCase());
    });
  };

  const convertToSentenceCase = () => {
    setText(prev => {
      // Capitalize first letter of every sentence
      return prev.toLowerCase().replace(/(^\s*|[.!?]\s+)([a-z])/g, (_match, separator, char) => {
        return separator + char.toUpperCase();
      });
    });
  };

  const convertToCamelCase = () => {
    setText(prev => {
      return prev
        .replace(/[^a-zA-Z0-9\s-_]/g, '')
        .replace(/[-_]+/g, ' ')
        .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
          return index === 0 ? word.toLowerCase() : word.toUpperCase();
        })
        .replace(/\s+/g, '');
    });
  };

  const convertToKebabCase = () => {
    setText(prev => {
      return prev
        .replace(/([a-z])([A-Z])/g, '$1-$2')
        .replace(/[\s_]+/g, '-')
        .toLowerCase()
        .replace(/^-+|-+$/g, '');
    });
  };

  const convertToSnakeCase = () => {
    setText(prev => {
      return prev
        .replace(/([a-z])([A-Z])/g, '$1_$2')
        .replace(/[\s-]+/g, '_')
        .toLowerCase()
        .replace(/^_+|_+$/g, '');
    });
  };

  // Line Operations
  const handleSortLines = (direction: 'asc' | 'desc') => {
    const lines = text.split('\n');
    lines.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base', numeric: true }));
    if (direction === 'desc') {
      lines.reverse();
    }
    setText(lines.join('\n'));
  };

  const handleShuffleLines = () => {
    const lines = text.split('\n');
    for (let i = lines.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [lines[i], lines[j]] = [lines[j], lines[i]];
    }
    setText(lines.join('\n'));
  };

  const handleReverseLines = () => {
    setText(prev => prev.split('\n').reverse().join('\n'));
  };

  const handleRemoveEmptyLines = () => {
    setText(prev => prev.split('\n').filter(line => line.trim() !== '').join('\n'));
  };

  const handleTrimWhitespace = () => {
    setText(prev => prev.split('\n').map(line => line.trim()).join('\n'));
  };

  const handleRemoveDuplicates = () => {
    const lines = text.split('\n');
    const unique = Array.from(new Set(lines));
    setText(unique.join('\n'));
  };

  // Add Prefix/Suffix
  const handleApplyPrefixSuffix = () => {
    if (!prefix && !suffix) return;
    const lines = text.split('\n');
    const updated = lines.map(line => `${prefix}${line}${suffix}`);
    setText(updated.join('\n'));
  };

  // Add Line Numbers
  const handleAddLineNumbers = () => {
    const lines = text.split('\n');
    const digits = String(lines.length).length;
    const updated = lines.map((line, idx) => {
      const lineNum = String(idx + 1).padStart(digits, '0');
      return `${lineNum}. ${line}`;
    });
    setText(updated.join('\n'));
  };

  // Find & Replace Action
  const handleReplace = (all: boolean = true) => {
    if (!searchQuery) return;
    try {
      let regex: RegExp;
      const flags = isCaseSensitive ? (all ? 'g' : '') : (all ? 'gi' : 'i');
      if (isRegex) {
        regex = new RegExp(searchQuery, flags);
      } else {
        const escaped = searchQuery.replace(/[/\-\\^$*+?.()|[\]{}]/g, '\\$&');
        regex = new RegExp(escaped, flags);
      }
      setText(prev => prev.replace(regex, replaceQuery));
    } catch (err) {
      alert('Invalid Regular Expression syntax.');
    }
  };

  // Quick stats
  const getStats = () => {
    const charCount = text.length;
    const wordCount = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
    const lineCount = text === '' ? 0 : text.split('\n').length;
    return { charCount, wordCount, lineCount };
  };

  const { charCount, wordCount, lineCount } = getStats();

  return (
    <div className="space-y-6">
      {/* Title block */}
      <div>
        <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-2.5">
          <Type className="w-8 h-8 text-indigo-600" />
          Case Converter & Formatter
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Convert cases, clean whitespace, sort lines, search-replace with regex, and add line numbering.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side - Editor */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col">
            {/* Header controls */}
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-500" />
                Input Workspace
              </span>
              <div className="flex gap-2">
                <button
                  onClick={handleCopy}
                  disabled={!text}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      Copy Text
                    </>
                  )}
                </button>
                <button
                  onClick={handleClear}
                  disabled={!text}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-100 bg-red-50/50 hover:bg-red-50 text-red-600 text-xs font-semibold shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear
                </button>
              </div>
            </div>

            {/* Editor textarea */}
            <div className="relative">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste or type your text here to begin formatting..."
                rows={16}
                className="w-full p-6 text-slate-800 bg-white border-0 focus:ring-0 focus:outline-none resize-y font-mono text-sm leading-relaxed"
              />
            </div>

            {/* Footer Quick Stats */}
            <div className="bg-slate-50/50 border-t border-slate-100 px-6 py-3 flex justify-between text-xs text-slate-500 font-semibold">
              <span>Lines: <strong className="text-slate-800">{lineCount}</strong></span>
              <span>Words: <strong className="text-slate-800">{wordCount}</strong></span>
              <span>Characters: <strong className="text-slate-800">{charCount}</strong></span>
            </div>
          </div>
        </div>

        {/* Right Side - Actions Panel */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Section 1: Case Conversions */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-800 tracking-tight flex items-center gap-2">
              <Type className="w-4.5 h-4.5 text-indigo-500" />
              Case Conversions
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={convertToUpperCase} className="px-3 py-2 rounded-xl text-left border border-slate-100 hover:bg-indigo-50/50 hover:border-indigo-100 text-xs font-bold text-slate-700 hover:text-indigo-700 transition-all">
                UPPERCASE
              </button>
              <button onClick={convertToLowerCase} className="px-3 py-2 rounded-xl text-left border border-slate-100 hover:bg-indigo-50/50 hover:border-indigo-100 text-xs font-bold text-slate-700 hover:text-indigo-700 transition-all">
                lowercase
              </button>
              <button onClick={convertToTitleCase} className="px-3 py-2 rounded-xl text-left border border-slate-100 hover:bg-indigo-50/50 hover:border-indigo-100 text-xs font-bold text-slate-700 hover:text-indigo-700 transition-all">
                Title Case
              </button>
              <button onClick={convertToSentenceCase} className="px-3 py-2 rounded-xl text-left border border-slate-100 hover:bg-indigo-50/50 hover:border-indigo-100 text-xs font-bold text-slate-700 hover:text-indigo-700 transition-all">
                Sentence case
              </button>
              <button onClick={convertToCamelCase} className="px-3 py-2 rounded-xl text-left border border-slate-100 hover:bg-indigo-50/50 hover:border-indigo-100 text-xs font-bold text-slate-700 hover:text-indigo-700 transition-all">
                camelCase
              </button>
              <button onClick={convertToKebabCase} className="px-3 py-2 rounded-xl text-left border border-slate-100 hover:bg-indigo-50/50 hover:border-indigo-100 text-xs font-bold text-slate-700 hover:text-indigo-700 transition-all">
                kebab-case
              </button>
              <button onClick={convertToSnakeCase} className="col-span-2 px-3 py-2 rounded-xl text-center border border-slate-100 hover:bg-indigo-50/50 hover:border-indigo-100 text-xs font-bold text-slate-700 hover:text-indigo-700 transition-all">
                snake_case
              </button>
            </div>
          </div>

          {/* Section 2: Line Operations */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-800 tracking-tight flex items-center gap-2">
              <SortAsc className="w-4.5 h-4.5 text-indigo-500" />
              Line Operations
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => handleSortLines('asc')} className="px-3 py-2 rounded-xl text-left border border-slate-100 hover:bg-indigo-50/50 hover:border-indigo-100 text-xs font-bold text-slate-700 hover:text-indigo-700 transition-all flex items-center gap-1.5">
                <SortAsc className="w-3.5 h-3.5" />
                Sort A-Z
              </button>
              <button onClick={() => handleSortLines('desc')} className="px-3 py-2 rounded-xl text-left border border-slate-100 hover:bg-indigo-50/50 hover:border-indigo-100 text-xs font-bold text-slate-700 hover:text-indigo-700 transition-all flex items-center gap-1.5">
                <SortAsc className="w-3.5 h-3.5 transform rotate-180" />
                Sort Z-A
              </button>
              <button onClick={handleShuffleLines} className="px-3 py-2 rounded-xl text-left border border-slate-100 hover:bg-indigo-50/50 hover:border-indigo-100 text-xs font-bold text-slate-700 hover:text-indigo-700 transition-all flex items-center gap-1.5">
                <Shuffle className="w-3.5 h-3.5" />
                Shuffle Lines
              </button>
              <button onClick={handleReverseLines} className="px-3 py-2 rounded-xl text-left border border-slate-100 hover:bg-indigo-50/50 hover:border-indigo-100 text-xs font-bold text-slate-700 hover:text-indigo-700 transition-all flex items-center gap-1.5">
                <RefreshCw className="w-3.5 h-3.5" />
                Reverse Lines
              </button>
              <button onClick={handleRemoveEmptyLines} className="px-3 py-2 rounded-xl text-left border border-slate-100 hover:bg-indigo-50/50 hover:border-indigo-100 text-xs font-bold text-slate-700 hover:text-indigo-700 transition-all">
                Remove Empty Lines
              </button>
              <button onClick={handleTrimWhitespace} className="px-3 py-2 rounded-xl text-left border border-slate-100 hover:bg-indigo-50/50 hover:border-indigo-100 text-xs font-bold text-slate-700 hover:text-indigo-700 transition-all">
                Trim Whitespace
              </button>
              <button onClick={handleRemoveDuplicates} className="col-span-2 px-3 py-2 rounded-xl text-center border border-slate-100 hover:bg-indigo-50/50 hover:border-indigo-100 text-xs font-bold text-slate-700 hover:text-indigo-700 transition-all">
                Remove Duplicate Lines
              </button>
            </div>
          </div>

          {/* Section 3: Prepend/Append & Numbering */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-800 tracking-tight flex items-center gap-2">
              <ListOrdered className="w-4.5 h-4.5 text-indigo-500" />
              Pre / Suffix & Numbering
            </h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Prefix text</label>
                  <input
                    type="text"
                    value={prefix}
                    onChange={(e) => setPrefix(e.target.value)}
                    placeholder="e.g. prefix_"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Suffix text</label>
                  <input
                    type="text"
                    value={suffix}
                    onChange={(e) => setSuffix(e.target.value)}
                    placeholder="e.g. _suffix"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleApplyPrefixSuffix}
                  className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
                >
                  Apply Prefix/Suffix
                </button>
                <button
                  onClick={handleAddLineNumbers}
                  className="px-3 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-1.5"
                >
                  <ListOrdered className="w-3.5 h-3.5 text-slate-500" />
                  Add Line Numbers
                </button>
              </div>
            </div>
          </div>

          {/* Section 4: Regex Search & Replace */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-800 tracking-tight flex items-center gap-2">
              <Search className="w-4.5 h-4.5 text-indigo-500" />
              Search & Replace
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Find</label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Find pattern..."
                    className="w-full pl-3 pr-16 py-2 text-xs border border-slate-200 rounded-xl focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                  {searchQuery && (
                    <span className="absolute right-2 top-1.5 bg-slate-100 text-[10px] text-slate-500 font-bold px-1.5 py-0.5 rounded">
                      {matchCount} matches
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Replace With</label>
                <input
                  type="text"
                  value={replaceQuery}
                  onChange={(e) => setReplaceQuery(e.target.value)}
                  placeholder="Replacement text..."
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-4 text-xs font-semibold text-slate-600 py-1">
                <label className="flex items-center gap-1.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isRegex}
                    onChange={(e) => setIsRegex(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 w-3.5 h-3.5"
                  />
                  Regex
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isCaseSensitive}
                    onChange={(e) => setIsCaseSensitive(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 w-3.5 h-3.5"
                  />
                  Case Sensitive
                </label>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleReplace(false)}
                  disabled={!searchQuery}
                  className="px-3 py-2 border border-slate-200 hover:bg-slate-50 disabled:opacity-50 text-slate-700 rounded-xl text-xs font-bold transition-all"
                >
                  Replace First
                </button>
                <button
                  onClick={() => handleReplace(true)}
                  disabled={!searchQuery}
                  className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all"
                >
                  Replace All
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
