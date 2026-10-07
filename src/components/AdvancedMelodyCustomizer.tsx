import { useState } from 'react';
import { 
  Sliders, 
  Gauge, 
  Layers, 
  RotateCcw, 
  KeyRound, 
  Sparkles, 
  Volume2, 
  CheckCircle2,
  Clock,
  Music
} from 'lucide-react';
import { 
  AccompanimentSettings, 
  ComplexityLevel, 
  LeadInstrument, 
  PadInstrument, 
  BassInstrument, 
  DrumKit, 
  ScaleType 
} from '../types/music';

interface AdvancedMelodyCustomizerProps {
  settings: AccompanimentSettings;
  onUpdateSettings: (newSettings: Partial<AccompanimentSettings>) => void;
  lang: 'fa' | 'en';
}

const ROOT_KEYS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const SCALES: { id: ScaleType; nameFa: string; nameEn: string }[] = [
  { id: 'shur', nameFa: 'دستگاه شور ایرانی', nameEn: 'Persian Shur' },
  { id: 'isfahan', nameFa: 'آواز بیات اصفهان', nameEn: 'Bayat-e Isfahan' },
  { id: 'mahur', nameFa: 'دستگاه ماهور', nameEn: 'Persian Mahur' },
  { id: 'minor', nameFa: 'مینور طبیعی', nameEn: 'Natural Minor' },
  { id: 'major', nameFa: 'ماژور طبیعی', nameEn: 'Natural Major' },
  { id: 'dorian', nameFa: 'دورین جاز', nameEn: 'Dorian Mode' },
  { id: 'blues', nameFa: 'گام بلوز', nameEn: 'Blues Scale' },
  { id: 'pentatonic', nameFa: 'پنج‌صدایی کهکشانی', nameEn: 'Pentatonic' },
];

const LEAD_INSTRUMENTS: { id: LeadInstrument; nameFa: string; nameEn: string }[] = [
  { id: 'santur', nameFa: 'سنتور مضراب‌خورده', nameEn: 'Persian Santur' },
  { id: 'tar', nameFa: 'تار و سه‌تار اصیل', nameEn: 'Tar / Setar' },
  { id: 'piano', nameFa: 'پیانو گرند آکوستیک', nameEn: 'Grand Piano' },
  { id: 'rhodes', nameFa: 'پیانو الکتریک رودز', nameEn: 'Vintage Rhodes' },
  { id: 'synth_lead', nameFa: 'سینت سایزر براق', nameEn: 'Modern Synth Lead' },
  { id: 'violin', nameFa: 'ویولن و کمانچه کششی', nameEn: 'Violin / Kamancheh' },
];

const PAD_INSTRUMENTS: { id: PadInstrument; nameFa: string; nameEn: string }[] = [
  { id: 'oriental_pad', nameFa: 'پد کهن شرقی', nameEn: 'Oriental Modal Pad' },
  { id: 'acoustic_piano', nameFa: 'آکوردهای پیانو', nameEn: 'Acoustic Piano Chords' },
  { id: 'warm_strings', nameFa: 'ارکستر زهی ملایم', nameEn: 'Warm Strings Ensemble' },
  { id: 'vintage_rhodes', nameFa: 'آکوردهای جاز رودز', nameEn: 'Jazz Rhodes Voicing' },
  { id: 'synth_poly', nameFa: 'پلی‌سینت فضایی', nameEn: 'Ambient Poly Synth' },
];

const BASS_INSTRUMENTS: { id: BassInstrument; nameFa: string; nameEn: string }[] = [
  { id: 'sub_808', nameFa: 'ساب بیس عمیق ۸۰۸', nameEn: 'Deep 808 Sub' },
  { id: 'upright_bass', nameFa: 'کنترباس آکوستیک', nameEn: 'Upright Acoustic Bass' },
  { id: 'electric_drive', nameFa: 'بیس درایو راک', nameEn: 'Overdrive Rock Bass' },
  { id: 'synth_bass', nameFa: 'سینت بیس مدرن', nameEn: 'Modern Synth Bass' },
];

const DRUM_KITS: { id: DrumKit; nameFa: string; nameEn: string }[] = [
  { id: 'daf_tombak', nameFa: 'دف، تنبک و دایره', nameEn: 'Daf & Tombak Percussion' },
  { id: 'electronic_pop', nameFa: 'درام ماشین مدرن پاپ', nameEn: 'Electronic Pop Kit' },
  { id: 'acoustic_kit', nameFa: 'درامز زنده آکوستیک', nameEn: 'Acoustic Studio Kit' },
  { id: 'lofi_brush', nameFa: 'براش اسنیر لوفای', nameEn: 'Lofi Brushed Snare' },
  { id: 'ambient_chimes', nameFa: 'زنگ و پژواک امبینت', nameEn: 'Ambient Chimes' },
];

const COMPLEXITY_LEVELS: { id: ComplexityLevel; nameFa: string; nameEn: string; descFa: string; descEn: string }[] = [
  {
    id: 'minimal',
    nameFa: 'ساده و مینیمال',
    nameEn: 'Minimal & Sparse',
    descFa: 'همراهی خلوت و آرام با آکوردهای کشیده مناسب ترانه‌های احساسی',
    descEn: 'Sparse, long-held chords and gentle subtle bassline',
  },
  {
    id: 'balanced',
    nameFa: 'متعادل و دلنشین',
    nameEn: 'Balanced & Flowing',
    descFa: 'آرپژهای استاندارد، ریتم روان و هارمونی منظم همراه آواز',
    descEn: 'Standard flowing arpeggios and steady rhythmic cadence',
  },
  {
    id: 'ornate',
    nameFa: 'پرتحریر و آراسته',
    nameEn: 'Ornate & Melismatic',
    descFa: 'ریزه‌کاری‌های تکنیکی، جواب‌های ملودیک سریع و نت‌های زینت',
    descEn: 'Melismatic counter-melodies and rapid responsive ornaments',
  },
  {
    id: 'virtuoso',
    nameFa: 'ویرتوئوز و پیشرفته',
    nameEn: 'Virtuoso & Complex',
    descFa: 'آرپژهای شتابان ۱۶گانه، جهش‌های اکتاوی و پلی‌فونی غنی',
    descEn: 'Rapid 16th-note polyphonic runs and dynamic octave leaps',
  },
];

export function AdvancedMelodyCustomizer({
  settings,
  onUpdateSettings,
  lang,
}: AdvancedMelodyCustomizerProps) {
  const [activeTab, setActiveTab] = useState<'tempo' | 'complexity' | 'instruments' | 'key_harmony'>('tempo');
  const [tapTimes, setTapTimes] = useState<number[]>([]);

  // Tap Tempo calculation
  const handleTapTempo = () => {
    const now = performance.now();
    const updated = [...tapTimes, now].filter(t => now - t < 3000);
    setTapTimes(updated);

    if (updated.length >= 3) {
      const deltas: number[] = [];
      for (let i = 1; i < updated.length; i++) {
        deltas.push(updated[i] - updated[i - 1]);
      }
      const avgMs = deltas.reduce((a, b) => a + b, 0) / deltas.length;
      const bpm = Math.min(180, Math.max(50, Math.round(60000 / avgMs)));
      onUpdateSettings({ bpm });
    }
  };

  return (
    <div className="w-full rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-md shadow-2xl flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm sm:text-base text-slate-100 flex items-center gap-2">
              <span>{lang === 'fa' ? 'تنظیمات پیشرفته شخصی‌سازی ملودی' : 'Advanced Melody Customization Studio'}</span>
              <span className="text-[11px] font-normal text-cyan-400 bg-cyan-950/60 border border-cyan-800/60 px-2 py-0.5 rounded-md">
                Live Fine-Tuning
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {lang === 'fa'
                ? 'تمپو، پیچیدگی هارمونی، جنس سازها، انتقال گام و فواصل همراهی را در هر لحظه تغییر دهید:'
                : 'Fine-tune tempo, complexity, instruments, key transposition, and harmony voicing in real-time:'}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('tempo')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
            activeTab === 'tempo'
              ? 'bg-cyan-500 text-slate-950 shadow-md font-bold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>{lang === 'fa' ? 'تمپو و ضرب‌آهنگ (BPM)' : 'Tempo & BPM'}</span>
        </button>

        <button
          onClick={() => setActiveTab('complexity')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
            activeTab === 'complexity'
              ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <Gauge className="w-3.5 h-3.5" />
          <span>{lang === 'fa' ? 'سطح پیچیدگی و آرپژ' : 'Melody Complexity'}</span>
        </button>

        <button
          onClick={() => setActiveTab('instruments')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
            activeTab === 'instruments'
              ? 'bg-purple-500 text-white shadow-md font-bold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>{lang === 'fa' ? 'انتخاب اختصاصی سازها' : 'Instrumentation'}</span>
        </button>

        <button
          onClick={() => setActiveTab('key_harmony')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
            activeTab === 'key_harmony'
              ? 'bg-emerald-500 text-slate-950 shadow-md font-bold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <KeyRound className="w-3.5 h-3.5" />
          <span>{lang === 'fa' ? 'گام، انتقال و فواصل' : 'Key & Harmony'}</span>
        </button>
      </div>

      {/* Tab 1: Tempo & BPM */}
      {activeTab === 'tempo' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200">
                {lang === 'fa' ? 'سرعت اجرای آهنگ (BPM):' : 'Playback Tempo (BPM):'}
              </span>
              <span className="font-mono text-xl font-bold text-cyan-400">
                {settings.bpm} <span className="text-xs font-normal text-slate-400">BPM</span>
              </span>
            </div>

            <input
              type="range"
              min="50"
              max="180"
              step="1"
              value={settings.bpm}
              onChange={(e) => onUpdateSettings({ bpm: parseInt(e.target.value, 10) })}
              className="w-full accent-cyan-500 my-1"
            />

            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>50 (Largo / آرام)</span>
              <span>110 (Moderato)</span>
              <span>180 (Presto / تند)</span>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => onUpdateSettings({ bpm: Math.max(50, Math.round(settings.bpm * 0.5)) })}
                className="flex-1 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
              >
                0.5x ({lang === 'fa' ? 'نصف' : 'Half'})
              </button>
              <button
                onClick={() => onUpdateSettings({ bpm: 90 })}
                className="flex-1 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
              >
                {lang === 'fa' ? 'پیش‌فرض' : 'Reset'} (90)
              </button>
              <button
                onClick={() => onUpdateSettings({ bpm: Math.min(180, Math.round(settings.bpm * 1.5)) })}
                className="flex-1 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
              >
                1.5x ({lang === 'fa' ? '۱.۵ برابر' : '1.5x'})
              </button>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-slate-200 block mb-1">
                {lang === 'fa' ? 'تپ تمپو دستی (Tap Tempo):' : 'Manual Tap Tempo:'}
              </span>
              <p className="text-xs text-slate-400">
                {lang === 'fa'
                  ? 'چند بار با ریتم دلخواه روی دکمه زیر کلیک کنید تا ضرب‌آهنگ متناسب با صدای شما تنظیم شود:'
                  : 'Tap the button repeatedly to calculate and sync BPM with your rhythm:'}
              </p>
            </div>

            <button
              onClick={handleTapTempo}
              className="w-full py-4 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-200 font-bold text-sm flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-md"
            >
              <Clock className="w-4 h-4 animate-spin" />
              <span>{lang === 'fa' ? 'کلیک با ضرب‌آهنگ (TAP)' : 'TAP TEMPO BEAT'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Tab 2: Complexity */}
      {activeTab === 'complexity' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {COMPLEXITY_LEVELS.map((comp) => {
            const isSelected = settings.complexity === comp.id;
            return (
              <button
                key={comp.id}
                onClick={() => onUpdateSettings({ complexity: comp.id })}
                className={`p-3.5 rounded-xl border text-right transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'bg-amber-500/15 border-amber-500 text-amber-200 shadow-md ring-1 ring-amber-500/50'
                    : 'bg-slate-950/60 hover:bg-slate-800/40 border-slate-800 text-slate-400'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-xs text-slate-100">
                      {lang === 'fa' ? comp.nameFa : comp.nameEn}
                    </span>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-amber-400" />}
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    {lang === 'fa' ? comp.descFa : comp.descEn}
                  </p>
                </div>

                <div className="mt-3 w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400"
                    style={{
                      width: comp.id === 'minimal' ? '25%' : comp.id === 'balanced' ? '50%' : comp.id === 'ornate' ? '75%' : '100%',
                    }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Tab 3: Detailed Instrumentation */}
      {activeTab === 'instruments' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Lead Instrument */}
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col gap-2">
            <span className="text-xs font-bold text-slate-200 flex items-center justify-between">
              <span>{lang === 'fa' ? 'ساز همراهی اصلی (Lead)' : 'Lead Instrument'}</span>
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
            </span>
            <div className="flex flex-col gap-1.5 mt-1">
              {LEAD_INSTRUMENTS.map((inst) => (
                <button
                  key={inst.id}
                  onClick={() => onUpdateSettings({ leadInstrument: inst.id })}
                  className={`px-2.5 py-1.5 rounded-lg text-xs text-right transition-colors ${
                    settings.leadInstrument === inst.id
                      ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/40 font-bold'
                      : 'hover:bg-slate-800/60 text-slate-400'
                  }`}
                >
                  {lang === 'fa' ? inst.nameFa : inst.nameEn}
                </button>
              ))}
            </div>
          </div>

          {/* Pad / Chord Instrument */}
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col gap-2">
            <span className="text-xs font-bold text-slate-200 flex items-center justify-between">
              <span>{lang === 'fa' ? 'ساز آکوردها (Pad / Poly)' : 'Chord Instrument'}</span>
              <span className="w-2 h-2 rounded-full bg-amber-400" />
            </span>
            <div className="flex flex-col gap-1.5 mt-1">
              {PAD_INSTRUMENTS.map((inst) => (
                <button
                  key={inst.id}
                  onClick={() => onUpdateSettings({ padInstrument: inst.id })}
                  className={`px-2.5 py-1.5 rounded-lg text-xs text-right transition-colors ${
                    settings.padInstrument === inst.id
                      ? 'bg-amber-500/20 text-amber-200 border border-amber-500/40 font-bold'
                      : 'hover:bg-slate-800/60 text-slate-400'
                  }`}
                >
                  {lang === 'fa' ? inst.nameFa : inst.nameEn}
                </button>
              ))}
            </div>
          </div>

          {/* Bass Instrument */}
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col gap-2">
            <span className="text-xs font-bold text-slate-200 flex items-center justify-between">
              <span>{lang === 'fa' ? 'ساز خط باس (Bass)' : 'Bass Timbre'}</span>
              <span className="w-2 h-2 rounded-full bg-purple-400" />
            </span>
            <div className="flex flex-col gap-1.5 mt-1">
              {BASS_INSTRUMENTS.map((inst) => (
                <button
                  key={inst.id}
                  onClick={() => onUpdateSettings({ bassInstrument: inst.id })}
                  className={`px-2.5 py-1.5 rounded-lg text-xs text-right transition-colors ${
                    settings.bassInstrument === inst.id
                      ? 'bg-purple-500/20 text-purple-200 border border-purple-500/40 font-bold'
                      : 'hover:bg-slate-800/60 text-slate-400'
                  }`}
                >
                  {lang === 'fa' ? inst.nameFa : inst.nameEn}
                </button>
              ))}
            </div>
          </div>

          {/* Drum Kit */}
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col gap-2">
            <span className="text-xs font-bold text-slate-200 flex items-center justify-between">
              <span>{lang === 'fa' ? 'مجموعه ضربی (Drums/Percussion)' : 'Percussion Kit'}</span>
              <span className="w-2 h-2 rounded-full bg-rose-400" />
            </span>
            <div className="flex flex-col gap-1.5 mt-1">
              {DRUM_KITS.map((kit) => (
                <button
                  key={kit.id}
                  onClick={() => onUpdateSettings({ drumKit: kit.id })}
                  className={`px-2.5 py-1.5 rounded-lg text-xs text-right transition-colors ${
                    settings.drumKit === kit.id
                      ? 'bg-rose-500/20 text-rose-200 border border-rose-500/40 font-bold'
                      : 'hover:bg-slate-800/60 text-slate-400'
                  }`}
                >
                  {lang === 'fa' ? kit.nameFa : kit.nameEn}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Key, Transposition & Harmony Voicing */}
      {activeTab === 'key_harmony' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Key and Transposition */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200">
                {lang === 'fa' ? 'انتقال گام ملودی (Transposition):' : 'Key Transposition (Semitones):'}
              </span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold text-emerald-400">
                  {settings.transpositionSemitones > 0 ? `+${settings.transpositionSemitones}` : settings.transpositionSemitones} st
                </span>
                {settings.transpositionSemitones !== 0 && (
                  <button
                    onClick={() => onUpdateSettings({ transpositionSemitones: 0 })}
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400"
                    title="Reset Transposition"
                  >
                    <RotateCcw className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            <input
              type="range"
              min="-12"
              max="12"
              step="1"
              value={settings.transpositionSemitones}
              onChange={(e) => onUpdateSettings({ transpositionSemitones: parseInt(e.target.value, 10) })}
              className="w-full accent-emerald-500 my-1"
            />

            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>-12 نیم‌پرده</span>
              <span>0 (پایه)</span>
              <span>+12 نیم‌پرده</span>
            </div>

            <div className="pt-2 border-t border-slate-800">
              <span className="text-xs font-semibold text-slate-300 block mb-1.5">
                {lang === 'fa' ? 'نت ریشه (Root Key):' : 'Root Tonic Key:'}
              </span>
              <div className="flex flex-wrap gap-1">
                {ROOT_KEYS.map((key) => (
                  <button
                    key={key}
                    onClick={() => onUpdateSettings({ selectedRootKey: key })}
                    className={`px-2.5 py-1 rounded-md text-xs font-mono transition-all ${
                      settings.selectedRootKey === key
                        ? 'bg-emerald-500 text-slate-950 font-bold shadow-md'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                    }`}
                  >
                    {key}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Harmony Voicing Type */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col gap-3">
            <span className="text-xs font-bold text-slate-200 block">
              {lang === 'fa' ? 'فاصله هارمونی همزمان با صدای خواننده:' : 'Vocal Duet Harmony Interval:'}
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                { id: 'third', nameFa: 'فاصله سوم هارمونیک', nameEn: 'Harmonic 3rd (Duet)' },
                { id: 'fifth', nameFa: 'فاصله پنجم پرشکوه', nameEn: 'Resonant 5th' },
                { id: 'octave', nameFa: 'دوبل اکتاو (بم/زیر)', nameEn: 'Octave Doubling' },
                { id: 'counterpoint', nameFa: 'پادفونکشن مقامی', nameEn: 'Modal Counterpoint' },
                { id: 'unison', nameFa: 'هم‌صدا (Unison)', nameEn: 'Pure Unison' },
              ].map((h) => (
                <button
                  key={h.id}
                  onClick={() => onUpdateSettings({ harmonyInterval: h.id as any })}
                  className={`p-2.5 rounded-lg border text-right text-xs transition-all ${
                    settings.harmonyInterval === h.id
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-200 font-bold'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  {lang === 'fa' ? h.nameFa : h.nameEn}
                </button>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 leading-relaxed">
              {lang === 'fa'
                ? 'با خواندن هر نت، موتور صوتی فواصل انتخابی را به‌طور خودکار در گام فعال می‌نوازد.'
                : 'As you sing each note, the engine automatically harmonizes using this chosen interval.'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
