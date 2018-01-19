'use strict';

const mockDeploy = jest.fn(() => () => Promise.resolve());
const mockCreateStatusStream = jest.fn();

jest.mock('../task', () => mockDeploy);
jest.mock('../../status-stream', () => mockCreateStatusStream);

const createDeployTask = require('../index');

describe('createDeployTask', () => {
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

    it('should create task', () => {
        const params = {
            path: 'path',
            logStream: {},
            config: { verbose: true },
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
