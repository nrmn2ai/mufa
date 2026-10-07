/**
 * Melodiya - Real-Time AI Vocal Accompaniment Studio
 * Synchronous pitch detection, instant melody generation (< 3s latency),
 * dynamic style morphing, advanced customization, and social sharing.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Mic, 
  MicOff, 
  Music, 
  Radio, 
  Disc, 
  Sliders, 
  Sparkles, 
  Globe, 
  Share2, 
  Layers, 
  Zap,
  Volume2
} from 'lucide-react';

import { 
  MusicalStyleId, 
  AccompanimentSettings, 
  VocalMetrics, 
  StyleAnalysisResult, 
  SavedPerformance 
} from './types/music';
import { MUSICAL_STYLES } from './data/styles';
import { PitchDetector, PitchDetectionResult } from './audio/pitchDetector';
import { VocalClassifier } from './audio/vocalClassifier';
import { MusicEngine } from './audio/musicEngine';

import { AudioVisualizer } from './components/AudioVisualizer';
import { StyleIndicator } from './components/StyleIndicator';
import { PrePerformanceGenreSelector } from './components/PrePerformanceGenreSelector';
import { StudioControls } from './components/StudioControls';
import { AdvancedMelodyCustomizer } from './components/AdvancedMelodyCustomizer';
import { VirtualVocalistDemo } from './components/VirtualVocalistDemo';
import { AILyricsAdvisor } from './components/AILyricsAdvisor';
import { SavedPerformancesModal } from './components/SavedPerformancesModal';
import { SharePerformanceModal } from './components/SharePerformanceModal';

const DEFAULT_SETTINGS: AccompanimentSettings = {
  autoStyleDetect: true,
  autoStartOnVoice: true, // Auto-detect genre and start music as soon as user sings!
  selectedStyle: 'traditional_persian',
  selectedScale: 'shur',
  selectedRootKey: 'D',
  autoKeyDetect: true,
  bpm: 88,
  autoBpmDetect: true,
  
  // Advanced Customization
  complexity: 'balanced',
  transpositionSemitones: 0,
  leadInstrument: 'santur',
  padInstrument: 'oriental_pad',
  bassInstrument: 'upright_bass',
  drumKit: 'daf_tombak',
  harmonyInterval: 'third',
  reverbAmount: 0.5,
  stereoSpread: 0.7,

  // Layers
  enableChords: true,
  enableMelodyHarmony: true,
  enableBass: true,
  enablePercussion: true,
  enableArpeggio: true,

  // Mixer
  micVolume: 1.0,
  accompanimentVolume: 0.8,
  muteMicMonitor: true, // Prevents feedback loop on laptop speakers
};

export default function App() {
  const [lang, setLang] = useState<'fa' | 'en'>('fa');
  const [settings, setSettings] = useState<AccompanimentSettings>(DEFAULT_SETTINGS);
  
  // Audio state
  const [isListening, setIsListening] = useState(false);
  const [isAccompanimentPlaying, setIsAccompanimentPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordTimer, setRecordTimer] = useState(0);

  // Auto-start notification state
  const [autoStartedNotice, setAutoStartedNotice] = useState<{
    show: boolean;
    genreNameFa: string;
    genreNameEn: string;
    timestamp: number;
  } | null>(null);

  // Pitch & Analysis state
  const [pitchData, setPitchData] = useState<PitchDetectionResult>({
    frequency: 0,
    midiNote: 0,
    exactMidi: 0,
    noteName: '—',
    noteBase: '—',
    centsOffset: 0,
    confidence: 0,
    rms: 0,
    db: -100,
    spectralCentroid: 0,
  });

  const [styleAnalysis, setStyleAnalysis] = useState<StyleAnalysisResult>({
    currentStyle: 'traditional_persian',
    confidence: 0.8,
    autoDetected: true,
    scores: {
      traditional_persian: 0.8,
      acoustic_ballad: 0.2,
      pop_upbeat: 0.2,
      lofi_jazz: 0.1,
      epic_rock: 0.1,
      ambient_mystic: 0.1,
    },
    transitioning: false,
    reasonFa: 'آماده تشخیص تحریرهای آوازی سنتی ایرانی یا ساز',
    reasonEn: 'Ready to detect vocal ornaments and performance style',
  });

  const [melismaFactor, setMelismaFactor] = useState(0.3);
  const [vibratoDepth, setVibratoDepth] = useState(0);

  // Modals & Recordings
  const [savedPerformances, setSavedPerformances] = useState<SavedPerformance[]>([]);
  const [showSavedModal, setShowSavedModal] = useState(false);
  const [activeSharePerformance, setActiveSharePerformance] = useState<SavedPerformance | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  // Engine references
  const engineRef = useRef<MusicEngine | null>(null);
  const pitchDetectorRef = useRef<PitchDetector | null>(null);
  const vocalClassifierRef = useRef<VocalClassifier | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const lastUiUpdateRef = useRef<number>(0);
  const recordIntervalRef = useRef<number | null>(null);

  // Initialize engine on first render
  useEffect(() => {
    engineRef.current = new MusicEngine(DEFAULT_SETTINGS);
    pitchDetectorRef.current = new PitchDetector(2048, 44100);
    vocalClassifierRef.current = new VocalClassifier();

    return () => {
      if (engineRef.current) {
        engineRef.current.dispose();
      }
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
      }
      if (recordIntervalRef.current !== null) {
        clearInterval(recordIntervalRef.current);
      }
    };
  }, []);

  // Update HTML document direction and title on language switch
  useEffect(() => {
    document.documentElement.dir = lang === 'fa' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  // Handle Settings Update
  const handleUpdateSettings = useCallback((newSettings: Partial<AccompanimentSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      if (engineRef.current) {
        engineRef.current.updateSettings(updated);
      }
      return updated;
    });
  }, []);

  // Pre-Select Starting Genre
  const handleSelectPreGenre = (styleId: MusicalStyleId) => {
    const meta = MUSICAL_STYLES[styleId];
    handleUpdateSettings({
      selectedStyle: styleId,
      bpm: meta.bpmDefault,
      selectedScale: meta.scales[0] || 'minor',
      leadInstrument: meta.defaultLead,
      padInstrument: meta.defaultPad,
      bassInstrument: meta.defaultBass,
      drumKit: meta.defaultDrums,
    });

    setStyleAnalysis((prev) => ({
      ...prev,
      currentStyle: styleId,
      reasonFa: `سبک انتخابی: ${meta.nameFa} با سازهای اختصاصی`,
      reasonEn: `Selected genre: ${meta.nameEn} with customized instruments`,
    }));
  };

  // Toggle Microphone
  const handleToggleMic = async () => {
    if (!engineRef.current) return;

    if (isListening) {
      // Turn off
      setIsListening(false);
      analyserRef.current = null;
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      if (engineRef.current.isPlaying()) {
        engineRef.current.stopAccompaniment();
        setIsAccompanimentPlaying(false);
      }
      return;
    }

    // Reset initial detection so the first singing phrase triggers fresh genre classification & auto-play
    if (vocalClassifierRef.current) {
      vocalClassifierRef.current.resetInitialDetection();
    }

    // Turn on microphone
    const analyser = await engineRef.current.connectMicrophone();
    if (analyser) {
      analyserRef.current = analyser;
      setIsListening(true);
      startAudioLoop(analyser);
    }
  };

  // Toggle Accompaniment Playback
  const handleToggleAccompaniment = async () => {
    if (!engineRef.current) return;
    await engineRef.current.initAudio();

    if (isAccompanimentPlaying) {
      engineRef.current.stopAccompaniment();
      setIsAccompanimentPlaying(false);
    } else {
      engineRef.current.startAccompaniment();
      setIsAccompanimentPlaying(true);
    }
  };

  // Audio Processing Loop
  const startAudioLoop = (analyser: AnalyserNode) => {
    const timeBuffer = new Float32Array(analyser.fftSize);
    const freqBuffer = new Uint8Array(analyser.frequencyBinCount);

    const processLoop = () => {
      animFrameRef.current = requestAnimationFrame(processLoop);

      analyser.getFloatTimeDomainData(timeBuffer);
      analyser.getByteFrequencyData(freqBuffer);

      if (!pitchDetectorRef.current || !vocalClassifierRef.current || !engineRef.current) return;

      const res = pitchDetectorRef.current.detectPitch(timeBuffer, freqBuffer);
      const now = performance.now();

      // If singing is detected:
      if (res.frequency > 0 && res.rms > 0.015) {
        const vibrato = pitchDetectorRef.current.getVibratoDepth();
        vocalClassifierRef.current.addSample({
          frequency: res.frequency,
          midiNote: res.midiNote,
          rms: res.rms,
          spectralCentroid: res.spectralCentroid,
          vibrato,
        });

        // 1. AUTO-DETECT GENRE & AUTO-START MUSIC AS SOON AS USER SINGS!
        if (!engineRef.current.isPlaying() && settings.autoStartOnVoice) {
          const autoAnalysis = vocalClassifierRef.current.classify(
            settings.autoStyleDetect ? undefined : settings.selectedStyle
          );
          const detectedStyle = autoAnalysis.currentStyle;
          const detectedMeta = MUSICAL_STYLES[detectedStyle];

          const styleUpdate: Partial<AccompanimentSettings> = {
            selectedStyle: detectedStyle,
            bpm: detectedMeta.bpmDefault,
            selectedScale: detectedMeta.scales[0] || 'minor',
            leadInstrument: detectedMeta.defaultLead,
            padInstrument: detectedMeta.defaultPad,
            bassInstrument: detectedMeta.defaultBass,
            drumKit: detectedMeta.defaultDrums,
          };

          if (settings.autoKeyDetect) {
            const keyDetect = vocalClassifierRef.current.detectScaleAndKey();
            styleUpdate.selectedRootKey = keyDetect.rootKey;
          }

          engineRef.current.updateSettings(styleUpdate);
          handleUpdateSettings(styleUpdate);
          setStyleAnalysis(autoAnalysis);

          // Launch accompaniment immediately in the detected genre!
          engineRef.current.startAccompaniment();
          setIsAccompanimentPlaying(true);

          setAutoStartedNotice({
            show: true,
            genreNameFa: detectedMeta.nameFa,
            genreNameEn: detectedMeta.nameEn,
            timestamp: Date.now(),
          });
        }

        // 2. Trigger instant accompaniment note response & harmony (< 100ms)!
        engineRef.current.onSingerNoteDetected(res.midiNote, res.frequency, res.confidence);
      }

      // Throttle UI and style classifier updates to 15fps (~65ms) to preserve CPU
      if (now - lastUiUpdateRef.current > 65) {
        lastUiUpdateRef.current = now;
        setPitchData(res);

        // Classify style dynamically
        const analysis = vocalClassifierRef.current.classify(
          settings.autoStyleDetect ? undefined : settings.selectedStyle
        );

        setStyleAnalysis(analysis);

        // If style switched dynamically during singing, update engine parameters live!
        if (analysis.transitioning && analysis.currentStyle !== settings.selectedStyle) {
          const newMeta = MUSICAL_STYLES[analysis.currentStyle];
          const morphParams: Partial<AccompanimentSettings> = {
            selectedStyle: analysis.currentStyle,
            bpm: newMeta.bpmDefault,
            selectedScale: newMeta.scales[0] || settings.selectedScale,
            leadInstrument: newMeta.defaultLead,
            padInstrument: newMeta.defaultPad,
            bassInstrument: newMeta.defaultBass,
            drumKit: newMeta.defaultDrums,
          };

          engineRef.current.updateSettings(morphParams);
          handleUpdateSettings(morphParams);

          setAutoStartedNotice({
            show: true,
            genreNameFa: newMeta.nameFa,
            genreNameEn: newMeta.nameEn,
            timestamp: Date.now(),
          });
        }

        // Auto-detect key if enabled
        if (settings.autoKeyDetect) {
          const keyDetect = vocalClassifierRef.current.detectScaleAndKey();
          if (keyDetect.rootKey !== settings.selectedRootKey) {
            handleUpdateSettings({ selectedRootKey: keyDetect.rootKey });
          }
        }

        const vib = pitchDetectorRef.current.getVibratoDepth();
        setVibratoDepth(vib);
        setMelismaFactor(Math.min(1, Math.max(0.1, vib / 10)));
      }
    };

    processLoop();
  };

  // Simulate Singing / Instrument note from Virtual Vocalist demo
  const handleSimulateVocal = async (noteMidi: number, freq: number, rms: number, styleHint: MusicalStyleId) => {
    if (!engineRef.current) return;
    await engineRef.current.initAudio();

    // 1. Immediately switch to the demo's genre and trigger music!
    if (styleHint) {
      const meta = MUSICAL_STYLES[styleHint];
      const styleParams: Partial<AccompanimentSettings> = {
        selectedStyle: styleHint,
        bpm: meta.bpmDefault,
        selectedScale: meta.scales[0] || 'minor',
        leadInstrument: meta.defaultLead,
        padInstrument: meta.defaultPad,
        bassInstrument: meta.defaultBass,
        drumKit: meta.defaultDrums,
      };
      engineRef.current.updateSettings(styleParams);
      handleUpdateSettings(styleParams);

      setStyleAnalysis((prev) => ({
        ...prev,
        currentStyle: styleHint,
        reasonFa: `سبک «${meta.nameFa}» از صدای خواننده تشخیص داده شد و پخش موسیقی آغاز گردید`,
        reasonEn: `Genre "${meta.nameEn}" detected from vocal input — music accompaniment started`,
      }));

      setAutoStartedNotice({
        show: true,
        genreNameFa: meta.nameFa,
        genreNameEn: meta.nameEn,
        timestamp: Date.now(),
      });
    }

    // 2. Start accompaniment automatically if not playing!
    if (!engineRef.current.isPlaying()) {
      engineRef.current.startAccompaniment();
      setIsAccompanimentPlaying(true);
    }

    // 3. Trigger instant counter-melody / harmony in engine
    engineRef.current.onSingerNoteDetected(noteMidi, freq, 0.95);

    // Update Pitch visualizer
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const noteName = `${noteNames[noteMidi % 12]}${Math.floor(noteMidi / 12) - 1}`;

    setPitchData({
      frequency: freq,
      midiNote: noteMidi,
      exactMidi: noteMidi,
      noteName,
      noteBase: noteNames[noteMidi % 12],
      centsOffset: 0,
      confidence: 0.95,
      rms,
      db: -18,
      spectralCentroid: 1400,
    });

    if (vocalClassifierRef.current) {
      vocalClassifierRef.current.addSample({
        frequency: freq,
        midiNote: noteMidi,
        rms,
        spectralCentroid: 1400,
        vibrato: 4,
      });
    }
  };

  // Recording Management (Vocal + Accompaniment synchronized)
  const handleToggleRecord = async () => {
    if (!engineRef.current) return;
    await engineRef.current.initAudio();

    if (isRecording) {
      // Stop recording
      const result = engineRef.current.stopRecording();
      setIsRecording(false);
      if (recordIntervalRef.current !== null) {
        clearInterval(recordIntervalRef.current);
        recordIntervalRef.current = null;
      }
      setRecordTimer(0);

      if (result) {
        const audioUrl = URL.createObjectURL(result.blob);
        setDownloadUrl(audioUrl);

        const currentStyleMeta = MUSICAL_STYLES[settings.selectedStyle];
        const newPerformance: SavedPerformance = {
          id: `perf_${Date.now()}`,
          title: lang === 'fa' 
            ? `اجرای آوازی ${currentStyleMeta.nameFa}` 
            : `${currentStyleMeta.nameEn} Vocal Performance`,
          timestamp: Date.now(),
          durationSeconds: result.durationSeconds,
          audioBlob: result.blob,
          audioUrl,
          styleId: settings.selectedStyle,
          styleNameFa: currentStyleMeta.nameFa,
          styleNameEn: currentStyleMeta.nameEn,
          rootKey: settings.selectedRootKey,
          scale: settings.selectedScale,
          bpm: settings.bpm,
          fileSizeFormatted: `${(result.blob.size / 1024 / 1024).toFixed(1)} MB`,
        };

        setSavedPerformances((prev) => [newPerformance, ...prev]);
        setActiveSharePerformance(newPerformance);
      }
    } else {
      // Start recording
      const started = engineRef.current.startRecording();
      if (started) {
        setIsRecording(true);
        setRecordTimer(0);
        recordIntervalRef.current = window.setInterval(() => {
          setRecordTimer((t) => t + 1);
        }, 1000);

        // Ensure accompaniment is playing
        if (!engineRef.current.isPlaying()) {
          engineRef.current.startAccompaniment();
          setIsAccompanimentPlaying(true);
        }
      }
    }
  };

  const handleDeletePerformance = (id: string) => {
    setSavedPerformances((prev) => prev.filter((p) => p.id !== id));
  };

  const activeStyleMeta = MUSICAL_STYLES[settings.selectedStyle] || MUSICAL_STYLES.traditional_persian;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-amber-500 selection:text-slate-950">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 text-slate-950 flex items-center justify-center font-black text-xl shadow-lg shadow-amber-500/20">
              <Music className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base sm:text-lg tracking-tight text-white">
                  Melodiya
                </span>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Real-Time &lt; 3s
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                {lang === 'fa'
                  ? 'استودیو ساخت ملودی و همراهی همزمان با آواز'
                  : 'Instant AI Vocal Accompaniment Studio'}
              </p>
            </div>
          </div>

          {/* Right Controls: Saved Recordings Library, Language Switch */}
          <div className="flex items-center gap-2.5">
            {/* Saved Recordings Button */}
            <button
              onClick={() => setShowSavedModal(true)}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-semibold flex items-center gap-2 transition-all"
            >
              <Disc className="w-4 h-4 text-amber-400" />
              <span>{lang === 'fa' ? 'آرشیو اجراها' : 'Recordings'}</span>
              {savedPerformances.length > 0 && (
                <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 font-mono text-[11px] font-bold flex items-center justify-center">
                  {savedPerformances.length}
                </span>
              )}
            </button>

            {/* Language Switcher */}
            <button
              onClick={() => setLang(lang === 'fa' ? 'en' : 'fa')}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-mono font-semibold flex items-center gap-1.5 transition-all"
              title="Toggle Language"
            >
              <Globe className="w-4 h-4 text-cyan-400" />
              <span>{lang === 'fa' ? 'EN' : 'فا'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Sub-header with Real-Time Latency Promise */}
      <div className="bg-gradient-to-b from-slate-900/60 to-transparent border-b border-slate-900 px-4 py-3 text-center">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-center gap-3 text-xs text-slate-300">
          <div className="flex items-center gap-1.5 text-amber-400 font-semibold">
            <Zap className="w-4 h-4" />
            <span>{lang === 'fa' ? 'پاسخ صوتی کمتر از ۳ ثانیه' : 'Sub-3s Instant Response'}</span>
          </div>
          <span className="text-slate-600 hidden sm:inline">•</span>
          <span>
            {lang === 'fa'
              ? 'با شروع خواندن یا نواختن ساز، ملودی متناسب با ریتم و تناژ صدا بلافاصله ساخته شده و سبک همگام با لحن شما تغییر می‌کند.'
              : 'As you sing or play, harmonious melodies adapt live to your pitch, rhythm, and tone.'}
          </span>
        </div>
      </div>

      {/* Main Studio Workspace */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-6 w-full flex flex-col gap-6">
        {/* Live Vocal Auto-Start & Genre Detection Banner */}
        <div
          className={`w-full rounded-2xl border p-4 transition-all duration-500 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
            isAccompanimentPlaying
              ? 'bg-gradient-to-r from-emerald-950/80 via-slate-900/90 to-amber-950/80 border-emerald-500/50 shadow-emerald-950/40 ring-1 ring-emerald-500/30'
              : isListening
                ? 'bg-gradient-to-r from-cyan-950/70 via-slate-900/90 to-slate-900/90 border-cyan-500/50 animate-pulse-subtle'
                : 'bg-slate-900/50 border-slate-800'
          }`}
        >
          <div className="flex items-center gap-3.5">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-transform ${
                isAccompanimentPlaying
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-lg shadow-emerald-500/40 scale-105'
                  : isListening
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'bg-slate-800 text-slate-400'
              }`}
            >
              {isAccompanimentPlaying ? (
                <Music className="w-6 h-6 animate-pulse" />
              ) : isListening ? (
                <Radio className="w-6 h-6 animate-spin" />
              ) : (
                <Mic className="w-6 h-6" />
              )}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-extrabold text-sm sm:text-base text-slate-100">
                  {isAccompanimentPlaying
                    ? (lang === 'fa'
                        ? `🎵 سبک «${activeStyleMeta.nameFa}» فعال است و موسیقی خودکار می‌نوازد!`
                        : `🎵 Playing in Detected Genre: "${activeStyleMeta.nameEn}"!`)
                    : isListening
                      ? (lang === 'fa'
                          ? '🎧 میکروفن آماده است • همین حالا شروع به خواندن کنید!'
                          : '🎧 Ready & Listening • Start singing to detect genre & auto-play!')
                      : (lang === 'fa'
                          ? 'حالت تشخیص سبک و همراهی خودکار با صدا (Auto-Detect & Auto-Play)'
                          : 'Auto-Detect Genre & Auto-Play Music Mode')
                  }
                </h3>

                {isAccompanimentPlaying && (
                  <span className="text-[11px] font-mono text-emerald-300 bg-emerald-950/90 border border-emerald-700/60 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    {lang === 'fa' ? 'نواختن زنده فعال' : 'Live Accomp Active'}
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                {isAccompanimentPlaying
                  ? (lang === 'fa'
                      ? 'ملودی و سازهای همراهی با تن صدای شما شروع به نواختن کردند. اگر تحریر، سرعت یا احساس خواندن را تغییر دهید، سبک موسیقی نیز به صورت خودکار تغییر می‌کند.'
                      : 'Accompaniment started automatically based on your vocal timbre. Changing your singing style will dynamically morph the genre in real-time.')
                  : isListening
                    ? (lang === 'fa'
                        ? 'به محض اینکه دهان به آواز باز کنید، هوش مصنوعی تن و ریتم شما را شناسایی کرده و موسیقی همراهی را در سبک متناسب شروع می‌کند (بدون نیاز به فشردن دکمه).'
                        : 'As soon as you sing the first phrase, the app identifies your genre and immediately launches tailored music accompaniment without manual clicking.')
                    : (lang === 'fa'
                        ? 'میکروفن را روشن کنید یا از بخش «شبیه‌ساز و تست خوانندگی» در پایین صفحه یک قطعه را امتحان نمایید تا شروع خودکار را تجربه کنید.'
                        : 'Enable the microphone or try a sample from the Virtual Vocalist Simulator below to experience auto-detection & music playback.')
                }
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
            {!isListening ? (
              <button
                onClick={handleToggleMic}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/25 active:scale-95 cursor-pointer"
              >
                <Mic className="w-4 h-4" />
                <span>{lang === 'fa' ? 'فعال‌سازی میکروفن و شروع' : 'Enable Mic & Start'}</span>
              </button>
            ) : !isAccompanimentPlaying ? (
              <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-800/60 px-3 py-1.5 rounded-xl">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                <span>{lang === 'fa' ? 'در انتظار صدای آواز...' : 'Waiting for voice...'}</span>
              </div>
            ) : null}
          </div>
        </div>

        {/* 1. Pre-Performance Genre Selector */}
        <PrePerformanceGenreSelector
          selectedStyle={settings.selectedStyle}
          onSelectStyle={handleSelectPreGenre}
          lang={lang}
        />

        {/* 2. Visualizer and Pitch Monitor */}
        <AudioVisualizer
          analyser={analyserRef.current}
          pitchData={pitchData}
          currentStyle={settings.selectedStyle}
          isListening={isListening}
          isAccompanimentPlaying={isAccompanimentPlaying}
          lang={lang}
        />

        {/* 3. Style Indicator & Dynamic Morphing Gauges */}
        <StyleIndicator
          currentStyle={settings.selectedStyle}
          autoDetect={settings.autoStyleDetect}
          onToggleAutoDetect={(auto) => handleUpdateSettings({ autoStyleDetect: auto })}
          onSelectStyle={handleSelectPreGenre}
          scores={styleAnalysis.scores}
          reasonFa={styleAnalysis.reasonFa}
          reasonEn={styleAnalysis.reasonEn}
          melismaFactor={melismaFactor}
          vibratoDepth={vibratoDepth}
          spectralCentroid={pitchData.spectralCentroid}
          bpm={settings.bpm}
          lang={lang}
        />

        {/* 4. Studio Controls (Mic, Accomp, Recording, Layer Toggles, Mixer) */}
        <StudioControls
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
          isListening={isListening}
          onToggleMic={handleToggleMic}
          isAccompanimentPlaying={isAccompanimentPlaying}
          onToggleAccompaniment={handleToggleAccompaniment}
          isRecording={isRecording}
          onToggleRecord={handleToggleRecord}
          downloadUrl={downloadUrl}
          lang={lang}
        />

        {/* 5. Advanced Melody Customizer (Tempo, Complexity, Instruments, Key & Harmony) */}
        <AdvancedMelodyCustomizer
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
          lang={lang}
        />

        {/* 6. Virtual Vocalist & Keyboard Simulator (For testing without mic) */}
        <VirtualVocalistDemo
          onSimulateVocal={handleSimulateVocal}
          onSelectStyle={handleSelectPreGenre}
          lang={lang}
        />

        {/* 7. AI Lyrics & Improvisation Advisor */}
        <AILyricsAdvisor
          currentStyle={settings.selectedStyle}
          scale={settings.selectedScale}
          rootKey={settings.selectedRootKey}
          lang={lang}
        />
      </main>

      {/* Saved Performances Modal */}
      {showSavedModal && (
        <SavedPerformancesModal
          performances={savedPerformances}
          onDeletePerformance={handleDeletePerformance}
          onClose={() => setShowSavedModal(false)}
          lang={lang}
        />
      )}

      {/* Share Modal */}
      {activeSharePerformance && (
        <SharePerformanceModal
          performance={activeSharePerformance}
          onClose={() => setActiveSharePerformance(null)}
          lang={lang}
        />
      )}

      {/* Footer */}
      <footer className="mt-12 border-t border-slate-900 bg-slate-950/90 py-6 px-4 text-center text-xs text-slate-500">
        <p>
          {lang === 'fa'
            ? 'Melodiya • سیستم آهنگسازی و همراهی هوشمند زنده با آواز • طراحی شده با Web Audio API و هوش مصنوعی'
            : 'Melodiya • Real-Time Adaptive Vocal Music Accompaniment Studio • Powered by Web Audio API & AI'}
        </p>
      </footer>
    </div>
  );
}
