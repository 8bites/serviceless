'use strict';

// mocks
const mockSelectService = jest.fn(() => Promise.resolve('path'));
const mockCli = jest.fn(() => ({
    selectService: mockSelectService
}));
const mockDeployMultiple = jest.fn();
const mockDiscoverServices = jest.fn();

jest.mock('../../../cli', () => mockCli);
jest.mock('../../../serverless/deploy-multiple', () => mockDeployMultiple);
jest.mock('../../../utils/discover-services', () => mockDiscoverServices);

const Errors = require('../../../common/errors');
const Deploy = require('../index');
const { Writable } = require('stream');

describe('Deploy command', () => {
    const path = 'path';
    const argv = 'argv';
    const options = {};

    describe('all', () => {
        it('should deploy all services', () => {
            expect.assertions(1);

            mockDiscoverServices.mockReturnValueOnce(
                Promise.resolve({ foo: true, bar: true })
            );
            const deploy = new Deploy(path, argv, options, new Writable());

            return deploy.exec('all').then(() => {
                expect(mockDeployMultiple).toHaveBeenCalledWith(
                    ['foo', 'bar'],
                    argv,
                    options,
                    expect.any(Writable),
                    {}
                );
            });
        });
    });

    describe('with service', () => {
        it('should reject if no services found', () => {
            expect.assertions(1);

            mockDiscoverServices.mockReturnValueOnce(Promise.resolve({}));
            const deploy = new Deploy(path, argv, options, new Writable());

            return expect(deploy.exec()).rejects.toBeInstanceOf(
                Errors.NoServerlessConfigFoundError
            );
        });

        it('should deploy selected service', () => {
            const services = { path: true };
            mockDiscoverServices.mockReturnValueOnce(Promise.resolve(services));

            const deploy = new Deploy(path, argv, options, new Writable());

            return deploy.exec().then(() => {
                expect(mockDeployMultiple).toHaveBeenCalledWith(
                    ['path/path'],
                    argv,
                    options,
                    expect.any(Writable),
                    {}
                );
            });
        });
    });

    describe('with cli lookup', () => {
        it('should deploy selected service', () => {
            const services = { path: true };
            mockDiscoverServices.mockReturnValueOnce(Promise.resolve(services));

            const deploy = new Deploy(path, argv, options, new Writable());

            return deploy.exec('path').then(() => {
                expect(mockDeployMultiple).toHaveBeenCalledWith(
                    ['path/path'],
                    argv,
                    options,
                    expect.any(Writable),
                    {}
                );
            });
        });

        it('should call selectService if more than one service found', () => {
            expect.assertions(1);

            const services = { aaa: true, aab: true, zzz: true };
            mockDiscoverServices.mockReturnValueOnce(Promise.resolve(services));

            const deploy = new Deploy(path, argv, options, new Writable());

            return deploy.exec('aa').then(() => {
                expect(mockDeployMultiple).toHaveBeenCalledWith(
                    ['aaa', 'aab'],
                    argv,
                    options,
                    expect.any(Writable),
                    {}
                );
            });
        });

        it('should deploy root service', () => {
            expect.assertions(1);

            const services = { '.': true };
            mockDiscoverServices.mockReturnValueOnce(Promise.resolve(services));
            mockSelectService.mockReturnValueOnce(Promise.resolve('.'));

            const deploy = new Deploy(path, argv, options, new Writable());

            return deploy.exec().then(() => {
                expect(mockDeployMultiple).toHaveBeenCalledWith(
                    ['.'],
                    argv,
                    options,
                    expect.any(Writable),
                    {}
                );
            });
        });

        it('should deploy all services if root is selected', () => {
            expect.assertions(1);

            const services = { aaa: true, aab: true, zzz: true };
            mockDiscoverServices.mockReturnValueOnce(Promise.resolve(services));
            mockSelectService.mockReturnValueOnce(Promise.resolve('.'));

            const deploy = new Deploy(path, argv, options, new Writable());

            return deploy.exec().then(() => {
                expect(mockDeployMultiple).toHaveBeenCalledWith(
                    ['aaa', 'aab', 'zzz'],
                    argv,
                    options,
                    expect.any(Writable),
                    {}
                );
            });
        });

        it('should reject if no services found', () => {
            expect.assertions(1);

            const services = { aaa: true, aab: true };
            mockDiscoverServices.mockReturnValueOnce(Promise.resolve(services));

            const deploy = new Deploy(path, argv, options, new Writable());

            return expect(deploy.exec('zzz')).rejects.toBeInstanceOf(
                Errors.CantFindService
            );
        });
    });
});
