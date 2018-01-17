'use strict';

const logUpdate = require('log-update');
const chalk = require('chalk');
const Listr = require('listr');
const ListrVerboseRenderer = require('listr-verbose-renderer');
const createRollbackTask = require('./rollback');
const createDeployTask = require('./deploy-one');
const logger = require('../../utils/logger');

const colors = [
    'green',
    'yellow',
    'blue',
    'magenta',
    'cyan',
    'white',
    'gray',
    'greenBright',
    'yellowBright',
    'blueBright',
    'magentaBright',
    'cyanBright'
];

const getColor = index => colors[index % colors.length];

const getStatus = deploySummary => {
    if (deploySummary.isSkipped) {
        return chalk.yellow('[skipped]');
    } else if (deploySummary.isFailed) {
        return chalk.red('[failed]');
    }
    return chalk.green('[completed]');
};

const showSummary = (paths, ctx) => {
    let output = '\n';
    paths.forEach((path, index) => {
        if (ctx[path]) {
            const color = getColor(index);
            const { info } = ctx[path];

            output += `${chalk[color](`[${path}]`)} ${getStatus(
                ctx[path]
            )}:\n${info}\n`;
        }
    });
    logUpdate(output);
};

module.exports = (paths, flags, config, logStream) => {
    const tasks = new Listr(
        paths.map((path, index) => ({
            title: path,
            task: createDeployTask({
                path,
                flags,
                config,
                logStream,
                color: getColor(index)
            })
        })),
        {
            concurrent: !config.runInBand,
            exitOnError: Boolean(config.exitOnFailure),
            renderer: config.verbose && ListrVerboseRenderer,
            collapse: false
        }
    ).run();

    return tasks
        .catch(err => {
            logger.log('Deployment failed');
            showSummary(paths, err.context);

            const { deployedPaths } = err.context;

            if (config.rollbackOnFailure && deployedPaths.length > 0) {
                logger.log('Rolling back');
                return new Listr(
                    deployedPaths.map((path, index) => ({
                        title: `rolling back ${path}`,
                        task: createRollbackTask({
                            path,
                            logStream,
                            color: getColor(index)
                        })
                    })),
                    {
                        concurrent: !config.runInBand,
                        exitOnError: false,
                        renderer: config.verbose && ListrVerboseRenderer
                    }
                )
                    .run()
                    .catch(err => {
                        logger.error(err);
                    })
                    .then(() => Promise.reject(err));
            }

            return Promise.reject(err);
        })
        .then(ctx => {
            logger.log('Deployment completed successfuly');
            showSummary(paths, ctx);
        });
};
