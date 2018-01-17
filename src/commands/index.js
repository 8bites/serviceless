'use strict';

const fs = require('fs');
const Path = require('path');
const Deploy = require('./deploy');
const logger = require('../utils/logger');

module.exports = {
    deploy: (service, path, argv, options) =>
        new Promise((resolve, reject) => {
            let failed = false;
            const logStream = fs.createWriteStream(
                Path.resolve('./serviceless.log')
            );
            logStream.on('error', reject);
            const deploy = new Deploy(path, argv, options, logStream);

            logStream.on('finish', () => {
                if (failed) {
                    process.exit(1);
                }
                resolve();
            });

            logStream.once('open', () => {
                deploy
                    .exec(service)
                    .catch(err => {
                        logger.error(err);
                        failed = true;
                        logStream.end();
                    })
                    .then(() => {
                        logStream.end();
                    });
            });
        })
};
