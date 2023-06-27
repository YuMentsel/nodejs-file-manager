import { createReadStream, createWriteStream } from 'node:fs';
import { createBrotliCompress, createBrotliDecompress } from 'node:zlib';
import { access } from 'node:fs/promises';
import { pipeline } from 'node:stream/promises';

export const brodli = async (pathToSrc, pathToDest, type = 'compress') => {
  await access(pathToSrc);
  const brotli = type === 'compress' ? createBrotliCompress() : createBrotliDecompress();
  await pipeline(createReadStream(pathToSrc), brotli, createWriteStream(pathToDest));
};
