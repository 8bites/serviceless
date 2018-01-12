'use strict';

const chalk = require('chalk');

const adjustTime = num => {
    if (num < 10) {
        num = '0' + num;
    }
    return num;
};
const now = () => {
    const date = new Date();

    return `${adjustTime(date.getHours())}:${adjustTime(
        date.getMinutes()
    )}:${adjustTime(date.getSeconds())}`;
};

module.exports = {
    log(message) {
        // eslint-disable-next-line no-console
        console.log(`${chalk.gray(`[${now()}][Serviceless]:`)} ${message}`);
    },
    error(err) {
        // eslint-disable-next-line no-console
        console.error(err);
    }
};
