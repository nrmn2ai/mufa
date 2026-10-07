import { useState, useRef, useEffect } from 'react';
import { Play, Square, Music, Mic, Volume2 } from 'lucide-react';
import { MusicalStyleId } from '../types/music';

interface VirtualVocalistDemoProps {
  onSimulateVocal: (noteMidi: number, freq: number, rms: number, styleHint: MusicalStyleId) => void;
  onSelectStyle: (style: MusicalStyleId) => void;
  lang: 'fa' | 'en';
}

interface DemoTrack {
  id: string;
  styleId: MusicalStyleId;
  titleFa: string;
  titleEn: string;
  descriptionFa: string;
  descriptionEn: string;
  notes: { midi: number; duration: number }[];
  tempo: number;
}

const DEMO_TRACKS: DemoTrack[] = [
  {
    id: 'persian_shur',
    styleId: 'traditional_persian',
    titleFa: 'آواز دستگاه شور و دشتی (سنتی)',
    titleEn: 'Persian Dastgah Shur & Dashti',
    descriptionFa: 'تحریرهای غنی گوشه اوج با فواصل اصیل شور',
    descriptionEn: 'Rich vocal ornamentation in traditional Persian Shur',
    tempo: 84,
    notes: [
      { midi: 62, duration: 400 }, // D4
      { midi: 63, duration: 300 }, // Eb4 (Koron approx)
      { midi: 65, duration: 500 }, // F4
      { midi: 63, duration: 250 },
      { midi: 65, duration: 350 },
      { midi: 67, duration: 700 }, // G4 (Ouj)
      { midi: 65, duration: 300 },
      { midi: 63, duration: 400 },
      { midi: 62, duration: 800 }, // Tonic D4
    ],
  },
  {
    id: 'acoustic_ballad',
    styleId: 'acoustic_ballad',
    titleFa: 'بالاد احساسی و ملایم (پیانو)',
    titleEn: 'Emotional Acoustic Ballad',
    descriptionFa: 'ملودی نرم و آرام با کشش‌های سوزناک عاطفی',
    descriptionEn: 'Gentle, soft legato singing ideal for acoustic ballad',
    tempo: 75,
    notes: [
      { midi: 60, duration: 600 }, // C4
      { midi: 64, duration: 600 }, // E4
      { midi: 67, duration: 700 }, // G4
      { midi: 65, duration: 500 }, // F4
      { midi: 64, duration: 600 }, // E4
      { midi: 62, duration: 600 }, // D4
      { midi: 60, duration: 900 }, // C4
    ],
  },
  {
    id: 'pop_upbeat',
    styleId: 'pop_upbeat',
    titleFa: 'پاپ ریتمیک و پرانرژی',
    titleEn: 'Upbeat Dynamic Pop Vocal',
    descriptionFa: 'ریتم تند، ادای مقطع و ضرب‌آهنگ شاد',
    descriptionEn: 'Punchy vocal phrasing and rhythmic cadence',
    tempo: 124,
    notes: [
      { midi: 67, duration: 250 }, // G4
      { midi: 67, duration: 250 },
      { midi: 69, duration: 300 }, // A4
      { midi: 72, duration: 350 }, // C5
      { midi: 71, duration: 250 }, // B4
      { midi: 69, duration: 300 }, // A4
      { midi: 67, duration: 500 }, // G4
    ],
  },
  {
    id: 'epic_rock',
    styleId: 'epic_rock',
    titleFa: 'راک حماسی و پرطنین (اوج‌خوانی)',
    titleEn: 'Powerful Rock Anthem Belt',
    descriptionFa: 'فریاد و خوانش پرانرژی نت‌های بالا با قدرت',
    descriptionEn: 'High belted notes with intense rock energy',
    tempo: 130,
    notes: [
      { midi: 69, duration: 400 }, // A4
      { midi: 72, duration: 400 }, // C5
      { midi: 74, duration: 600 }, // D5
      { midi: 76, duration: 900 }, // E5 (High Belt)
      { midi: 74, duration: 400 },
      { midi: 72, duration: 400 },
      { midi: 69, duration: 900 }, // A4
    ],
  },
  {
    id: 'lofi_jazz',
    styleId: 'lofi_jazz',
    titleFa: 'جاز و لوفای آرامش‌بخش',
    titleEn: 'Lofi & Mellow Jazz Riff',
    descriptionFa: 'تحریر آرام با فواصل دلنشین جاز',
    descriptionEn: 'Relaxed vocal line with jazz intervals',
    tempo: 80,
    notes: [
      { midi: 62, duration: 500 }, // D4
      { midi: 65, duration: 450 }, // F4
      { midi: 69, duration: 600 }, // A4
      { midi: 71, duration: 400 }, // B4
      { midi: 67, duration: 500 }, // G4
      { midi: 64, duration: 700 }, // E4
    ],
  },
];

const PIANO_KEYS = [
  { note: 'C4', midi: 60, isBlack: false },
  { note: 'C#4', midi: 61, isBlack: true },
  { note: 'D4', midi: 62, isBlack: false },
  { note: 'D#4', midi: 63, isBlack: true },
  { note: 'E4', midi: 64, isBlack: false },
  { note: 'F4', midi: 65, isBlack: false },
  { note: 'F#4', midi: 66, isBlack: true },
  { note: 'G4', midi: 67, isBlack: false },
  { note: 'G#4', midi: 68, isBlack: true },
  { note: 'A4', midi: 69, isBlack: false },
  { note: 'A#4', midi: 70, isBlack: true },
  { note: 'B4', midi: 71, isBlack: false },
  { note: 'C5', midi: 72, isBlack: false },
  { note: 'D5', midi: 74, isBlack: false },
  { note: 'E5', midi: 76, isBlack: false },
];

export function VirtualVocalistDemo({
  onSimulateVocal,
  onSelectStyle,
  lang,
}: VirtualVocalistDemoProps) {
  const [activeTrackId, setActiveTrackId] = useState<string | null>(null);
  const [activeMidiNote, setActiveMidiNote] = useState<number | null>(null);
  const sequenceTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (sequenceTimerRef.current !== null) {
        clearTimeout(sequenceTimerRef.current);
      }
    };
  }, []);

  const playDemoTrack = (track: DemoTrack) => {
    // If playing this track, stop it
    if (activeTrackId === track.id) {
      stopDemo();
      return;
    }

    stopDemo();
    setActiveTrackId(track.id);
    onSelectStyle(track.styleId);

    let noteIdx = 0;

    const playNext = () => {
      if (noteIdx >= track.notes.length) {
        // loop or finish
        noteIdx = 0;
      }

      const note = track.notes[noteIdx];
      setActiveMidiNote(note.midi);
      const freq = 440 * Math.pow(2, (note.midi - 69) / 12);
      const rms = track.styleId === 'epic_rock' ? 0.35 : 0.18;

      onSimulateVocal(note.midi, freq, rms, track.styleId);

      noteIdx++;
      sequenceTimerRef.current = window.setTimeout(playNext, note.duration);
    };

    playNext();
  };

  const stopDemo = () => {
    if (sequenceTimerRef.current !== null) {
      clearTimeout(sequenceTimerRef.current);
      sequenceTimerRef.current = null;
    }
    setActiveTrackId(null);
    setActiveMidiNote(null);
  };

  const handleKeyPress = (midi: number) => {
    setActiveMidiNote(midi);
    const freq = 440 * Math.pow(2, (midi - 69) / 12);
    onSimulateVocal(midi, freq, 0.22, 'traditional_persian');
    setTimeout(() => {
      setActiveMidiNote(null);
    }, 400);
  };

  return (
    <div className="w-full rounded-2xl border border-slate-800 bg-slate-900/50 p-5 backdrop-blur-md shadow-xl flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center">
            <Music className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-slate-100">
              {lang === 'fa' ? 'شبیه‌ساز و تست خوانندگی زنده' : 'Virtual Vocal & Instrument Simulator'}
            </h4>
            <p className="text-xs text-slate-400">
              {lang === 'fa'
                ? 'برای تست فوری ملودی و تغییر خودکار سبک بدون نیاز به میکروفن، روی قطعات زیر کلیک کنید:'
                : 'Click any sample vocal track to test instant accompaniment and style morphing without a mic:'}
            </p>
          </div>
        </div>

        {activeTrackId && (
          <button
            onClick={stopDemo}
            className="self-start sm:self-auto px-3 py-1.5 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/40 text-xs font-medium flex items-center gap-1.5 hover:bg-rose-500/30"
          >
            <Square className="w-3.5 h-3.5" />
            <span>{lang === 'fa' ? 'توقف پخش تست' : 'Stop Demo'}</span>
          </button>
        )}
      </div>

      {/* Preset Vocal Tracks */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
        {DEMO_TRACKS.map((track) => {
          const isPlaying = activeTrackId === track.id;
          return (
            <button
              key={track.id}
              onClick={() => playDemoTrack(track)}
              className={`flex flex-col text-right p-3 rounded-xl border transition-all ${
                isPlaying
                  ? 'bg-amber-500/15 border-amber-500 shadow-md ring-1 ring-amber-500/50'
                  : 'bg-slate-950/50 hover:bg-slate-800/60 border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-1.5">
                <span className="font-semibold text-xs text-slate-200">
                  {lang === 'fa' ? track.titleFa : track.titleEn}
                </span>
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                    isPlaying ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {isPlaying ? <Square className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current ml-0.5" />}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 line-clamp-2">
                {lang === 'fa' ? track.descriptionFa : track.descriptionEn}
              </p>
            </button>
          );
        })}
      </div>

      {/* Interactive Piano Keyboard for Instant Pitch Trigger */}
      <div className="pt-2">
        <div className="flex items-center justify-between mb-2 text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
            {lang === 'fa'
              ? 'کیبورد لمسی آواز: روی کلاویه‌ها ضربه بزنید تا همراهی همزمان زنده ساخته شود'
              : 'Interactive Touch Keyboard: Tap notes to hear instant live harmonized accompaniment'}
          </span>
          {activeMidiNote && (
            <span className="font-mono text-cyan-300 font-bold">
              Active Note: MIDI {activeMidiNote}
            </span>
          )}
        </div>

        <div className="flex items-end justify-center overflow-x-auto p-2 bg-slate-950/80 rounded-xl border border-slate-800 gap-1 select-none">
          {PIANO_KEYS.map((key) => {
            const isActive = activeMidiNote === key.midi;
            if (key.isBlack) {
              return (
                <button
                  key={key.midi}
                  onClick={() => handleKeyPress(key.midi)}
                  className={`w-7 sm:w-8 h-20 -mx-3 sm:-mx-3.5 z-10 rounded-b-md transition-all text-[10px] font-mono flex items-end justify-center pb-1 ${
                    isActive
                      ? 'bg-amber-400 text-slate-950 font-bold shadow-lg shadow-amber-500/50 scale-95'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-700'
                  }`}
                >
                  {key.note}
                </button>
              );
            }

            return (
              <button
                key={key.midi}
                onClick={() => handleKeyPress(key.midi)}
                className={`w-9 sm:w-11 h-28 rounded-b-md transition-all text-xs font-mono flex items-end justify-center pb-2 ${
                  isActive
                    ? 'bg-cyan-400 text-slate-950 font-bold shadow-lg shadow-cyan-500/50 scale-95'
                    : 'bg-slate-200 hover:bg-white text-slate-800 border-x border-slate-300'
                }`}
              >
                {key.note}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
