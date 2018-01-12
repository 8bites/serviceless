'use strict';

// mocks
const mockExeca = jest.fn();
const mockResolve = jest.fn(path => '/' + path);

jest.mock('execa', () => ({
    shell: mockExeca
}));
jest.mock('path', () => ({
    resolve: mockResolve
}));

const Sls = require('../command');
const { ServerlessExecutableNotFoundError } = require('../../common/errors');

describe('serverless commands', () => {
    it('checks sls exists', () => {
        mockExeca.mockImplementation(command => {
            if (command === 'which') {
                return Promise.resolve('');
            }
        });

        return expect(Sls.deploy('path', 'flags')).rejects.toBeInstanceOf(
            ServerlessExecutableNotFoundError
        );
    });

    describe('commands', () => {
        beforeEach(() => {
            mockExeca.mockImplementation(command => {
                if (command === 'which') {
                    return Promise.resolve('sls');
                } else {
                    return Promise.resolve('log');
                }
            });
        });

        afterEach(() => {
            mockExeca.mockClear();
        });

        it('should deploy', () => {
            return expect(Sls.deploy('foo', 'flags'))
                .resolves.toBe('log')
                .then(() => {
                    expect(mockExeca).toBeCalledWith('which', ['sls']);
                    expect(mockExeca).toBeCalledWith(
                        'cd /foo && sls deploy flags'
                    );
                });
        });

        it('should rollback', () => {
            return expect(Sls.rollback('path'))
                .resolves.toBe('log')
                .then(() => {
                    expect(mockExeca).toBeCalledWith(
                        'cd /path && sls rollback '
                    );
                });
        });

        it('should rollback with version', () => {
            return expect(Sls.rollback('path', 'blah'))
                .resolves.toBe('log')
                .then(() => {
                    expect(mockExeca).toBeCalledWith(
                        'cd /path && sls rollback -t blah'
                    );
                });
        });
    });
});
