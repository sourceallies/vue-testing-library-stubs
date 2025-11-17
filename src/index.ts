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

/*
Usage:
const stubs = { ...getStub('{componentName}')};

const component = screen.getByText('{componentName}-stub');
*/
export const getStub = (componentName: string) => {
    const stub: any = { };
    stub[componentName] = { template: `<div>${componentName}-stub</div>`, name: componentName + '-stub' };
    return stub;
};

/*
Usage:
const stubs = { ...getStubWithProps('{componentName}', 'property1', 'property2', 'property-three', 'propertyFour')};

const component = screen.getByText('{componentName}-stub');
const component = screen.getByText('{propertyName}-{expectedValue}');
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

/*
Usage:
const stubs = { ...getEmittingStub('{componentName}', '{emittingEvent}')};
const stubs = { ...getEmittingStub('{componentName}', '{emittingEvent}', emittedValue1, emittedValue2, etc.)};

const button = screen.getByRole('button', { name: '{emittingEvent}' });
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

/*
Usage:
const stubs = { ...getEmittingStubWithProps('{componentName}', '{emittingEvent}')};
const stubs = { ...getEmittingStubWithProps('{componentName}', '{emittingEvent}', [emittedValue1, emittedValue2], 'property1', 'property2', etc.)};

const button = screen.getByRole('button', { name: '{emittingEvent}' });
const component = screen.getByText('{componentName}-stub');
const propWithValue = screen.getByText('{propertyName}-{expectedValue}');
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

export type EmittedEvent = {
    name: string;
    value?: any;
};

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
    };

    return stub;
};

/*
Creates a stub which will confirm that a parent component correctly calls the child component's exposed validate function.
Usage:
stubs = { ...getExposedValidateStub('<component_name'>)};

Testing:
screen.getByText('<component_name>-stub-validated-true');
screen.getByText('<component_name>-stub-validated-false');
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
