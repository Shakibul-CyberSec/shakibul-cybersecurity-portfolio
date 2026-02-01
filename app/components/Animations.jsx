'use client';

import { useEffect, useRef, useState, Children, cloneElement } from 'react';

/**
 * Professional Animation System - V3
 * - Full component animations (not text-by-text)
 * - More visible and impactful
 * - Once-only on scroll
 * - Smooth, professional timing
 */

// ===== CORE ANIMATE COMPONENT =====
export function Animate({
  children,
  animation = 'fadeInUp',
  delay = 0,
  duration = 1.0,
  threshold = 0.15,
  once = true,
  className = '',
  disabled = false,
  ...props
}) {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  
  useEffect(() => {
    if (disabled) {
      setIsVisible(true);
      return;
    }

    const element = ref.current;
    if (!element) return;
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          requestAnimationFrame(() => {
            setIsVisible(true);
            setHasAnimated(true);
          });
          if (once) observer.disconnect();
        }
      },
      { 
        threshold,
        rootMargin: '0px 0px -80px 0px'
      }
    );
    
    observer.observe(element);
    
    return () => observer.disconnect();
  }, [threshold, once, disabled, hasAnimated]);
  
  if (disabled) {
    return (
      <div ref={ref} className={className} {...props}>
        {children}
      </div>
    );
  }

  const delayMs = Math.round(delay * 1000);
  const delayClass = getDelayClass(delayMs);
  const animationClass = isVisible ? `animate-${animation} ${delayClass}` : 'animate-waiting';
  
  return (
    <div
      ref={ref}
      className={`${animationClass} ${className}`.trim()}
      {...props}
    >
      {children}
    </div>
  );
}

// ===== STAGGER COMPONENT =====
export function Stagger({
  children,
  stagger = 0.15,
  animation = 'fadeInUp',
  className = '',
  disabled = false,
  ...props
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef(null);
  
  useEffect(() => {
    if (disabled) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          requestAnimationFrame(() => {
            setIsVisible(true);
            setHasAnimated(true);
          });
          observer.disconnect();
        }
      },
      { 
        threshold: 0.1,
        rootMargin: '0px 0px -60px 0px'
      }
    );
    
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [disabled, hasAnimated]);
  
  if (disabled) {
    return (
      <div ref={ref} className={className} {...props}>
        {children}
      </div>
    );
  }

  const processedChildren = Children.map(children, (child, index) => {
    if (!child) return null;
    
    const delayClass = getStaggerClass(index + 1);
    const childClassName = `
      ${child.props?.className || ''} 
      ${isVisible ? `animate-${animation} ${delayClass}` : 'animate-waiting'}
    `.trim();
    
    return cloneElement(child, {
      className: childClassName,
    });
  });

  return (
    <div ref={ref} className={className} {...props}>
      {processedChildren}
    </div>
  );
}

// ===== PROGRESS BAR COMPONENT =====
export function ProgressBar({ 
  percentage, 
  label, 
  className = '', 
  ...props 
}) {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          requestAnimationFrame(() => {
            setIsVisible(true);
            setHasAnimated(true);
          });
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [hasAnimated]);
  
  const widthClass = getWidthClass(percentage);
  
  return (
    <div ref={ref} className={`space-y-2 ${className}`} {...props}>
      <div className="flex justify-between items-center">
        <span className="text-white font-medium">{label}</span>
        <span className="text-neon-green font-mono text-sm">{percentage}%</span>
      </div>

      <div className="h-2 bg-cyber-border/30 rounded-full overflow-hidden">
        <div
          className={`h-full bg-gradient-to-r from-neon-green to-neon-cyan rounded-full transition-all duration-1200 ease-out ${
            isVisible ? widthClass : 'w-0'
          }`}
        />
      </div>
    </div>
  );
}

// ===== HOVER EFFECT WRAPPER =====
export function HoverEffect({
  children,
  effect = 'lift',
  className = '',
  ...props
}) {
  const effectClass = {
    lift: 'hover-lift',
    scale: 'hover-scale',
    glow: 'hover-glow',
    glowSubtle: 'hover-glow-subtle',
  }[effect] || 'hover-lift';
  
  return (
    <div className={`${effectClass} ${className}`} {...props}>
      {children}
    </div>
  );
}

// ===== UTILITY FUNCTIONS =====
function getDelayClass(delayMs) {
  const delays = [0, 50, 100, 150, 200, 250, 300, 350, 400, 450, 500, 600, 700, 800, 900, 1000];
  const closest = delays.reduce((prev, curr) => 
    Math.abs(curr - delayMs) < Math.abs(prev - delayMs) ? curr : prev
  );
  return `animation-delay-${closest}`;
}

function getStaggerClass(index) {
  if (index <= 10) return `animate-stagger-${index}`;
  return 'animate-stagger-10';
}

function getWidthClass(percentage) {
  if (percentage >= 95) return 'w-[95%]';
  if (percentage >= 90) return 'w-[90%]';
  if (percentage >= 85) return 'w-[85%]';
  if (percentage >= 80) return 'w-[80%]';
  if (percentage >= 75) return 'w-[75%]';
  if (percentage >= 70) return 'w-[70%]';
  if (percentage >= 65) return 'w-[65%]';
  return 'w-full';
}