/**
 * Real-Time Music Generation and Synthesis Engine
 * Features Polyphonic Accompaniment, Pitch Harmonization, Rhythmic Percussion,
 * Dynamic Style Morphing, Advanced Customization, and Multi-track Recording.
 */

import { 
  MusicalStyleId, 
  ScaleType, 
  AccompanimentSettings, 
  ChordDefinition,
  LeadInstrument,
  PadInstrument,
  BassInstrument,
  DrumKit
} from '../types/music';

// Note intervals in semitones for scales
const SCALE_INTERVALS: Record<ScaleType, number[]> = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
  shur: [0, 1.5, 3, 5, 7, 8, 10],      // Microtonal Persian Shur simulation
  isfahan: [0, 2, 3, 5, 7, 8, 11],    // Bayat-e Isfahan
  mahur: [0, 2, 4, 5, 7, 9, 11],      // Mahur (similar to Major)
  dorian: [0, 2, 3, 5, 7, 9, 10],
  blues: [0, 3, 5, 6, 7, 10],
  pentatonic: [0, 2, 4, 7, 9],
};

const NOTE_NAME_TO_MIDI: Record<string, number> = {
  'C': 60, 'C#': 61, 'D': 62, 'D#': 63, 'E': 64, 'F': 65,
  'F#': 66, 'G': 67, 'G#': 68, 'A': 69, 'A#': 70, 'B': 71,
};

export class MusicEngine {
  private ctx: AudioContext | null = null;
  private isRunning = false;

  // Master Audio Nodes
  private masterGain: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private reverbNode: ConvolverNode | null = null;
  private reverbGain: GainNode | null = null;
  private dryGain: GainNode | null = null;

  // Layer Gain Nodes
  private chordGain: GainNode | null = null;
  private melodyGain: GainNode | null = null;
  private bassGain: GainNode | null = null;
  private percussionGain: GainNode | null = null;
  private micInputGain: GainNode | null = null;
  private micMonitorGain: GainNode | null = null;

  // Microphone stream & recording
  private micStream: MediaStream | null = null;
  private micSource: MediaStreamAudioSourceNode | null = null;
  private vocalAnalyser: AnalyserNode | null = null;
  private masterRecordDestination: MediaStreamAudioDestinationNode | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private recordingStartTime = 0;

  // Sequencer & State
  private settings: AccompanimentSettings;
  private currentStep = 0;
  private timerId: number | null = null;
  private lastDetectedNote = 60; // Middle C
  private lastNoteTime = 0;
  private currentChordIndex = 0;
  private chordProgression: ChordDefinition[] = [];

  constructor(initialSettings: AccompanimentSettings) {
    this.settings = initialSettings;
    this.updateChordProgression();
  }

  /**
   * Initializes AudioContext on user gesture
   */
  public async initAudio(): Promise<boolean> {
    if (this.ctx && this.ctx.state !== 'closed') {
      if (this.ctx.state === 'suspended') {
        await this.ctx.resume();
      }
      return true;
    }

    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new AudioContextClass();

    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }

    // Setup Master Bus
    this.compressor = this.ctx.createDynamicsCompressor();
    this.compressor.threshold.setValueAtTime(-18, this.ctx.currentTime);
    this.compressor.knee.setValueAtTime(12, this.ctx.currentTime);
    this.compressor.ratio.setValueAtTime(4, this.ctx.currentTime);
    this.compressor.attack.setValueAtTime(0.003, this.ctx.currentTime);
    this.compressor.release.setValueAtTime(0.25, this.ctx.currentTime);

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.9, this.ctx.currentTime);

    // Reverb Impulse Response
    this.reverbNode = this.ctx.createConvolver();
    this.reverbNode.buffer = this.createReverbBuffer(this.ctx, 2.5, 2.2);

    this.reverbGain = this.ctx.createGain();
    this.reverbGain.gain.setValueAtTime(this.settings.reverbAmount * 0.45, this.ctx.currentTime);

    this.dryGain = this.ctx.createGain();
    this.dryGain.gain.setValueAtTime(0.85, this.ctx.currentTime);

    // Recording node (mixes mic + accompaniment)
    this.masterRecordDestination = this.ctx.createMediaStreamDestination();

    // Layer gains
    this.chordGain = this.ctx.createGain();
    this.melodyGain = this.ctx.createGain();
    this.bassGain = this.ctx.createGain();
    this.percussionGain = this.ctx.createGain();
    this.micMonitorGain = this.ctx.createGain();
    this.micInputGain = this.ctx.createGain();

    this.updateGains();

    // Connect layers to compressor & reverb
    const layers = [this.chordGain, this.melodyGain, this.bassGain, this.percussionGain, this.micMonitorGain];
    layers.forEach(node => {
      if (node && this.compressor && this.reverbNode && this.reverbGain) {
        node.connect(this.compressor);
        node.connect(this.reverbNode);
      }
    });

    if (this.reverbNode && this.reverbGain) {
      this.reverbNode.connect(this.reverbGain);
    }

    if (this.compressor && this.dryGain) {
      this.compressor.connect(this.dryGain);
    }

    if (this.dryGain && this.masterGain) {
      this.dryGain.connect(this.masterGain);
    }

    if (this.reverbGain && this.masterGain) {
      this.reverbGain.connect(this.masterGain);
    }

    // Connect master to speakers and record destination
    if (this.masterGain) {
      this.masterGain.connect(this.ctx.destination);
      if (this.masterRecordDestination) {
        this.masterGain.connect(this.masterRecordDestination);
      }
    }

    return true;
  }

  private createReverbBuffer(ctx: AudioContext, duration: number, decay: number): AudioBuffer {
    const sampleRate = ctx.sampleRate;
    const length = Math.floor(sampleRate * duration);
    const buffer = ctx.createBuffer(2, length, sampleRate);
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);

    for (let i = 0; i < length; i++) {
      const t = i / length;
      const envelope = Math.pow(1 - t, decay);
      left[i] = (Math.random() * 2 - 1) * envelope;
      right[i] = (Math.random() * 2 - 1) * envelope;
    }
    return buffer;
  }

  public async connectMicrophone(): Promise<AnalyserNode | null> {
    await this.initAudio();
    if (!this.ctx) return null;

    try {
      this.micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });

      this.micSource = this.ctx.createMediaStreamSource(this.micStream);
      this.vocalAnalyser = this.ctx.createAnalyser();
      this.vocalAnalyser.fftSize = 2048;
      this.vocalAnalyser.smoothingTimeConstant = 0.2;

      this.micSource.connect(this.vocalAnalyser);

      // Connect to mic monitor (with anti-feedback control)
      if (this.micInputGain && this.micMonitorGain) {
        this.micSource.connect(this.micInputGain);
        this.micInputGain.connect(this.micMonitorGain);
      }

      // Also connect mic directly to master recording destination so vocal is recorded clearly!
      if (this.masterRecordDestination) {
        const recordMicGain = this.ctx.createGain();
        recordMicGain.gain.setValueAtTime(1.0, this.ctx.currentTime);
        this.micSource.connect(recordMicGain);
        recordMicGain.connect(this.masterRecordDestination);
      }

      return this.vocalAnalyser;
    } catch (err) {
      console.warn('Microphone access denied or unavailable:', err);
      return null;
    }
  }

  public getVocalAnalyser(): AnalyserNode | null {
    return this.vocalAnalyser;
  }

  public startAccompaniment() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.currentStep = 0;
    this.scheduleNextTick();
  }

  public stopAccompaniment() {
    this.isRunning = false;
    if (this.timerId !== null) {
      window.clearTimeout(this.timerId);
      this.timerId = null;
    }
  }

  public isPlaying(): boolean {
    return this.isRunning;
  }

  private scheduleNextTick() {
    if (!this.isRunning || !this.ctx) return;

    const bpm = this.settings.bpm || 100;
    const stepIntervalMs = (60000 / bpm) / 4;

    this.onTick(this.currentStep);
    this.currentStep = (this.currentStep + 1) % 16;

    this.timerId = window.setTimeout(() => {
      this.scheduleNextTick();
    }, stepIntervalMs);
  }

  private onTick(step: number) {
    if (!this.ctx || this.ctx.state !== 'running') return;
    const now = this.ctx.currentTime;
    const complexity = this.settings.complexity || 'balanced';

    // Advance chord every 8 or 16 steps depending on complexity
    const chordStepInterval = complexity === 'minimal' ? 16 : 8;
    if (step % chordStepInterval === 0) {
      this.currentChordIndex = (this.currentChordIndex + 1) % this.chordProgression.length;
    }

    const currentChord = this.chordProgression[this.currentChordIndex];

    // 1. Chords
    if (this.settings.enableChords && currentChord) {
      const shouldPlayChord = 
        complexity === 'minimal' ? (step === 0) :
        complexity === 'balanced' ? (step === 0 || step === 8) :
        (step === 0 || step === 6 || step === 10); // Ornate/virtuoso syncopation

      if (shouldPlayChord) {
        this.playChord(currentChord, now);
      }
    }

    // 2. Bassline
    if (this.settings.enableBass && currentChord) {
      const root = currentChord.rootMidi - 12 + this.settings.transpositionSemitones;
      if (complexity === 'minimal') {
        if (step === 0) this.playBassNote(root, now, 0.8);
      } else if (complexity === 'balanced') {
        if (step === 0 || step === 8) this.playBassNote(root, now, 0.4);
      } else {
        // Ornate / Virtuoso walking bass
        if (step % 4 === 0) {
          const bassNote = step === 12 ? root + 7 : root;
          this.playBassNote(bassNote, now, 0.3);
        }
      }
    }

    // 3. Drums & Percussion
    if (this.settings.enablePercussion) {
      this.playPercussionStep(step, now, complexity);
    }

    // 4. Arpeggiator & Melodic Runs
    if (this.settings.enableArpeggio && currentChord) {
      const chordNotes = currentChord.notesMidi;
      const transposedNotes = chordNotes.map(n => n + this.settings.transpositionSemitones);

      if (complexity === 'minimal') {
        if (step === 4 || step === 12) {
          this.playArpNote(transposedNotes[0] + 12, now, 0.35);
        }
      } else if (complexity === 'balanced') {
        if (step % 2 === 0) {
          const noteIndex = Math.floor(step / 2) % transposedNotes.length;
          this.playArpNote(transposedNotes[noteIndex], now, 0.22);
        }
      } else {
        // Ornate & Virtuoso: 16th note arpeggios with octave leaps
        const noteIndex = step % transposedNotes.length;
        const octaveShift = (step % 4 === 2 || step % 4 === 3) ? 12 : 0;
        this.playArpNote(transposedNotes[noteIndex] + octaveShift, now, 0.16);
      }
    }
  }

  /**
   * Called immediately whenever a singer sings a note!
   * Creates an instantaneous responsive counter-melody or vocal harmony (< 100ms)!
   */
  public onSingerNoteDetected(midiNote: number, frequency: number, confidence: number) {
    if (!this.ctx || this.ctx.state !== 'running' || confidence < 0.6) return;

    const now = performance.now();
    if (now - this.lastNoteTime < 110) return;
    this.lastNoteTime = now;
    this.lastDetectedNote = midiNote;

    const audioNow = this.ctx.currentTime;
    const transposedMidi = midiNote + this.settings.transpositionSemitones;

    // Harmonize singer's note:
    if (this.settings.enableMelodyHarmony) {
      const harmonyNote = this.calculateHarmonizingPitch(transposedMidi);
      this.playHarmonizerVoice(harmonyNote, audioNow, 0.45);
    }

    // Responsive melodic grace chime
    if (this.settings.enableArpeggio && (this.settings.complexity === 'ornate' || this.settings.complexity === 'virtuoso')) {
      const responseNote = transposedMidi > 64 ? transposedMidi - 12 : transposedMidi + 12;
      this.playResponsiveChime(responseNote, audioNow + 0.04);
    }
  }

  private calculateHarmonizingPitch(singNote: number): number {
    const scale = this.settings.selectedScale;
    const intervalType = this.settings.harmonyInterval || 'third';

    if (intervalType === 'unison') return singNote;
    if (intervalType === 'octave') return singNote > 65 ? singNote - 12 : singNote + 12;
    if (intervalType === 'fifth') return singNote + 7;

    // Third or modal counterpoint:
    const scaleIntervals = SCALE_INTERVALS[scale] || SCALE_INTERVALS.minor;
    const noteClass = singNote % 12;

    let harmonyOffset = (scale === 'minor' || scale === 'shur' || scale === 'isfahan') ? 3 : 4;
    const targetClass = (noteClass + harmonyOffset) % 12;

    if (!scaleIntervals.includes(targetClass)) {
      for (const offset of [3, 4, 5, 7, -3, -4]) {
        if (scaleIntervals.includes((noteClass + offset + 12) % 12)) {
          harmonyOffset = offset;
          break;
        }
      }
    }

    return singNote + harmonyOffset;
  }

  /**
   * Synthesize Polyphonic Chords with selected Pad Instrument
   */
  private playChord(chord: ChordDefinition, time: number) {
    if (!this.ctx || !this.chordGain) return;
    const pad = this.settings.padInstrument;

    chord.notesMidi.forEach((midi, idx) => {
      const transMidi = midi + this.settings.transpositionSemitones;
      const freq = 440 * Math.pow(2, (transMidi - 69) / 12);
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const filter = this.ctx!.createBiquadFilter();

      filter.type = 'lowpass';

      if (pad === 'oriental_pad') {
        osc.type = idx % 2 === 0 ? 'triangle' : 'sawtooth';
        filter.frequency.setValueAtTime(2600, time);
        filter.Q.setValueAtTime(3.5, time);
        gain.gain.setValueAtTime(0.001, time);
        gain.gain.linearRampToValueAtTime(0.12, time + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 1.4);
        osc.stop(time + 1.45);
      } else if (pad === 'acoustic_piano') {
        osc.type = 'triangle';
        filter.frequency.setValueAtTime(1600, time);
        filter.frequency.exponentialRampToValueAtTime(450, time + 1.8);
        gain.gain.setValueAtTime(0.001, time);
        gain.gain.linearRampToValueAtTime(0.14, time + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 2.0);
        osc.stop(time + 2.05);
      } else if (pad === 'vintage_rhodes') {
        osc.type = 'sine';
        filter.frequency.setValueAtTime(950, time);
        gain.gain.setValueAtTime(0.001, time);
        gain.gain.linearRampToValueAtTime(0.15, time + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 1.5);
        osc.stop(time + 1.55);
      } else if (pad === 'synth_poly') {
        osc.type = 'sawtooth';
        filter.frequency.setValueAtTime(1900, time);
        gain.gain.setValueAtTime(0.001, time);
        gain.gain.linearRampToValueAtTime(0.1, time + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 1.1);
        osc.stop(time + 1.15);
      } else {
        // warm_strings
        osc.type = 'sine';
        filter.frequency.setValueAtTime(1200, time);
        gain.gain.setValueAtTime(0.001, time);
        gain.gain.linearRampToValueAtTime(0.09, time + 0.35);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 2.8);
        osc.stop(time + 2.85);
      }

      osc.frequency.setValueAtTime(freq, time);
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.chordGain!);
      osc.start(time);
    });
  }

  /**
   * Harmonizer Voice with selected Lead Instrument
   */
  private playHarmonizerVoice(midiNote: number, time: number, duration: number) {
    if (!this.ctx || !this.melodyGain) return;
    const lead = this.settings.leadInstrument;
    const freq = 440 * Math.pow(2, (midiNote - 69) / 12);

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    filter.type = 'lowpass';

    if (lead === 'santur' || lead === 'tar') {
      osc.type = 'triangle';
      filter.frequency.setValueAtTime(3000, time);
      filter.Q.setValueAtTime(4.0, time);
      osc.frequency.setValueAtTime(freq * 0.985, time);
      osc.frequency.linearRampToValueAtTime(freq, time + 0.04); // Grace ornament
    } else if (lead === 'synth_lead') {
      osc.type = 'sawtooth';
      filter.frequency.setValueAtTime(2200, time);
      osc.frequency.setValueAtTime(freq, time);
    } else if (lead === 'violin') {
      osc.type = 'sawtooth';
      filter.frequency.setValueAtTime(1500, time);
      osc.frequency.setValueAtTime(freq, time);
    } else {
      // piano / rhodes
      osc.type = 'sine';
      filter.frequency.setValueAtTime(1400, time);
      osc.frequency.setValueAtTime(freq, time);
    }

    gain.gain.setValueAtTime(0.001, time);
    gain.gain.linearRampToValueAtTime(0.18, time + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.melodyGain);

    osc.start(time);
    osc.stop(time + duration + 0.05);
  }

  /**
   * Bassline Synthesis with selected Bass Instrument
   */
  private playBassNote(midiNote: number, time: number, duration: number) {
    if (!this.ctx || !this.bassGain) return;
    const bass = this.settings.bassInstrument;
    const freq = 440 * Math.pow(2, (midiNote - 69) / 12);

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    filter.type = 'lowpass';

    if (bass === 'electric_drive') {
      osc.type = 'sawtooth';
      filter.frequency.setValueAtTime(600, time);
    } else if (bass === 'sub_808') {
      osc.type = 'sine';
      filter.frequency.setValueAtTime(220, time);
    } else if (bass === 'synth_bass') {
      osc.type = 'square';
      filter.frequency.setValueAtTime(420, time);
    } else {
      // upright_bass
      osc.type = 'triangle';
      filter.frequency.setValueAtTime(350, time);
    }

    osc.frequency.setValueAtTime(freq, time);

    gain.gain.setValueAtTime(0.001, time);
    gain.gain.linearRampToValueAtTime(0.24, time + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.bassGain);

    osc.start(time);
    osc.stop(time + duration + 0.05);
  }

  /**
   * Arpeggiator & Chime
   */
  private playArpNote(midiNote: number, time: number, duration: number) {
    if (!this.ctx || !this.melodyGain) return;
    const freq = 440 * Math.pow(2, (midiNote - 69) / 12);

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = (this.settings.leadInstrument === 'santur' || this.settings.leadInstrument === 'tar') ? 'triangle' : 'sine';
    osc.frequency.setValueAtTime(freq, time);

    gain.gain.setValueAtTime(0.001, time);
    gain.gain.linearRampToValueAtTime(0.09, time + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc.connect(gain);
    gain.connect(this.melodyGain);

    osc.start(time);
    osc.stop(time + duration + 0.02);
  }

  private playResponsiveChime(midiNote: number, time: number) {
    if (!this.ctx || !this.melodyGain) return;
    const freq = 440 * Math.pow(2, (midiNote - 69) / 12);

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, time);

    gain.gain.setValueAtTime(0.001, time);
    gain.gain.linearRampToValueAtTime(0.07, time + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.3);

    osc.connect(gain);
    gain.connect(this.melodyGain);

    osc.start(time);
    osc.stop(time + 0.32);
  }

  /**
   * Percussion & Drums with selected Kit
   */
  private playPercussionStep(step: number, time: number, complexity: string) {
    if (!this.ctx || !this.percussionGain) return;
    const kit = this.settings.drumKit;

    if (kit === 'daf_tombak') {
      if (step === 0 || step === 8) this.synthesizeTombakBam(time);
      if (step === 4 || step === 12) this.synthesizeTombakBak(time);
      if (complexity !== 'minimal' && step % 2 === 1) this.synthesizeDafJingle(time);
    } else if (kit === 'electronic_pop') {
      if (step === 0 || step === 4 || step === 8 || step === 12) this.synthesizeKick(time);
      if (step === 4 || step === 12) this.synthesizeSnare(time);
      if (step % 2 === 0) this.synthesizeHiHat(time, step % 4 === 2);
    } else if (kit === 'lofi_brush') {
      if (step === 0 || step === 10) this.synthesizeKick(time);
      if (step === 8) this.synthesizeSnare(time);
      if (step % 4 === 2) this.synthesizeHiHat(time, false);
    } else if (kit === 'acoustic_kit') {
      if (step === 0 || step === 8) this.synthesizeKick(time);
      if (step === 4 || step === 12) this.synthesizeSnare(time);
      if (step % 2 === 0) this.synthesizeHiHat(time, false);
    }
  }

  private synthesizeKick(time: number) {
    if (!this.ctx || !this.percussionGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.frequency.setValueAtTime(140, time);
    osc.frequency.exponentialRampToValueAtTime(42, time + 0.12);

    gain.gain.setValueAtTime(0.3, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.25);

    osc.connect(gain);
    gain.connect(this.percussionGain);

    osc.start(time);
    osc.stop(time + 0.26);
  }

  private synthesizeSnare(time: number) {
    if (!this.ctx || !this.percussionGain) return;
    const bufferSize = this.ctx.sampleRate * 0.15;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(800, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.18, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.percussionGain);

    noise.start(time);
    noise.stop(time + 0.16);
  }

  private synthesizeHiHat(time: number, open = false) {
    if (!this.ctx || !this.percussionGain) return;
    const bufferSize = this.ctx.sampleRate * (open ? 0.14 : 0.04);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(7000, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(open ? 0.08 : 0.05, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + (open ? 0.12 : 0.035));

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.percussionGain);

    noise.start(time);
    noise.stop(time + (open ? 0.13 : 0.04));
  }

  private synthesizeTombakBam(time: number) {
    if (!this.ctx || !this.percussionGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(95, time);
    filter.Q.setValueAtTime(4.0, time);

    osc.frequency.setValueAtTime(110, time);
    osc.frequency.exponentialRampToValueAtTime(65, time + 0.18);

    gain.gain.setValueAtTime(0.32, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.35);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.percussionGain);

    osc.start(time);
    osc.stop(time + 0.36);
  }

  private synthesizeTombakBak(time: number) {
    if (!this.ctx || !this.percussionGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(360, time);
    osc.frequency.exponentialRampToValueAtTime(180, time + 0.08);

    gain.gain.setValueAtTime(0.2, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);

    osc.connect(gain);
    gain.connect(this.percussionGain);

    osc.start(time);
    osc.stop(time + 0.11);
  }

  private synthesizeDafJingle(time: number) {
    if (!this.ctx || !this.percussionGain) return;
    const bufferSize = this.ctx.sampleRate * 0.03;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(5200, time);
    filter.Q.setValueAtTime(6.0, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.04, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.028);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.percussionGain);

    noise.start(time);
    noise.stop(time + 0.03);
  }

  public updateChordProgression(rootKey = this.settings.selectedRootKey, scale = this.settings.selectedScale) {
    const rootMidi = NOTE_NAME_TO_MIDI[rootKey] || 60;
    const chords: ChordDefinition[] = [];

    if (scale === 'shur') {
      chords.push(
        { name: `${rootKey} شور`, rootMidi: rootMidi, notesMidi: [rootMidi, rootMidi + 3, rootMidi + 7, rootMidi + 10], mood: 'اصیل و رازآلود' },
        { name: `درآمد شور`, rootMidi: rootMidi + 5, notesMidi: [rootMidi + 5, rootMidi + 8, rootMidi + 12], mood: 'آرامش بخش' },
        { name: `اوج شور`, rootMidi: rootMidi + 7, notesMidi: [rootMidi + 7, rootMidi + 10, rootMidi + 14], mood: 'حماسی' },
        { name: `فرود`, rootMidi: rootMidi, notesMidi: [rootMidi, rootMidi + 3, rootMidi + 7], mood: 'پایان بندی' },
      );
    } else if (scale === 'isfahan') {
      chords.push(
        { name: `${rootKey}m اصفهان`, rootMidi: rootMidi, notesMidi: [rootMidi, rootMidi + 3, rootMidi + 7, rootMidi + 11], mood: 'رمانتیک و اندوهگین' },
        { name: `گوشه بیات`, rootMidi: rootMidi + 5, notesMidi: [rootMidi + 5, rootMidi + 8, rootMidi + 12], mood: 'تسکین دهنده' },
        { name: `عشاق`, rootMidi: rootMidi + 7, notesMidi: [rootMidi + 7, rootMidi + 11, rootMidi + 14], mood: 'پرشور' },
        { name: `فرود اصفهان`, rootMidi: rootMidi, notesMidi: [rootMidi, rootMidi + 3, rootMidi + 7], mood: 'بازگشت' },
      );
    } else if (scale === 'major') {
      chords.push(
        { name: `${rootKey}`, rootMidi: rootMidi, notesMidi: [rootMidi, rootMidi + 4, rootMidi + 7], mood: 'شاد و روشن' },
        { name: `V`, rootMidi: rootMidi + 7, notesMidi: [rootMidi + 7, rootMidi + 11, rootMidi + 14], mood: 'امیدوارکننده' },
        { name: `vi`, rootMidi: rootMidi + 9, notesMidi: [rootMidi + 9, rootMidi + 12, rootMidi + 16], mood: 'احساسی' },
        { name: `IV`, rootMidi: rootMidi + 5, notesMidi: [rootMidi + 5, rootMidi + 9, rootMidi + 12], mood: 'رها و اوج' },
      );
    } else {
      chords.push(
        { name: `${rootKey}m`, rootMidi: rootMidi, notesMidi: [rootMidi, rootMidi + 3, rootMidi + 7], mood: 'عمیق' },
        { name: `VI`, rootMidi: rootMidi + 8, notesMidi: [rootMidi + 8, rootMidi + 12, rootMidi + 15], mood: 'روشن' },
        { name: `III`, rootMidi: rootMidi + 3, notesMidi: [rootMidi + 3, rootMidi + 7, rootMidi + 10], mood: 'پرشکوه' },
        { name: `VII`, rootMidi: rootMidi + 10, notesMidi: [rootMidi + 10, rootMidi + 14, rootMidi + 17], mood: 'انتظار' },
      );
    }

    this.chordProgression = chords;
    this.currentChordIndex = 0;
  }

  public updateSettings(newSettings: Partial<AccompanimentSettings>) {
    const oldStyle = this.settings.selectedStyle;
    const oldRoot = this.settings.selectedRootKey;
    const oldScale = this.settings.selectedScale;

    this.settings = { ...this.settings, ...newSettings };
    this.updateGains();

    if (this.settings.selectedRootKey !== oldRoot || this.settings.selectedScale !== oldScale || this.settings.selectedStyle !== oldStyle) {
      this.updateChordProgression(this.settings.selectedRootKey, this.settings.selectedScale);
    }
  }

  private updateGains() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const accVol = this.settings.accompanimentVolume;

    if (this.chordGain) this.chordGain.gain.setValueAtTime(this.settings.enableChords ? accVol * 0.75 : 0, now);
    if (this.melodyGain) this.melodyGain.gain.setValueAtTime(this.settings.enableMelodyHarmony ? accVol * 0.9 : 0, now);
    if (this.bassGain) this.bassGain.gain.setValueAtTime(this.settings.enableBass ? accVol * 0.8 : 0, now);
    if (this.percussionGain) this.percussionGain.gain.setValueAtTime(this.settings.enablePercussion ? accVol * 0.7 : 0, now);
    if (this.reverbGain) this.reverbGain.gain.setValueAtTime(this.settings.reverbAmount * 0.5, now);

    if (this.micMonitorGain) {
      const monitorVol = this.settings.muteMicMonitor ? 0 : this.settings.micVolume * 0.8;
      this.micMonitorGain.gain.setValueAtTime(monitorVol, now);
    }
  }

  public startRecording(): boolean {
    if (!this.masterRecordDestination) return false;
    try {
      this.recordedChunks = [];
      this.recordingStartTime = Date.now();
      const stream = this.masterRecordDestination.stream;
      this.mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });

      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          this.recordedChunks.push(e.data);
        }
      };

      this.mediaRecorder.start(100);
      return true;
    } catch (e) {
      console.error('Recording start error:', e);
      return false;
    }
  }

  public stopRecording(): { blob: Blob; durationSeconds: number } | null {
    if (!this.mediaRecorder) return null;
    this.mediaRecorder.stop();
    const durationSeconds = Math.max(1, Math.round((Date.now() - this.recordingStartTime) / 1000));
    const blob = new Blob(this.recordedChunks, { type: 'audio/webm' });
    return { blob, durationSeconds };
  }

  public getCurrentChords(): ChordDefinition[] {
    return this.chordProgression;
  }

  public getCurrentChord(): ChordDefinition | null {
    return this.chordProgression[this.currentChordIndex] || null;
  }

  public getStep(): number {
    return this.currentStep;
  }

  public dispose() {
    this.stopAccompaniment();
    if (this.micStream) {
      this.micStream.getTracks().forEach(t => t.stop());
    }
    if (this.ctx && this.ctx.state !== 'closed') {
      this.ctx.close();
    }
  }
}
