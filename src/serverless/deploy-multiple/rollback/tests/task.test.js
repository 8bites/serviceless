'use strict';

const mockRollback = jest.fn();
const mockCreateStatusStream = jest.fn();

jest.mock('../rollback', () => mockRollback);
jest.mock('../../status-stream', () => mockCreateStatusStream);

const createRollbackTask = require('../index');

describe('createRollbackTask', () => {
    it('should create task', () => {
        const params = {
            path: 'path',
            logStream: {},
            config: {},
            color: 'blue'
        };

        const task = createRollbackTask(params);
        const mockCtx = {};
        const mockTask = {};

        task(mockCtx, mockTask);
        expect(mockRollback).toBeCalledWith({
            path: params.path,
            logStream: params.logStream
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
        const task = createRollbackTask(params);
        const mockCtx = {};
        const mockTask = {};

        task(mockCtx, mockTask);
        expect(mockRollback).toBeCalledWith({
            path: params.path,
            logStream: params.logStream,
            stdout: 'stdout'
        });
        expect(mockCreateStatusStream).toBeCalledWith(
            params.path,
            params.color,
            mockTask
        );
    });
});
