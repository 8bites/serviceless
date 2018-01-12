'use strict';

const Sls = require('../../command');
const { CanNotRollback } = require('../../../common/errors');

const versionRegExp = /Serverless: Timestamp: (\d+)/;
const rollback = ({ path, stdout }) => {
    const rollback = Sls.rollback(path);

    return rollback
        .then(log => {
            const match = log.match(versionRegExp);

            if (match) {
                return versionRegExp.exec(match[0])[1];
            }
            return Promise.reject(new CanNotRollback());
        })
        .then(version => Sls.rollback(path, version, stdout));
};

module.exports = rollback;
