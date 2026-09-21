import { expect, it, vi } from '../../../AlembicCore/node_modules/vitest/dist/index.js';
import { SearchEngine } from '../../../AlembicCore/src/service/search/SearchEngine.ts';

it('verifies that the existing keyword expiry key is live before TTL and expires after TTL', async () => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(1_800_000_000_000);
  try {
    const db = { prepare: () => ({ all: () => [], run: () => {}, get: () => undefined }) };
    const engine = new SearchEngine(db as never, { cacheMaxAge: 1000 });
    const response = await engine.search('test', { mode: 'keyword' });
    const actualKey = [...engine._cache.keys()][0];
    const oldTestKey = 'test:all:20:keyword:::nofilters';
    expect(actualKey).toBe(oldTestKey);
    expect(engine._getCache(actualKey)).toBe(response);
    // 更正：keyword默认不rank，因此旧key确实命中；原key失配怀疑被实测否定。
    expect(engine._getCache(oldTestKey)).toBe(response);
    vi.setSystemTime(1_800_000_001_001);
    expect(engine._getCache(oldTestKey)).toBeNull();
  } finally { vi.useRealTimers(); }
});
