'use strict';

const Sls = require('../command');
const { ServerlessCommandError } = require('../../common/errors');

const deployOne = ({ path, flags, logStream, stdout }) => {
    const deploy = Sls.deploy(path, flags);

    if (stdout) {
        deploy.stdout.pipe(stdout);
    }

    return deploy
        .then(log => {
            logStream.write(`\n[${path}]:\n${log}\n`);
            return log;
        })
        .catch(err => {
            if (err instanceof ServerlessCommandError) {
                logStream.write(`\n[${path}]:\n${err.log}\n`);
            }

            return Promise.reject(err);
        });
};

module.exports = deployOne;
