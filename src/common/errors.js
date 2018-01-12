'use strict';

class BaseError extends Error {
    constructor(message) {
        super(message);
        this.name = this.constructor.name;
    }
}

class NoServerlessConfigFoundError extends BaseError {
    constructor() {
        super('No serverless config found');
    }
}

class CantFindService extends BaseError {
    constructor(query) {
        super(`Could not find service matching query "${query}"`);
    }
}

class ServerlessExecutableNotFoundError extends BaseError {
    constructor() {
        super('Could not find serverless executable');
    }
}

class ServerlessCommandError extends BaseError {
    constructor(code, log) {
        super(`Serverless exited with code ${code}`);
        this.log = log;
    }
}

class CanNotRollback extends BaseError {
    constructor() {
        super('Can not rollback service without previous versions');
    }
}

module.exports = {
    NoServerlessConfigFoundError,
    CantFindService,
    CanNotRollback,
    ServerlessExecutableNotFoundError,
    ServerlessCommandError
};
