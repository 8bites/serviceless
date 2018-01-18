'use strict';

const wireHooks = (params, globalContext, tasks, before, after) => {
    const createHook = hook => ({
        title: hook.title,
        task: (ctx, task) => hook.task(ctx, task, params, globalContext)
    });

    if (before) {
        if (!Array.isArray(before)) {
            before = [before];
        }
        tasks = [...before.map(createHook), ...tasks];
    }
    if (after) {
        if (!Array.isArray(after)) {
            after = [after];
        }
        tasks = [...tasks, after.map(createHook)];
    }

    return tasks;
};

module.exports = {
    wireHooks
};
