'use strict';

const path = require('path');
const fs = require('fs-extra');
const discoverServices = require('../discover-services');

describe('discover-services', () => {
    const tmpPath = `.tmp-${Date.now()}`;

    beforeEach(() => {
        return fs.mkdir(tmpPath);
    });

    afterEach(() => {
        return fs.remove(tmpPath);
    });

    it('returns empty list for empty directory', () => {
        return expect(discoverServices(tmpPath)).resolves.toEqual({});
    });

    it('return list of services', () => {
        const service1Path = path.join(tmpPath, '1');
        const service2Path = path.join(tmpPath, '2');

        return Promise.all([fs.mkdir(service1Path), fs.mkdir(service2Path)])
            .then(() => {
                return Promise.all([
                    fs.outputFile(
                        path.join(service1Path, 'serverless.yml'),
                        ''
                    ),
                    fs.outputFile(path.join(service2Path, 'serverless.js'), '')
                ]);
            })
            .then(() => {
                return expect(discoverServices(tmpPath)).resolves.toEqual({
                    ['1']: path.join(service1Path, 'serverless.yml'),
                    ['2']: path.join(service2Path, 'serverless.js')
                });
            });
    });

    it('returns nested services', () => {
        const rootServicePath = path.join(tmpPath, 'serverless.yml');
        const service1Path = path.join(tmpPath, '1');
        const service2Path = path.join(service1Path, '2');

        return fs
            .mkdir(service1Path)
            .then(() => fs.mkdir(service2Path))
            .then(() => {
                return Promise.all([
                    fs.outputFile(rootServicePath, ''),
                    fs.outputFile(
                        path.join(service1Path, 'serverless.yml'),
                        ''
                    ),
                    fs.outputFile(path.join(service2Path, 'serverless.js'), '')
                ]);
            })
            .then(() => {
                return expect(discoverServices(tmpPath)).resolves.toEqual({
                    '.': rootServicePath,
                    '1': path.join(service1Path, 'serverless.yml'),
                    '1/2': path.join(service2Path, 'serverless.js')
                });
            });
    });
});
