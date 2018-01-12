'use strict';

const rollback = require('./rollback');
const createStatusStream = require('../status-stream');

module.exports = ({ path, logStream, config, color }) => (ctx, task) =>
    rollback({
        path,
        logStream,
        stdout: config.verbose && createStatusStream(path, color, task)
    });
