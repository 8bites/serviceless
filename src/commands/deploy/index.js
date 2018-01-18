'use strict';

const Path = require('path');
const isEmpty = require('lodash/isEmpty');
const pick = require('lodash/pick');
const Cli = require('../../cli');
const deployMultiple = require('../../serverless/deploy-multiple');
const Errors = require('../../common/errors');
const discoverServices = require('../../utils/discover-services');
const groupServices = require('../../utils/group-services');

class DeployCommand {
    constructor(path, argv, options, logStream) {
        this.argv = argv;
        this.options = options;
        this.cli = new Cli();
        this.basePath = path;
        this.logStream = logStream;
    }

    _loadServices() {
        return discoverServices(this.basePath).then(services => {
            this.services = services;
            this.serviceGroups = groupServices(this.services);
        });
    }

    _deploy(paths) {
        return deployMultiple(
            typeof paths === 'string' ? this._normalizePath(paths) : paths,
            this.argv,
            this.options,
            this.logStream,
            // empty hooks, replace when will be implemented
            {}
        );
    }

    _findService(query) {
        const matchServices = Object.keys(this.services).filter(
            service => service.indexOf(query) > -1
        );

        if (matchServices.length === 0) {
            return Promise.reject(new Errors.CantFindService(query));
        } else {
            return Promise.resolve(matchServices);
        }
    }

    _normalizePath(path) {
        const services = Object.keys(this.services);

        if (path === '.') {
            return path in this.services ? [path] : services;
        } else {
            return services
                .filter(servicePath => servicePath.indexOf(path) === 0)
                .map(path => Path.join(this.basePath, path));
        }
    }

    exec(service) {
        return this._loadServices().then(() => {
            if (isEmpty(this.services)) {
                return Promise.reject(
                    new Errors.NoServerlessConfigFoundError()
                );
            }

            if (service === 'all') {
                return deployMultiple(
                    Object.keys(this.services),
                    this.argv,
                    this.options,
                    this.logStream,
                    {}
                );
            } else if (service) {
                return this._findService(service).then(paths =>
                    this._deploy(paths)
                );
            } else {
                return this.cli
                    .selectService(this.serviceGroups)
                    .then(path => this._deploy(path));
            }
        });
    }
}

module.exports = DeployCommand;
