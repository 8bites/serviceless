'use strict';

const path = require('path');
const fs = require('fs-extra');
const discoverServices = require('../discover-services');

describe('discover-services', () => {
    const tmpPath = path.resolve(`.tmp-${Date.now()}`);

    beforeEach(() => {
        return fs.mkdir(tmpPath);
    });

    afterEach(() => {
        return fs.remove(tmpPath);
    });

    it('returns empty list for empty directory', () => {
        expect(discoverServices(tmpPath)).resolves.toEqual([]);
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
                return expect(discoverServices(tmpPath)).resolves.toEqual([
                    service1Path,
                    service2Path
                ]);
            });
    });

    it('returns nested services', () => {
        const service1Path = path.join(tmpPath, '1');
        const service2Path = path.join(service1Path, '2');

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
                return expect(discoverServices(tmpPath)).resolves.toEqual([
                    service1Path,
                    service2Path
                ]);
            });
    });
});