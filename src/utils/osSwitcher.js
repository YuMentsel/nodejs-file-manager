import { EOL, cpus, homedir, userInfo, arch } from 'node:os';
import { invalidInput } from './messages.js';

export const osSwitcher = (arg) => {
  switch (arg) {
    case '--EOL':
      console.log(JSON.stringify(EOL));
      break;
    case '--cpus':
      const model = cpus().map((el) => ({
        model: el.model.trim(),
        'Clock rate': `${( el.speed / 1000).toFixed(1)} GHz`,
      }));
      console.log(`Amount of CPUS - ${model.length}`);
      console.table(model);
      break;
    case '--homedir':
      console.log(homedir());
      break;
    case '--username':
      console.log(userInfo().username);
      break;
    case '--architecture':
      console.log(arch());
      break;
    default:
      invalidInput();
      break;
  }
};
