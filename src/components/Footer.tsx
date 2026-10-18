import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-800/80 bg-slate-950 py-8 text-xs text-slate-400 mt-12" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-sm">
              ⌥
            </span>
            <span className="font-bold text-slate-200">
              سامانه تخصصی تحلیل اختیار معامله بورس تهران (OptionBaaz TSE)
            </span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <span>فرمول‌بندی بلک-شولز ۱۹۷۳</span>
            <span aria-hidden="true">·</span>
            <span>مدل‌سازی Payoff چندپوزیشنه</span>
            <span aria-hidden="true">·</span>
            <span>پوشش نمادهای TSETMC</span>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-900 text-[11px] text-slate-500 leading-relaxed text-justify">
          <strong>سلب مسئولیت ریسک معاملات ابزارهای مشتقه:</strong> معاملات قراردادهای اختیار معامله (Option) در بورس اوراق بهادار تهران و بورس کالا دارای خاصیت اهرمی بوده و ریسک‌های ناشی از نوسانات شدید بازار، زوال زمانی (Time Decay) و عدم نقدشوندگی را به همراه دارد. محاسبات ارزش منصفانه و یونانی‌های ارائه‌شده در این پلتفرم بر اساس فرضیات مدل استاندارد بلک-شولز انجام شده و تنها جنبه تحلیلی و آموزشی دارد؛ بنابراین تضمینی برای سودآوری نبوده و نباید به عنوان توصیه مستقیم خرید یا فروش تلقی گردد.
        </div>

        <div className="text-center text-slate-600 text-[10px] pt-2">
          طراحی‌شده برای تحلیل‌گران و معامله‌گران مشتقات مالی ایران © {new Date().getFullYear()}
        </div>
      </div>
    </footer>
  );
};
