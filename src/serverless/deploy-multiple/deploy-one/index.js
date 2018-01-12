'use strict';

const deploy = require('./deploy');
const createStatusStream = require('../status-stream');

module.exports = ({ path, flags, config, logStream, color }) => (ctx, task) =>
    deploy({
        path,
        flags,
        logStream,
        stdout: config.verbose && createStatusStream(path, color, task)
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
                res.stdout.indexOf('Serverless: Stack update finished...') > -1
            ) {
                if (!ctx.deployedPaths) {
                    ctx.deployedPaths = [];
                }
                ctx.deployedPaths.push(path);
            } else {
                isSkipped = true;
                task.skip();
            }

            const infoIndex = res.stdout.lastIndexOf('Service Information');
            const info = res.stdout.substring(infoIndex);
            ctx[path] = {
                info,
                isSkipped
            };
        });
