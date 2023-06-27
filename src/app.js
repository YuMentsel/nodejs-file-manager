import { createInterface } from 'node:readline';
import { createReadStream, createWriteStream } from 'node:fs';
import {
  readdir,
  readFile,
  writeFile,
  access,
  rename,
  mkdir,
  rm as remove,
} from 'node:fs/promises';
import { pipeline } from 'node:stream/promises';
import { resolve, dirname, basename, extname } from 'node:path';
import { createHash } from 'node:crypto';
import { currentDirectory, invalidInput, operationError } from './utils/messages.js';
import { isExisting } from './utils/checkers.js';
import { osSwitcher } from './utils/osSwitcher.js';
import { brodli } from './utils/brodli.js';
const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: '> ',
});

export class App {
  constructor(dir) {
    this.currentDir = dir;
    // this.username = username;
  }

  // Navigation & working directory (nwd)

  up() {
    this.currentDir = dirname(this.currentDir);
  }

  async cd(args) {
    const pathToDir = resolve(this.currentDir, ...args);
    console.log(pathToDir);
    (await isExisting(pathToDir)) ? (this.currentDir = pathToDir) : invalidInput();
  }

  async ls() {
    const list = await readdir(this.currentDir, { withFileTypes: true });
    const sortedList = list
      .filter((item) => !item.isSymbolicLink())
      .sort((a, b) => a.isFile() - b.isFile())
      .map((el) => ({
        name: el.name,
        type: el.isDirectory() ? 'directory' : 'file',
      }));
    console.table(sortedList);
  }

  // Basic operations with files

  async cat([arg]) {
    const pathToFile = resolve(this.currentDir, arg);
    await access(pathToFile);
    // await isExisting(pathToFile, 'file');
    const readableStream = createReadStream(pathToFile);
    await new Promise((res, rej) => {
      let data = '';
      readableStream.on('data', (chunk) => (data += chunk));
      readableStream.on('end', () => {
        console.log(data);
        res();
      });
      readableStream.on('error', () => {
        operationError();
        rej();
      });
    });
  }

  async add([arg]) {
    const newFileName = resolve(this.currentDir, arg);
    await writeFile(newFileName, '', { flag: 'wx' });
  }

  async rn([file, newFile]) {
    const pathToFile = resolve(this.currentDir, file);
    const pathToNewFile = resolve(this.currentDir, newFile);
    await rename(pathToFile, pathToNewFile);
  }

  async cp([file, newDir]) {
    const pathToOldFile = resolve(this.currentDir, file);
    const pathToNewDir = resolve(this.currentDir, newDir);
    if (!(await isExisting(pathToNewDir))) await mkdir(pathToNewDir);
    const pathToNewFile = resolve(pathToNewDir, basename(pathToOldFile));

    await access(pathToOldFile);

    const read = createReadStream(pathToOldFile);
    const write = createWriteStream(pathToNewFile);
    await pipeline(read, write);
  }

  async rm([file]) {
    const pathToFile = resolve(this.currentDir, file);
    await remove(pathToFile);
  }

  async mv([file, newDir]) {
    await this.cp([file, newDir]);
    await this.rm([file]);
  }

  // Operating system info

  os([arg]) {
    osSwitcher(arg);
  }

  // Hash calculation
  async hash([file]) {
    const pathToFile = resolve(this.currentDir, file);
    const buffer = await readFile(pathToFile);
    const hash = createHash('sha256').update(buffer).digest('hex');
    console.log(hash);
  }

  // Compress and decompress operations

  async compress([file, newFile]) {
    const ext = extname(newFile);
    if (ext !== '.gz' && ext !== '.br') {
      invalidInput();
      console.log('Extname for compressed file should be .gz or .br');
      return;
    }
    const pathToSrc = resolve(this.currentDir, file);
    const pathToDest = resolve(this.currentDir, newFile);

    brodli(pathToSrc, pathToDest);
  }

  async decompress([file, newFile]) {
    const pathToSrc = resolve(this.currentDir, file);
    const pathToDest = resolve(this.currentDir, newFile);
    brodli(pathToSrc, pathToDest, 'decompress');
  }

  ['.exit']() {
    process.exit();
  }

  async start() {
    currentDirectory(this.currentDir);
    rl.prompt();
    rl.on('line', async (input) => {
      const command = input.trim().split(' ');
      const parsedCommand = { command: command[0], args: command.slice(1) };

      if (!this[parsedCommand.command]) {
        invalidInput();
        currentDirectory(this.currentDir);
        rl.prompt();
        return;
      }

      try {
        await this[parsedCommand.command](parsedCommand.args);
        currentDirectory(this.currentDir);
      } catch (e) {
        operationError();
        console.log(e.message);
      }

      rl.prompt();
    });
  }
}
