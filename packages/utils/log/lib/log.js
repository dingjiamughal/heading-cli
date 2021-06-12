'use strict';
/**
 * npmlog 封装
 */

const log = require('npmlog');

log.level = process.env.LOG_LEVEL ? process.env.LOG_LEVEL : 'info';
// log.heading = 'nobug thx';
// log.headingStyle = { fg: '#eb2f96', bg: 'fff' };
log.addLevel('success', 2000, { fg: 'green', bold: true });
log.addLevel('notice', 2000, { fg: 'orange', bold: true });


module.exports = log;
