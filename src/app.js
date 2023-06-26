import { createInterface } from 'node:readline';
import { createReadStream, createWriteStream } from 'node:fs';
import { readdir, writeFile, access, rename, mkdir, rm as remove } from 'node:fs/promises';
import { pipeline } from 'node:stream/promises';
import { resolve, dirname, basename } from 'node:path';
import { currentDirectory, invalidInput, operationError } from './utils/messages.js';
import { isExisting } from './utils/checkers.js';

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

  async start() {
    currentDirectory(this.currentDir);
    const rl = createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: '> ',
    });

    rl.prompt();
    rl.on('line', async (input) => {
      const command = input.trim().split(' '); //todo: fix ""
      const parsedCommand = { command: command[0], args: command.slice(1) };
      // console.log(parsedCommand);

      // fixArgs

      if (!this[parsedCommand.command]) {
        invalidInput();
        currentDirectory(this.currentDir);
        rl.prompt();
        return;
      }

      try {
        console.log('!', parsedCommand);
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
