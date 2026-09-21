// Node 22 --experimental-strip-types；仅进程内缓存，不启动 HTTP 服务。
import assert from 'node:assert/strict';
import { cacheService, initCacheAdapter, getCacheAdapter } from '../../../Alembic/lib/infrastructure/cache/UnifiedCacheAdapter.ts';
try {
  assert.equal(cacheService.cleanupInterval, null);
  const adapter = await initCacheAdapter();
  assert.strictEqual(getCacheAdapter(), adapter);
  assert.strictEqual(adapter.memoryService, cacheService);
  assert.equal(cacheService.cleanupInterval, null);
  await adapter.set('consumer-probe', false, 1);
  assert.equal(await adapter.get('consumer-probe'), false);
  assert.equal(cacheService.cleanupInterval.hasRef(), false);
  await adapter.clear();
  assert.equal(cacheService.cleanupInterval, null);
  console.log(JSON.stringify({status:'PASS',scope:'Main cache shim -> Core package',sharedInstance:true,idleTimer:false,activeTimerUnref:true,value:false}));
} finally {
  cacheService.shutdown();
}
