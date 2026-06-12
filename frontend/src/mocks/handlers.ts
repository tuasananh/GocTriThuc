import { courseHandlers } from './handlers/courses';
import { moduleHandlers } from './handlers/modules';
import { questionHandlers } from './handlers/questions';
import { fileHandlers } from './handlers/files';
import { authHandlers } from './handlers/auth';
import { testsHandlers } from './handlers/tests';
import { adminHandlers } from './handlers/admin';

/**
 * Tất cả mock handlers — import vào browser.ts
 */
export const handlers = [
  ...authHandlers,
  ...courseHandlers,
  ...moduleHandlers,
  ...testsHandlers,
  ...questionHandlers,
  ...fileHandlers,
  ...adminHandlers,
];
