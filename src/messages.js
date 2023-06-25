export const greetingMessage = (username) => {
  console.log(`Welcome to the File Manager, ${username}!`);
};

export const exitMessage = (username) => {
  console.log(`Thank you for using File Manager, ${username}, goodbye!`);
};

export const currentDirectory = () => {
  console.log('You are currently in', process.cwd());
};

export const invalidInput = () => {
  console.log('Invalid input');
};

export const operationError = () => {
  console.log('Operation failed');
};
