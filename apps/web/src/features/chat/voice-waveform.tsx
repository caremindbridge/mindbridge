'use client';

interface VoiceWaveformProps {
  levels: number[];
}

export function VoiceWaveform({ levels }: VoiceWaveformProps) {
  return (
    <div className="flex flex-1 items-center justify-center gap-[2px]" aria-hidden="true">
      {levels.map((v, i) => (
        <div
          key={i}
          className="w-[3px] rounded-full bg-[#C4856F] transition-[height] duration-75 dark:bg-[#D4A89A]"
          style={{ height: `${Math.max(4, v * 28)}px` }}
        />
      ))}
      {/* Placeholder bars while analyser warms up */}
      {levels.length === 0 &&
        Array.from({ length: 32 }, (_, i) => (
          <div key={i} className="h-1 w-[3px] rounded-full bg-[#C4856F]/40 dark:bg-[#D4A89A]/40" />
        ))}
    </div>
  );
}
