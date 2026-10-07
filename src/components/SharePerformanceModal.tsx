import { useState } from 'react';
import { 
  X, 
  Share2, 
  Copy, 
  Check, 
  Download, 
  Send, 
  MessageSquare, 
  Twitter, 
  Music, 
  Sparkles 
} from 'lucide-react';
import { SavedPerformance } from '../types/music';

interface SharePerformanceModalProps {
  performance: SavedPerformance;
  onClose: () => void;
  lang: 'fa' | 'en';
}

export function SharePerformanceModal({
  performance,
  onClose,
  lang,
}: SharePerformanceModalProps) {
  const [copied, setCopied] = useState(false);

  const shareTextFa = `🎵 اجرای آوازی من با همراهی هوشمند و ملودی زنده Melodiya!\nسبک: ${performance.styleNameFa} | گام: ${performance.rootKey} | تمپو: ${performance.bpm} BPM`;
  const shareTextEn = `🎵 Check out my live singing performance accompanied in real-time by Melodiya!\nGenre: ${performance.styleNameEn} | Key: ${performance.rootKey} | BPM: ${performance.bpm}`;
  const shareText = lang === 'fa' ? shareTextFa : shareTextEn;

  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  // Native Web Share API
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: performance.title,
          text: shareText,
          url: currentUrl,
        });
      } catch (err) {
        console.warn('Share cancelled or error:', err);
      }
    } else {
      handleCopyLink();
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${shareText}\n${currentUrl}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const shareToTelegram = () => {
    const url = `https://t.me/share/url?url=${encodeURIComponent(currentUrl)}&text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
  };

  const shareToWhatsApp = () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareText}\n${currentUrl}`)}`;
    window.open(url, '_blank');
  };

  const shareToTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(`${shareText}\n${currentUrl}`)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl flex flex-col gap-5 text-right">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center">
            <Share2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-slate-100">
              {lang === 'fa' ? 'اشتراک‌گذاری اجرای آواز و ملودی' : 'Share Vocal & Melody Performance'}
            </h3>
            <p className="text-xs text-slate-400">
              {lang === 'fa' ? 'ارسال قطعه ضبط شده برای دوستان یا در شبکه‌های اجتماعی' : 'Share your recorded performance on social platforms'}
            </p>
          </div>
        </div>

        {/* Performance Preview Card */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Music className="w-4 h-4 text-amber-400" />
              <span className="font-bold text-sm text-slate-200">{performance.title}</span>
            </div>
            <span className="text-xs font-mono text-slate-400">
              {Math.floor(performance.durationSeconds / 60)}:{String(performance.durationSeconds % 60).padStart(2, '0')}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="px-2.5 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-300">
              {lang === 'fa' ? performance.styleNameFa : performance.styleNameEn}
            </span>
            <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-mono">
              {performance.rootKey} {performance.scale}
            </span>
            <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-mono">
              {performance.bpm} BPM
            </span>
          </div>

          {/* Audio Player in Preview */}
          <audio controls src={performance.audioUrl} className="w-full mt-2 h-10 rounded-lg" />
        </div>

        {/* Social Share Buttons */}
        <div>
          <label className="text-xs font-semibold text-slate-300 block mb-2.5">
            {lang === 'fa' ? 'اشتراک‌گذاری مستقیم در پیام‌رسان‌ها:' : 'Direct Share to Social Channels:'}
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <button
              onClick={shareToTelegram}
              className="p-3 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 text-sky-300 text-xs font-medium flex items-center justify-center gap-2 transition-all"
            >
              <Send className="w-4 h-4" />
              <span>تلگرام</span>
            </button>

            <button
              onClick={shareToWhatsApp}
              className="p-3 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-medium flex items-center justify-center gap-2 transition-all"
            >
              <MessageSquare className="w-4 h-4" />
              <span>واتساپ</span>
            </button>

            <button
              onClick={shareToTwitter}
              className="p-3 rounded-xl bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/30 text-blue-300 text-xs font-medium flex items-center justify-center gap-2 transition-all"
            >
              <Twitter className="w-4 h-4" />
              <span>توییتر / X</span>
            </button>

            <button
              onClick={handleNativeShare}
              className="p-3 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-300 text-xs font-medium flex items-center justify-center gap-2 transition-all"
            >
              <Share2 className="w-4 h-4" />
              <span>{lang === 'fa' ? 'سایر برنامه‌ها' : 'Other Apps'}</span>
            </button>
          </div>
        </div>

        {/* Copy Link & Download File */}
        <div className="flex flex-col sm:flex-row gap-2.5 pt-2 border-t border-slate-800">
          <button
            onClick={handleCopyLink}
            className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center justify-center gap-2 transition-all border border-slate-700"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? (lang === 'fa' ? 'متن و لینک کپی شد!' : 'Copied!') : (lang === 'fa' ? 'کپی متن و لینک اجرا' : 'Copy Share Text & Link')}</span>
          </button>

          <a
            href={performance.audioUrl}
            download={`${performance.title}.webm`}
            className="py-2.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md"
          >
            <Download className="w-4 h-4" />
            <span>{lang === 'fa' ? 'دانلود فایل صوتی' : 'Download Audio File'}</span>
          </a>
        </div>
      </div>
    </div>
  );
}
