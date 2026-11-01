import type { Locator } from '@playwright/test';

// scroll-driven animations never finish, and the scroll cue pulse repeats for seconds
export async function waitForEntranceAnimations(target: Locator): Promise<void> {
  await target.evaluate(element =>
    Promise.all(
      element
        .getAnimations({ subtree: true })
        .filter(
          animation =>
            animation.timeline === document.timeline &&
            animation.effect?.getComputedTiming().iterations === 1,
        )
        .map(animation => animation.finished),
    ),
  );
}
