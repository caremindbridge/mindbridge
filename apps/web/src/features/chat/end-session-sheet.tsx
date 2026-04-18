'use client';

import { CircleCheckBig, MessageCircle, Pause } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { BottomSheet } from '@/shared/ui/bottom-sheet';

interface EndSessionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEndAndSummary: () => void;
  onPause: () => void;
}

export function EndSessionSheet({ open, onOpenChange, onEndAndSummary, onPause }: EndSessionSheetProps) {
  const t = useTranslations('chat');

  return (
    <BottomSheet open={open} onOpenChange={onOpenChange}>
      <div className="mb-5 flex flex-col items-center gap-2 text-center">
        <p className="text-xl font-bold text-[#2B2320] dark:text-[#E8E0D8]">{t('endSheetTitle')}</p>
        <p className="text-sm leading-relaxed text-[#9A8880] dark:text-[#A09A93]">{t('endSheetSubtitle')}</p>
      </div>

      <div className="mb-5 flex flex-col gap-2.5">
        <button
          onClick={onEndAndSummary}
          className="flex items-center gap-3.5 rounded-2xl border border-[#F0E4DE] bg-white p-4 text-left transition-colors active:bg-[#FFF8F0] dark:border-[#3A332E] dark:bg-[#221E1B]"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#E8F2E9] dark:bg-[#1A2E1C]">
            <CircleCheckBig className="h-5 w-5 text-[#7A9E7E]" />
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[15px] font-bold text-[#2B2320] dark:text-[#E8E0D8]">{t('endSheetEndSummary')}</span>
            <span className="text-xs leading-snug text-[#9A8880] dark:text-[#A09A93]">{t('endSheetEndSummaryDesc')}</span>
          </div>
        </button>

        <button
          onClick={onPause}
          className="flex items-center gap-3.5 rounded-2xl border border-[#F0E4DE] bg-white p-4 text-left transition-colors active:bg-[#FFF8F0] dark:border-[#3A332E] dark:bg-[#221E1B]"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#FFF8F0] dark:bg-[#2A211B]">
            <Pause className="h-5 w-5 text-[#C4856F]" />
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[15px] font-bold text-[#2B2320] dark:text-[#E8E0D8]">{t('endSheetPause')}</span>
            <span className="text-xs leading-snug text-[#9A8880] dark:text-[#A09A93]">{t('endSheetPauseDesc')}</span>
          </div>
        </button>
      </div>

      <button
        onClick={() => onOpenChange(false)}
        className="send-button-gradient flex h-[52px] w-full items-center justify-center gap-2 rounded-2xl shadow-[0_4px_12px_#C4856F30]"
      >
        <MessageCircle className="h-[18px] w-[18px] text-white" />
        <span className="text-[15px] font-bold text-white">{t('endSheetKeepTalking')}</span>
      </button>
    </BottomSheet>
  );
}
