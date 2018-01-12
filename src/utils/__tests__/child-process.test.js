'use strict';

const { exec } = require('child_process');
const stream = require('stream');
const { wrap, kill } = require('../child-process');

describe('child-process', () => {
    describe('kill', () => {
        it('should kill child processes', () => {
            const childPromise = {
                on: jest.fn(),
                kill: jest.fn(),
                then: jest.fn()
            };

            wrap(childPromise);
            wrap(childPromise);

            kill();
            expect(childPromise.then).toHaveBeenCalledTimes(2);
            expect(childPromise.kill).toHaveBeenCalledTimes(2);
        });
    });
});
