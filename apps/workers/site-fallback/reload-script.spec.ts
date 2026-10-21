import { describe, expect, it, vi } from 'vitest';
import { RELOAD_SCRIPT } from './reload-script';

const ADDRESS = 'https://rapaglaz.de/en';

// Runs the script of the page against stand-ins for the browser objects it uses
function runScript(answer: Response | Error) {
  const reload = vi.fn();
  const listeners = new Map<string, () => void>();
  const timers: { callback: () => void; delay: number }[] = [];
  const page = {
    hidden: false,
    addEventListener: (type: string, callback: () => void) => listeners.set(type, callback),
  };
  const request = vi.fn((_url: string, _init: RequestInit) =>
    answer instanceof Error ? Promise.reject(answer) : Promise.resolve(answer),
  );

  new Function('document', 'location', 'fetch', 'setInterval', RELOAD_SCRIPT)(
    page,
    { href: ADDRESS, reload },
    request,
    (callback: () => void, delay: number) => timers.push({ callback, delay }),
  );

  return {
    reload,
    request,
    page,
    timers,
    showTab: () => listeners.get('visibilitychange')?.(),
    // lets the promise chain of the script finish
    settle: () => new Promise(resolve => setTimeout(resolve)),
  };
}

describe('reload script of the offline page', () => {
  it('asks the same address with HEAD and without cache once a minute', () => {
    const run = runScript(new Response('', { status: 503 }));

    expect(run.timers).toHaveLength(1);
    expect(run.timers[0].delay).toBe(60_000);

    run.timers[0].callback();

    expect(run.request).toHaveBeenCalledWith(ADDRESS, { method: 'HEAD', cache: 'no-store' });
  });

  for (const status of [200, 301, 404]) {
    it(`reloads the page when the answer is ${status}, so no longer a server error`, async () => {
      const run = runScript(new Response('', { status }));

      run.timers[0].callback();
      await run.settle();

      expect(run.reload).toHaveBeenCalledTimes(1);
    });
  }

  for (const status of [500, 503, 521]) {
    it(`keeps the page while the answer is ${status}`, async () => {
      const run = runScript(new Response('', { status }));

      run.timers[0].callback();
      await run.settle();

      expect(run.reload).not.toHaveBeenCalled();
    });
  }

  it('keeps the page when the request itself fails', async () => {
    const run = runScript(new TypeError('network error'));

    run.timers[0].callback();
    await run.settle();

    expect(run.reload).not.toHaveBeenCalled();
  });

  it('does not ask while the tab is hidden, and asks as soon as it is visible again', async () => {
    const run = runScript(new Response('', { status: 200 }));
    run.page.hidden = true;

    run.timers[0].callback();
    expect(run.request).not.toHaveBeenCalled();

    run.page.hidden = false;
    run.showTab();
    await run.settle();

    expect(run.request).toHaveBeenCalledTimes(1);
    expect(run.reload).toHaveBeenCalledTimes(1);
  });
});
