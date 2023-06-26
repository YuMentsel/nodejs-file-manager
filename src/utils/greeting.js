import { greetingMessage, exitMessage } from './messages.js';

export default () => {
  const DEFAULT_USERNAME = 'Anonymous';

  const args = process.argv.slice(2);
  let usernameArg = args.find((el) => el.startsWith('--username'));
  const username = usernameArg ? usernameArg.replace('--username=', '').trim() : DEFAULT_USERNAME;

  greetingMessage(username);

  process.on('exit', () => exitMessage(username));
};
