'use strict';

const mockRollback = jest.fn(() => Promise.resolve({}));
const mockCreateStatusStream = jest.fn();

jest.mock('../rollback', () => mockRollback);
jest.mock('../../status-stream', () => mockCreateStatusStream);

const createRollbackTask = require('../index');

describe('createRollbackTask', () => {
    describe('without hooks', () => {
        it('should create task', () => {
            const params = {
                path: 'path',
                logStream: {},
                config: {},
                color: 'blue'
            };

            const task = createRollbackTask(params, {});
            const mockCtx = {};
            const mockTask = {};

            return expect(task(mockCtx, mockTask))
                .resolves.toEqual({})
                .then(() => {
                    expect(mockRollback).toBeCalledWith({
                        path: params.path,
                        logStream: params.logStream
                    });
                });
        });

        it('should catch error', () => {
            const task = createRollbackTask();

            return expect(task()).rejects.toBeInstanceOf(Error);
        });
    });

    describe('with hooks', () => {
        it('should create task', () => {
            const params = {
                path: 'path',
                logStream: {},
                config: {},
                color: 'blue'
            };

            const hook = {
                title: 'before hook',
                task: jest.fn(() => Promise.resolve({}))
            };
            const task = createRollbackTask(params, { beforeRollback: hook });
            const mockCtx = {};
            const mockTask = {};

            return expect(task(mockCtx, mockTask))
                .resolves.toEqual({})
                .then(() => {
                    expect(hook.task).toBeCalledWith(
                        {},
                        expect.any(Object),
                        params,
                        mockCtx
                    );
                    expect(mockRollback).toBeCalledWith({
                        path: params.path,
                        logStream: params.logStream
                    });
                });
        });

        it('should create task with verbose flag', () => {
            const params = {
                path: 'path',
                logStream: {},
                config: { verbose: true },
                color: 'blue'
            };

            mockCreateStatusStream.mockReturnValueOnce('stdout');
            const hook = {
                title: 'before hook',
                task: jest.fn(() => Promise.resolve({}))
            };
            const task = createRollbackTask(params, { beforeRollback: hook });
            const mockCtx = {};
            const mockTask = {};

            return expect(task(mockCtx, mockTask))
                .resolves.toEqual({})
                .then(() => {
                    expect(hook.task).toBeCalledWith(
                        {},
                        expect.any(Object),
                        params,
                        mockCtx
                    );
                    expect(mockRollback).toBeCalledWith({
                        path: params.path,
                        logStream: params.logStream,
                        stdout: 'stdout'
                    });
                    expect(mockCreateStatusStream).toBeCalledWith(
                        params.path,
                        params.color,
                        expect.any(Object)
                    );
                });
        });
    });
});
