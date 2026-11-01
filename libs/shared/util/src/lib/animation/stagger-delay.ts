type StaggerDelay = {
  readonly base: number;
  readonly increment: number;
};

export function buildStaggerDelay({ base, increment }: StaggerDelay): (index: number) => string {
  return (index: number) => `${Math.round((base + index * increment) * 100) / 100}s`;
}
