'use strict';

const Path = require('path');
const glob = require('glob');

const serverlessConfigRegExp = /\/serverless\.(yaml|yml|json|js)$/;
const ignorePaths = ['node_modules'];

const discover = basePath =>
    new Promise((resolve, reject) => {
        glob(
            Path.join(basePath, '**/serverless.@(yaml|yml|json|js)'),
            (err, files) => {
                const hash = {};

                if (err) {
                    reject(err);
                }
                files.forEach(file => {
                    if (ignorePaths.some(path => file.indexOf(path) > -1)) {
                        return;
                    }
                    hash[file.replace(serverlessConfigRegExp, '')] = file;
                });

                resolve(hash);
            }
        );
    });

module.exports = basePath =>
    discover(basePath).then(hash => {
        Object.keys(hash).forEach(key => {
            const hashKey = key.replace(basePath, '').replace(/^\//, '') || '.';
            hash[hashKey] = hash[key];
            delete hash[key];
        });

        return hash;
    });
