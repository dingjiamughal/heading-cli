'use strict';

function init(projectName, cmd) {
  console.log(projectName, cmd, process.env.CLI_TARGET_PATH);
}

module.exports = init;
