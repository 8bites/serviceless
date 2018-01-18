'use strict';

const deploy = require('./deploy');
const createStatusStream = require('../status-stream');

module.exports = (globalCtx, { path, flags, config, logStream, color }) => (
    ctx,
    task
) =>
    deploy({
        path,
        flags,
        logStream,
        stdout: config.verbose && createStatusStream(path, color, task)
    })
        .catch(err => {
            const deployContext = {
                stdout: err.log,
                info: err.log,
                isFailed: true,
                isSkipped: false,
                isSucceeded: false
            };
            globalCtx[path] = deployContext;
            Object.assign(ctx, deployContext);

            return Promise.reject(err);
        })
        .then(res => {
            let isSkipped = false;
            let isSucceeded = false;

            // check if service was deployed
            if (
                res.stdout.indexOf('Serverless: Stack update finished...') > -1
            ) {
                if (!globalCtx.deployedPaths) {
                    globalCtx.deployedPaths = [];
                }
                globalCtx.deployedPaths.push(path);
                isSucceeded = true;
            } else {
                isSkipped = true;
                task.skip();
            }

            const infoIndex = res.stdout.lastIndexOf('Service Information');
            const info = res.stdout.substring(infoIndex);
            const deployContext = {
                info,
                stdout: res.stdout,
                isSkipped,
                isSucceeded,
                isFailed: false
            };
            Object.assign(ctx, deployContext);
            globalCtx[path] = deployContext;

            return ctx;
        });
