import { MusicalStyleId } from '../types/music';
import { MUSICAL_STYLES } from '../data/styles';
import { Sparkles, Lock, RefreshCw, Zap, Activity } from 'lucide-react';

interface StyleIndicatorProps {
  currentStyle: MusicalStyleId;
  autoDetect: boolean;
  onToggleAutoDetect: (auto: boolean) => void;
  onSelectStyle: (style: MusicalStyleId) => void;
  scores: Record<MusicalStyleId, number>;
  reasonFa: string;
  reasonEn: string;
  melismaFactor: number;
  vibratoDepth: number;
  spectralCentroid: number;
  bpm: number;
  lang: 'fa' | 'en';
}

export function StyleIndicator({
  currentStyle,
  autoDetect,
  onToggleAutoDetect,
  onSelectStyle,
  scores,
  reasonFa,
  reasonEn,
  melismaFactor,
  vibratoDepth,
  spectralCentroid,
  bpm,
  lang,
}: StyleIndicatorProps) {
  const activeStyleMeta = MUSICAL_STYLES[currentStyle] || MUSICAL_STYLES.traditional_persian;

  return (
    <div className="w-full rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-md shadow-xl flex flex-col gap-4">
      {/* Header and Auto-Detect Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-lg"
            style={{
              backgroundColor: `${activeStyleMeta.color}20`,
              color: activeStyleMeta.color,
              border: `1px solid ${activeStyleMeta.color}50`,
            }}
          >
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-lg text-slate-100">
                {lang === 'fa' ? activeStyleMeta.nameFa : activeStyleMeta.nameEn}
              </h3>
              {autoDetect ? (
                <span className="text-[11px] font-medium text-emerald-400 bg-emerald-950/70 border border-emerald-800/80 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  {lang === 'fa' ? 'تغییر خودکار سبک با آواز' : 'Auto-Morphing Style'}
                </span>
              ) : (
                <span className="text-[11px] font-medium text-amber-400 bg-amber-950/70 border border-amber-800/80 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  {lang === 'fa' ? 'سبک قفل‌شده' : 'Locked Style'}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {lang === 'fa' ? activeStyleMeta.descriptionFa : activeStyleMeta.descriptionEn}
            </p>
          </div>
        </div>

        {/* Mode Toggle Button */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => onToggleAutoDetect(!autoDetect)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 border ${
              autoDetect
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
          >
            {autoDetect ? <RefreshCw className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
            <span>
              {autoDetect
                ? (lang === 'fa' ? 'تطبیق هوشمند فعال' : 'Auto Morph ON')
                : (lang === 'fa' ? 'قفل روی این سبک' : 'Lock Active Style')}
            </span>
          </button>
        </div>
      </div>

      {/* AI Tone Detection Reason Prompt */}
      <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs">
        <Zap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div className="flex-1">
          <span className="font-semibold text-slate-300">
            {lang === 'fa' ? 'تحلیل لحظه‌ای صدای خواننده: ' : 'Live Vocal Tone Analysis: '}
          </span>
          <span className="text-slate-400">
            {lang === 'fa' ? reasonFa : reasonEn}
          </span>
        </div>
      </div>

      {/* Vocal Characteristics Gauges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-2.5 rounded-xl bg-slate-950/50 border border-slate-800">
          <div className="text-slate-400 mb-1 flex items-center justify-between">
            <span>{lang === 'fa' ? 'تحریر و چرخش صدا' : 'Melisma / Tahrir'}</span>
            <Activity className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-sm font-bold font-mono text-slate-200">
            {Math.round(melismaFactor * 100)}%
          </div>
          <div className="w-full h-1 bg-slate-800 rounded-full mt-1.5 overflow-hidden">
            <div
              className="h-full bg-amber-400 transition-all duration-300"
              style={{ width: `${Math.min(100, melismaFactor * 100)}%` }}
            />
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-950/50 border border-slate-800">
          <div className="text-slate-400 mb-1 flex items-center justify-between">
            <span>{lang === 'fa' ? 'ویبراتوی حنجره' : 'Vocal Vibrato'}</span>
            <span className="font-mono text-[10px] text-purple-400">Hz</span>
          </div>
          <div className="text-sm font-bold font-mono text-slate-200">
            {Math.round(vibratoDepth)} Hz
          </div>
          <div className="w-full h-1 bg-slate-800 rounded-full mt-1.5 overflow-hidden">
            <div
              className="h-full bg-purple-400 transition-all duration-300"
              style={{ width: `${Math.min(100, (vibratoDepth / 15) * 100)}%` }}
            />
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-950/50 border border-slate-800">
          <div className="text-slate-400 mb-1 flex items-center justify-between">
            <span>{lang === 'fa' ? 'روشنایی طنین' : 'Timbre Brightness'}</span>
            <span className="font-mono text-[10px] text-cyan-400">Freq</span>
          </div>
          <div className="text-sm font-bold font-mono text-slate-200">
            {Math.round(spectralCentroid)} Hz
          </div>
          <div className="w-full h-1 bg-slate-800 rounded-full mt-1.5 overflow-hidden">
            <div
              className="h-full bg-cyan-400 transition-all duration-300"
              style={{ width: `${Math.min(100, (spectralCentroid / 2400) * 100)}%` }}
            />
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-950/50 border border-slate-800">
          <div className="text-slate-400 mb-1 flex items-center justify-between">
            <span>{lang === 'fa' ? 'سرعت ریتم' : 'Tempo (BPM)'}</span>
            <span className="font-mono text-[10px] text-emerald-400">Beat</span>
          </div>
          <div className="text-sm font-bold font-mono text-slate-200">
            {bpm} BPM
          </div>
          <div className="w-full h-1 bg-slate-800 rounded-full mt-1.5 overflow-hidden">
            <div
              className="h-full bg-emerald-400 transition-all duration-300"
              style={{ width: `${Math.min(100, ((bpm - 60) / 100) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Style Selector Chips (with match percentages) */}
      <div className="mt-1">
        <label className="text-xs font-semibold text-slate-400 mb-2 block">
          {lang === 'fa'
            ? 'سبک‌های موسیقی (کلیک کنید برای تغییر یا قفل):'
            : 'Musical Styles (Click to manually trigger or lock):'}
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {(Object.keys(MUSICAL_STYLES) as MusicalStyleId[]).map((styleId) => {
            const style = MUSICAL_STYLES[styleId];
            const isCurrent = styleId === currentStyle;
            const score = scores[styleId] || 0;
            const matchPercent = Math.min(100, Math.round(score * 40));

            return (
              <button
                key={styleId}
                onClick={() => onSelectStyle(styleId)}
                className={`relative flex flex-col items-start p-2.5 rounded-xl border text-right transition-all group ${
                  isCurrent
                    ? 'bg-slate-800/90 shadow-md ring-2'
                    : 'bg-slate-950/50 hover:bg-slate-800/40 border-slate-800'
                }`}
                style={{
                  borderColor: isCurrent ? style.color : '#334155',
                }}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: style.color }}
                  />
                  {autoDetect && matchPercent > 0 && (
                    <span className="text-[10px] font-mono text-slate-400">
                      {matchPercent}%
                    </span>
                  )}
                </div>
                <div className="font-medium text-xs text-slate-200 group-hover:text-white line-clamp-1">
                  {lang === 'fa' ? style.nameFa : style.nameEn}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
                  {style.instrumentLead}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
