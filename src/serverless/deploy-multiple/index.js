'use strict';

const logUpdate = require('log-update');
const chalk = require('chalk');
const lastIndexOf = require('lodash/lastIndexOf');
const Listr = require('listr');
const ListrVerboseRenderer = require('listr-verbose-renderer');
const deployOne = require('./deploy-one');
const rollback = require('./rollback');
const createStatusStream = require('./status-stream');

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
    } else {
        return chalk.green('[completed]');
    }
};

const showSummary = (paths, ctx) => {
    let output = '';
    paths.forEach((path, index) => {
        if (ctx[path]) {
            const color = getColor(index);
            const { info, isSkipped, isFailed } = ctx[path];

            output += `${chalk[color](`[${path}]`)} ${getStatus(
                ctx[path]
            )}:\n${info}`;
        }
    });
    logUpdate(output);
};

module.exports = (paths, flags, config, logStream) => {
    const deployedPaths = [];

    const tasks = new Listr(
        paths.map((path, index) => {
            return {
                title: path,
                task: (ctx, task) => {
                    return deployOne({
                        path,
                        flags,
                        logStream,
                        stdout:
                            config.verbose &&
                            createStatusStream(path, getColor(index), task)
                    })
                        .catch(err => {
                            ctx[path] = {
                                info: err.log,
                                isFailed: true
                            };

                            return Promise.reject(err);
                        })
                        .then(res => {
                            let isSkipped = false;
                            // check if service was deployed
                            if (
                                res.stdout.indexOf(
                                    'Serverless: Stack update finished...'
                                ) > -1
                            ) {
                                deployedPaths.push(path);
                            } else {
                                isSkipped = true;
                                task.skip();
                            }

                            const infoIndex = res.stdout.lastIndexOf(
                                'Service Information'
                            );
                            const info = res.stdout.substring(infoIndex);
                            ctx[path] = {
                                info,
                                isSkipped
                            };
                        });
                }
            };
        }),
        {
            concurrent: !config.runInBand,
            exitOnError: Boolean(config.exitOnFailure),
            renderer: config.verbose && ListrVerboseRenderer,
            collapse: false
        }
    ).run();

    return tasks
        .catch(err => {
            console.log('Deployment failed');
            showSummary(paths, err.context);

            if (config.rollbackOnFailure && deployedPaths.length > 0) {
                console.log('Rolling back');
                return new Listr(
                    deployedPaths.map((path, index) => {
                        return {
                            title: `rolling back ${path}`,
                            task: (ctx, task) =>
                                rollback({
                                    path,
                                    logStream,
                                    stdout:
                                        config.verbose &&
                                        createStatusStream(
                                            path,
                                            getColor(index),
                                            task
                                        )
                                })
                        };
                    }),
                    {
                        concurrent: !config.runInBand,
                        exitOnError: false,
                        renderer: config.verbose && ListrVerboseRenderer
                    }
                )
                    .run()
                    .catch(err => {
                        console.error(err);
                    })
                    .then(() => Promise.reject(err));
            }

            return Promise.reject(err);
        })
        .then(ctx => {
            console.log('\nDeployment completed successfuly\n');
            showSummary(paths, ctx);
        });
};
