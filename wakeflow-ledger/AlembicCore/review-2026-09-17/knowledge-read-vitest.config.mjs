import { fileURLToPath } from 'node:url';
export default { test: { include: [fileURLToPath(new URL('./knowledge-read-probes.test.ts', import.meta.url))], testTimeout: 30000, fileParallelism: false, globals: false } };
