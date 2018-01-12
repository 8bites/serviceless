'use strict';

const mockWrapChildProcess = jest.fn(child => child);
const mockDeploy = jest.fn();
const mockRollback = jest.fn();
const mockStream = {
    write: jest.fn()
};

jest.mock('../../../../utils/child-process', () => ({
    wrap: mockWrapChildProcess
}));
jest.mock('../../../command', () => ({
    deploy: mockDeploy,
    rollback: mockRollback
}));

const rollback = require('../rollback');
const { CanNotRollback } = require('../../../../common/errors');

describe('rollback', () => {
    it('should rollback service', () => {
        const log = `
            Serverless: Use a timestamp from the deploy list below to rollback to a specific version.
            Run \`sls rollback -t YourTimeStampHere\`
            Serverless: Listing deployments:
            Serverless: -------------
            Serverless: Timestamp: 1514886606692
            Serverless: Datetime: 2018-01-02T09:50:06.692Z
            Serverless: Files:
            Serverless: - compiled-cloudformation-template.json
        `;
        mockRollback.mockImplementation((path, version) => {
            if (version) {
                return Promise.resolve(version);
            }
            return Promise.resolve(log);
        });

        return expect(
            rollback({
                path: 'path',
                logStream: mockStream,
                stdout: mockStream
            })
        ).resolves.toBe('1514886606692');
    });

    it('should reject if there is no previous versions', () => {
        mockRollback.mockImplementation(() => Promise.resolve(''));

        return expect(rollback('path', mockStream)).rejects.toBeInstanceOf(
            CanNotRollback
        );
    });
});
