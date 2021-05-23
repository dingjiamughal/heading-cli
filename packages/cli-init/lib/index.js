'use strict';

const Command = require('@cx-heading/command');
const log = require('@cx-heading/log');

class InitCommand extends Command {
  init() {
    this.projectName = this.argv[0] || '';
    const options = this.argv[1];

    this.force = options.force;

    console.log(this.projectName, this.cmd);
  }

  exec() {}
}

function init(args) {
  return new InitCommand(args);
}
module.exports = init;
