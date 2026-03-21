"use client"

import { cn } from "@/lib/utils"

interface SirenSpinnerProps {
  className?: string
  size?: "sm" | "md" | "lg"
}

export function SirenSpinner({ className, size = "md" }: SirenSpinnerProps) {
  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-10 h-10",
    lg: "w-16 h-16",
  }

  return (
    <div
      className={cn(
        "relative flex items-center justify-center",
        sizeClasses[size],
        className
      )}
      role="status"
      aria-label="Loading"
    >
      {/* Outer rotating ring */}
      <div className="absolute inset-0 animate-siren">
        <svg viewBox="0 0 50 50" className="w-full h-full">
          <circle
            cx="25"
            cy="25"
            r="20"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeDasharray="31.4 31.4"
            className="text-emergency"
          />
        </svg>
      </div>
      
      {/* Inner pulsing siren */}
      <div className="absolute inset-2 animate-pulse-emergency">
        <svg viewBox="0 0 40 40" className="w-full h-full">
          {/* Siren base */}
          <rect
            x="12"
            y="22"
            width="16"
            height="10"
            rx="2"
            className="fill-primary"
          />
          {/* Siren dome */}
          <ellipse
            cx="20"
            cy="18"
            rx="10"
            ry="8"
            className="fill-emergency"
          />
          {/* Light rays */}
          <path
            d="M20 6 L22 10 L18 10 Z"
            className="fill-emergency"
          />
          <path
            d="M8 18 L12 16 L12 20 Z"
            className="fill-emergency"
          />
          <path
            d="M32 18 L28 16 L28 20 Z"
            className="fill-emergency"
          />
        </svg>
      </div>
      
      <span className="sr-only">Loading...</span>
    </div>
  )
}
