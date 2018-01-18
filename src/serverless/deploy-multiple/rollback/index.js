'use strict';

const Listr = require('listr');
const ListrVerboseRenderer = require('listr-verbose-renderer');
const rollback = require('./rollback');
const createStatusStream = require('../status-stream');
const { wireHooks } = require('../utils');

module.exports = (params, hooks) => (globalCtx, task) => {
    try {
        const { path, logStream, config, color } = params;

        const tasks = [
            {
                title: 'sls rollback',
                task: () =>
                    rollback({
                        path,
                        logStream,
                        stdout:
                            config.verbose &&
                            createStatusStream(path, color, task)
                    })
            }
        ];

        wireHooks(
            params,
            globalCtx,
            tasks,
            hooks.beforeRollback,
            hooks.afterRollback
        );

        return new Listr(tasks, {
            renderer: config.verbose && ListrVerboseRenderer,
            exitOnError: true
        }).run();
    } catch (err) {
        return Promise.reject(err);
    }
};
