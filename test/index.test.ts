import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { render, screen } from '@testing-library/vue';
import userEvent from '@testing-library/user-event';
import {
    getStub,
    getStubWithProps,
    getEmittingStub,
    getEmittingStubWithProps,
    getMultiEmittingStubWithProps,
    getExposedValidateStub,
    getExposedValidateStubWithProps,
    getTemplateComponentForExposedFunction,
    type EmittedEvent,
} from '../src/index';
import { defineComponent } from 'vue';

describe('getStub', () => {
    it('should create a basic stub with component name', () => {
        const stub = getStub('MyComponent');

        expect(stub).toHaveProperty('MyComponent');
        expect(stub.MyComponent.name).toBe('MyComponent-stub');
        expect(stub.MyComponent.template).toBe('<div>MyComponent-stub</div>');
    });

    it('should render the stub component', () => {
        const stub = getStub('TestComponent');
        const wrapper = mount(stub.TestComponent);

        expect(wrapper.text()).toContain('TestComponent-stub');
    });
});

describe('getStubWithProps', () => {
    it('should create a stub with string props', () => {
        const stub = getStubWithProps('MyComponent', 'propOne', 'propTwo');

        expect(stub).toHaveProperty('MyComponent');
        expect(stub.MyComponent.name).toBe('MyComponent-stubWithProps');
        expect(stub.MyComponent.props).toEqual(['propOne', 'propTwo']);
    });

    it('should handle hyphenated prop names by converting to camelCase', () => {
        const stub = getStubWithProps('MyComponent', 'prop-name', 'another-prop');

        expect(stub.MyComponent.template).toContain('propName');
        expect(stub.MyComponent.template).toContain('anotherProp');
    });

    it('should render props with their values', () => {
        const stub = getStubWithProps('MyComponent', 'title', 'count');
        const wrapper = mount(stub.MyComponent, {
            props: {
                title: 'Hello World',
                count: 42,
            },
        });

        expect(wrapper.text()).toContain('MyComponent-stub');
        expect(wrapper.text()).toContain('title-Hello World');
        expect(wrapper.text()).toContain('count-42');
    });

    it('should render object props as JSON', () => {
        const stub = getStubWithProps('MyComponent', 'config');
        const wrapper = mount(stub.MyComponent, {
            props: {
                config: { foo: 'bar', nested: { value: 123 } },
            },
        });

        expect(wrapper.text()).toContain('config');
        expect(wrapper.text()).toContain('"foo":"bar"');
    });

    it('should render array props as JSON', () => {
        const stub = getStubWithProps('MyComponent', 'items');
        const wrapper = mount(stub.MyComponent, {
            props: {
                items: ['item1', 'item2', 'item3'],
            },
        });

        expect(wrapper.text()).toContain('items');
        expect(wrapper.text()).toContain('item1');
    });

    it('should handle array of functions by showing function names', () => {
        const stub = getStubWithProps('MyComponent', 'rules');
        const namedFunction1 = function validateEmail() { return true; };
        const namedFunction2 = function validateLength() { return true; };

        const wrapper = mount(stub.MyComponent, {
            props: {
                rules: [namedFunction1, namedFunction2],
            },
        });

        expect(wrapper.text()).toContain('rules');
        expect(wrapper.text()).toContain('validateEmail');
        expect(wrapper.text()).toContain('validateLength');
    });

    it('should not render undefined props', () => {
        const stub = getStubWithProps('MyComponent', 'definedProp', 'undefinedProp');
        const wrapper = mount(stub.MyComponent, {
            props: {
                definedProp: 'value',
            },
        });

        expect(wrapper.text()).toContain('definedProp');
        expect(wrapper.text()).not.toContain('undefinedProp');
    });
});

describe('getEmittingStub', () => {
    it('should create a stub that can emit events', () => {
        const stub = getEmittingStub('MyComponent', 'submit');

        expect(stub).toHaveProperty('MyComponent');
        expect(stub.MyComponent.name).toBe('MyComponent-emittingStub');
    });

    it('should emit events when button is clicked', async () => {
        const stub = getEmittingStub('MyComponent', 'save');
        const wrapper = mount(stub.MyComponent);

        await wrapper.find('button').trigger('click');

        expect(wrapper.emitted()).toHaveProperty('save');
        expect(wrapper.emitted('save')!.length).toBeGreaterThan(0);
    });

    it('should emit events with values', async () => {
        const stub = getEmittingStub('MyComponent', 'update', 'value1', 42, { key: 'value' });
        const wrapper = mount(stub.MyComponent);

        await wrapper.find('button').trigger('click');

        expect(wrapper.emitted('update')).toBeTruthy();
        expect(wrapper.emitted('update')![0]).toEqual(['value1', 42, { key: 'value' }]);
    });

    it('should have validate, reset, and resetValidation methods', () => {
        const stub = getEmittingStub('MyComponent', 'submit');

        expect(stub.MyComponent.methods.validate).toBeDefined();
        expect(stub.MyComponent.methods.reset).toBeDefined();
        expect(stub.MyComponent.methods.resetValidation).toBeDefined();
    });

    it('should validate method return valid result', async () => {
        const stub = getEmittingStub('MyComponent', 'submit');
        const result = await stub.MyComponent.methods.validate();

        expect(result).toEqual({ valid: true, errors: [] });
    });
});

describe('getEmittingStubWithProps', () => {
    it('should create a stub with both props and emitting capabilities', () => {
        const stub = getEmittingStubWithProps('MyComponent', 'save', ['data'], 'title', 'count');

        expect(stub).toHaveProperty('MyComponent');
        expect(stub.MyComponent.name).toBe('MyComponent-emittingStubWithProps');
        expect(stub.MyComponent.props).toEqual(['title', 'count']);
    });

    it('should render props and emit events', async () => {
        const stub = getEmittingStubWithProps('MyComponent', 'submit', [{ foo: 'bar' }], 'title');
        const wrapper = mount(stub.MyComponent, {
            props: {
                title: 'Test Title',
            },
        });

        expect(wrapper.text()).toContain('title-Test Title');

        await wrapper.find('button').trigger('click');
        expect(wrapper.emitted('submit')).toBeTruthy();
        expect(wrapper.emitted('submit')![0]).toEqual([{ foo: 'bar' }]);
    });

    it('should have validation methods', () => {
        const stub = getEmittingStubWithProps('MyComponent', 'save', [], 'prop1');

        expect(stub.MyComponent.methods.validate).toBeDefined();
        expect(stub.MyComponent.methods.reset).toBeDefined();
        expect(stub.MyComponent.methods.resetValidation).toBeDefined();
    });
});

describe('getMultiEmittingStubWithProps', () => {
    it('should create a stub with multiple events', () => {
        const events: EmittedEvent[] = [
            { name: 'save', value: 'saveData' },
            { name: 'cancel', value: null },
        ];
        const stub = getMultiEmittingStubWithProps('MyComponent', events, 'title');

        expect(stub).toHaveProperty('MyComponent');
        expect(stub.MyComponent.name).toBe('MyComponent-multiEmittingStubWithProps');
    });

    it('should emit multiple different events', async () => {
        const events: EmittedEvent[] = [
            { name: 'save', value: 'saveData' },
            { name: 'cancel', value: 'cancelData' },
            { name: 'delete' },
        ];
        const stub = getMultiEmittingStubWithProps('MyComponent', events);
        const wrapper = mount(stub.MyComponent);

        const buttons = wrapper.findAll('button');
        expect(buttons).toHaveLength(3);

        await buttons[0].trigger('click');
        expect(wrapper.emitted('save')).toBeTruthy();
        expect(wrapper.emitted('save')![0]).toEqual(['saveData']);

        await buttons[1].trigger('click');
        expect(wrapper.emitted('cancel')).toBeTruthy();
        expect(wrapper.emitted('cancel')![0]).toEqual(['cancelData']);

        await buttons[2].trigger('click');
        expect(wrapper.emitted('delete')).toBeTruthy();
        expect(wrapper.emitted('delete')![0]).toEqual([undefined]);
    });

    it('should render props along with multiple event buttons', async () => {
        const events: EmittedEvent[] = [
            { name: 'update', value: 123 },
        ];
        const stub = getMultiEmittingStubWithProps('MyComponent', events, 'status');
        const wrapper = mount(stub.MyComponent, {
            props: {
                status: 'active',
            },
        });

        expect(wrapper.text()).toContain('status-active');
        expect(wrapper.find('button').text()).toBe('update');
    });
});

describe('getExposedValidateStub', () => {
    it('should create a stub with exposed validate function', () => {
        const stub = getExposedValidateStub('MyComponent');

        expect(stub).toHaveProperty('MyComponent');
        expect(stub.MyComponent.name).toBe('MyComponent-exposedValidateStub');
        expect(stub.MyComponent.methods.validate).toBeDefined();
    });

    it('should show validateCalled as false initially', () => {
        const stub = getExposedValidateStub('MyComponent');
        const wrapper = mount(stub.MyComponent);

        expect(wrapper.text()).toContain('MyComponent-stub-validated-false');
    });

    it('should change validateCalled to true when validate is called', async () => {
        const stub = getExposedValidateStub('MyComponent');
        const wrapper = mount(stub.MyComponent);

        const instance = wrapper.vm as any;
        await instance.validate();
        await wrapper.vm.$nextTick();

        expect(wrapper.text()).toContain('MyComponent-stub-validated-true');
    });

    it('should return valid result when isValid is true', async () => {
        const stub = getExposedValidateStub('MyComponent', true);
        const wrapper = mount(stub.MyComponent);

        const result = await (wrapper.vm as any).validate();
        expect(result).toEqual({ valid: true, errors: [] });
    });

    it('should return invalid result when isValid is false', async () => {
        const stub = getExposedValidateStub('MyComponent', false);
        const wrapper = mount(stub.MyComponent);

        const result = await (wrapper.vm as any).validate();
        expect(result).toEqual({ valid: false, errors: [] });
    });

    it('should have resetValidation method', () => {
        const stub = getExposedValidateStub('MyComponent');

        expect(stub.MyComponent.methods.resetValidation).toBeDefined();
    });
});

describe('getExposedValidateStubWithProps', () => {
    it('should create a stub with validation and props', () => {
        const stub = getExposedValidateStubWithProps('MyComponent', true, 'email', 'password');

        expect(stub).toHaveProperty('MyComponent');
        expect(stub.MyComponent.name).toBe('MyComponent-exposedValidateStubWithProps');
        expect(stub.MyComponent.props).toEqual(['email', 'password']);
    });

    it('should render props and show validation state', async () => {
        const stub = getExposedValidateStubWithProps('MyComponent', true, 'username');
        const wrapper = mount(stub.MyComponent, {
            props: {
                username: 'testuser',
            },
        });

        expect(wrapper.text()).toContain('username-testuser');
        expect(wrapper.text()).toContain('MyComponent-stub-validated-false');

        await (wrapper.vm as any).validate();
        await wrapper.vm.$nextTick();

        expect(wrapper.text()).toContain('MyComponent-stub-validated-true');
    });

    it('should support different validation states', async () => {
        const validStub = getExposedValidateStubWithProps('ValidComponent', true, 'prop1');
        const validWrapper = mount(validStub.ValidComponent);
        const validResult = await (validWrapper.vm as any).validate();
        expect(validResult.valid).toBe(true);

        const invalidStub = getExposedValidateStubWithProps('InvalidComponent', false, 'prop1');
        const invalidWrapper = mount(invalidStub.InvalidComponent);
        const invalidResult = await (invalidWrapper.vm as any).validate();
        expect(invalidResult.valid).toBe(false);
    });
});

describe('getTemplateComponentForExposedFunction', () => {
    it('should create a wrapper component that can call exposed functions', () => {
        const mockComponent = defineComponent({
            name: 'MockComponent',
            template: '<div>Mock Component</div>',
            methods: {
                exposedMethod() {
                    return 'called';
                },
            },
        });

        const wrapper = getTemplateComponentForExposedFunction(
            mockComponent as any,
            'exposedMethod'
        );

        expect(wrapper.name).toBe(mockComponent + '-withExposedFunction');
        expect(wrapper.methods.exposedFn).toBeDefined();
    });

    it('should call the exposed function when button is clicked', async () => {
        const mockComponent = defineComponent({
            name: 'MockComponent',
            template: '<div>Mock Component</div>',
            setup() {
                return {
                    callCount: 0,
                };
            },
            methods: {
                testMethod() {
                    (this as any).callCount++;
                },
            },
        });

        const wrapperComponent = getTemplateComponentForExposedFunction(
            mockComponent as any,
            'testMethod'
        );

        const wrapper = mount(wrapperComponent);

        const refComponent = (wrapper.vm as any).$refs.ref;
        const initialCallCount = refComponent.callCount;

        await wrapper.find('button').trigger('click');

        expect(refComponent.callCount).toBeGreaterThan(initialCallCount);
    });

    it('should handle props correctly', () => {
        const mockComponent = defineComponent({
            name: 'MockComponent',
            template: '<div>{{ value }}</div>',
            props: {
                value: String,
                count: Number,
            },
            methods: {
                reset() {},
            },
        });

        const wrapperComponent = getTemplateComponentForExposedFunction(
            mockComponent as any,
            'reset',
            { value: 'test', count: 42 }
        );

        expect(wrapperComponent.props).toHaveProperty('value');
        expect(wrapperComponent.props).toHaveProperty('count');
    });

    it('should work without props', () => {
        const mockComponent = defineComponent({
            name: 'MockComponent',
            template: '<div>No Props</div>',
            methods: {
                submit() {},
            },
        });

        const wrapperComponent = getTemplateComponentForExposedFunction(
            mockComponent as any,
            'submit'
        );

        expect(wrapperComponent.name).toBe(mockComponent + '-withExposedFunction');
        const wrapper = mount(wrapperComponent);

        expect(wrapper.exists()).toBe(true);
    });
});

describe('getStub (object form)', () => {
    it('should create a basic stub from options', () => {
        const stub = getStub({ componentName: 'MyComponent' });

        expect(stub).toHaveProperty('MyComponent');
        expect(stub.MyComponent.name).toBe('MyComponent-stub');

        const wrapper = mount(stub.MyComponent);
        expect(wrapper.text()).toContain('MyComponent-stub');
    });

    it('should render props', () => {
        const stub = getStub({ componentName: 'MyComponent', props: ['title', 'count'] });
        expect(stub.MyComponent.props).toEqual(['title', 'count']);

        const wrapper = mount(stub.MyComponent, { props: { title: 'Hello', count: 42 } });
        expect(wrapper.text()).toContain('title-Hello');
        expect(wrapper.text()).toContain('count-42');
    });

    it('should emit a single event with a value', async () => {
        const stub = getStub({
            componentName: 'MyComponent',
            events: [{ name: 'save', value: { id: 123 } }],
        });
        const wrapper = mount(stub.MyComponent);

        await wrapper.find('button').trigger('click');
        expect(wrapper.emitted('save')![0]).toEqual([{ id: 123 }]);
    });

    it('should emit an event with multiple values', async () => {
        const stub = getStub({
            componentName: 'MyComponent',
            events: [{ name: 'update', values: ['a', 42, { k: 'v' }] }],
        });
        const wrapper = mount(stub.MyComponent);

        await wrapper.find('button').trigger('click');
        expect(wrapper.emitted('update')![0]).toEqual(['a', 42, { k: 'v' }]);
    });

    it('should emit no args for a valueless event', async () => {
        const stub = getStub({ componentName: 'MyComponent', events: [{ name: 'click' }] });
        const wrapper = mount(stub.MyComponent);

        await wrapper.find('button').trigger('click');
        expect(wrapper.emitted('click')![0]).toEqual([]);
    });

    it('should render a button per event', async () => {
        const stub = getStub({
            componentName: 'MyComponent',
            events: [{ name: 'save', value: 1 }, { name: 'cancel' }, { name: 'delete' }],
        });
        const wrapper = mount(stub.MyComponent);

        const cancelButton = wrapper.findAll('button').find(b => b.text() === 'cancel')!;
        await cancelButton.trigger('click');
        expect(wrapper.emitted('cancel')![0]).toEqual([]);
    });

    it('should expose a tracking validate method (valid by default)', async () => {
        const stub = getStub({ componentName: 'MyComponent', validate: true });
        const wrapper = mount(stub.MyComponent);

        expect(wrapper.text()).toContain('MyComponent-stub-validated-false');

        const result = await (wrapper.vm as any).validate();
        await wrapper.vm.$nextTick();

        expect(result).toEqual({ valid: true, errors: [] });
        expect(wrapper.text()).toContain('MyComponent-stub-validated-true');
    });

    it('should validate as invalid when isValid is false', async () => {
        const stub = getStub({ componentName: 'MyComponent', validate: { isValid: false } });
        const wrapper = mount(stub.MyComponent);

        const result = await (wrapper.vm as any).validate();
        expect(result).toEqual({ valid: false, errors: [] });
    });

    it('should wire caller-supplied spies into methods', async () => {
        const reset = vi.fn();
        const stub = getStub({ componentName: 'MyComponent', spies: { reset } });
        const wrapper = mount(stub.MyComponent);

        (wrapper.vm as any).reset('arg');
        expect(reset).toHaveBeenCalledWith('arg');
    });

    it('should let spies override default validate', async () => {
        const validate = vi.fn();
        const stub = getStub({ componentName: 'MyComponent', validate: true, spies: { validate } });
        const wrapper = mount(stub.MyComponent);

        (wrapper.vm as any).validate();
        expect(validate).toHaveBeenCalled();
    });

    it('should combine props, events and validate together', async () => {
        const stub = getStub({
            componentName: 'MyComponent',
            props: ['title'],
            events: [{ name: 'save', value: 'data' }],
            validate: true,
        });
        const wrapper = mount(stub.MyComponent, { props: { title: 'Combined' } });

        expect(wrapper.text()).toContain('title-Combined');
        expect(wrapper.text()).toContain('MyComponent-stub-validated-false');

        await wrapper.find('button').trigger('click');
        expect(wrapper.emitted('save')![0]).toEqual(['data']);
    });

    it('should default props to an empty array when omitted', () => {
        const stub = getStub({ componentName: 'MyComponent' });
        expect(stub.MyComponent.props).toEqual([]);
    });

    it('should always expose no-op validate, reset and resetValidation', async () => {
        const stub = getStub({ componentName: 'MyComponent' });

        expect(stub.MyComponent.methods.validate).toBeDefined();
        expect(stub.MyComponent.methods.reset).toBeDefined();
        expect(stub.MyComponent.methods.resetValidation).toBeDefined();

        const result = await stub.MyComponent.methods.validate();
        expect(result).toEqual({ valid: true, errors: [] });
    });

    it('should not error when a parent calls reset over a ref', () => {
        const stub = getStub({ componentName: 'MyComponent', events: [{ name: 'save' }] });
        const wrapper = mount(stub.MyComponent);

        expect(() => (wrapper.vm as any).reset()).not.toThrow();
    });
});

describe('Edge cases and integration', () => {
    it('should handle empty props array', () => {
        const stub = getStubWithProps('MyComponent');

        expect(stub.MyComponent.props).toEqual([]);
    });

    it('should handle multiple hyphens in prop names', () => {
        const stub = getStubWithProps('MyComponent', 'multi-hyphen-prop-name');

        expect(stub.MyComponent.template).toContain('multiHyphenPropName');
    });

    it('should handle props with no hyphens', () => {
        const stub = getStubWithProps('MyComponent', 'regularProp');

        expect(stub.MyComponent.template).toContain('regularProp');
    });

    it('should handle mixed hyphenated and regular props', () => {
        const stub = getStubWithProps('MyComponent', 'regular', 'hyphen-prop', 'anotherRegular');

        expect(stub.MyComponent.template).toContain('regular');
        expect(stub.MyComponent.template).toContain('hyphenProp');
        expect(stub.MyComponent.template).toContain('anotherRegular');
    });

    it('should handle empty emitted values array', async () => {
        const stub = getEmittingStub('MyComponent', 'click');
        const wrapper = mount(stub.MyComponent);

        await wrapper.find('button').trigger('click');

        expect(wrapper.emitted('click')).toBeTruthy();
        expect(wrapper.emitted('click')![0]).toEqual([]);
    });

    it('should handle empty events array in multiEmitting stub', () => {
        const stub = getMultiEmittingStubWithProps('MyComponent', []);
        const wrapper = mount(stub.MyComponent);

        expect(wrapper.findAll('button')).toHaveLength(0);
    });
});

// Mirrors the documented @testing-library/vue usage so the dual-library support
// the README advertises is actually exercised (jest-dom matchers + userEvent + role queries).
describe('getStub with @testing-library/vue', () => {
    it('should render a basic stub', () => {
        const stub = getStub({ componentName: 'ChildComponent' });
        render(stub.ChildComponent);

        expect(screen.getByText('ChildComponent-stub')).toBeVisible();
    });

    it('should render props in testable format', () => {
        const stub = getStub({ componentName: 'ChildComponent', props: ['title', 'count'] });
        render(stub.ChildComponent, { props: { title: 'Hello', count: 42 } });

        expect(screen.getByText(/title-Hello/)).toBeInTheDocument();
        expect(screen.getByText(/count-42/)).toBeInTheDocument();
    });

    it('should emit an event when its button is clicked', async () => {
        const stub = getStub({
            componentName: 'ChildComponent',
            events: [{ name: 'save', value: { id: 123 } }],
        });
        const { emitted } = render(stub.ChildComponent);

        await userEvent.click(screen.getByRole('button', { name: 'save' }));

        expect(emitted()).toHaveProperty('save');
        expect(emitted().save[0]).toEqual([{ id: 123 }]);
    });

    it('should expose a labelled button per event', async () => {
        const stub = getStub({
            componentName: 'ChildComponent',
            events: [{ name: 'save', value: 1 }, { name: 'cancel' }],
        });
        const { emitted } = render(stub.ChildComponent);

        // Each event is addressable by its accessible name — no positional indexing.
        await userEvent.click(screen.getByRole('button', { name: 'cancel' }));

        expect(emitted()).toHaveProperty('cancel');
        expect(emitted().cancel[0]).toEqual([]);
        expect(emitted()).not.toHaveProperty('save');
    });

    it('should render the initial validation state', () => {
        const stub = getStub({ componentName: 'ChildComponent', validate: true });
        render(stub.ChildComponent);

        expect(screen.getByText(/ChildComponent-stub-validated-false/)).toBeVisible();
    });
});
