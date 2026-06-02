/* eslint-disable vue/one-component-per-file */
import { Component } from 'vue';
import { Validated } from './types';

function propertiesWithValues (...props: (string | object)[]) {
    const result = props.reduce((prev, next) => {
        // stubs don't like to have hyphens in the props when provided.  Convert to camelCase
        if (typeof (next) === 'string' && next.includes('-')) {
            // replaces the match with just the upperCase of the next character after the hyphen
            next = next.replace(/-([a-z])/g, function (match) {
                return match[1].toUpperCase();
            });
        }

        // array of functions (ie. rules), return function names, else if object, return JSON.stringify, else return value
        return prev + `<li v-if="typeof(${next}) !== 'undefined'">
                <div v-if="Array.isArray(${next})">
                    <div v-if="${next}?.some(x => typeof x === 'function')">
                        ${next}-{{ JSON.stringify(${next}.map(x => x.name)) }}
                    </div>
                    <div v-else>
                        ${next}-{{ typeof(${next}) === 'object' ? JSON.stringify(${next}) : ${next} }}
                    </div>
                </div>
                <div v-else>
                    ${next}-{{ typeof(${next}) === 'object' ? JSON.stringify(${next}) : ${next} }}
                </div>
            </li>`;
    }, '');
    return result;
}

export type EmittedEvent = {
    name: string;
    /** Single value to emit: $emit(name, value). Ignored when `values` is provided. */
    value?: any;
    /** Multiple values to emit: $emit(name, ...values). Takes precedence over `value`. */
    values?: any[];
};

/*
Unified stub configuration. Every dimension is optional except componentName,
so this one shape replaces the props / emitting / validate variants.
*/
export interface StubOptions {
    componentName: string;
    /** Prop names (or objects) to accept and render as `propName-value`. */
    props?: (string | object)[];
    /** Events the stub can emit; each renders a button labelled with its name. */
    events?: EmittedEvent[];
    /**
     * Expose a tracking `validate()` method (and `resetValidation()`).
     * `true` validates as valid; pass `{ isValid: false }` to validate as invalid.
     * When enabled the template renders `{componentName}-stub-validated-{true|false}`.
     */
    validate?: boolean | { isValid?: boolean };
    /**
     * Caller-supplied mock functions merged into the stub's `methods`,
     * e.g. `{ reset: vi.fn() }`. Keep a reference to assert calls in your test.
     * The library stays test-framework agnostic — you provide the spy.
     */
    spies?: Record<string, (...args: any[]) => any>;
}

// Normalise an event's emit arguments: `values` wins, else single `value`, else none.
const eventArgs = (event: EmittedEvent): any[] => {
    if (Array.isArray(event.values)) {
        return event.values;
    }
    return 'value' in event ? [event.value] : [];
};

/*
Usage:
// Legacy string form (unchanged):
const stubs = { ...getStub('{componentName}')};

// Object form — combine any of props / events / validate / spies:
const stubs = { ...getStub({ componentName: '{componentName}', props: ['title'] })};
const stubs = { ...getStub({
    componentName: '{componentName}',
    props: ['title', 'count'],
    events: [{ name: 'save', value: { id: 1 } }, { name: 'cancel' }],
    validate: { isValid: false },
    spies: { reset: vi.fn() },
})};

const component = screen.getByText('{componentName}-stub');
*/
export function getStub (componentName: string): Record<string, any>;
export function getStub (options: StubOptions): Record<string, any>;
export function getStub (arg: string | StubOptions): Record<string, any> {
    // Legacy string form: preserved byte-for-byte.
    if (typeof arg === 'string') {
        const stub: any = { };
        stub[arg] = { template: `<div>${arg}-stub</div>`, name: arg + '-stub' };
        return stub;
    }

    const { componentName, props, events, validate, spies } = arg;
    const validateEnabled = !!validate;
    const isValid = typeof validate === 'object' ? validate.isValid !== false : true;

    // Build the template from only the parts that were requested.
    const validatedSuffix = validateEnabled ? '-validated-{{validateCalled}}' : '';
    const propsBlock = props && props.length
        ? `<ul>${propertiesWithValues(...props)}</ul>`
        : '';
    const eventsBlock = events && events.length
        ? '<button v-for="event in events" @click="$emit(event.name, ...event.args)">{{event.name}}</button>'
        : '';

    // Form lifecycle no-ops are always exposed (matching the legacy emitting stubs)
    // so parents that call child.reset()/validate() over a ref don't blow up.
    const methods: Record<string, any> = {
        // eslint-disable-next-line require-await
        validate: async (): Promise<Validated> => ({ valid: true, errors: [] }),
        reset: () => {},
        resetValidation: () => {},
    };
    if (validateEnabled) {
        // Upgrade validate to track calls and honour isValid.
        // eslint-disable-next-line require-await
        methods.validate = async function (): Promise<Validated> {
            (this as any).$data.validateCalled = true;
            return { valid: isValid, errors: [] };
        };
    }
    // Spies are merged last so callers can override any default method.
    Object.assign(methods, spies);

    const stub: any = { };
    stub[componentName] = {
        name: componentName + '-stub',
        template: `
            <div>
                ${componentName}-stub${validatedSuffix}
                ${propsBlock}
                ${eventsBlock}
            </div>
        `,
        props: props ?? [],
        data () {
            return {
                validateCalled: false,
                // Pre-normalised emit args so the template stays simple.
                events: (events ?? []).map(e => ({ name: e.name, args: eventArgs(e) })),
            };
        },
        methods,
    };
    return stub;
}

/**
 * @deprecated Use `getStub({ componentName, props: [...] })` instead.
 *
 * Usage:
 * const stubs = { ...getStubWithProps('{componentName}', 'property1', 'property2', 'property-three', 'propertyFour')};
 *
 * const component = screen.getByText('{componentName}-stub');
 * const component = screen.getByText('{propertyName}-{expectedValue}');
 */
export const getStubWithProps = (componentName: string, ...props: (string | object)[]) => {
    const stub: any = { };

    stub[componentName] = {
        name: componentName + '-stubWithProps',
        template: `
            <div>
                ${componentName}-stub
                <ul>
                    ${propertiesWithValues(...props)}
                </ul>
            </div>
        `,
        props,
    };
    return stub;
};

/**
 * @deprecated Use `getStub({ componentName, events: [{ name, values: [...] }] })` instead.
 *
 * Usage:
 * const stubs = { ...getEmittingStub('{componentName}', '{emittingEvent}')};
 * const stubs = { ...getEmittingStub('{componentName}', '{emittingEvent}', emittedValue1, emittedValue2, etc.)};
 *
 * const button = screen.getByRole('button', { name: '{emittingEvent}' });
 */
export const getEmittingStub = (componentName: string, emittedEvent: string, ...emittedValues: any[]) => {
    const stub: any = { };
    stub[componentName] = {
        name: componentName + '-emittingStub',
        template: `
        <div>
            <div>
                ${componentName}-stub
            </div>
            <button @click="$emit('${emittedEvent}', ...emittedValues)">${emittedEvent}</button>
        </div>
        `,
        data () {
            return {
                emittedValues,
            };
        },
        methods: {
            // eslint-disable-next-line require-await
            validate: async (): Promise<Validated> => ({ valid: true, errors: [] }),
            reset: () => {},
            resetValidation: () => {},
        },
    };

    return stub;
};

/**
 * @deprecated Use `getStub({ componentName, props: [...], events: [{ name, values: [...] }] })` instead.
 *
 * Usage:
 * const stubs = { ...getEmittingStubWithProps('{componentName}', '{emittingEvent}')};
 * const stubs = { ...getEmittingStubWithProps('{componentName}', '{emittingEvent}', [emittedValue1, emittedValue2], 'property1', 'property2', etc.)};
 *
 * const button = screen.getByRole('button', { name: '{emittingEvent}' });
 * const component = screen.getByText('{componentName}-stub');
 * const propWithValue = screen.getByText('{propertyName}-{expectedValue}');
 */
export const getEmittingStubWithProps = (componentName: string, emittedEvent: string, emittedValues: any[], ...props: (string | object)[]) => {
    const stub: any = { };

    stub[componentName] = {
        name: componentName + '-emittingStubWithProps',
        template: `
        <div>
            ${componentName}-stub
            <ul>
                ${propertiesWithValues(...props)}
            </ul>
            <button @click="$emit('${emittedEvent}', ...emittedValues)">${emittedEvent}</button>
        </div>
        `,
        data () {
            return {
                emittedValues,
            };
        },
        props,
        methods: {
            // eslint-disable-next-line require-await
            validate: async (): Promise<Validated> => ({ valid: true, errors: [] }),
            reset: () => {},
            resetValidation: () => {},
        },
    };

    return stub;
};

/**
 * @deprecated Use `getStub({ componentName, props: [...], events: [{ name, value }] })` instead.
 *
 * Usage:
 * const stubs = { ...getMultiEmittingStubWithProps('{componentName}', [{ name: '{event1}', value: 'value1' }, { name: '{event2}' }])};
 * const stubs = { ...getMultiEmittingStubWithProps('{componentName}', [{ name: '{event1}', value: 'value1' }], 'property1', 'property2')};
 *
 * const button = screen.getByRole('button', { name: '{event1}' });
 * const component = screen.getByText('{componentName}-stub');
 * const propWithValue = screen.getByText('{propertyName}-{expectedValue}');
 */
export const getMultiEmittingStubWithProps = (
    componentName: string,
    events: EmittedEvent[],
    ...props: (string | object)[]
) => {
    const stub: any = {};

    stub[componentName] = {
        name: componentName + '-multiEmittingStubWithProps',
        template: `
        <div>
            ${componentName}-stub
            <ul>
                ${propertiesWithValues(...props)}
            </ul>
            <button v-for="event in events" @click="$emit(event.name, event.value)">{{event.name}}</button>
        </div>
        `,
        data () {
            return {
                events,
            };
        },
        props,
        methods: {
            // eslint-disable-next-line require-await
            validate: async (): Promise<Validated> => ({ valid: true, errors: [] }),
            reset: () => {},
            resetValidation: () => {},
        },
    };

    return stub;
};

/**
 * @deprecated Use `getStub({ componentName, validate: true })` (or `{ isValid: false }`) instead.
 *
 * Creates a stub which will confirm that a parent component correctly calls the child component's exposed validate function.
 * Usage:
 * stubs = { ...getExposedValidateStub('<component_name'>)};
 *
 * Testing:
 * screen.getByText('<component_name>-stub-validated-true');
 * screen.getByText('<component_name>-stub-validated-false');
 */
export const getExposedValidateStub = (componentName: string, isValid: boolean = true) => {
    const stub: any = { };
    stub[componentName] = {
        name: componentName + '-exposedValidateStub',
        template: `
            <div>
                ${componentName}-stub-validated-{{validateCalled}}
            </div>`,
        methods: {
            // eslint-disable-next-line require-await
            validate: async function (): Promise<Validated> {
                (this as any).$data.validateCalled = true;
                return { valid: isValid, errors: [] };
            },
            resetValidation: () => {},
        },
        data () {
            return {
                validateCalled: false,
            };
        },
    };

    return stub;
};
/**
 * @deprecated Use `getStub({ componentName, props: [...], validate: true })` (or `{ isValid: false }`) instead.
 */
export const getExposedValidateStubWithProps = (componentName: string, isValid: boolean = true, ...props: (string | object)[]) => {
    const stub: any = { };
    stub[componentName] = {
        name: componentName + '-exposedValidateStubWithProps',
        template: `
            <div>
                ${componentName}-stub-validated-{{validateCalled}}
                <ul>
                    ${propertiesWithValues(...props)}
                </ul>
            </div>`,
        methods: {
            // eslint-disable-next-line require-await
            validate: async function (): Promise<Validated> {
                (this as any).$data.validateCalled = true;
                return { valid: isValid, errors: [] };
            },
            resetValidation: () => {},
        },
        data () {
            return {
                validateCalled: false,
            };
        },
        props,
    };

    return stub;
};

/*
Provides the ability to call an exposed function from a component.
*/
export const getTemplateComponentForExposedFunction = (componentAlias: Component, exposedFn: string, props?: object) => {
    let propIdentifiersForComponentAlias = '';
    const localProps = {} as any;

    if (props) {
        // Looks like => :value="value" :lineItems="lineItems"
        propIdentifiersForComponentAlias = Object.keys(props).reduce((prev, next) => {
            return prev + `:${next}="${next}" `;
        }, '');

        // Template requires the individual props as an object or array only.  render() will pass the real prop values through.
        Object.keys(props).forEach((x) => {
            localProps[x] = { };
        });
    }

    return {
        name: componentAlias + '-withExposedFunction',
        template: `
            <div>
                <component-alias ${propIdentifiersForComponentAlias} ref="ref" />
                <button @click="exposedFn">${exposedFn}</button>
            </div>
        `,
        components: { componentAlias },
        props: localProps,
        methods: {
            exposedFn: function () {
                (this as any).$refs.ref[exposedFn]();
            },
        },
    };
};
