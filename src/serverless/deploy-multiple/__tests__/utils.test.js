'use strict';

const { wireHooks } = require('../utils');

describe('wireHooks', () => {
    const params = {};
    const globalContext = {};
    const tasks = ['task'];
    const hook = {
        title: 'hook',
        task: jest.fn()
    };
    const mockContext = {};
    const mockTask = jest.fn();

    beforeEach(() => {
        hook.task.mockClear();
    });

    it('should returns tasks if no hooks provided', () => {
        expect(wireHooks(params, globalContext, tasks)).toBe(tasks);
    });

    it('should wire single before hook', () => {
        const result = wireHooks(params, globalContext, tasks, hook);
        expect(result).toHaveLength(2);
        expect(result[1]).toBe(tasks[0]);
        expect(result[0].title).toBe(hook.title);

        result[0].task(mockContext, mockTask);

        expect(hook.task).toBeCalledWith(
            mockContext,
            mockTask,
            params,
            globalContext
        );
    });

    it('should wire single after hook', () => {
        const result = wireHooks(params, globalContext, tasks, undefined, hook);
        expect(result).toHaveLength(2);
        expect(result[0]).toBe(tasks[0]);
        expect(result[1].title).toBe(hook.title);

        result[1].task(mockContext, mockTask);

        expect(hook.task).toBeCalledWith(
            mockContext,
            mockTask,
            params,
            globalContext
        );
    });

    it('should wire array of before hooks', () => {
        const result = wireHooks(params, globalContext, tasks, [hook]);
        expect(result).toHaveLength(2);
        expect(result[1]).toBe(tasks[0]);
        expect(result[0].title).toBe(hook.title);

        result[0].task(mockContext, mockTask);

        expect(hook.task).toBeCalledWith(
            mockContext,
            mockTask,
            params,
            globalContext
        );
    });

    it('should wire array of after hooks', () => {
        const result = wireHooks(params, globalContext, tasks, undefined, [
            hook
        ]);
        expect(result).toHaveLength(2);
        expect(result[0]).toBe(tasks[0]);
        expect(result[1].title).toBe(hook.title);

        result[1].task(mockContext, mockTask);

        expect(hook.task).toBeCalledWith(
            mockContext,
            mockTask,
            params,
            globalContext
        );
    });
});
