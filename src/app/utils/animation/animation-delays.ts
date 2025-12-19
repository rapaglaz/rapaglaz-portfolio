// calculates staggered delays for list animations, keeps items sequential
export function getStaggeredDelay(index: number, baseDelay = 0.15, increment = 0.015): string {
  const delay = Math.round((baseDelay + index * increment) * 100) / 100;
  return `${delay}s`;
}
