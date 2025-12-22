'use client';

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
  sm: { icon: 28, text: 'text-base' },
  md: { icon: 40, text: 'text-xl' },
  lg: { icon: 56, text: 'text-2xl' },
  xl: { icon: 64, text: 'text-3xl' },
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
      'flex items-center space-x-3 group',
      className
    )}>
      <div className="relative">
        {/* Animated background glow */}
        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-cyan-500/20 dark:from-blue-400/30 dark:via-purple-400/30 dark:to-cyan-400/30 blur-xl animate-pulse opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

        {/* Main logo container */}
        <div className="relative z-10">
          <svg
            width={iconSize}
            height={iconSize}
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="drop-shadow-lg"
          >
            {/* Animated gradient definitions */}
            <defs>
              <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6">
                  <animate attributeName="stop-color" values="#3b82f6;#8b5cf6;#06b6d4;#3b82f6" dur="4s" repeatCount="indefinite"/>
                </stop>
                <stop offset="50%" stopColor="#6366f1">
                  <animate attributeName="stop-color" values="#6366f1;#a855f7;#0891b2;#6366f1" dur="4s" repeatCount="indefinite"/>
                </stop>
                <stop offset="100%" stopColor="#8b5cf6">
                  <animate attributeName="stop-color" values="#8b5cf6;#06b6d4;#3b82f6;#8b5cf6" dur="4s" repeatCount="indefinite"/>
                </stop>
              </linearGradient>

              <linearGradient id="flowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#60a5fa" stopOpacity="0">
                  <animate attributeName="stop-opacity" values="0;1;0" dur="2s" repeatCount="indefinite"/>
                </stop>
                <stop offset="50%" stopColor="#a78bfa" stopOpacity="0.8">
                  <animate attributeName="stop-opacity" values="0.8;0.3;0.8" dur="2s" repeatCount="indefinite"/>
                </stop>
                <stop offset="100%" stopColor="#34d399" stopOpacity="0">
                  <animate attributeName="stop-opacity" values="0;1;0" dur="2s" repeatCount="indefinite"/>
                </stop>
              </linearGradient>

              <filter id="glow">
                <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>

            {/* Background circle with subtle animation */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="url(#logoGradient)"
              opacity="0.1"
              className="dark:opacity-0.2"
            >
              <animate
                attributeName="r"
                values="45;47;45"
                dur="3s"
                repeatCount="indefinite"
              />
            </circle>

            {/* Flowing data streams representing workflow */}
            <g transform="translate(50, 50)">
              {/* Main task flow line */}
              <path
                d="M -25 0 Q -10 -15 0 0 T 25 0"
                stroke="url(#flowGradient)"
                strokeWidth="3"
                fill="none"
                strokeLinecap="round"
                filter="url(#glow)"
              >
                <animate
                  attributeName="d"
                  values="M -25 0 Q -10 -15 0 0 T 25 0;M -25 0 Q -10 15 0 0 T 25 0;M -25 0 Q -10 -15 0 0 T 25 0"
                  dur="3s"
                  repeatCount="indefinite"
                />
              </path>

              {/* Animated task nodes */}
              <circle cx="-25" cy="0" r="4" fill="url(#logoGradient)" filter="url(#glow)">
                <animate
                  attributeName="r"
                  values="4;6;4"
                  dur="2s"
                  repeatCount="indefinite"
                />
              </circle>

              <circle cx="0" cy="0" r="4" fill="url(#logoGradient)" filter="url(#glow)">
                <animate
                  attributeName="r"
                  values="4;6;4"
                  dur="2.5s"
                  repeatCount="indefinite"
                />
              </circle>

              <circle cx="25" cy="0" r="4" fill="url(#logoGradient)" filter="url(#glow)">
                <animate
                  attributeName="r"
                  values="4;6;4"
                  dur="3s"
                  repeatCount="indefinite"
                />
              </circle>

              {/* Flow arrows */}
              <path
                d="M 20 -3 L 25 0 L 20 3"
                fill="url(#logoGradient)"
                opacity="0.8"
              >
                <animateTransform
                  attributeName="transform"
                  type="translate"
                  values="0 0;5 0;0 0"
                  dur="2s"
                  repeatCount="indefinite"
                />
              </path>
            </g>

            {/* Subtle particle effects */}
            <circle cx="20" cy="30" r="1" fill="#60a5fa" opacity="0.6">
              <animate
                attributeName="opacity"
                values="0.6;0;0.6"
                dur="1.5s"
                repeatCount="indefinite"
              />
            </circle>

            <circle cx="80" cy="70" r="1.5" fill="#a78bfa" opacity="0.4">
              <animate
                attributeName="opacity"
                values="0.4;0.8;0.4"
                dur="2s"
                repeatCount="indefinite"
              />
            </circle>
          </svg>
        </div>
      </div>
      {showText && (
        <span
          className={cn(
            'font-bold logo-text bg-gradient-to-r from-slate-900 via-blue-800 to-purple-800 dark:from-slate-100 dark:via-blue-200 dark:to-purple-200 bg-clip-text text-transparent',
            textSize,
            textClassName
          )}
        >
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

