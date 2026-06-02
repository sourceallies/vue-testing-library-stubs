# Vue Testing Library Stubs

Contains stubbing functions for Vue components to unit test components without requiring the full component to be loaded.

## Why Use This Library?

When testing Vue components, you often need to test a parent component's behavior without rendering all of its child components. This library provides pre-built stub components that:

- **Simplify Component Isolation**: Test parent components without worrying about child component complexity or dependencies
- **Verify Props Passing**: Automatically display props in a testable format (e.g., `propName-value`)
- **Test Event Handling**: Create stubs that emit events with specific payloads, allowing you to verify parent components handle events correctly
- **Reduce Test Complexity**: Avoid importing and configuring numerous child components in your tests
- **Support Multiple Testing Libraries**: Works seamlessly with both `@vue/test-utils` and `@testing-library/vue`

### Common Use Cases

- Testing that a parent component passes the correct props to child components
- Verifying that a parent component correctly handles events emitted by children
- Testing form validation flows where child components expose validation methods
- Isolating unit tests from complex or slow-to-render child components

## Installation

```bash
npm install --save-dev @sourceallies/vue-testing-library-stubs
```

## Development

This project is written in TypeScript.

### Prerequisites

- Node.js >= 20.0.0
- npm

### Setup

```bash
npm install
```

### Building

Build the TypeScript source to JavaScript:

```bash
npm run build
```

### Local testing of stub functions using another project

Ensure package is not already installed in the project testing the changes.

```bash
npm uninstall @sourceallies/vue-testing-library-stubs
```

Ensure Vue Testing Library Stubs project is using the same node version as the project testing the changes.

```bash
node -v
```

Create a symlink for the project testing the changes to connect to.

```bash
npm link
```

In project testing the changes link the package

```bash
npm link @sourceallies/vue-testing-library-stubs
```

The compiled output will be in the `dist/` directory.

### Project Structure

```
src/
├── index.ts              # Main entry point with stub functions
└── types.ts              # TypeScript type definitions
```

## Usage

The primary API is **`getStub`**, a single function that takes an options object describing everything a stub needs — props, emitted events, exposed validation, and method spies. One shape replaces the older family of `getStubWithProps` / `getEmittingStub` / `getExposedValidateStub` helpers (those still work but are [deprecated](#deprecated-apis)).

```typescript
import { getStub, type StubOptions } from '@sourceallies/vue-testing-library-stubs';
```

`getStub` accepts either a component name string (a shorthand for the simplest stub) or a `StubOptions` object:

| Option | Type | Description |
|---|---|---|
| `componentName` | `string` | **Required.** The name of the component to stub. |
| `props` | `(string \| object)[]` | Prop names to accept and render as `propName-value`. |
| `events` | `EmittedEvent[]` | Events the stub can emit; each renders a button labelled with its name. |
| `validate` | `boolean \| { isValid?: boolean }` | Exposes a tracking `validate()` (and `resetValidation()`). `true` validates as valid; `{ isValid: false }` validates as invalid. |
| `spies` | `Record<string, Function>` | Caller-supplied mock functions merged into the stub's `methods`. |

### Basic Stub

Create a simple stub component for testing:

**Using @vue/test-utils:**

```typescript
import { mount } from '@vue/test-utils';
import { getStub } from '@sourceallies/vue-testing-library-stubs';

const wrapper = mount(MyParentComponent, {
  global: {
    stubs: {
      ...getStub({ componentName: 'ChildComponent' })
    }
  }
});

// Verify the stub was rendered
expect(wrapper.text()).toContain('ChildComponent-stub');
```

**Using @testing-library/vue:**

```typescript
import { render, screen } from '@testing-library/vue';
import { getStub } from '@sourceallies/vue-testing-library-stubs';

render(MyParentComponent, {
  global: {
    stubs: {
      ...getStub({ componentName: 'ChildComponent' })
    }
  }
});

// Verify the stub was rendered
expect(screen.getByText('ChildComponent-stub')).toBeVisible();
```

> **Shorthand:** `getStub('ChildComponent')` (passing just the name string) is equivalent to `getStub({ componentName: 'ChildComponent' })`.

### Stub With Props

Test components that pass props to child components. Props are rendered as `propName-value`; objects/arrays are JSON-stringified, and hyphenated names are converted to camelCase.

**Using @vue/test-utils:**

```typescript
import { mount } from '@vue/test-utils';
import { getStub } from '@sourceallies/vue-testing-library-stubs';

const wrapper = mount(MyParentComponent, {
  global: {
    stubs: {
      ...getStub({ componentName: 'ChildComponent', props: ['title', 'count', 'config'] })
    }
  }
});

// Verify props are displayed (automatically converts to {propName}-{value})
expect(wrapper.text()).toContain('title-Hello');
expect(wrapper.text()).toContain('count-42');
```

**Using @testing-library/vue:**

```typescript
import { render, screen } from '@testing-library/vue';
import { getStub } from '@sourceallies/vue-testing-library-stubs';

render(MyParentComponent, {
  global: {
    stubs: {
      ...getStub({ componentName: 'ChildComponent', props: ['title', 'count', 'config'] })
    }
  }
});

expect(screen.getByText(/title-Hello/)).toBeVisible();
expect(screen.getByText(/count-42/)).toBeVisible();
```

### Stub With Event Emitters

Each entry in `events` renders a button labelled with the event name. Use `value` to emit a single payload, or `values` to emit multiple arguments. Omit both to emit no arguments.

**Using @vue/test-utils:**

```typescript
import { mount } from '@vue/test-utils';
import { getStub } from '@sourceallies/vue-testing-library-stubs';

const wrapper = mount(MyParentComponent, {
  global: {
    stubs: {
      ...getStub({
        componentName: 'ChildComponent',
        events: [{ name: 'save', value: { id: 123 } }]
      })
    }
  }
});

// Trigger the event by finding the button with text 'save'
await wrapper.find('button').trigger('click');

expect(wrapper.emitted('save')).toBeTruthy();
expect(wrapper.emitted('save')?.[0]).toEqual([{ id: 123 }]);
```

**Using @testing-library/vue:**

```typescript
import { render, screen } from '@testing-library/vue';
import userEvent from '@testing-library/user-event';
import { getStub } from '@sourceallies/vue-testing-library-stubs';

const { emitted } = render(MyParentComponent, {
  global: {
    stubs: {
      ...getStub({
        componentName: 'ChildComponent',
        events: [{ name: 'save', value: { id: 123 } }]
      })
    }
  }
});

const button = screen.getByRole('button', { name: 'save' });
await userEvent.click(button);

expect(emitted()).toHaveProperty('save');
expect(emitted().save[0]).toEqual([{ id: 123 }]);
```

#### Multiple events and multiple values

```typescript
const stubs = {
  ...getStub({
    componentName: 'ChildComponent',
    events: [
      { name: 'save', value: { id: 1 } },     // $emit('save', { id: 1 })
      { name: 'cancel' },                      // $emit('cancel')
      { name: 'update', values: ['a', 42] },   // $emit('update', 'a', 42)
    ]
  })
};

// Each event gets its own button, labelled with its name
const saveButton = screen.getByRole('button', { name: 'save' });
const updateButton = screen.getByRole('button', { name: 'update' });
await userEvent.click(updateButton);

expect(emitted().update[0]).toEqual(['a', 42]);
```

### Stub With Props and Events

Combine any options in a single call:

```typescript
const wrapper = mount(MyParentComponent, {
  global: {
    stubs: {
      ...getStub({
        componentName: 'ChildComponent',
        props: ['title', 'isActive'],
        events: [{ name: 'update', value: { newValue: 'test' } }]
      })
    }
  }
});

expect(wrapper.text()).toContain('title-Hello');

await wrapper.find('button').trigger('click');
expect(wrapper.emitted('update')?.[0]).toEqual([{ newValue: 'test' }]);
```

### Validation Stubs

Set `validate` to expose a `validate()` method that tracks whether it was called and renders `{componentName}-stub-validated-{true|false}`. Pass `{ isValid: false }` to simulate a failing validation.

**Using @vue/test-utils:**

```typescript
import { mount } from '@vue/test-utils';
import { getStub } from '@sourceallies/vue-testing-library-stubs';

const wrapper = mount(MyFormComponent, {
  global: {
    stubs: {
      ...getStub({ componentName: 'InputComponent', validate: true }) // valid
      // ...getStub({ componentName: 'InputComponent', validate: { isValid: false } }) // invalid
    }
  }
});

// After the parent calls validate() on the child component
expect(wrapper.text()).toContain('InputComponent-stub-validated-true');
```

**Using @testing-library/vue:**

```typescript
import { render, screen } from '@testing-library/vue';
import { getStub } from '@sourceallies/vue-testing-library-stubs';

render(MyFormComponent, {
  global: {
    stubs: {
      ...getStub({ componentName: 'InputComponent', validate: true })
    }
  }
});

expect(screen.getByText(/InputComponent-stub-validated-true/)).toBeVisible();
```

### Spies

Pass your own mock functions via `spies` to assert the parent invoked a child method. The library stays test-framework agnostic — you provide the spy (`vi.fn()`, `jest.fn()`, etc.) and keep a reference to assert on it. Spies are merged last, so they can also override the always-present no-op methods (`validate`, `reset`, `resetValidation`).

```typescript
import { mount } from '@vue/test-utils';
import { vi } from 'vitest';
import { getStub } from '@sourceallies/vue-testing-library-stubs';

const reset = vi.fn();

const wrapper = mount(MyParentComponent, {
  global: {
    stubs: {
      ...getStub({ componentName: 'ChildComponent', spies: { reset } })
    }
  }
});

// ...after the parent calls the child's reset()
expect(reset).toHaveBeenCalled();
```

### Template for Exposed Functions

Test components that use a child component's exposed functions. Unlike `getStub`, this wraps the **real** component (not a string-named stub), so it is not superseded by `getStub`.

**Using @vue/test-utils:**

```typescript
import { mount } from '@vue/test-utils';
import { getTemplateComponentForExposedFunction } from '@sourceallies/vue-testing-library-stubs';

const props = { value: 'test', enabled: true };

const componentWithExposed = getTemplateComponentForExposedFunction(
  ChildComponent,
  'reset',
  props
);

const wrapper = mount(componentWithExposed, {
  props
});

// Click button to trigger the exposed function
await wrapper.find('button').trigger('click');
```

**Using @testing-library/vue:**

```typescript
import { render, screen } from '@testing-library/vue';
import userEvent from '@testing-library/user-event';
import { getTemplateComponentForExposedFunction } from '@sourceallies/vue-testing-library-stubs';

const props = { value: 'test', enabled: true };

const componentWithExposed = getTemplateComponentForExposedFunction(
  ChildComponent,
  'reset',
  props
);

render(componentWithExposed, {
  props
});

// Click button to trigger the exposed function
const button = screen.getByRole('button', { name: 'reset' });
await userEvent.click(button);
```

## API Reference

### `getStub(componentName: string)` / `getStub(options: StubOptions)`

Creates a stub component. Call it with a component name string for the simplest stub, or with a `StubOptions` object to configure props, events, validation, and spies.

**`StubOptions`:**

```typescript
interface StubOptions {
  componentName: string;
  props?: (string | object)[];
  events?: EmittedEvent[];
  validate?: boolean | { isValid?: boolean };
  spies?: Record<string, (...args: any[]) => any>;
}

type EmittedEvent = {
  name: string;
  value?: any;      // single value: $emit(name, value)
  values?: any[];   // multiple values: $emit(name, ...values) — takes precedence over `value`
};
```

**Behavior:**
- Renders `{componentName}-stub` and exposes the stub under the key `componentName` with name `{componentName}-stub`.
- `props`: rendered as `propName-value`. Hyphenated names are converted to camelCase, objects/arrays are JSON-stringified, arrays of functions show the function names, and `undefined` props are not rendered.
- `events`: each event renders a button labelled with its name. `values` emits multiple args, `value` emits one, neither emits none.
- Every object-form stub always exposes no-op `validate()` (resolves `{ valid: true, errors: [] }`), `reset()`, and `resetValidation()` methods, so a parent that calls these over a `ref` won't error.
- `validate`: upgrades the no-op `validate()` to track calls (honouring `isValid`) and renders `{componentName}-stub-validated-{true|false}`.
- `spies`: merged into `methods` last, so a spy can override any default method (including `validate`/`reset`/`resetValidation`).

**Examples:**
```typescript
getStub('MyComponent');
getStub({ componentName: 'MyComponent', props: ['title', 'count'] });
getStub({ componentName: 'MyComponent', events: [{ name: 'save', value: { id: 1 } }] });
getStub({
  componentName: 'MyComponent',
  props: ['title'],
  events: [{ name: 'save' }, { name: 'cancel' }],
  validate: { isValid: false },
  spies: { reset: vi.fn() },
});
```

---

### `getTemplateComponentForExposedFunction(componentAlias: Component, exposedFn: string, props?: object)`

Creates a wrapper component that calls an exposed function on a child component.

**Parameters:**
- `componentAlias` (Component): The actual component to wrap
- `exposedFn` (string): The name of the exposed function to call
- `props` (object, optional): Props to pass to the child component

**Returns:** A Vue component configuration that wraps the provided component

**Features:**
- Creates a button that triggers the exposed function
- Button is labeled with the function name
- Passes props to the child component
- Useful for testing components that use `expose()` or `defineExpose()`

**Example:**
```typescript
const wrapper = getTemplateComponentForExposedFunction(ChildComponent, 'reset', { value: 'test' });
// Renders ChildComponent with a button that calls reset() when clicked
```

## Deprecated APIs

> ⚠️ The functions below remain for backward compatibility but are **superseded by [`getStub`](#getstubcomponentname-string--getstuboptions-stuboptions)**. They are marked `@deprecated` and will show a strikethrough in editors. Prefer the `getStub({ ... })` equivalent shown with each.

### Migration at a glance

| Deprecated call | `getStub` replacement |
|---|---|
| `getStub('Name')` | `getStub({ componentName: 'Name' })` *(string form still supported as a shorthand)* |
| `getStubWithProps('Name', 'a', 'b')` | `getStub({ componentName: 'Name', props: ['a', 'b'] })` |
| `getEmittingStub('Name', 'save', v1, v2)` | `getStub({ componentName: 'Name', events: [{ name: 'save', values: [v1, v2] }] })` |
| `getEmittingStubWithProps('Name', 'save', [v1, v2], 'a')` | `getStub({ componentName: 'Name', props: ['a'], events: [{ name: 'save', values: [v1, v2] }] })` |
| `getMultiEmittingStubWithProps('Name', [{ name: 'save', value: v }], 'a')` | `getStub({ componentName: 'Name', props: ['a'], events: [{ name: 'save', value: v }] })` |
| `getExposedValidateStub('Name', false)` | `getStub({ componentName: 'Name', validate: { isValid: false } })` |
| `getExposedValidateStubWithProps('Name', true, 'a')` | `getStub({ componentName: 'Name', props: ['a'], validate: true })` |

> **Emit-args difference:** `getEmittingStub` spreads trailing args (`...emittedValues`), so map those to `values: [...]`. `getMultiEmittingStubWithProps` uses a single `value` per event, which maps directly to `value`. Also note a valueless event emits `[undefined]` in the legacy multi-stub but `[]` in `getStub`.

### `getStubWithProps(componentName: string, ...props: (string | object)[])`

> Replacement: `getStub({ componentName, props: [...] })`

Creates a stub component that displays its props in a testable format.

```typescript
import { mount } from '@vue/test-utils';
import { getStubWithProps } from '@sourceallies/vue-testing-library-stubs';

const wrapper = mount(MyParentComponent, {
  global: {
    stubs: {
      ...getStubWithProps('ChildComponent', 'title', 'count', 'config')
    }
  }
});

expect(wrapper.text()).toContain('title-Hello');
expect(wrapper.text()).toContain('count-42');
```

---

### `getEmittingStub(componentName: string, emittedEvent: string, ...emittedValues: any[])`

> Replacement: `getStub({ componentName, events: [{ name, values: [...] }] })`

Creates a stub component that emits a single event when a button is clicked.

```typescript
import { mount } from '@vue/test-utils';
import { getEmittingStub } from '@sourceallies/vue-testing-library-stubs';

const wrapper = mount(MyParentComponent, {
  global: {
    stubs: {
      ...getEmittingStub('ChildComponent', 'save', { id: 123 })
    }
  }
});

await wrapper.find('button').trigger('click');

expect(wrapper.emitted('save')).toBeTruthy();
expect(wrapper.emitted('save')?.[0]).toEqual([{ id: 123 }]);
```

---

### `getEmittingStubWithProps(componentName: string, emittedEvent: string, emittedValues: any[], ...props: (string | object)[])`

> Replacement: `getStub({ componentName, props: [...], events: [{ name, values: [...] }] })`

Creates a stub component that combines props display and event emission.

```typescript
import { mount } from '@vue/test-utils';
import { getEmittingStubWithProps } from '@sourceallies/vue-testing-library-stubs';

const wrapper = mount(MyParentComponent, {
  global: {
    stubs: {
      ...getEmittingStubWithProps('ChildComponent', 'update', [{ newValue: 'test' }], 'title', 'isActive')
    }
  }
});

await wrapper.find('button').trigger('click');

expect(wrapper.emitted('update')?.[0]).toEqual([{ newValue: 'test' }]);
```

---

### `getMultiEmittingStubWithProps(componentName: string, events: EmittedEvent[], ...props: (string | object)[])`

> Replacement: `getStub({ componentName, props: [...], events: [{ name, value }] })`

Creates a stub component that can emit multiple different events.

```typescript
import { mount } from '@vue/test-utils';
import { getMultiEmittingStubWithProps, type EmittedEvent } from '@sourceallies/vue-testing-library-stubs';

const events: EmittedEvent[] = [
  { name: 'save', value: { id: 1 } },
  { name: 'cancel' },
  { name: 'delete', value: { id: 1 } }
];

const wrapper = mount(MyParentComponent, {
  global: {
    stubs: {
      ...getMultiEmittingStubWithProps('ChildComponent', events, 'title', 'status')
    }
  }
});

const buttons = wrapper.findAll('button');
await buttons[0].trigger('click'); // Triggers 'save'

expect(wrapper.emitted('save')?.[0]).toEqual([{ id: 1 }]);
```

> **Note:** This legacy function emits `[undefined]` for a valueless event, whereas `getStub` emits `[]` (no arguments). Keep that in mind when migrating assertions.

---

### `getExposedValidateStub(componentName: string, isValid: boolean = true)`

> Replacement: `getStub({ componentName, validate: true })` (or `validate: { isValid: false }`)

Creates a stub component with an exposed `validate()` method for testing form validation.

```typescript
import { mount } from '@vue/test-utils';
import { getExposedValidateStub } from '@sourceallies/vue-testing-library-stubs';

const wrapper = mount(MyFormComponent, {
  global: {
    stubs: {
      ...getExposedValidateStub('InputComponent', true) // true = validation passes
    }
  }
});

expect(wrapper.text()).toContain('InputComponent-stub-validated-true');
```

---

### `getExposedValidateStubWithProps(componentName: string, isValid: boolean = true, ...props: (string | object)[])`

> Replacement: `getStub({ componentName, props: [...], validate: true })`

Creates a stub component that combines validation testing with props display.

```typescript
const stub = getExposedValidateStubWithProps('InputComponent', true, 'value', 'label');
```

## License

MIT
