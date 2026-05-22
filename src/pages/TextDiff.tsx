import { useState } from 'react';
import { 
  GitCompare, 
  Trash2, 
  Sparkles, 
  Split, 
  Rows
} from 'lucide-react';

interface DiffRow {
  left: {
    lineNum?: number;
    type: 'removed' | 'unchanged' | 'empty';
    value: string;
  };
  right: {
    lineNum?: number;
    type: 'added' | 'unchanged' | 'empty';
    value: string;
  };
}

interface InlineDiffItem {
  type: 'added' | 'removed' | 'unchanged';
  lineNum?: number;
  value: string;
}

export function TextDiff() {
  const [oldText, setOldText] = useState('');
  const [newText, setNewText] = useState('');
  const [viewMode, setViewMode] = useState<'side' | 'inline'>('side');
  const [ignoreWhitespace, setIgnoreWhitespace] = useState(false);
  const [ignoreCase, setIgnoreCase] = useState(false);
  
  const [isCompared, setIsCompared] = useState(false);
  const [diffRows, setDiffRows] = useState<DiffRow[]>([]);
  const [inlineRows, setInlineRows] = useState<InlineDiffItem[]>([]);
  const [stats, setStats] = useState({ additions: 0, deletions: 0, unchanged: 0 });

  const loadSample = () => {
    setOldText(
      `// Simple User Schema\nconst user = {\n  id: 12345,\n  name: "John Doe",\n  email: "john@example.com",\n  role: "user",\n  createdAt: "2026-01-15"\n};\n\nfunction getStatus(user) {\n  if (user.role === 'admin') {\n    return 'Full Access';\n  }\n  return 'Limited Access';\n}`
    );
    setNewText(
      `// Premium User Schema\nconst user = {\n  id: 12345,\n  name: "John Doe Sr.",\n  email: "john.doe@example.com",\n  role: "administrator",\n  isPremium: true,\n  createdAt: "2026-01-15"\n};\n\nfunction getStatus(user) {\n  if (user.role === 'administrator') {\n    return 'Super Admin Access';\n  }\n  return 'Standard Access';\n}`
    );
    setIsCompared(false);
  };

  const handleClear = () => {
    setOldText('');
    setNewText('');
    setDiffRows([]);
    setInlineRows([]);
    setIsCompared(false);
    setStats({ additions: 0, deletions: 0, unchanged: 0 });
  };

  const normalize = (val: string) => {
    let clean = val;
    if (ignoreWhitespace) {
      clean = clean.trim().replace(/\s+/g, ' ');
    }
    if (ignoreCase) {
      clean = clean.toLowerCase();
    }
    return clean;
  };

  const runDiff = () => {
    const oldLines = oldText.split('\n');
    const newLines = newText.split('\n');
    const n = oldLines.length;
    const m = newLines.length;

    // Standard LCS DP Table
    const dp: number[][] = Array(n + 1).fill(null).map(() => Array(m + 1).fill(0));

    for (let i = 1; i <= n; i++) {
      for (let j = 1; j <= m; j++) {
        if (normalize(oldLines[i - 1]) === normalize(newLines[j - 1])) {
          dp[i][j] = dp[i - 1][j - 1] + 1;
        } else {
          dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
        }
      }
    }

    // Backtrack and align
    let i = n;
    let j = m;
    const rows: DiffRow[] = [];
    const inline: InlineDiffItem[] = [];
    let additions = 0;
    let deletions = 0;
    let unchanged = 0;

    while (i > 0 || j > 0) {
      if (i > 0 && j > 0 && normalize(oldLines[i - 1]) === normalize(newLines[j - 1])) {
        const val = oldLines[i - 1]; // Use original formatting
        rows.unshift({
          left: { lineNum: i, type: 'unchanged', value: val },
          right: { lineNum: j, type: 'unchanged', value: val }
        });
        inline.unshift({ type: 'unchanged', lineNum: j, value: val });
        unchanged++;
        i--;
        j--;
      } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
        const val = newLines[j - 1];
        rows.unshift({
          left: { type: 'empty', value: '' },
          right: { lineNum: j, type: 'added', value: val }
        });
        inline.unshift({ type: 'added', lineNum: j, value: val });
        additions++;
        j--;
      } else {
        const val = oldLines[i - 1];
        rows.unshift({
          left: { lineNum: i, type: 'removed', value: val },
          right: { type: 'empty', value: '' }
        });
        inline.unshift({ type: 'removed', lineNum: i, value: val });
        deletions++;
        i--;
      }
    }

    setDiffRows(rows);
    setInlineRows(inline);
    setStats({ additions, deletions, unchanged });
    setIsCompared(true);
  };

  return (
    <div className="space-y-6">
      {/* Title Block */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-2.5">
            <GitCompare className="w-8 h-8 text-indigo-600" />
            Text Diff Checker
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Instantly compare two versions of a text block to inspect changes, additions, and deletions offline.
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

      {/* Editor Panels */}
      {!isCompared ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Old Text Container */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="bg-slate-50/80 border-b border-slate-100 px-5 py-3.5 flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-500 tracking-wider uppercase">Original Text (Left)</span>
              <span className="text-[10px] text-slate-400 font-semibold">{oldText.split('\n').filter(Boolean).length} lines</span>
            </div>
            <textarea
              value={oldText}
              onChange={(e) => setOldText(e.target.value)}
              placeholder="Paste original text here..."
              rows={16}
              className="w-full p-5 font-mono text-sm leading-relaxed border-0 focus:ring-0 focus:outline-none bg-white text-slate-800 resize-y"
            />
          </div>

          {/* New Text Container */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="bg-slate-50/80 border-b border-slate-100 px-5 py-3.5 flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-500 tracking-wider uppercase">Modified Text (Right)</span>
              <span className="text-[10px] text-slate-400 font-semibold">{newText.split('\n').filter(Boolean).length} lines</span>
            </div>
            <textarea
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              placeholder="Paste modified version here..."
              rows={16}
              className="w-full p-5 font-mono text-sm leading-relaxed border-0 focus:ring-0 focus:outline-none bg-white text-slate-800 resize-y"
            />
          </div>
        </div>
      ) : null}

      {/* Config Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Comparison Parameters */}
        <div className="flex flex-wrap items-center gap-5 text-xs font-semibold text-slate-600">
          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={ignoreWhitespace}
              onChange={(e) => {
                setIgnoreWhitespace(e.target.checked);
                setIsCompared(false);
              }}
              className="rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 w-3.5 h-3.5"
            />
            Ignore Whitespace
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={ignoreCase}
              onChange={(e) => {
                setIgnoreCase(e.target.checked);
                setIsCompared(false);
              }}
              className="rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 w-3.5 h-3.5"
            />
            Ignore Case
          </label>
        </div>

        {/* View Switches & Trigger */}
        <div className="flex items-center gap-3 self-end md:self-auto">
          {isCompared && (
            <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200">
              <button
                onClick={() => setViewMode('side')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'side' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Split className="w-3.5 h-3.5" />
                Side by Side
              </button>
              <button
                onClick={() => setViewMode('inline')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'inline' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Rows className="w-3.5 h-3.5" />
                Inline List
              </button>
            </div>
          )}

          <button
            onClick={runDiff}
            disabled={!oldText && !newText}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-extrabold shadow-md hover:shadow-lg disabled:opacity-50 transition-all flex items-center gap-1.5"
          >
            <GitCompare className="w-4 h-4" />
            {isCompared ? 'Re-Compare Text' : 'Find Differences'}
          </button>
        </div>
      </div>

      {/* Comparison View Result */}
      {isCompared && (
        <div className="space-y-4">
          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4">
              <div className="text-xl font-black text-emerald-700">{stats.additions}</div>
              <div className="text-[10px] font-extrabold text-emerald-600 uppercase tracking-wider mt-0.5">Lines Added</div>
            </div>
            <div className="bg-red-50 border border-red-100 rounded-2xl p-4">
              <div className="text-xl font-black text-red-700">{stats.deletions}</div>
              <div className="text-[10px] font-extrabold text-red-600 uppercase tracking-wider mt-0.5">Lines Removed</div>
            </div>
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
              <div className="text-xl font-black text-slate-700">{stats.unchanged}</div>
              <div className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mt-0.5">Lines Unchanged</div>
            </div>
          </div>

          {/* Diffs Viewer container */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden font-mono text-sm leading-relaxed">
            {viewMode === 'side' ? (
              // Side by Side Split layout
              <div className="grid grid-cols-2 divide-x divide-slate-100 overflow-x-auto">
                {/* Left Side (Original) */}
                <div className="min-w-[400px]">
                  <div className="bg-slate-50 border-b border-slate-100 px-4 py-2 text-xs font-bold text-slate-500 uppercase tracking-wider sticky top-0">
                    Original Version
                  </div>
                  <div className="divide-y divide-slate-50 bg-white">
                    {diffRows.map((row, idx) => {
                      const { type, value, lineNum } = row.left;
                      const isRemoved = type === 'removed';
                      const isEmpty = type === 'empty';

                      return (
                        <div
                          key={`left-${idx}`}
                          className={`flex items-start min-h-[24px] ${
                            isRemoved ? 'bg-red-50/70 text-red-800' : isEmpty ? 'bg-slate-50/30' : 'text-slate-800'
                          }`}
                        >
                          <span className="w-12 text-right pr-3 select-none text-slate-300 text-xs font-bold border-r border-slate-100 py-0.5 bg-slate-50/50 shrink-0">
                            {lineNum || ''}
                          </span>
                          <span className="w-6 text-center select-none text-red-400 font-bold shrink-0 py-0.5">
                            {isRemoved ? '-' : ''}
                          </span>
                          <pre className="px-3 overflow-x-auto py-0.5 whitespace-pre-wrap word-break-all font-mono">
                            {value || ' '}
                          </pre>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Right Side (Modified) */}
                <div className="min-w-[400px]">
                  <div className="bg-slate-50 border-b border-slate-100 px-4 py-2 text-xs font-bold text-slate-500 uppercase tracking-wider sticky top-0">
                    Modified Version
                  </div>
                  <div className="divide-y divide-slate-50 bg-white">
                    {diffRows.map((row, idx) => {
                      const { type, value, lineNum } = row.right;
                      const isAdded = type === 'added';
                      const isEmpty = type === 'empty';

                      return (
                        <div
                          key={`right-${idx}`}
                          className={`flex items-start min-h-[24px] ${
                            isAdded ? 'bg-emerald-50/70 text-emerald-800' : isEmpty ? 'bg-slate-50/30' : 'text-slate-800'
                          }`}
                        >
                          <span className="w-12 text-right pr-3 select-none text-slate-300 text-xs font-bold border-r border-slate-100 py-0.5 bg-slate-50/50 shrink-0">
                            {lineNum || ''}
                          </span>
                          <span className="w-6 text-center select-none text-emerald-400 font-bold shrink-0 py-0.5">
                            {isAdded ? '+' : ''}
                          </span>
                          <pre className="px-3 overflow-x-auto py-0.5 whitespace-pre-wrap word-break-all font-mono">
                            {value || ' '}
                          </pre>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              // Sequential Inline listing layout
              <div className="divide-y divide-slate-100 overflow-x-auto bg-white">
                <div className="bg-slate-50 px-4 py-2 text-xs font-bold text-slate-500 uppercase tracking-wider sticky top-0">
                  Combined Inline Diff
                </div>
                {inlineRows.map((row, idx) => {
                  const isAdded = row.type === 'added';
                  const isRemoved = row.type === 'removed';

                  return (
                    <div
                      key={`inline-${idx}`}
                      className={`flex items-start min-h-[24px] ${
                        isAdded ? 'bg-emerald-50/70 text-emerald-800' : isRemoved ? 'bg-red-50/70 text-red-800' : 'text-slate-800'
                      }`}
                    >
                      <span className="w-12 text-right pr-3 select-none text-slate-300 text-xs font-bold border-r border-slate-100 py-0.5 bg-slate-50/50 shrink-0">
                        {row.lineNum || ''}
                      </span>
                      <span className={`w-6 text-center select-none font-bold shrink-0 py-0.5 ${isAdded ? 'text-emerald-500' : isRemoved ? 'text-red-500' : 'text-slate-300'}`}>
                        {isAdded ? '+' : isRemoved ? '-' : ' '}
                      </span>
                      <pre className="px-3 overflow-x-auto py-0.5 whitespace-pre-wrap word-break-all font-mono">
                        {row.value || ' '}
                      </pre>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
