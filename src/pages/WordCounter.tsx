import { useState } from 'react';
import { 
  BarChart3, 
  Trash2, 
  Copy, 
  Check, 
  Sparkles, 
  BookOpen, 
  Mic, 
  Activity
} from 'lucide-react';

const STOPWORDS = new Set([
  'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you', 'your', 'yours', 
  'yourself', 'yourselves', 'he', 'him', 'his', 'himself', 'she', 'her', 'hers', 
  'herself', 'it', 'its', 'itself', 'they', 'them', 'their', 'theirs', 'themselves', 
  'what', 'which', 'who', 'whom', 'this', 'that', 'these', 'those', 'am', 'is', 'are', 
  'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'having', 'do', 'does', 
  'did', 'doing', 'a', 'an', 'the', 'and', 'but', 'if', 'or', 'because', 'as', 'until', 
  'while', 'of', 'at', 'by', 'for', 'with', 'about', 'against', 'between', 'into', 
  'through', 'during', 'before', 'after', 'above', 'below', 'to', 'from', 'up', 'down', 
  'in', 'out', 'on', 'off', 'over', 'under', 'again', 'further', 'then', 'once', 'here', 
  'there', 'when', 'where', 'why', 'how', 'all', 'any', 'both', 'each', 'few', 'more', 
  'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 
  'than', 'too', 'very', 's', 't', 'can', 'will', 'just', 'don', 'should', 'now'
]);

export function WordCounter() {
  const [text, setText] = useState('');
  const [copied, setCopied] = useState(false);
  const [excludeStopwords, setExcludeStopwords] = useState(false);

  const handleCopy = async () => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleClear = () => {
    setText('');
  };

  const loadSample = () => {
    setText(
      `Text analysis tools are essential for content writers, SEO experts, and developers alike. By checking word density and distribution, you can ensure that your copy is balanced, engaging, and not spammy.\n\nThis workstation runs entirely inside your web browser. This means that no server-side APIs are invoked, and all processing is carried out locally using your computer's resources. In a world focused on privacy and security, this ensures your sensitive data is 100% protected and secure. Happy writing!`
    );
  };

  // Perform statistics calculations
  const totalChars = text.length;
  const charsNoSpaces = text.replace(/\s/g, '').length;
  const lines = text === '' ? 0 : text.split('\n').length;
  const paragraphs = text.trim() === '' ? 0 : text.split(/\n\s*\n/).filter(Boolean).length;
  
  // Word matching
  const wordsArray = text.toLowerCase().match(/\b[a-z0-9'-]+\b/g) || [];
  const totalWords = wordsArray.length;
  
  // Sentence matching
  const sentencesCount = text.trim() === '' ? 0 : (text.match(/[.!?]+(\s|$)/g) || []).length + (text.trim().slice(-1).match(/[^.!?]/) ? 1 : 0);

  // Average calculations
  const avgWordLength = totalWords > 0 
    ? (wordsArray.reduce((acc, word) => acc + word.length, 0) / totalWords).toFixed(1) 
    : '0';

  const avgSentenceLength = sentencesCount > 0 
    ? (totalWords / sentencesCount).toFixed(1) 
    : '0';

  // Reading / Speaking times
  // Average reading speed: 200 words per minute
  // Average speaking speed: 130 words per minute
  const readingTimeSecs = Math.ceil((totalWords / 200) * 60);
  const speakingTimeSecs = Math.ceil((totalWords / 130) * 60);

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return secs === 0 ? `${mins}m` : `${mins}m ${secs}s`;
  };

  // Density Mapping
  const filteredWords = excludeStopwords 
    ? wordsArray.filter(w => !STOPWORDS.has(w)) 
    : wordsArray;

  const densityMap: { [key: string]: number } = {};
  filteredWords.forEach(word => {
    if (word.length > 1) { // ignore single-letter words mostly
      densityMap[word] = (densityMap[word] || 0) + 1;
    }
  });

  const sortedDensity = Object.entries(densityMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8); // Top 8 words

  const maxFrequency = sortedDensity.length > 0 ? sortedDensity[0][1] : 1;

  // Longest Words
  const uniqueWords = Array.from(new Set(wordsArray));
  const longestWords = uniqueWords
    .sort((a, b) => b.length - a.length)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Title block */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-2.5">
            <BarChart3 className="w-8 h-8 text-indigo-600" />
            Word Counter & Stats
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Count characters, sentences, check average reading durations, and evaluate word density profiles.
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

      {/* Editor & Stats Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Editor Area (Left 7cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
                Writing Board
              </span>
              <button
                onClick={handleCopy}
                disabled={!text}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Copy All
                  </>
                )}
              </button>
            </div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste or write your text block here..."
              rows={18}
              className="w-full p-6 text-slate-800 bg-white border-0 focus:ring-0 focus:outline-none resize-y text-sm leading-relaxed"
            />
          </div>

          {/* Detailed Readability Indicators */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl shrink-0">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Reading Time</div>
                <div className="text-lg font-black text-slate-800 mt-0.5">{formatTime(readingTimeSecs)}</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl shrink-0">
                <Mic className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Speaking Time</div>
                <div className="text-lg font-black text-slate-800 mt-0.5">{formatTime(speakingTimeSecs)}</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl shrink-0">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Avg. Word Size</div>
                <div className="text-lg font-black text-slate-800 mt-0.5">{avgWordLength} <span className="text-[10px] text-slate-400 font-semibold">chars</span></div>
              </div>
            </div>
          </div>
        </div>

        {/* Counter Dashboard Sidebar (Right 5cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Counters Grid */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-3">Counters</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50/70 rounded-xl p-4 border border-slate-100">
                <div className="text-2xl font-black text-slate-800">{totalWords}</div>
                <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mt-1">Words</div>
              </div>
              <div className="bg-slate-50/70 rounded-xl p-4 border border-slate-100">
                <div className="text-2xl font-black text-slate-800">{totalChars}</div>
                <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mt-1">Characters</div>
              </div>
              <div className="bg-slate-50/70 rounded-xl p-4 border border-slate-100">
                <div className="text-2xl font-black text-slate-800">{charsNoSpaces}</div>
                <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mt-1">Chars (no spaces)</div>
              </div>
              <div className="bg-slate-50/70 rounded-xl p-4 border border-slate-100">
                <div className="text-2xl font-black text-slate-800">{sentencesCount}</div>
                <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mt-1">Sentences</div>
              </div>
              <div className="bg-slate-50/70 rounded-xl p-4 border border-slate-100">
                <div className="text-2xl font-black text-slate-800">{paragraphs}</div>
                <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mt-1">Paragraphs</div>
              </div>
              <div className="bg-slate-50/70 rounded-xl p-4 border border-slate-100">
                <div className="text-2xl font-black text-slate-800">{lines}</div>
                <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mt-1">Lines</div>
              </div>
            </div>
            <div className="text-xs font-semibold text-slate-500 flex justify-between pt-1 border-t border-slate-100">
              <span>Avg. Words per Sentence:</span>
              <strong className="text-slate-800">{avgSentenceLength}</strong>
            </div>
          </div>

          {/* Density Analysis */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Word Density</h3>
              <label className="flex items-center gap-1 text-[11px] font-bold text-slate-500 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={excludeStopwords}
                  onChange={(e) => setExcludeStopwords(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 w-3 h-3"
                />
                Filter Stopwords
              </label>
            </div>

            {sortedDensity.length > 0 ? (
              <div className="space-y-3">
                {sortedDensity.map(([word, freq]) => {
                  const percentage = totalWords > 0 ? ((freq / totalWords) * 100).toFixed(1) : '0';
                  const widthPercent = (freq / maxFrequency) * 100;
                  return (
                    <div key={word} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-slate-700 font-mono bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">{word}</span>
                        <span className="text-slate-500">{freq} times ({percentage}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-indigo-500 h-full rounded-full transition-all duration-300"
                          style={{ width: `${widthPercent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-slate-400 font-medium text-center py-4">
                No words analyzed yet. Paste some text to view density stats.
              </p>
            )}
          </div>

          {/* Longest Words */}
          {longestWords.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-3">Longest Words</h3>
              <div className="divide-y divide-slate-50">
                {longestWords.map((word, idx) => (
                  <div key={`${word}-${idx}`} className="flex items-center justify-between py-2 text-xs font-semibold">
                    <span className="text-slate-700 font-mono">{word}</span>
                    <span className="text-slate-400 font-medium">{word.length} letters</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
