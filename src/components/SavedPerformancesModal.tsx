import { useState } from 'react';
import { 
  X, 
  Disc, 
  Play, 
  Square, 
  Download, 
  Share2, 
  Trash2, 
  Music, 
  Calendar, 
  Clock 
} from 'lucide-react';
import { SavedPerformance } from '../types/music';
import { SharePerformanceModal } from './SharePerformanceModal';

interface SavedPerformancesModalProps {
  performances: SavedPerformance[];
  onDeletePerformance: (id: string) => void;
  onClose: () => void;
  lang: 'fa' | 'en';
}

export function SavedPerformancesModal({
  performances,
  onDeletePerformance,
  onClose,
  lang,
}: SavedPerformancesModalProps) {
  const [activePlayingId, setActivePlayingId] = useState<string | null>(null);
  const [sharingPerformance, setSharingPerformance] = useState<SavedPerformance | null>(null);

  const formatTime = (ts: number) => {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-2xl max-h-[85vh] rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl flex flex-col gap-4 text-right overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
            <Disc className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-slate-100 flex items-center gap-2">
              <span>{lang === 'fa' ? 'آرشیو اجراهای ضبط شده (آواز + ملودی)' : 'Saved Performances Library'}</span>
              <span className="text-xs font-mono font-normal text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
                {performances.length}
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              {lang === 'fa'
                ? 'فایل‌های همزمان صدای خواننده و همراهی تولید شده را بشنوید، دانلود کنید یا به اشتراک بگذارید:'
                : 'Listen, download, or share your synchronized vocal & melody recordings:'}
            </p>
          </div>
        </div>

        {/* Track List */}
        <div className="flex-1 overflow-y-auto flex flex-col gap-3 pr-1">
          {performances.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center gap-3 text-slate-500">
              <Music className="w-10 h-10 stroke-[1.5]" />
              <p className="text-sm font-medium">
                {lang === 'fa'
                  ? 'هنوز هیچ اجرایی ضبط نشده است. با زدن دکمه «ضبط اجرای زنده» خوانندگی خود را ذخیره کنید!'
                  : 'No saved recordings yet. Click "Record Session" to save your performance!'}
              </p>
            </div>
          ) : (
            performances.map((perf) => (
              <div
                key={perf.id}
                className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col gap-3 transition-colors hover:border-slate-700"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-sm text-slate-100">{perf.title}</h4>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(perf.timestamp)}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTime(perf.timestamp)}
                      </span>
                      <span>•</span>
                      <span className="font-mono text-cyan-400">
                        {Math.floor(perf.durationSeconds / 60)}:{String(perf.durationSeconds % 60).padStart(2, '0')}
                      </span>
                    </div>
                  </div>

                  {/* Metadata Chips */}
                  <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-auto text-xs">
                    <span className="px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/30">
                      {lang === 'fa' ? perf.styleNameFa : perf.styleNameEn}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-mono">
                      {perf.rootKey} {perf.scale}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-mono">
                      {perf.bpm} BPM
                    </span>
                  </div>
                </div>

                {/* Audio Player */}
                <div className="w-full">
                  <audio
                    controls
                    src={perf.audioUrl}
                    className="w-full h-10 rounded-lg"
                    onPlay={() => setActivePlayingId(perf.id)}
                    onPause={() => {
                      if (activePlayingId === perf.id) setActivePlayingId(null);
                    }}
                  />
                </div>

                {/* Action Buttons: Share, Download, Delete */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-900 text-xs">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSharingPerformance(perf)}
                      className="px-3 py-1.5 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 text-sky-300 flex items-center gap-1.5 transition-all font-medium"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>{lang === 'fa' ? 'اشتراک‌گذاری' : 'Share'}</span>
                    </button>

                    <a
                      href={perf.audioUrl}
                      download={`${perf.title}.webm`}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-all font-medium"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{lang === 'fa' ? 'دانلود' : 'Download'}</span>
                    </a>
                  </div>

                  <button
                    onClick={() => onDeletePerformance(perf.id)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    title={lang === 'fa' ? 'حذف قطعه' : 'Delete'}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Share Sub-Modal */}
      {sharingPerformance && (
        <SharePerformanceModal
          performance={sharingPerformance}
          onClose={() => setSharingPerformance(null)}
          lang={lang}
        />
      )}
    </div>
  );
}
