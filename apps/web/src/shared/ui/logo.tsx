import { cn } from '@/shared/lib/utils';

interface LogoProps {
  size?: 'small' | 'default' | 'large';
}

const sizes = {
  small: { icon: 'text-base', text: 'text-sm font-semibold', badge: 'text-[8px] px-1 py-px' },
  default: { icon: 'text-lg', text: 'text-base font-semibold', badge: 'text-[10px] px-1.5 py-0.5' },
  large: { icon: 'text-2xl', text: 'text-xl font-semibold', badge: 'text-[10px] px-1.5 py-0.5' },
};

export function Logo({ size = 'default' }: LogoProps) {
  const s = sizes[size];
  return (
    <div className="flex items-center gap-2">
      <span className={s.icon}>🌿</span>
      <span className={cn('tracking-tight', s.text)}>MindBridge</span>
      <span
        className={cn(
          'font-medium uppercase tracking-wider rounded-full leading-none',
          'bg-primary/10 text-primary border border-primary/20',
          s.badge,
        )}
      >
        Beta
      </span>
    </div>
  );
}
