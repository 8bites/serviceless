'use strict';

const mockDeploy = jest.fn();
const mockCreateStatusStream = jest.fn();
jest.mock('../deploy', () => mockDeploy);
jest.mock('../../status-stream', () => mockCreateStatusStream);

const createTask = require('../task');

describe('createDeployTask', () => {
    describe('with success deploy', () => {
        it('should update context if service deployed', () => {
            mockDeploy.mockReturnValueOnce(
                Promise.resolve({
                    stdout:
                        'Serverless: Stack update finished... foo Service Information bar'
                })
            );

            const globalCtx = {};

            const params = {
                path: 'path',
                flags: 'flags',
                config: {},
                logStream: jest.fn(),
                color: 'blue'
            };
            const ctx = {};
            const task = createTask(globalCtx, params);

            const expectedResult = {
                isSkipped: false,
                stdout:
                    'Serverless: Stack update finished... foo Service Information bar',
                info: 'Service Information bar',
                isSucceeded: true,
                isFailed: false
            };

            return expect(task(ctx))
                .resolves.toEqual(expectedResult)
                .then(() => {
                    expect(globalCtx.path).toEqual(expectedResult);
                    expect(globalCtx.deployedPaths).toEqual(['path']);
                });
        });

        it('should update deployed paths', () => {
            mockDeploy.mockReturnValueOnce(
                Promise.resolve({
                    stdout:
                        'Serverless: Stack update finished... foo Service Information bar'
                })
            );

            const globalCtx = { deployedPaths: ['foo'] };
            const params = {
                path: 'path',
                flags: 'flags',
                config: { verbose: true },
                logStream: jest.fn(),
                color: 'blue'
            };
            const task = createTask(globalCtx, params);
            const mockTask = {};

            const expectedResult = {
                isSkipped: false,
                stdout:
                    'Serverless: Stack update finished... foo Service Information bar',
                info: 'Service Information bar',
                isSucceeded: true,
                isFailed: false
            };

            return expect(task({}, mockTask))
                .resolves.toEqual(expectedResult)
                .then(() => {
                    expect(globalCtx).toEqual({
                        deployedPaths: ['foo', 'path'],
                        path: expectedResult
                    });
                    expect(mockCreateStatusStream).toBeCalledWith(
                        'path',
                        'blue',
                        mockTask
                    );
                });
        });

        it('should skip task if service was cached', () => {
            mockDeploy.mockReturnValueOnce(
                Promise.resolve({
                    stdout: 'Restored from cache'
                })
            );

            const globalCtx = { deployedPaths: [] };
            const params = {
                path: 'path',
                flags: 'flags',
                config: {},
                logStream: jest.fn(),
                color: 'blue'
            };
            const task = createTask(globalCtx, params);
            const mockTask = { skip: jest.fn() };

            const expectedResult = {
                isSkipped: true,
                isSucceeded: false,
                isFailed: false,
                info: 'Restored from cache',
                stdout: 'Restored from cache'
            };

            return expect(task({}, mockTask))
                .resolves.toEqual(expectedResult)
                .then(() => {
                    expect(globalCtx.path).toEqual(expectedResult);
                    expect(globalCtx.deployedPaths).toEqual([]);
                });
        });
    });

    describe('with failed deploy', () => {
        it('should catch error', () => {
            const err = new Error();
            err.log = 'Failed';
            mockDeploy.mockReturnValueOnce(Promise.reject(err));

            const params = {
                path: 'path',
                flags: 'flags',
                config: {},
                logStream: jest.fn(),
                color: 'blue'
            };
            const globalCtx = {};
            const task = createTask(globalCtx, params);

            return expect(task({}))
                .rejects.toBe(err)
                .then(() => {
                    expect(globalCtx.path).toEqual({
                        stdout: err.log,
                        info: err.log,
                        isFailed: true,
                        isSucceeded: false,
                        isSkipped: false
                    });
                });
        });
    });
});
