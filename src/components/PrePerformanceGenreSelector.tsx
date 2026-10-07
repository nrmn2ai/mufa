import { MusicalStyleId } from '../types/music';
import { MUSICAL_STYLES } from '../data/styles';
import { Sparkles, Music2, Radio, Check } from 'lucide-react';

interface PrePerformanceGenreSelectorProps {
  selectedStyle: MusicalStyleId;
  onSelectStyle: (styleId: MusicalStyleId) => void;
  lang: 'fa' | 'en';
}

export function PrePerformanceGenreSelector({
  selectedStyle,
  onSelectStyle,
  lang,
}: PrePerformanceGenreSelectorProps) {
  const stylesList = Object.values(MUSICAL_STYLES);

  return (
    <div className="w-full rounded-2xl border border-slate-800 bg-slate-900/40 p-4 sm:p-5 backdrop-blur-md shadow-lg flex flex-col gap-3.5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
            <Radio className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm sm:text-base text-slate-100 flex items-center gap-2">
              <span>{lang === 'fa' ? 'انتخاب سبک و ژنـر اولیه پیش از شروع آواز' : 'Pre-Select Starting Genre'}</span>
              <span className="text-[11px] font-normal text-slate-400 hidden sm:inline">
                {lang === 'fa' ? '(شروع آنی در کمتر از ۳ ثانیه)' : '(< 3s instant adaptive generation)'}
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {lang === 'fa'
                ? 'سبک دلخواه خود را تعیین کنید تا بلافاصله با نخستین آوای شما، مناسب‌ترین ملودی و سازبندی نواخته شود:'
                : 'Select your preferred genre before singing for a perfectly tailored initial melody:'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-auto text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{lang === 'fa' ? 'تطبیق بلادرنگ سازها' : 'Adaptive Synthesis'}</span>
        </div>
      </div>

      {/* Genre Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {stylesList.map((style) => {
          const isSelected = selectedStyle === style.id;
          return (
            <button
              key={style.id}
              onClick={() => onSelectStyle(style.id)}
              className={`relative flex flex-col p-3 rounded-xl border text-right transition-all group cursor-pointer ${
                isSelected
                  ? 'bg-slate-800/90 shadow-xl ring-2'
                  : 'bg-slate-950/60 hover:bg-slate-800/40 border-slate-800/90'
              }`}
              style={{
                borderColor: isSelected ? style.color : '#334155',
                boxShadow: isSelected ? `0 0 16px ${style.color}30` : 'none',
              }}
            >
              {isSelected && (
                <div
                  className="absolute top-2 left-2 w-4 h-4 rounded-full flex items-center justify-center text-slate-950"
                  style={{ backgroundColor: style.color }}
                >
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </div>
              )}

              <div className="flex items-center gap-2 mb-2">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: style.color }}
                />
                <span className="font-mono text-[10px] text-slate-400">
                  {style.bpmDefault} BPM
                </span>
              </div>

              <div className="font-bold text-xs text-slate-100 group-hover:text-white line-clamp-1 mb-1">
                {lang === 'fa' ? style.nameFa : style.nameEn}
              </div>

              <div className="text-[10px] text-slate-400 line-clamp-1 mb-1.5">
                {style.instrumentLead}
              </div>

              <div className="mt-auto flex items-center gap-1 text-[10px] text-slate-500">
                <Music2 className="w-2.5 h-2.5" />
                <span className="truncate">{style.instrumentRhythm}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
