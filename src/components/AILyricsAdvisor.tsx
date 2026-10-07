import { useState } from 'react';
import { Sparkles, RefreshCw, Copy, Check, Feather, Lightbulb } from 'lucide-react';
import { MusicalStyleId, ScaleType } from '../types/music';
import { MUSICAL_STYLES } from '../data/styles';

interface AILyricsAdvisorProps {
  currentStyle: MusicalStyleId;
  scale: ScaleType;
  rootKey: string;
  lang: 'fa' | 'en';
}

interface LyricsData {
  lyrics: string[];
  poeticMeter: string;
  vocalTip: string;
  recommendedEmotion: string;
}

const DEFAULT_LYRICS: Record<MusicalStyleId, LyricsData> = {
  traditional_persian: {
    lyrics: [
      'به جهان خرم از آنم که جهان خرم ازوست',
      'عاشقم بر همه عالم که همه عالم ازوست',
      'غم و شادی برِ عارف چه تفاوت دارد',
      'ساقیا باده بده کین همه مایه ازوست'
    ],
    poeticMeter: 'مفاعیلن مفاعیلن فعولن (بحر هزج)',
    vocalTip: 'روی نت پایه شور (شاهد) تکیه کنید و در فرودها تحریر ملایم بزنید.',
    recommendedEmotion: 'عارفانه، عمیق و اصیل'
  },
  acoustic_ballad: {
    lyrics: [
      'در سکوت شب و باران، صدایت مانده در یادم',
      'به دنبال تو می‌گردم، در این رویای بی‌فرجام',
      'اگرچه دور رفتی تو، هنوزم با تو می‌خوانم',
      'که دل بی تو نمی‌گیرد، در این دنیای بی‌آرام'
    ],
    poeticMeter: 'ترانه احساسی و ملایم',
    vocalTip: 'آغاز کلمات را با صدای ملایم سینه و کشش‌های نرم ادا کنید.',
    recommendedEmotion: 'نوستالژیک و عاشقانه'
  },
  pop_upbeat: {
    lyrics: [
      'بیا پرواز کنیم تا اوج رویاها همین امشب',
      'نذار تاریک بمونه کوچه دلتنگی و غم‌ها',
      'صدای ساز ما جاری شده در نبض این دنیا',
      'بخند و همصدا با من برقص تا مرز فرداها'
    ],
    poeticMeter: 'ریتمیک ۴/۴ شاد',
    vocalTip: 'حروف آخر را کوتاه و ضربه‌دار (استکاتو) برای حس انرژی بیشتر ادا کنید.',
    recommendedEmotion: 'پرشور، باانرژی و رها'
  },
  lofi_jazz: {
    lyrics: [
      'قهوه سرد و شب آرام و نور ملایم ماه',
      'ملودی زمزمه می‌شود در دل یک نگاه',
      'بدون عجله در امتداد این خیابان خیس',
      'قدم بزن با من در ترنم این نوای لوفای'
    ],
    poeticMeter: 'شعر آزاد ملودیک با سوئینگ جاز',
    vocalTip: 'از ویبراتوی آرام انتهای مصراع‌ها و نت‌های آبی (Blue notes) بهره ببرید.',
    recommendedEmotion: 'آرامش‌بخش، مخملی و تامل‌برانگیز'
  },
  epic_rock: {
    lyrics: [
      'از میان شعله‌ها فریاد خواهم زد به نام عشق',
      'طوفان نمی‌تواند سد راه این خروش آید',
      'ما ایستاده‌ایم در اوج کوهستان این شب‌ها',
      'تا روشنایی از پس تاریکی‌ها برآید'
    ],
    poeticMeter: 'حماسی و دراماتیک راک',
    vocalTip: 'از رزونانس سر و دیافراگم قوی برای نت‌های اوج استفاده کنید.',
    recommendedEmotion: 'قدرتمند، طوفانی و استوار'
  },
  ambient_mystic: {
    lyrics: [
      'در بی‌کران کهکشان، نغمه‌ای شناور است',
      'سکوتِ مطلق فضا، از نور پرتو می‌زند',
      'نفس بکش در عطر نور، رها شو از زمین و خاک',
      'که این سفر به بیکران، نوای جاودانگی‌ست'
    ],
    poeticMeter: 'آزاد و مراقبه‌ای',
    vocalTip: 'کشش واکه‌ها (آ، او، ای) را طولانی و با طنین عمیق ریورب همراه کنید.',
    recommendedEmotion: 'کهکشانی، روحانی و رها'
  }
};

export function AILyricsAdvisor({
  currentStyle,
  scale,
  rootKey,
  lang,
}: AILyricsAdvisorProps) {
  const [lyricsData, setLyricsData] = useState<LyricsData>(DEFAULT_LYRICS[currentStyle] || DEFAULT_LYRICS.traditional_persian);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const styleMeta = MUSICAL_STYLES[currentStyle] || MUSICAL_STYLES.traditional_persian;

  const handleGenerateCustomLyrics = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/ai-lyrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          styleId: currentStyle,
          styleName: lang === 'fa' ? styleMeta.nameFa : styleMeta.nameEn,
          scale,
          rootKey,
          vocalMood: styleMeta.descriptionFa,
          lang,
        }),
      });

      const json = await res.json();
      if (json?.data?.lyrics) {
        setLyricsData(json.data);
      }
    } catch (err) {
      console.warn('API lyrics call failed, falling back to curated verse:', err);
      setLyricsData(DEFAULT_LYRICS[currentStyle] || DEFAULT_LYRICS.traditional_persian);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    const text = lyricsData.lyrics.join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full rounded-2xl border border-slate-800 bg-slate-900/50 p-5 backdrop-blur-md shadow-xl flex flex-col gap-4 text-right">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
            <Feather className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-slate-100 flex items-center gap-2">
              <span>{lang === 'fa' ? 'پیشنهاد شعر و نکته بداهه‌خوانی با هوش مصنوعی' : 'AI Lyric & Improvisation Maestro'}</span>
              <span className="text-[10px] font-mono text-amber-400 bg-amber-950/60 border border-amber-800/60 px-1.5 py-0.5 rounded">
                Gemini
              </span>
            </h4>
            <p className="text-xs text-slate-400">
              {lang === 'fa'
                ? 'اشعار و ابیات موزون هماهنگ با سبک فعال برای همراهی با آواز:'
                : 'Poetic verses and improvisation guidance tailored to your active style:'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleCopy}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1 transition-colors"
            title={lang === 'fa' ? 'کپی شعر' : 'Copy'}
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? (lang === 'fa' ? 'کپی شد' : 'Copied') : (lang === 'fa' ? 'کپی' : 'Copy')}</span>
          </button>

          <button
            onClick={handleGenerateCustomLyrics}
            disabled={isLoading}
            className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{lang === 'fa' ? 'سرودن شعر جدید' : 'Compose New Verses'}</span>
          </button>
        </div>
      </div>

      {/* Lyrics Box */}
      <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-slate-900">
          <span>{lang === 'fa' ? 'وزن / سبک شعر:' : 'Poetic Meter:'} <span className="text-slate-300 font-medium">{lyricsData.poeticMeter}</span></span>
          <span>{lang === 'fa' ? 'حس عاطفی:' : 'Mood:'} <span className="text-amber-400 font-medium">{lyricsData.recommendedEmotion}</span></span>
        </div>

        <div className="py-2 flex flex-col gap-1.5 text-center sm:text-right">
          {lyricsData.lyrics.map((line, idx) => (
            <p key={idx} className="text-sm sm:text-base font-semibold text-slate-200 leading-relaxed tracking-wide">
              {line}
            </p>
          ))}
        </div>

        {/* Practical Vocal Tip */}
        <div className="mt-2 pt-2 border-t border-slate-900 flex items-start gap-2 text-xs">
          <Lightbulb className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-cyan-300">{lang === 'fa' ? 'نکته خوانندگی: ' : 'Vocal Tip: '}</span>
            <span className="text-slate-400">{lyricsData.vocalTip}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
