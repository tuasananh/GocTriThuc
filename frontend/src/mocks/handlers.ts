
import { courseHandlers } from './handlers/courses';
import { moduleHandlers } from './handlers/modules';
import { questionHandlers } from './handlers/questions';
import { fileHandlers } from './handlers/files';

/**
 * Tất cả mock handlers — import vào browser.ts
 */
export const handlers = [
  ...courseHandlers,
  ...moduleHandlers,
  ...questionHandlers,
  ...fileHandlers,
];
