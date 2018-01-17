'use strict';

const mockDeploy = jest.fn();
const mockCreateStatusStream = jest.fn();
jest.mock('../deploy', () => mockDeploy);
jest.mock('../../status-stream', () => mockCreateStatusStream);

const createTask = require('../index');

describe('createDeployTask', () => {
    describe('with success deploy', () => {
        it('should update context if service deployed', () => {
            mockDeploy.mockReturnValueOnce(
                Promise.resolve({
                    stdout:
                        'Serverless: Stack update finished... foo Service Information bar'
                })
            );

            const params = {
                path: 'path',
                flags: 'flags',
                config: {},
                logStream: jest.fn(),
                color: 'blue'
            };
            const ctx = {};
            const task = createTask(params);

            return expect(task(ctx))
                .resolves.toBeUndefined()
                .then(() => {
                    expect(ctx.path.isSkipped).toBe(false);
                    expect(ctx.path.info).toBe('Service Information bar');
                    expect(ctx.deployedPaths).toEqual(['path']);
                });
        });

        it('should update deployed paths', () => {
            mockDeploy.mockReturnValueOnce(
                Promise.resolve({
                    stdout:
                        'Serverless: Stack update finished... foo Service Information bar'
                })
            );

            const params = {
                path: 'path',
                flags: 'flags',
                config: { verbose: true },
                logStream: jest.fn(),
                color: 'blue'
            };
            const ctx = { deployedPaths: ['foo'] };
            const task = createTask(params);
            const mockTask = {};

            return expect(task(ctx, mockTask))
                .resolves.toBeUndefined()
                .then(() => {
                    expect(ctx.deployedPaths).toEqual(['foo', 'path']);
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

            const params = {
                path: 'path',
                flags: 'flags',
                config: {},
                logStream: jest.fn(),
                color: 'blue'
            };
            const ctx = { deployedPaths: [] };
            const task = createTask(params);
            const mockTask = { skip: jest.fn() };

            return expect(task(ctx, mockTask))
                .resolves.toBeUndefined()
                .then(() => {
                    expect(ctx.path.isSkipped).toBe(true);
                    expect(ctx.path.info).toBe('Restored from cache');
                    expect(ctx.deployedPaths).toEqual([]);
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
            const ctx = {};
            const task = createTask(params);

            return expect(task(ctx))
                .rejects.toBe(err)
                .then(() => {
                    expect(ctx.path).toEqual({
                        info: err.log,
                        isFailed: true
                    });
                });
        });
    });
});
