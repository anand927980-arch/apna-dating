"use client";

import { useState } from 'react';
import Image from 'next/image';
import { Flame } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
}

export function Logo({ className, size = 40, showText = false }: LogoProps) {
  const [error, setError] = useState(false);

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div 
        className="relative flex items-center justify-center rounded-xl overflow-hidden bg-white shadow-sm"
        style={{ width: size, height: size }}
      >
        {!error ? (
          <Image
            src="/logo.png"
            alt="Apna Partner"
            fill
            className="object-contain p-1"
            onError={() => setError(true)}
            priority
          />
        ) : (
          <div className="w-full h-full tinder-gradient flex items-center justify-center text-white">
            <Flame size={size * 0.6} className="fill-current" />
          </div>
        )}
      </div>
      {showText && (
        <span className="font-headline font-bold text-primary tracking-tight" style={{ fontSize: size * 0.5 }}>
          Apna Partner
        </span>
      )}
    </div>
  );
}
