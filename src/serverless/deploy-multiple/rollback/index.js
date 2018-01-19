'use strict';

const Listr = require('listr');
const ListrVerboseRenderer = require('listr-verbose-renderer');
const rollback = require('./rollback');
const createStatusStream = require('../status-stream');
const { wireHooks } = require('../utils');

module.exports = (params, hooks) => (globalCtx, task) => {
    try {
        const { path, logStream, config, color } = params;

        const tasks = wireHooks(
            params,
            globalCtx,
            [
                {
                    title: 'sls rollback',
                    task: (ctx, task) =>
                        rollback({
                            path,
                            logStream,
                            stdout: createStatusStream(path, color, task)
                        })
                }
            ],
            hooks.beforeRollback,
            hooks.afterRollback
        );

        if (tasks.length > 1) {
            return new Listr(tasks, {
                renderer: config.verbose && ListrVerboseRenderer,
                exitOnError: true
            }).run();
        }

        return tasks[0].task({}, task);
    } catch (err) {
        return Promise.reject(err);
    }
};
