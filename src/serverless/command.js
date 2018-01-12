'use strict';

const execa = require('execa');
const { ServerlessExecutableNotFoundError } = require('../common/errors');
const { wrap } = require('../utils/child-process');
const Path = require('path');

exports = {
    checkSls() {
        return execa.shell('which', ['sls']).then(result => {
            if (!result) {
                return Promise.reject(new ServerlessExecutableNotFoundError());
            }
        });
    },
    deploy(path, flags) {
        return this.checkSls().then(() =>
            wrap(execa.shell(`cd ${Path.resolve(path)} && sls deploy ${flags}`))
        );
    },
    rollback(path, version) {
        return this.checkSls().then(() =>
            wrap(
                execa.shell(
                    `cd ${Path.resolve(path)} && sls rollback ${
                        version ? `-t ${version}` : ''
                    }`
                )
            )
        );
    }
};

module.exports = exports;
