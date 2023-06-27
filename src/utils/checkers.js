import { stat } from 'node:fs/promises';

export async function isExisting(path, type = 'dir') {
  try {
    const pathStats = await stat(path);
    return type === 'dir' ? pathStats.isDirectory() : pathStats.isFile();
  } catch {
    return false;
  }
}
