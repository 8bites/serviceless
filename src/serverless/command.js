'use strict';

const execa = require('execa');
const { ServerlessExecutableNotFoundError } = require('../common/errors');
const { wrap } = require('../utils/child-process');
const Path = require('path');

exports = {
    checkSls() {
        return execa.shell('which sls').then(result => {
            if (result === 'sls not found') {
                return Promise.reject(new ServerlessExecutableNotFoundError());
            }
        });
    },
    deploy(path, flags, stdout) {
        return this.checkSls().then(() => {
            const deploy = execa.shell(
                `cd ${Path.resolve(path)} && sls deploy ${flags}`
            );
            if (stdout) {
                deploy.stdout.pipe(stdout);
            }
            return wrap(deploy);
        });
    },
    rollback(path, version, stdout) {
        return this.checkSls().then(() => {
            const rollback = execa.shell(
                `cd ${Path.resolve(path)} && sls rollback ${
                    version ? `-t ${version}` : ''
                }`
            );
            if (stdout) {
                rollback.stdout.pipe(stdout);
            }
            return wrap(rollback);
        });
    }
};

module.exports = exports;
