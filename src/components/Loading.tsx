import type React from 'react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2 } from 'lucide-react';

interface LoadingProps {
  size?: 'small' | 'normal';
  text?: string;
  fullPage?: boolean;
}

export const Loading: React.FC<LoadingProps> = ({
  size = 'normal',
  text,
  fullPage = false,
}) => {
  const content = (
    <div className="flex flex-col items-center justify-center gap-3">
      <Loader2
        className={cn(
          'animate-spin text-primary',
          size === 'small' ? 'h-5 w-5' : 'h-8 w-8'
        )}
      />
      {text && <p className="text-sm text-muted-foreground">{text}</p>}
    </div>
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50">
        {content}
      </div>
    );
  }

  return content;
};

export const SkeletonCard: React.FC = () => {
  return (
    <div className="rounded-lg border bg-card p-4 space-y-4">
      <Skeleton className="h-40 w-full rounded-md" />
      <Skeleton className="h-5 w-3/4" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/6" />
      </div>
    </div>
  );
};

export default Loading;
