'use strict';

const mockWrapChildProcess = jest.fn(child => child);
const mockDeploy = jest.fn();
const mockRollback = jest.fn();
const mockStream = {
    write: jest.fn()
};

jest.mock('../../../utils/child-process', () => ({
    wrap: mockWrapChildProcess
}));
jest.mock('../../command', () => ({
    deploy: mockDeploy,
    rollback: mockRollback
}));

const deployOne = require('../deploy-one');
const { ServerlessCommandError } = require('../../../common/errors');

describe('deployOne', () => {
    it('should deploy service', () => {
        const mockPipe = jest.fn();
        mockDeploy.mockImplementation(() => {
            return Promise.resolve('log');
        });

        const config = {};
        return expect(
            deployOne({
                path: 'path',
                flags: 'flags',
                config,
                stdout: mockStream,
                logStream: mockStream
            })
        )
            .resolves.toBe('log')
            .then(() => {
                expect(mockDeploy).toBeCalledWith('path', 'flags', mockStream);
                expect(mockStream.write).toBeCalledWith('\n[path]:\nlog\n');
            });
    });

    it('should catch regular error', () => {
        const error = new Error();
        mockDeploy.mockImplementation(() => Promise.reject(error));

        const config = {};
        return expect(
            deployOne({
                path: 'path',
                flags: 'flags',
                config,
                logStream: mockStream
            })
        ).rejects.toBe(error);
    });

    it('should catch ServerlessCommandError', () => {
        const error = new ServerlessCommandError('log');
        mockDeploy.mockImplementation(() => Promise.reject(error));

        const config = {};
        return expect(
            deployOne({
                path: 'path',
                flags: 'flags',
                config,
                logStream: mockStream
            })
        )
            .rejects.toBe(error)
            .then(() => {
                expect(mockStream.write).toBeCalledWith('\n[path]:\nlog\n');
            });
    });
});
