import { fileURLToPath } from 'node:url';
export default { test: { include: [fileURLToPath(new URL('./guard-review-probes.test.ts', import.meta.url))], fileParallelism: false, globals: false } };
