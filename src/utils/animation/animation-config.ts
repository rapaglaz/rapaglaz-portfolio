import { getStaggeredDelay } from './animation-delays';

export const ANIMATION_CONFIG = {
  skills: { base: 0.15, increment: 0.015 },
  certifications: { base: 0, increment: 0.075 },
  languages: { base: 0.15, increment: 0.05 },
  contact: { base: 0.15, increment: 0.075 },
} as const;

export type AnimationType = keyof typeof ANIMATION_CONFIG;

export function getAnimationDelay(type: AnimationType, index: number): string {
  const config = ANIMATION_CONFIG[type];
  return getStaggeredDelay(index, config.base, config.increment);
}

export function buildDelayGetter(type: AnimationType): (index: number) => string {
  return (index: number) => getAnimationDelay(type, index);
}
