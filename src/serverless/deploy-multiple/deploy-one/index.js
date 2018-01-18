'use strict';

const Listr = require('listr');
const ListrVerboseRenderer = require('listr-verbose-renderer');
const task = require('./task');
const { wireHooks } = require('../utils');

/*
 * path [String]
 * flags [String]
 * config [Object]
 * logStream [WriteStream]
 * color [String]
 * hooks [Object]
 */
module.exports = (params, hooks) => (globalCtx, task) => {
    try {
        const { config } = params;

        const tasks = [
            {
                title: `sls deploy ${flags}`,
                task: task(params)
            }
        ];

        wireHooks(
            params,
            globalCtx,
            tasks,
            hooks.beforeDeploy,
            hooks.afterDeploy
        );

        return new Listr(tasks, {
            renderer: config.verbose && ListrVerboseRenderer,
            exitOnError: true
        }).run();
    } catch (err) {
        return Promise.reject(err);
    }
};
