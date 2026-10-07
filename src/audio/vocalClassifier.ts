/**
 * Intelligent Vocal and Performance Classifier
 * Evaluates pitch agility, ornamentation (Tahrir/Melisma), volume dynamics,
 * spectral timbre brightness, and rhythmic cadence to dynamically switch styles.
 */

import { MusicalStyleId, ScaleType, StyleAnalysisResult } from '../types/music';

export interface VocalSamplePoint {
  time: number;
  frequency: number;
  midiNote: number;
  rms: number;
  spectralCentroid: number;
  vibrato: number;
}

export class VocalClassifier {
  private history: VocalSamplePoint[] = [];
  private historyWindowMs = 2500; // Analysis window < 3 seconds
  private notePitchHistory: number[] = []; // MIDI note histogram for key/scale
  private currentStyle: MusicalStyleId = 'acoustic_ballad';
  private styleChangeCooldown = 0; // Prevent jitter
  private lastStyleChangeTime = 0;

  constructor() {
    this.lastStyleChangeTime = performance.now();
  }

  public reset() {
    this.history = [];
    this.notePitchHistory = [];
  }

  /**
   * Adds a new real-time sample from the pitch detector
   */
  public addSample(sample: {
    frequency: number;
    midiNote: number;
    rms: number;
    spectralCentroid: number;
    vibrato: number;
  }) {
    const now = performance.now();

    // Only collect singing/playing voice samples
    if (sample.frequency > 0 && sample.rms > 0.012) {
      this.history.push({
        time: now,
        frequency: sample.frequency,
        midiNote: sample.midiNote,
        rms: sample.rms,
        spectralCentroid: sample.spectralCentroid,
        vibrato: sample.vibrato,
      });

      if (sample.midiNote > 0) {
        this.notePitchHistory.push(sample.midiNote % 12);
        if (this.notePitchHistory.length > 80) {
          this.notePitchHistory.shift();
        }
      }
    }

    // Prune history older than window
    const cutoff = now - this.historyWindowMs;
    while (this.history.length > 0 && this.history[0].time < cutoff) {
      this.history.shift();
    }
  }

  /**
   * Evaluates the active style based on vocal performance metrics
   */
  public classify(forcedStyle?: MusicalStyleId): StyleAnalysisResult {
    if (forcedStyle) {
      return {
        currentStyle: forcedStyle,
        confidence: 1.0,
        autoDetected: false,
        scores: {
          traditional_persian: forcedStyle === 'traditional_persian' ? 1 : 0,
          acoustic_ballad: forcedStyle === 'acoustic_ballad' ? 1 : 0,
          pop_upbeat: forcedStyle === 'pop_upbeat' ? 1 : 0,
          lofi_jazz: forcedStyle === 'lofi_jazz' ? 1 : 0,
          epic_rock: forcedStyle === 'epic_rock' ? 1 : 0,
          ambient_mystic: forcedStyle === 'ambient_mystic' ? 1 : 0,
        },
        transitioning: false,
        reasonFa: 'انتخاب دستی سبک توسط کاربر',
        reasonEn: 'Manual user style selection',
      };
    }

    // If not enough samples yet, retain default
    if (this.history.length < 8) {
      return {
        currentStyle: this.currentStyle,
        confidence: 0.5,
        autoDetected: true,
        scores: {
          traditional_persian: 0.2,
          acoustic_ballad: 0.5,
          pop_upbeat: 0.2,
          lofi_jazz: 0.2,
          epic_rock: 0.1,
          ambient_mystic: 0.2,
        },
        transitioning: false,
        reasonFa: 'در حال شنیدن و تحلیل فرکانس و جنس صدا...',
        reasonEn: 'Listening and analyzing vocal timbre...',
      };
    }

    // 1. Calculate Average Energy (RMS)
    const avgRms = this.history.reduce((sum, s) => sum + s.rms, 0) / this.history.length;

    // 2. Calculate Timbre Brightness (Spectral Centroid)
    const avgCentroid = this.history.reduce((sum, s) => sum + s.spectralCentroid, 0) / this.history.length;

    // 3. Calculate Melisma / Tahrir / Pitch Agility
    // Measures pitch volatility / rapid ornaments
    let pitchJumps = 0;
    let microVariations = 0;
    for (let i = 1; i < this.history.length; i++) {
      const freqRatio = this.history[i].frequency / this.history[i - 1].frequency;
      const semitoneDelta = Math.abs(12 * Math.log2(freqRatio || 1));
      if (semitoneDelta > 0.25 && semitoneDelta < 2.5) {
        microVariations++; // Typical Persian Tahrir / vocal trills
      }
      if (semitoneDelta >= 2.5) {
        pitchJumps++; // Melodic interval steps
      }
    }

    const tahrirDensity = microVariations / this.history.length;
    const intervalJumpDensity = pitchJumps / this.history.length;

    // 4. Note duration / sustained breath length
    const timeSpan = (this.history[this.history.length - 1].time - this.history[0].time) / 1000;
    const noteChangeRate = (pitchJumps + 1) / (timeSpan || 1); // notes per second

    // 5. Average Vibrato
    const avgVibrato = this.history.reduce((sum, s) => sum + s.vibrato, 0) / this.history.length;

    // Calculate Scores for each style:
    const scores: Record<MusicalStyleId, number> = {
      traditional_persian: 0,
      acoustic_ballad: 0,
      pop_upbeat: 0,
      lofi_jazz: 0,
      epic_rock: 0,
      ambient_mystic: 0,
    };

    // A. Persian Traditional (Tahrir, micro-variations, expressive ornamentations)
    scores.traditional_persian = 
      (tahrirDensity * 2.8) +
      (avgVibrato > 6 ? 0.35 : 0) +
      (avgRms > 0.04 && avgRms < 0.28 ? 0.3 : 0);

    // B. Epic Rock (Loud belting, bright harsh timbre, high energy)
    scores.epic_rock = 
      (avgRms > 0.2 ? 1.6 : 0) +
      (avgCentroid > 1600 ? 0.8 : 0) +
      (avgRms > 0.32 ? 1.0 : 0);

    // C. Upbeat Pop (Rhythmic note changes, energetic staccato, medium-high RMS)
    scores.pop_upbeat = 
      (noteChangeRate > 1.8 ? 1.2 : 0) +
      (intervalJumpDensity > 0.25 ? 0.8 : 0) +
      (avgRms > 0.08 && avgRms < 0.25 ? 0.6 : 0);

    // D. Acoustic Ballad (Gentle RMS, moderate legato, warm tone)
    scores.acoustic_ballad = 
      (avgRms < 0.12 ? 1.2 : 0) +
      (tahrirDensity < 0.2 ? 0.6 : 0) +
      (avgCentroid < 1400 ? 0.5 : 0);

    // E. Lofi Jazz (Mellow centroid, relaxed rate, moderate vibrato)
    scores.lofi_jazz = 
      (avgCentroid < 1100 ? 1.0 : 0) +
      (noteChangeRate > 0.6 && noteChangeRate < 1.6 ? 0.7 : 0) +
      (avgRms < 0.15 ? 0.5 : 0);

    // F. Ambient / Mystic (Very long sustained notes, low change rate, quiet/meditative)
    scores.ambient_mystic = 
      (noteChangeRate < 0.6 ? 1.3 : 0) +
      (tahrirDensity < 0.1 ? 0.7 : 0) +
      (avgRms < 0.09 ? 0.6 : 0);

    // Find style with highest score
    let bestStyle: MusicalStyleId = this.currentStyle;
    let maxScore = -1;

    (Object.keys(scores) as MusicalStyleId[]).forEach((style) => {
      if (scores[style] > maxScore) {
        maxScore = scores[style];
        bestStyle = style;
      }
    });

    const now = performance.now();
    const canSwitch = (now - this.lastStyleChangeTime) > 1800; // ~1.8s responsiveness (< 3s requirement!)
    let transitioning = false;

    if (bestStyle !== this.currentStyle && canSwitch && maxScore > 1.0) {
      this.currentStyle = bestStyle;
      this.lastStyleChangeTime = now;
      transitioning = true;
    }

    // Explanation strings
    let reasonFa = '';
    let reasonEn = '';
    switch (this.currentStyle) {
      case 'traditional_persian':
        reasonFa = 'تحریرهای غنی و ریزه‌کاری‌های آوازی سنتی ایرانی شناسایی شد';
        reasonEn = 'Vocal melisma and traditional Persian embellishments detected';
        break;
      case 'epic_rock':
        reasonFa = 'قدرت صدای بالا، انرژی پرحرارت و پرتاب فرکانسی راک تشخیص داده شد';
        reasonEn = 'High vocal power, resonant belting and rock energy detected';
        break;
      case 'pop_upbeat':
        reasonFa = 'ریتم تند، ادای استکاتو و پویایی پرانرژی پاپ تشخیص داده شد';
        reasonEn = 'Rhythmic cadence and energetic pop phrasing detected';
        break;
      case 'lofi_jazz':
        reasonFa = 'طنین گرم، نرم و آرام با ریتم شناور جاز/لوفای تشخیص داده شد';
        reasonEn = 'Warm mellow timbre and relaxed jazz pacing detected';
        break;
      case 'ambient_mystic':
        reasonFa = 'کشسانی نت‌ها، سکون مراقبه‌ای و حس کهکشانی تشخیص داده شد';
        reasonEn = 'Sustained meditative vocal tones and ambient space detected';
        break;
      case 'acoustic_ballad':
      default:
        reasonFa = 'نوای احساسی، آرام و مناسب همراهی پیانو و گیتار آکوستیک';
        reasonEn = 'Emotive, gentle vocal delivery ideal for acoustic ballad';
        break;
    }

    return {
      currentStyle: this.currentStyle,
      confidence: Math.min(1, Math.max(0.4, maxScore / 2.5)),
      autoDetected: true,
      scores,
      transitioning,
      reasonFa,
      reasonEn,
    };
  }

  /**
   * Analyzes pitch history to deduce root key and best musical scale
   */
  public detectScaleAndKey(): { rootKey: string; scale: ScaleType } {
    if (this.notePitchHistory.length < 12) {
      return { rootKey: 'C', scale: 'major' };
    }

    // Count note frequencies (0 = C, 1 = C#, ..., 11 = B)
    const counts = new Array(12).fill(0);
    for (const note of this.notePitchHistory) {
      counts[note]++;
    }

    // Find most prominent pitch class (potential tonic / root)
    let tonic = 0;
    let maxCount = -1;
    for (let i = 0; i < 12; i++) {
      if (counts[i] > maxCount) {
        maxCount = counts[i];
        tonic = i;
      }
    }

    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const rootKey = noteNames[tonic];

    // Determine scale based on current style and intervals
    if (this.currentStyle === 'traditional_persian') {
      return { rootKey, scale: 'shur' };
    } else if (this.currentStyle === 'epic_rock') {
      return { rootKey, scale: 'minor' };
    } else if (this.currentStyle === 'pop_upbeat') {
      return { rootKey, scale: 'major' };
    } else if (this.currentStyle === 'lofi_jazz') {
      return { rootKey, scale: 'dorian' };
    } else if (this.currentStyle === 'ambient_mystic') {
      return { rootKey, scale: 'pentatonic' };
    }

    return { rootKey, scale: 'minor' };
  }
}
