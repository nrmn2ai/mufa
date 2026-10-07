/**
 * Music and Audio Types for Real-Time Vocal Accompaniment
 */

export type MusicalStyleId = 
  | 'traditional_persian' // سنتی و دستگاهی ایرانی
  | 'acoustic_ballad'    // آکوستیک و بالاد پیانو
  | 'pop_upbeat'          // پاپ ریتمیک و مدرن
  | 'lofi_jazz'           // لوفای و جاز ملایم
  | 'epic_rock'           // حماسی و راک پرقدرت
  | 'ambient_mystic';     // امبینت و کلاسیک کهکشانی

export interface MusicalStyle {
  id: MusicalStyleId;
  nameFa: string;
  nameEn: string;
  descriptionFa: string;
  descriptionEn: string;
  icon: string;
  color: string;
  accentBg: string;
  badgeColor: string;
  bpmDefault: number;
  scales: ScaleType[];
  defaultLead: LeadInstrument;
  defaultPad: PadInstrument;
  defaultBass: BassInstrument;
  defaultDrums: DrumKit;
  instrumentLead: string;
  instrumentPad: string;
  instrumentRhythm: string;
}

export type ScaleType = 
  | 'shur'       // دستگاه شور ایرانی
  | 'isfahan'    // آواز بیات اصفهان
  | 'mahur'      // دستگاه ماهور
  | 'minor'      // مینور طبیعی
  | 'major'      // ماژور طبیعی
  | 'dorian'     // دورین مدرن
  | 'blues'      // بلوز
  | 'pentatonic';// پنج‌صدایی

export type LeadInstrument = 'santur' | 'tar' | 'piano' | 'rhodes' | 'synth_lead' | 'violin';
export type PadInstrument = 'acoustic_piano' | 'warm_strings' | 'vintage_rhodes' | 'oriental_pad' | 'synth_poly';
export type BassInstrument = 'sub_808' | 'upright_bass' | 'electric_drive' | 'synth_bass';
export type DrumKit = 'daf_tombak' | 'acoustic_kit' | 'electronic_pop' | 'lofi_brush' | 'ambient_chimes';

export type ComplexityLevel = 'minimal' | 'balanced' | 'ornate' | 'virtuoso';

export interface VocalMetrics {
  isSinging: boolean;
  volumeRms: number;       // 0 to 1
  volumeDb: number;        // -Infinity to 0
  frequency: number;       // in Hz
  midiNote: number;        // e.g. 69 = A4
  noteName: string;        // e.g. "A4"
  noteBase: string;        // e.g. "A"
  centsOffset: number;     // -50 to +50 cents
  confidence: number;      // 0 to 1
  vibratoDepth: number;    // Hz modulation
  melismaFactor: number;   // pitch agility / ornamentation (0 to 1)
  spectralCentroid: number;// Timbre brightness (Hz)
  energyLevel: 'soft' | 'medium' | 'high' | 'explosive';
  detectedBpm: number;
  activeScale: ScaleType;
  keyRoot: string;         // e.g. "C", "D", "A"
}

export interface StyleAnalysisResult {
  currentStyle: MusicalStyleId;
  confidence: number;      // 0 to 1
  autoDetected: boolean;
  scores: Record<MusicalStyleId, number>;
  transitioning: boolean;
  reasonFa: string;
  reasonEn: string;
}

export interface AccompanimentSettings {
  autoStyleDetect: boolean;
  autoStartOnVoice: boolean;          // Auto-detect genre and start music as soon as user sings!
  selectedStyle: MusicalStyleId;
  selectedScale: ScaleType;
  selectedRootKey: string;
  autoKeyDetect: boolean;
  bpm: number;
  autoBpmDetect: boolean;
  
  // Advanced Customization Parameters
  complexity: ComplexityLevel;        // minimal, balanced, ornate, virtuoso
  transpositionSemitones: number;     // -12 to +12
  leadInstrument: LeadInstrument;
  padInstrument: PadInstrument;
  bassInstrument: BassInstrument;
  drumKit: DrumKit;
  harmonyInterval: 'unison' | 'third' | 'fifth' | 'octave' | 'counterpoint';
  reverbAmount: number;               // 0 to 1
  stereoSpread: number;               // 0 to 1

  // Layer toggles
  enableChords: boolean;
  enableMelodyHarmony: boolean;
  enableBass: boolean;
  enablePercussion: boolean;
  enableArpeggio: boolean;

  // Mixer
  micVolume: number;                  // 0 to 1.5
  accompanimentVolume: number;         // 0 to 1
  muteMicMonitor: boolean;            // true for speakers to avoid acoustic feedback
}

export interface ChordDefinition {
  name: string;
  rootMidi: number;
  notesMidi: number[];
  mood: string;
}

export interface SavedPerformance {
  id: string;
  title: string;
  timestamp: number;
  durationSeconds: number;
  audioBlob: Blob;
  audioUrl: string;
  styleId: MusicalStyleId;
  styleNameFa: string;
  styleNameEn: string;
  rootKey: string;
  scale: ScaleType;
  bpm: number;
  fileSizeFormatted: string;
}
