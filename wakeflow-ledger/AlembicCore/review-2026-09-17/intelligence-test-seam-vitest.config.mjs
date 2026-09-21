import { fileURLToPath } from 'node:url';
export default { test: { include: [fileURLToPath(new URL('./intelligence-test-seam-probes.test.ts', import.meta.url))], fileParallelism: false, globals: false } };
