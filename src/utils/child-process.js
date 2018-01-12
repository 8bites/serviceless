'use strict';

const { ServerlessCommandError } = require('../common/errors');

let childPromises = [];

const wrap = (childPromise, params = {}) => {
    childPromises.push(childPromise);

    return childPromise.then(result => {
        childPromises = childPromises.filter(
            promise => promise !== childPromise
        );

        return result;
    });
};

const kill = () => {
    childPromises.map(child => {
        child.kill();
    });
};

module.exports = { wrap, kill };
