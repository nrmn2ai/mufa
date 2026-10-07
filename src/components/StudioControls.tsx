import { useState } from 'react';
import { 
  Sliders, 
  Disc, 
  Headphones, 
  Layers, 
  Download, 
  Radio, 
  Mic, 
  MicOff, 
  Play, 
  Square,
  Sparkles,
  Zap
} from 'lucide-react';
import { AccompanimentSettings, ScaleType } from '../types/music';

interface StudioControlsProps {
  settings: AccompanimentSettings;
  onUpdateSettings: (newSettings: Partial<AccompanimentSettings>) => void;
  isListening: boolean;
  onToggleMic: () => void;
  isAccompanimentPlaying: boolean;
  onToggleAccompaniment: () => void;
  isRecording: boolean;
  onToggleRecord: () => void;
  downloadUrl: string | null;
  lang: 'fa' | 'en';
}

const ROOT_KEYS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const SCALES: { id: ScaleType; nameFa: string; nameEn: string }[] = [
  { id: 'shur', nameFa: 'دستگاه شور (سنتی)', nameEn: 'Persian Shur' },
  { id: 'isfahan', nameFa: 'بیات اصفهان', nameEn: 'Bayat-e Isfahan' },
  { id: 'mahur', nameFa: 'دستگاه ماهور', nameEn: 'Persian Mahur' },
  { id: 'minor', nameFa: 'مینور طبیعی (طنین حسی)', nameEn: 'Natural Minor' },
  { id: 'major', nameFa: 'ماژور طبیعی (روشن و شاد)', nameEn: 'Natural Major' },
  { id: 'dorian', nameFa: 'دورین (جاز و مدرن)', nameEn: 'Dorian Mode' },
  { id: 'blues', nameFa: 'گام بلوز', nameEn: 'Blues Scale' },
  { id: 'pentatonic', nameFa: 'پنج‌صدایی (کهکشانی)', nameEn: 'Pentatonic' },
];

export function StudioControls({
  settings,
  onUpdateSettings,
  isListening,
  onToggleMic,
  isAccompanimentPlaying,
  onToggleAccompaniment,
  isRecording,
  onToggleRecord,
  downloadUrl,
  lang,
}: StudioControlsProps) {
  const [activeTab, setActiveTab] = useState<'layers' | 'scale' | 'mixer'>('layers');

  return (
    <div className="w-full rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-md shadow-xl flex flex-col gap-5">
      {/* Primary Action Ribbon: Mic, Start Accomp, Record */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Mic Toggle Button */}
          <button
            onClick={onToggleMic}
            className={`px-4 py-2.5 rounded-xl font-medium text-xs sm:text-sm flex items-center gap-2 transition-all shadow-md ${
              isListening
                ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-900/40 ring-2 ring-rose-400/30'
                : 'bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold shadow-emerald-950/40'
            }`}
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            <span>
              {isListening
                ? (lang === 'fa' ? 'خاموش کردن میکروفن' : 'Stop Microphone')
                : (lang === 'fa' ? 'شروع شنیدن صدای آواز' : 'Enable Microphone')}
            </span>
          </button>

          {/* Accompaniment Toggle Button */}
          <button
            onClick={onToggleAccompaniment}
            className={`px-4 py-2.5 rounded-xl font-medium text-xs sm:text-sm flex items-center gap-2 transition-all border ${
              isAccompanimentPlaying
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-md ring-1 ring-amber-400/40'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
          >
            {isAccompanimentPlaying ? <Square className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
            <span>
              {isAccompanimentPlaying
                ? (lang === 'fa' ? 'توقف پخش ملودی' : 'Stop Accompaniment')
                : (lang === 'fa' ? 'پخش همراهی همزمان' : 'Start Accompaniment')}
            </span>
          </button>

          {/* Auto-Start Music on Voice Toggle */}
          <button
            onClick={() => onUpdateSettings({ autoStartOnVoice: !settings.autoStartOnVoice })}
            className={`px-3 py-2.5 rounded-xl font-medium text-xs sm:text-sm flex items-center gap-1.5 transition-all border ${
              settings.autoStartOnVoice
                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40 shadow-sm'
                : 'bg-slate-800/80 text-slate-400 border-slate-700'
            }`}
            title={lang === 'fa' ? 'شروع خودکار نواختن با شروع آواز' : 'Auto-detect genre and start music on voice'}
          >
            <Zap className={`w-4 h-4 ${settings.autoStartOnVoice ? 'text-emerald-400 fill-emerald-400/30' : 'text-slate-500'}`} />
            <span>
              {settings.autoStartOnVoice
                ? (lang === 'fa' ? 'شروع خودکار با صدا: فعال' : 'Auto-Play on Voice: ON')
                : (lang === 'fa' ? 'شروع خودکار: غیرفعال' : 'Auto-Play: OFF')}
            </span>
          </button>

          {/* Record Button */}
          <button
            onClick={onToggleRecord}
            className={`px-3.5 py-2.5 rounded-xl font-medium text-xs sm:text-sm flex items-center gap-2 transition-all border ${
              isRecording
                ? 'bg-red-600 text-white border-red-500 animate-pulse'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
          >
            <Disc className={`w-4 h-4 ${isRecording ? 'animate-spin' : ''}`} />
            <span>
              {isRecording
                ? (lang === 'fa' ? 'توقف و ذخیره ضبط' : 'Stop & Save Recording')
                : (lang === 'fa' ? 'ضبط اجرای زنده' : 'Record Session')}
            </span>
          </button>
        </div>

        {/* Download recorded file if ready */}
        {downloadUrl && (
          <a
            href={downloadUrl}
            download={`melodiya-live-${Date.now()}.webm`}
            className="px-3.5 py-2 rounded-xl bg-cyan-600/30 hover:bg-cyan-600/40 border border-cyan-500/50 text-cyan-200 text-xs font-medium flex items-center gap-1.5 transition-all shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{lang === 'fa' ? 'دانلود اجرای ضبط شده' : 'Download Track'}</span>
          </a>
        )}
      </div>

      {/* Tabs: Layers / Scale & Key / Mixer */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('layers')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
            activeTab === 'layers'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>{lang === 'fa' ? 'لایه‌های سازبندی' : 'Instrument Layers'}</span>
        </button>

        <button
          onClick={() => setActiveTab('scale')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
            activeTab === 'scale'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{lang === 'fa' ? 'گام و آکوردها' : 'Scale & Harmonies'}</span>
        </button>

        <button
          onClick={() => setActiveTab('mixer')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
            activeTab === 'mixer'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>{lang === 'fa' ? 'میکسر و صداها' : 'Mixer & Effects'}</span>
        </button>
      </div>

      {/* Tab 1: Accompaniment Layers */}
      {activeTab === 'layers' && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {/* Chords Toggle */}
          <button
            onClick={() => onUpdateSettings({ enableChords: !settings.enableChords })}
            className={`p-3 rounded-xl border text-right transition-all flex flex-col justify-between ${
              settings.enableChords
                ? 'bg-cyan-500/15 border-cyan-500/50 text-cyan-200'
                : 'bg-slate-950/40 border-slate-800 text-slate-500'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-xs">{lang === 'fa' ? 'آکوردها' : 'Chords'}</span>
              <span className={`w-2 h-2 rounded-full ${settings.enableChords ? 'bg-cyan-400' : 'bg-slate-700'}`} />
            </div>
            <span className="text-[11px] opacity-80">{lang === 'fa' ? 'پیانو / پد آکورد' : 'Piano / Synth Pad'}</span>
          </button>

          {/* Harmony Counter-melody */}
          <button
            onClick={() => onUpdateSettings({ enableMelodyHarmony: !settings.enableMelodyHarmony })}
            className={`p-3 rounded-xl border text-right transition-all flex flex-col justify-between ${
              settings.enableMelodyHarmony
                ? 'bg-amber-500/15 border-amber-500/50 text-amber-200'
                : 'bg-slate-950/40 border-slate-800 text-slate-500'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-xs">{lang === 'fa' ? 'هارمونی آواز' : 'Vocal Harmony'}</span>
              <span className={`w-2 h-2 rounded-full ${settings.enableMelodyHarmony ? 'bg-amber-400' : 'bg-slate-700'}`} />
            </div>
            <span className="text-[11px] opacity-80">{lang === 'fa' ? 'دوئت زنده فاصله ۳ و ۵' : 'Real-time 3rd/5th Voice'}</span>
          </button>

          {/* Bassline */}
          <button
            onClick={() => onUpdateSettings({ enableBass: !settings.enableBass })}
            className={`p-3 rounded-xl border text-right transition-all flex flex-col justify-between ${
              settings.enableBass
                ? 'bg-purple-500/15 border-purple-500/50 text-purple-200'
                : 'bg-slate-950/40 border-slate-800 text-slate-500'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-xs">{lang === 'fa' ? 'خط باس' : 'Bassline'}</span>
              <span className={`w-2 h-2 rounded-full ${settings.enableBass ? 'bg-purple-400' : 'bg-slate-700'}`} />
            </div>
            <span className="text-[11px] opacity-80">{lang === 'fa' ? 'بیس عمیق و ریتمیک' : 'Sub & Harmonic Bass'}</span>
          </button>

          {/* Drums & Percussion */}
          <button
            onClick={() => onUpdateSettings({ enablePercussion: !settings.enablePercussion })}
            className={`p-3 rounded-xl border text-right transition-all flex flex-col justify-between ${
              settings.enablePercussion
                ? 'bg-rose-500/15 border-rose-500/50 text-rose-200'
                : 'bg-slate-950/40 border-slate-800 text-slate-500'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-xs">{lang === 'fa' ? 'کوبه و دف/تنبک' : 'Percussion'}</span>
              <span className={`w-2 h-2 rounded-full ${settings.enablePercussion ? 'bg-rose-400' : 'bg-slate-700'}`} />
            </div>
            <span className="text-[11px] opacity-80">{lang === 'fa' ? 'دف، تنبک و درامز' : 'Daf, Tombak & Drums'}</span>
          </button>

          {/* Arpeggio */}
          <button
            onClick={() => onUpdateSettings({ enableArpeggio: !settings.enableArpeggio })}
            className={`p-3 rounded-xl border text-right transition-all flex flex-col justify-between ${
              settings.enableArpeggio
                ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-200'
                : 'bg-slate-950/40 border-slate-800 text-slate-500'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-xs">{lang === 'fa' ? 'آرپژ و ریزنوایی' : 'Arpeggio'}</span>
              <span className={`w-2 h-2 rounded-full ${settings.enableArpeggio ? 'bg-emerald-400' : 'bg-slate-700'}`} />
            </div>
            <span className="text-[11px] opacity-80">{lang === 'fa' ? 'پاسخ مضراب سنتور و پیانو' : 'Santur & Piano Arp'}</span>
          </button>
        </div>
      )}

      {/* Tab 2: Scale and Key */}
      {activeTab === 'scale' && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                {lang === 'fa' ? 'نت پایه (Root Key):' : 'Root Key:'}
              </label>
              <div className="flex flex-wrap gap-1">
                {ROOT_KEYS.map((key) => (
                  <button
                    key={key}
                    onClick={() => onUpdateSettings({ selectedRootKey: key })}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                      settings.selectedRootKey === key
                        ? 'bg-amber-500 text-slate-950 shadow-md'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                    }`}
                  >
                    {key}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-400 flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.autoKeyDetect}
                  onChange={(e) => onUpdateSettings({ autoKeyDetect: e.target.checked })}
                  className="rounded border-slate-700 text-amber-500 focus:ring-amber-500"
                />
                <span>{lang === 'fa' ? 'تشخیص خودکار گام با آواز' : 'Auto-Detect Key from Voice'}</span>
              </label>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              {lang === 'fa' ? 'دستگاه و گام موسیقایی:' : 'Musical Scale / Mode:'}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {SCALES.map((scale) => (
                <button
                  key={scale.id}
                  onClick={() => onUpdateSettings({ selectedScale: scale.id })}
                  className={`p-2.5 rounded-xl border text-right text-xs transition-all ${
                    settings.selectedScale === scale.id
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                      : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:bg-slate-800/40'
                  }`}
                >
                  <div>{lang === 'fa' ? scale.nameFa : scale.nameEn}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Mixer & Effects */}
      {activeTab === 'mixer' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Accompaniment Volume */}
          <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800 flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300">{lang === 'fa' ? 'صدای ملودی همراهی' : 'Accompaniment Volume'}</span>
              <span className="font-mono text-cyan-400">{Math.round(settings.accompanimentVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.accompanimentVolume}
              onChange={(e) => onUpdateSettings({ accompanimentVolume: parseFloat(e.target.value) })}
              className="w-full accent-cyan-500"
            />
          </div>

          {/* Reverb Depth */}
          <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800 flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300">{lang === 'fa' ? 'طنین و ریورب سالن' : 'Reverb / Hall Space'}</span>
              <span className="font-mono text-amber-400">{Math.round(settings.reverbAmount * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.reverbAmount}
              onChange={(e) => onUpdateSettings({ reverbAmount: parseFloat(e.target.value) })}
              className="w-full accent-amber-500"
            />
          </div>

          {/* Mic Feedback Protection */}
          <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800 flex flex-col justify-between gap-2">
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <Headphones className="w-4 h-4 text-emerald-400" />
              <span>{lang === 'fa' ? 'جلوگیری از فیدبک بلندگو' : 'Speaker Anti-Feedback'}</span>
            </div>
            <label className="text-[11px] text-slate-400 flex items-center gap-2 cursor-pointer mt-1">
              <input
                type="checkbox"
                checked={settings.muteMicMonitor}
                onChange={(e) => onUpdateSettings({ muteMicMonitor: e.target.checked })}
                className="rounded border-slate-700 text-emerald-500"
              />
              <span>
                {lang === 'fa'
                  ? 'قطع پخش مستقیم صدای میکروفن در بلندگو (توصیه شده بدون هدفون)'
                  : 'Mute vocal monitor to avoid feedback loop'}
              </span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
