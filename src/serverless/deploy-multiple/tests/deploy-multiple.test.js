'use strict';

const mockDeployOne = jest.fn();
const mockRollback = jest.fn();

jest.mock('../deploy-one', () => mockDeployOne);
jest.mock('../rollback', () => mockRollback);

const deployMultiple = require('../index');
const { Writable } = require('stream');

describe('serverless deploy multiple', () => {
    beforeEach(() => {
        mockDeployOne.mockClear();
        mockRollback.mockClear();
    });

    const mockStream = jest.fn();

    describe('deploy in parallel', () => {
        it('should deploy empty list', () => {
            return expect(
                deployMultiple([], '', {}, mockStream)
            ).resolves.toBeUndefined();
        });

        it('should deploy list of services', () => {
            mockDeployOne.mockImplementation(({ path }) =>
                Promise.resolve(path)
            );

            const services = ['foo', 'bar', 'baz'];
            expect.assertions(services.length);
            return deployMultiple(services, '', {}, mockStream).then(() => {
                services.forEach(service => {
                    expect(mockDeployOne).toBeCalledWith({
                        path: service,
                        flags: '',
                        logStream: mockStream
                    });
                });
            });
        });

        it('with verbose flag', () => {
            mockDeployOne.mockImplementation(({ path }) =>
                Promise.resolve(`Serverless: ${path}`)
            );

            const services = ['foo', 'bar', 'baz'];
            const config = { verbose: true };
            expect.assertions(services.length);
            return deployMultiple(services, '', config, mockStream).then(() => {
                services.forEach(service => {
                    expect(mockDeployOne).toBeCalledWith({
                        path: service,
                        flags: '',
                        logStream: mockStream,
                        stdout: expect.any(Writable)
                    });
                });
            });
        });

        it('should catch error', () => {
            expect.assertions(1);

            const error = new Error('fail');
            mockDeployOne.mockImplementation(({ path }) =>
                Promise.reject(error)
            );

            return deployMultiple(['foo', 'bar', 'baz'], '', {}).catch(err => {
                expect(err).toBeInstanceOf(Error);
            });
        });
    });

    describe('deploy in band', () => {
        it('should deploy empty list', () => {
            expect.assertions(1);

            return expect(
                deployMultiple([], '', { runInBand: true }, mockStream)
            ).resolves.toBeUndefined();
        });

        it('should deploy list of services', () => {
            mockDeployOne.mockImplementation(({ path }) =>
                Promise.resolve(path)
            );

            const services = ['foo', 'bar', 'baz'];
            const config = { runInBand: true };
            expect.assertions(services.length);
            return deployMultiple(services, '', config, mockStream).then(() => {
                services.forEach(service => {
                    expect(mockDeployOne).toBeCalledWith({
                        path: service,
                        flags: '',
                        logStream: mockStream
                    });
                });
            });
        });

        it('with verbose flag', () => {
            mockDeployOne.mockImplementation(({ path }) =>
                Promise.resolve(`Serverless: ${path}`)
            );

            const services = ['foo', 'bar', 'baz'];
            const config = { runInBand: true, verbose: true };
            expect.assertions(services.length);
            return deployMultiple(services, '', config, mockStream).then(() => {
                services.forEach(service => {
                    expect(mockDeployOne).toBeCalledWith({
                        path: service,
                        flags: '',
                        logStream: mockStream,
                        stdout: expect.any(Writable)
                    });
                });
            });
        });

        it('should catch error', () => {
            expect.assertions(1);

            const error = new Error('fail');
            const config = { runInBand: true };
            mockDeployOne.mockImplementation(({ path }) =>
                Promise.reject(error)
            );

            return deployMultiple(['foo', 'bar', 'baz'], '', config).catch(
                err => {
                    expect(err).toBeInstanceOf(Error);
                }
            );
        });
    });

    describe('deploy with rollback', () => {
        it('should rollback deployed services on failure', () => {
            const error = new Error('failed');
            mockDeployOne.mockImplementation(({ path }) => {
                if (path === 'bar') {
                    return Promise.reject(error);
                } else if (path === 'foo') {
                    return Promise.resolve(
                        'Serverless: Service files not changed. Skipping deployment...'
                    );
                } else {
                    return Promise.resolve(
                        'Serverless: Stack update finished...'
                    );
                }
            });
            mockRollback.mockImplementation(() => Promise.resolve());

            const config = { rollbackOnFailure: true };
            const services = ['foo', 'bar', 'baz'];

            expect.assertions(services.length + 3);
            return deployMultiple(services, '', config, mockStream).catch(
                err => {
                    expect(err.errors).toHaveLength(1);
                    expect(err.errors[0]).toBe(error);

                    services.forEach(service => {
                        expect(mockDeployOne).toBeCalledWith({
                            path: service,
                            flags: '',
                            logStream: mockStream
                        });
                    });

                    expect(mockRollback).toBeCalledWith({
                        path: 'baz',
                        logStream: mockStream
                    });
                }
            );
        });

        it('should catch rollback error', () => {
            const error = new Error('failed');
            const rollbackError = new Error('rollback failed');
            mockDeployOne.mockImplementation(({ path }) => {
                if (path === 'bar') {
                    return Promise.reject(error);
                } else if (path === 'foo') {
                    return Promise.resolve(
                        'Serverless: Service files not changed. Skipping deployment...'
                    );
                } else {
                    return Promise.resolve(
                        'Serverless: Stack update finished...'
                    );
                }
            });
            mockRollback.mockImplementation(() =>
                Promise.reject(rollbackError)
            );

            const config = { rollbackOnFailure: true, verbose: true };
            const services = ['foo', 'bar', 'baz'];
            const errorLogSpy = jest.spyOn(console, 'error');

            expect.assertions(services.length + 5);
            return deployMultiple(services, '', config, mockStream).catch(
                err => {
                    expect(err.errors).toHaveLength(1);
                    expect(err.errors[0]).toBe(error);
                    expect(errorLogSpy).toBeCalled();
                    expect(errorLogSpy.mock.calls[0][0].errors[0]).toBe(
                        rollbackError
                    );

                    services.forEach(service => {
                        expect(mockDeployOne).toBeCalledWith({
                            path: service,
                            flags: '',
                            logStream: mockStream,
                            stdout: expect.any(Writable)
                        });
                    });

                    expect(mockRollback).toBeCalledWith({
                        path: 'baz',
                        logStream: mockStream,
                        stdout: expect.any(Writable)
                    });
                }
            );
        });

        it('should reject if no paths was deployed', () => {
            const error = new Error('failed');
            mockDeployOne.mockImplementation(({ path }) => {
                if (path === 'bar') {
                    return Promise.reject(error);
                } else {
                    return Promise.resolve(
                        'Serverless: Service files not changed. Skipping deployment...'
                    );
                }
            });
            mockRollback.mockImplementation(() => Promise.resolve());

            const config = { rollbackOnFailure: true };
            const services = ['foo', 'bar', 'baz'];

            expect.assertions(services.length + 3);
            return deployMultiple(services, '', config, mockStream).catch(
                err => {
                    expect(err.errors).toHaveLength(1);
                    expect(err.errors[0]).toBe(error);

                    services.forEach(service => {
                        expect(mockDeployOne).toBeCalledWith({
                            path: service,
                            flags: '',
                            logStream: mockStream
                        });
                    });

                    expect(mockRollback).not.toBeCalled();
                }
            );
        });
    });
});
