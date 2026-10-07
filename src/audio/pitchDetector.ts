/**
 * Real-time Pitch and Vocal Audio Feature Extraction
 * Uses optimized Autocorrelation with parabolic interpolation for sub-Hz accuracy.
 */

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export interface PitchDetectionResult {
  frequency: number;       // Hz
  midiNote: number;        // nearest integer
  exactMidi: number;       // fractional MIDI note
  noteName: string;        // e.g. "A4"
  noteBase: string;        // e.g. "A"
  centsOffset: number;     // -50 to +50
  confidence: number;      // 0 to 1
  rms: number;             // linear 0 to 1
  db: number;              // -100 to 0
  spectralCentroid: number;// Hz
}

export class PitchDetector {
  private bufferSize: number;
  private sampleRate: number;
  private recentFrequencies: number[] = [];
  private recentOnsets: number[] = [];
  private lastRms = 0;

  constructor(bufferSize = 2048, sampleRate = 44100) {
    this.bufferSize = bufferSize;
    this.sampleRate = sampleRate;
  }

  public updateSampleRate(sr: number) {
    this.sampleRate = sr;
  }

  /**
   * Calculates RMS volume of the time domain buffer
   */
  public calculateRms(buffer: Float32Array): number {
    let sum = 0;
    for (let i = 0; i < buffer.length; i++) {
      sum += buffer[i] * buffer[i];
    }
    return Math.sqrt(sum / buffer.length);
  }

  /**
   * Calculates Spectral Centroid (brightness of vocal sound)
   */
  public calculateSpectralCentroid(freqData: Uint8Array): number {
    let numerator = 0;
    let denominator = 0;
    const binSize = (this.sampleRate / 2) / freqData.length;

    for (let i = 0; i < freqData.length; i++) {
      const magnitude = freqData[i];
      const freq = i * binSize;
      numerator += freq * magnitude;
      denominator += magnitude;
    }

    return denominator > 0 ? numerator / denominator : 0;
  }

  /**
   * Autocorrelation Pitch Detection
   * Range tuned for vocal singing: ~65 Hz (C2) to ~1100 Hz (C6)
   */
  public detectPitch(
    timeData: Float32Array,
    freqData?: Uint8Array
  ): PitchDetectionResult {
    const rms = this.calculateRms(timeData);
    const db = rms > 0.00001 ? 20 * Math.log10(rms) : -100;

    // Threshold for singing voice presence (avoid fan or room noise)
    const SILENCE_THRESHOLD = 0.012; // ~ -38 dB
    if (rms < SILENCE_THRESHOLD) {
      return {
        frequency: 0,
        midiNote: 0,
        exactMidi: 0,
        noteName: '—',
        noteBase: '—',
        centsOffset: 0,
        confidence: 0,
        rms,
        db,
        spectralCentroid: freqData ? this.calculateSpectralCentroid(freqData) : 0,
      };
    }

    // Min and max period in samples for vocal range
    // 65 Hz -> sampleRate / 65
    // 1100 Hz -> sampleRate / 1100
    const minPeriod = Math.floor(this.sampleRate / 1100);
    const maxPeriod = Math.ceil(this.sampleRate / 65);

    let bestCorrelation = 0;
    let bestPeriod = -1;

    // Standard normalized autocorrelation
    for (let period = minPeriod; period <= maxPeriod; period++) {
      let correlation = 0;
      let norm1 = 0;
      let norm2 = 0;

      const len = this.bufferSize - period;
      for (let i = 0; i < len; i++) {
        const a = timeData[i];
        const b = timeData[i + period];
        correlation += a * b;
        norm1 += a * a;
        norm2 += b * b;
      }

      const normalization = Math.sqrt(norm1 * norm2);
      if (normalization > 0) {
        correlation = correlation / normalization;
      }

      if (correlation > bestCorrelation) {
        bestCorrelation = correlation;
        bestPeriod = period;
      }
    }

    // Check confidence threshold
    if (bestCorrelation < 0.65 || bestPeriod === -1) {
      return {
        frequency: 0,
        midiNote: 0,
        exactMidi: 0,
        noteName: '—',
        noteBase: '—',
        centsOffset: 0,
        confidence: bestCorrelation,
        rms,
        db,
        spectralCentroid: freqData ? this.calculateSpectralCentroid(freqData) : 0,
      };
    }

    // Parabolic interpolation around peak for fine frequency accuracy
    let finePeriod = bestPeriod;
    if (bestPeriod > minPeriod && bestPeriod < maxPeriod) {
      // sample adjacent correlations
      const shift = 1;
      const c1 = this.correlateLag(timeData, bestPeriod - shift);
      const c2 = bestCorrelation;
      const c3 = this.correlateLag(timeData, bestPeriod + shift);
      const delta = (c3 - c1) / (2 * (2 * c2 - c1 - c3) || 1);
      if (Math.abs(delta) < 1) {
        finePeriod = bestPeriod + delta;
      }
    }

    const frequency = this.sampleRate / finePeriod;

    // Convert frequency to MIDI note and cents
    const exactMidi = 69 + 12 * Math.log2(frequency / 440);
    const midiNote = Math.round(exactMidi);
    const centsOffset = Math.round((exactMidi - midiNote) * 100);

    const noteIdx = ((midiNote % 12) + 12) % 12;
    const octave = Math.floor(midiNote / 12) - 1;
    const noteBase = NOTE_NAMES[noteIdx];
    const noteName = `${noteBase}${octave}`;

    // Track frequency for vibrato calculation
    this.recentFrequencies.push(frequency);
    if (this.recentFrequencies.length > 20) {
      this.recentFrequencies.shift();
    }

    // Track onset for rhythm/BPM
    const onsetDelta = rms - this.lastRms;
    this.lastRms = rms;
    if (onsetDelta > 0.04) {
      this.recentOnsets.push(performance.now());
      if (this.recentOnsets.length > 10) {
        this.recentOnsets.shift();
      }
    }

    const spectralCentroid = freqData ? this.calculateSpectralCentroid(freqData) : 0;

    return {
      frequency,
      midiNote,
      exactMidi,
      noteName,
      noteBase,
      centsOffset,
      confidence: bestCorrelation,
      rms,
      db,
      spectralCentroid,
    };
  }

  private correlateLag(timeData: Float32Array, period: number): number {
    let corr = 0;
    let n1 = 0;
    let n2 = 0;
    const len = this.bufferSize - period;
    for (let i = 0; i < len; i++) {
      const a = timeData[i];
      const b = timeData[i + period];
      corr += a * b;
      n1 += a * a;
      n2 += b * b;
    }
    const norm = Math.sqrt(n1 * n2);
    return norm > 0 ? corr / norm : 0;
  }

  /**
   * Calculates vibrato depth in Hz from recent frequency samples
   */
  public getVibratoDepth(): number {
    if (this.recentFrequencies.length < 6) return 0;
    let min = Infinity;
    let max = -Infinity;
    for (const f of this.recentFrequencies) {
      if (f > 0) {
        if (f < min) min = f;
        if (f > max) max = f;
      }
    }
    if (min === Infinity || max === -Infinity) return 0;
    return max - min;
  }

  /**
   * Estimates singing tempo/BPM based on recent vocal onsets
   */
  public estimateBpm(): number {
    if (this.recentOnsets.length < 4) return 100;
    const deltas: number[] = [];
    for (let i = 1; i < this.recentOnsets.length; i++) {
      const dt = this.recentOnsets[i] - this.recentOnsets[i - 1];
      if (dt > 200 && dt < 2000) {
        deltas.push(dt);
      }
    }
    if (deltas.length < 3) return 100;
    const avgDt = deltas.reduce((a, b) => a + b, 0) / deltas.length;
    const rawBpm = Math.round(60000 / avgDt);
    // Normalize into 70 - 150 range
    let bpm = rawBpm;
    while (bpm < 65) bpm *= 2;
    while (bpm > 160) bpm /= 2;
    return Math.round(bpm);
  }
}
