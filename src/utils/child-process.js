'use strict';

const { ServerlessCommandError } = require('../common/errors');

let childPromises = [];

const wrap = childPromise => {
    childPromises.push(childPromise);

    childPromise.then(result => {
        childPromises = childPromises.filter(
            promise => promise !== childPromise
        );
    });

    return childPromise;
};

const kill = () => {
    childPromises.map(child => {
        child.kill();
    });
};

module.exports = { wrap, kill };
