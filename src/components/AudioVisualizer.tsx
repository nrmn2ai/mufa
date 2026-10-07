import { useEffect, useRef } from 'react';
import { PitchDetectionResult } from '../audio/pitchDetector';
import { MusicalStyleId } from '../types/music';
import { MUSICAL_STYLES } from '../data/styles';

interface AudioVisualizerProps {
  analyser: AnalyserNode | null;
  pitchData: PitchDetectionResult;
  currentStyle: MusicalStyleId;
  isListening: boolean;
  isAccompanimentPlaying: boolean;
  lang: 'fa' | 'en';
}

export function AudioVisualizer({
  analyser,
  pitchData,
  currentStyle,
  isListening,
  isAccompanimentPlaying,
  lang,
}: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pitchHistoryRef = useRef<{ note: number; time: number; vol: number }[]>([]);

  const styleMeta = MUSICAL_STYLES[currentStyle] || MUSICAL_STYLES.traditional_persian;

  // Track pitch history for continuous melody curve
  useEffect(() => {
    if (pitchData.frequency > 0 && pitchData.midiNote > 0) {
      const now = performance.now();
      pitchHistoryRef.current.push({
        note: pitchData.exactMidi || pitchData.midiNote,
        time: now,
        vol: pitchData.rms,
      });

      // Keep last 4 seconds
      const cutoff = now - 4000;
      while (pitchHistoryRef.current.length > 0 && pitchHistoryRef.current[0].time < cutoff) {
        pitchHistoryRef.current.shift();
      }
    }
  }, [pitchData]);

  useEffect(() => {
    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let bufferLength = 0;
    let dataArray: Uint8Array | null = null;
    let timeArray: Float32Array | null = null;

    if (analyser) {
      bufferLength = analyser.frequencyBinCount;
      dataArray = new Uint8Array(bufferLength);
      timeArray = new Float32Array(analyser.fftSize);
    }

    const render = () => {
      animId = requestAnimationFrame(render);

      // Handle retina resolution
      const dpr = window.devicePixelRatio || 1;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;

      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);

      // Background with subtle grid
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, width, height);

      // Draw subtle horizontal musical pitch guide lines
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      const numLines = 6;
      for (let i = 1; i <= numLines; i++) {
        const y = (height / (numLines + 1)) * i;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Collect audio data
      if (analyser && dataArray && timeArray && isListening) {
        analyser.getByteFrequencyData(dataArray as any);
        analyser.getFloatTimeDomainData(timeArray as any);

        // Draw Spectrum Bars at bottom
        const barCount = Math.min(64, Math.floor(width / 6));
        const barWidth = width / barCount;
        const primaryColor = styleMeta.color;

        for (let i = 0; i < barCount; i++) {
          const dataIdx = Math.floor((i / barCount) * (bufferLength / 3));
          const val = dataArray[dataIdx] / 255;
          const barHeight = val * (height * 0.45);

          const grad = ctx.createLinearGradient(0, height, 0, height - barHeight);
          grad.addColorStop(0, `${primaryColor}15`);
          grad.addColorStop(1, `${primaryColor}bb`);

          ctx.fillStyle = grad;
          ctx.fillRect(i * barWidth + 1, height - barHeight, barWidth - 2, barHeight);
        }

        // Draw Live Vocal Waveform in center
        ctx.beginPath();
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = '#38bdf8';
        const sliceWidth = width / timeArray.length;
        let x = 0;

        for (let i = 0; i < timeArray.length; i += 4) {
          const v = timeArray[i];
          const y = height * 0.45 + v * (height * 0.35);

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
          x += sliceWidth * 4;
        }
        ctx.stroke();
      }

      // Draw Melodic Pitch Trajectory Ribbon
      const now = performance.now();
      const history = pitchHistoryRef.current;
      if (history.length > 2) {
        ctx.beginPath();
        ctx.lineWidth = 3.5;
        ctx.strokeStyle = styleMeta.color;
        ctx.shadowColor = styleMeta.color;
        ctx.shadowBlur = 12;

        const minMidi = 48; // C3
        const maxMidi = 84; // C6

        for (let i = 0; i < history.length; i++) {
          const pt = history[i];
          const age = now - pt.time; // 0 to 4000
          const hX = width - (age / 4000) * width;
          // Invert Y: higher pitch -> higher position
          const normMidi = Math.max(0, Math.min(1, (pt.note - minMidi) / (maxMidi - minMidi)));
          const hY = height * 0.8 - normMidi * (height * 0.65);

          if (i === 0) {
            ctx.moveTo(hX, hY);
          } else {
            ctx.lineTo(hX, hY);
          }
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      // Idle animated pulsing waves when not listening or waiting
      if (!isListening) {
        const time = performance.now() * 0.002;
        ctx.beginPath();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#334155';
        for (let i = 0; i < width; i += 6) {
          const y = height / 2 + Math.sin(time + i * 0.02) * 12;
          if (i === 0) ctx.moveTo(i, y);
          else ctx.lineTo(i, y);
        }
        ctx.stroke();
      }

      ctx.restore();
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [analyser, currentStyle, isListening, styleMeta]);

  // Pitch Cents Offset position (-50 to +50 -> 0% to 100%)
  const centsPercent = Math.max(0, Math.min(100, ((pitchData.centsOffset + 50) / 100) * 100));

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-slate-800 bg-slate-950/90 shadow-2xl backdrop-blur-md">
      {/* Top Header Bar of Visualizer */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800/80 bg-slate-900/60 text-xs">
        <div className="flex items-center gap-2">
          <span
            className="w-2.5 h-2.5 rounded-full transition-colors duration-500"
            style={{
              backgroundColor: isListening
                ? (pitchData.frequency > 0 ? '#10b981' : '#f59e0b')
                : '#64748b',
              boxShadow: isListening && pitchData.frequency > 0 ? '0 0 10px #10b981' : 'none',
            }}
          />
          <span className="font-medium text-slate-300">
            {isListening
              ? (pitchData.frequency > 0
                  ? (lang === 'fa' ? 'در حال تشخیص زنده صدا و هارمونی' : 'Real-Time Voice Pitch Detected')
                  : (lang === 'fa' ? 'میکروفن آماده • شروع به خواندن یا نواختن کنید' : 'Ready • Start singing or playing'))
              : (lang === 'fa' ? 'میکروفن غیرفعال' : 'Microphone Idle')}
          </span>
        </div>

        {/* Accompaniment indicator */}
        <div className="flex items-center gap-2">
          {isAccompanimentPlaying && (
            <span className="flex items-center gap-1.5 text-xs font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded-md">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {lang === 'fa' ? 'ملودی زنده فعال (< ۳ ثانیه)' : 'Live Melodic Accomp (< 3s)'}
            </span>
          )}
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded-md border"
            style={{
              borderColor: `${styleMeta.color}50`,
              color: styleMeta.color,
              backgroundColor: `${styleMeta.color}15`,
            }}
          >
            {lang === 'fa' ? styleMeta.nameFa : styleMeta.nameEn}
          </span>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="relative h-64 sm:h-72 w-full">
        <canvas ref={canvasRef} className="w-full h-full block" />

        {/* Center Pitch & Note Badge Overlay */}
        <div className="absolute top-4 left-4 flex flex-col gap-1 bg-slate-900/85 backdrop-blur-md border border-slate-700/60 p-2.5 rounded-xl shadow-lg">
          <div className="flex items-baseline gap-2">
            <span className="text-xs text-slate-400 font-sans">
              {lang === 'fa' ? 'نت خواننده:' : 'Vocal Note:'}
            </span>
            <span
              className="text-2xl font-bold font-mono tracking-tight transition-colors"
              style={{ color: pitchData.frequency > 0 ? styleMeta.color : '#94a3b8' }}
            >
              {pitchData.noteName}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <span>
              {pitchData.frequency > 0 ? `${Math.round(pitchData.frequency)} Hz` : '0 Hz'}
            </span>
            <span>•</span>
            <span className="text-slate-300">
              {pitchData.centsOffset > 0 ? `+${pitchData.centsOffset}` : pitchData.centsOffset} cents
            </span>
          </div>

          {/* Cents Tuning Gauge */}
          <div className="w-32 h-1.5 bg-slate-800 rounded-full overflow-hidden mt-1 relative">
            <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-slate-500 z-10" />
            {pitchData.frequency > 0 && (
              <div
                className="absolute top-0 bottom-0 w-2 rounded-full transition-all duration-75"
                style={{
                  left: `${centsPercent}%`,
                  transform: 'translateX(-50%)',
                  backgroundColor: Math.abs(pitchData.centsOffset) < 15 ? '#10b981' : '#f59e0b',
                }}
              />
            )}
          </div>
        </div>

        {/* Volume & Dynamics Level Meter on Right */}
        <div className="absolute top-4 right-4 flex items-center gap-2 bg-slate-900/85 backdrop-blur-md border border-slate-700/60 px-3 py-2 rounded-xl text-xs">
          <span className="text-slate-400">{lang === 'fa' ? 'شدت صدا:' : 'Volume:'}</span>
          <div className="w-16 h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-75"
              style={{
                width: `${Math.min(100, pitchData.rms * 400)}%`,
                backgroundColor: pitchData.rms > 0.25 ? '#ef4444' : (pitchData.rms > 0.1 ? '#f59e0b' : '#10b981'),
              }}
            />
          </div>
        </div>

        {/* Latency Guarantee Notice */}
        <div className="absolute bottom-3 left-4 text-[11px] text-slate-400 bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-800/80 backdrop-blur-sm flex items-center gap-1.5">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span>
            {lang === 'fa'
              ? 'تولید بلادرنگ ملودی با تاخیر کمتر از ۱۰۰ میلی‌ثانیه'
              : 'Real-time accompaniment latency < 100ms'}
          </span>
        </div>
      </div>
    </div>
  );
}
