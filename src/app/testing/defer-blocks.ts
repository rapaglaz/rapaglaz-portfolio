import { ComponentFixture, DeferBlockState } from '@angular/core/testing';

// Renders the @defer blocks of the fixture, so specs can assert on the deferred portfolio
// sections without waiting for their triggers. The portfolio has no nested @defer blocks.
export async function renderDeferBlocks(fixture: ComponentFixture<unknown>): Promise<void> {
  for (const block of await fixture.getDeferBlocks()) {
    await block.render(DeferBlockState.Complete);
  }
}
