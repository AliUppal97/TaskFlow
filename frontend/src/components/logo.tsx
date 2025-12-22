'use client';

import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface LogoProps {
  /**
   * Size of the logo icon
   * @default "md"
   */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  
  /**
   * Whether to show the text label
   * @default true
   */
  showText?: boolean;
  
  /**
   * Whether the logo should be clickable (links to home)
   * @default true
   */
  clickable?: boolean;
  
  /**
   * Custom className for the container
   */
  className?: string;
  
  /**
   * Custom className for the text
   */
  textClassName?: string;
}

const sizeMap = {
  sm: { icon: 20, text: 'text-base' },
  md: { icon: 32, text: 'text-xl' },
  lg: { icon: 40, text: 'text-2xl' },
  xl: { icon: 48, text: 'text-3xl' },
};

export function Logo({ 
  size = 'md', 
  showText = true, 
  clickable = true,
  className,
  textClassName 
}: LogoProps) {
  const { icon: iconSize, text: textSize } = sizeMap[size];
  
  const logoContent = (
    <div className={cn(
      'flex items-center space-x-2 group',
      className
    )}>
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-lg blur opacity-50 group-hover:opacity-70 transition-opacity" />
        <div className="relative z-10">
          <Image
            src="/logo-icon.svg"
            alt="TaskFlow Logo"
            width={iconSize}
            height={iconSize}
            className="drop-shadow-md"
            priority
          />
        </div>
      </div>
      {showText && (
        <span className={cn(
          'font-bold bg-gradient-to-r from-slate-900 via-indigo-800 to-purple-800 dark:from-slate-100 dark:via-indigo-200 dark:to-purple-200 bg-clip-text text-transparent',
          textSize,
          textClassName
        )}>
          TaskFlow
        </span>
      )}
    </div>
  );

  if (!clickable) {
    return logoContent;
  }

  return (
    <Link href="/" className="inline-block">
      {logoContent}
    </Link>
  );
}

