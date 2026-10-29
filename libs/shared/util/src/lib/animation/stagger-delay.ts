type StaggerDelay = {
  // seconds before the first item
  readonly base: number;
  // seconds added for each following item
  readonly increment: number;
};

// staggered CSS delays for list animations, keeps items sequential
export function buildStaggerDelay({ base, increment }: StaggerDelay): (index: number) => string {
  return (index: number) => `${Math.round((base + index * increment) * 100) / 100}s`;
}
