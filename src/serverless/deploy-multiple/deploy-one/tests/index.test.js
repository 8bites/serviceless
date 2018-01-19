'use strict';

const mockDeploy = jest.fn(() => () => Promise.resolve({}));
const mockCreateStatusStream = jest.fn();

jest.mock('../task', () => mockDeploy);
jest.mock('../../status-stream', () => mockCreateStatusStream);

const createDeployTask = require('../index');

describe('createDeployTask', () => {
    describe('without hooks', () => {
        it('should create task', () => {
            const params = {
                path: 'path',
                logStream: {},
                config: {},
                color: 'blue'
            };

            const task = createDeployTask(params, {});
            const mockCtx = {};
            const mockTask = {};

            return expect(task(mockCtx, mockTask))
                .resolves.toEqual({})
                .then(() => {
                    expect(mockDeploy).toBeCalledWith(mockCtx, params);
                });
        });

        it('should catch error', () => {
            const task = createDeployTask();

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
            const task = createDeployTask(params, {
                beforeDeploy: hook
            });
            const mockCtx = {};
            const mockTask = {};

            return expect(task(mockCtx, mockTask))
                .resolves.toEqual({})
                .then(() => {
                    expect(mockDeploy).toBeCalledWith(mockCtx, params);
                    expect(hook.task).toBeCalledWith(
                        {},
                        expect.any(Object),
                        params,
                        mockCtx
                    );
                });
        });

        it('should create task with verbose flag', () => {
            const params = {
                path: 'path',
                logStream: {},
                config: { verbose: true },
                color: 'blue'
            };

            const hook = {
                title: 'before hook',
                task: jest.fn(() => Promise.resolve({}))
            };
            const task = createDeployTask(params, { beforeDeploy: hook });
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
                    expect(mockDeploy).toBeCalledWith(mockCtx, params);
                });
        });
    });
});
