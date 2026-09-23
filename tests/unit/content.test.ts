import { describe, expect, it } from 'vitest';
import { site } from '../../src/content/site';

const allText = JSON.stringify(site);
const BANNED = [
  'revolutioniz',
  'seamless',
  'unlock',
  'empower',
  'cutting-edge',
  'leverage',
  'synergy',
  'game-chang',
  'next-gen',
  'world-class',
];

describe('site content', () => {
  it('has no em or en dashes', () => {
    expect(allText).not.toMatch(/[–—]/);
  });
  it('avoids generic marketing words', () => {
    for (const w of BANNED) expect(allText.toLowerCase()).not.toContain(w);
  });
  it('states the verified entity facts', () => {
    expect(site.entity).toEqual({
      legalName: 'Project Win LLC',
      state: 'Colorado',
      kind: 'limited liability company',
      id: '20251401400',
      formed: '2025-04-04',
      agentAddress: '1500 N Grant St Ste R, Denver, CO 80203',
    });
  });
  it('names DreamCatcher as the only product, with the live store links', () => {
    expect(site.product.name).toBe('DreamCatcher');
    expect(site.product.links.appStore).toBe(
      'https://apps.apple.com/us/app/dreamcatcher-ai-journal/id6762375451',
    );
    expect(site.product.links.play).toBe(
      'https://play.google.com/store/apps/details?id=ai.thedreamcatcher.app',
    );
  });
  it('uses the App Store listing line verbatim', () => {
    expect(site.product.line).toBe(
      'DreamCatcher helps you remember, revisit, and understand your dreams before they fade.',
    );
  });
  it('has exactly five values, each titled from the manifesto', () => {
    expect(site.values.map((v) => v.title)).toEqual([
      'Be in the lab',
      'Solve our own problems, sell the solution',
      'Business as art',
      'Controlled abandon',
      'Simplicity and elegance',
    ]);
  });
  it('only uses characters present in the subset display font', () => {
    // Mirrors the --unicodes list in scripts/subset-font.sh.
    const extra = [0xa0, 0xb7, 0xe9, 0x2018, 0x2019, 0x201c, 0x201d, 0x2026, 0x2192];
    const missing = [...allText].filter((ch) => {
      const c = ch.codePointAt(0)!;
      return !((c >= 0x20 && c <= 0x7e) || extra.includes(c));
    });
    expect(missing).toEqual([]);
  });
  it('founders are Ian Cross and Abb Kapoor (full names, confirmed by Ian 2026-09-23)', () => {
    expect(site.founders).toEqual(['Ian Cross', 'Abb Kapoor']);
  });
  it('makes no location claim beyond the Colorado LLC', () => {
    expect(site.hero.line).not.toMatch(/Denver|Maryland/);
    expect(site.meta.title + site.meta.description).not.toMatch(/Denver|Maryland/);
  });
  it('contact address is one that receives mail (no forwarding on projectwin.cloud)', () => {
    expect(site.contactEmail).toBe('projectwinteam@gmail.com');
  });
});
