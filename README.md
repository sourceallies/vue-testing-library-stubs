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

- Node.js >= 18.0.0
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

This library provides various stub components for testing Vue applications with `@vue/test-utils` or `@testing-library/vue`.

### Basic Stub

Create a simple stub component for testing:

**Using @vue/test-utils:**

```typescript
import { mount } from '@vue/test-utils';
import { getStub } from '@sourceallies/vue-testing-library-stubs';

const wrapper = mount(MyParentComponent, {
  global: {
    stubs: {
      ...getStub('ChildComponent')
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
      ...getStub('ChildComponent')
    }
  }
});

// Verify the stub was rendered
expect(screen.getByText('ChildComponent-stub')).toBeVisible();
```

### Stub With Props

Test components that pass props to child components:

**Using @vue/test-utils:**

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

// Verify props are displayed (automatically converts to {propName}-{value})
expect(wrapper.text()).toContain('title-Hello');
expect(wrapper.text()).toContain('count-42');
```

**Using @testing-library/vue:**

```typescript
import { render, screen } from '@testing-library/vue';
import { getStubWithProps } from '@sourceallies/vue-testing-library-stubs';

render(MyParentComponent, {
  global: {
    stubs: {
      ...getStubWithProps('ChildComponent', 'title', 'count', 'config')
    }
  }
});

// Verify props are displayed (automatically converts to {propName}-{value})
expect(screen.getByText(/title-Hello/)).toBeVisible();
expect(screen.getByText(/count-42/)).toBeVisible();
```

### Stub With Event Emitters

Test components that listen to child component events:

**Using @vue/test-utils:**

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

// Trigger the event by finding the button with text 'save'
const button = wrapper.find('button'); // Button text is 'save'
await button.trigger('click');

// Verify parent component handled the event
expect(wrapper.emitted('save')).toBeTruthy();
expect(wrapper.emitted('save')?.[0]).toEqual([{ id: 123 }]);
```

**Using @testing-library/vue:**

```typescript
import { render, screen } from '@testing-library/vue';
import userEvent from '@testing-library/user-event';
import { getEmittingStub } from '@sourceallies/vue-testing-library-stubs';

const { emitted } = render(MyParentComponent, {
  global: {
    stubs: {
      ...getEmittingStub('ChildComponent', 'save', { id: 123 })
    }
  }
});

// Trigger the event
const button = screen.getByRole('button', { name: 'save' });
await userEvent.click(button);

// Verify parent component handled the event with the correct value
expect(emitted()).toHaveProperty('save');
expect(emitted().save[0]).toEqual([{ id: 123 }]);
```

### Stub With Props and Events

Combine props and event emission:

**Using @vue/test-utils:**

```typescript
import { mount } from '@vue/test-utils';
import { getEmittingStubWithProps } from '@sourceallies/vue-testing-library-stubs';

const wrapper = mount(MyParentComponent, {
  global: {
    stubs: {
      ...getEmittingStubWithProps(
        'ChildComponent',
        'update',
        [{ newValue: 'test' }],
        'title',
        'isActive'
      )
    }
  }
});

// Trigger the event
const button = wrapper.find('button'); // Button text is 'update'
await button.trigger('click');

// Verify the event was emitted with the correct value
expect(wrapper.emitted('update')).toBeTruthy();
expect(wrapper.emitted('update')?.[0]).toEqual([{ newValue: 'test' }]);
```

**Using @testing-library/vue:**

```typescript
import { render, screen } from '@testing-library/vue';
import userEvent from '@testing-library/user-event';
import { getEmittingStubWithProps } from '@sourceallies/vue-testing-library-stubs';

const { emitted } = render(MyParentComponent, {
  global: {
    stubs: {
      ...getEmittingStubWithProps(
        'ChildComponent',
        'update',
        [{ newValue: 'test' }],
        'title',
        'isActive'
      )
    }
  }
});

// Verify both stub and props are rendered
expect(screen.getByText('ChildComponent-stub')).toBeVisible();

// Trigger the event
const button = screen.getByRole('button', { name: 'update' });
await userEvent.click(button);

// Verify the event was emitted with the correct value
expect(emitted()).toHaveProperty('update');
expect(emitted().update[0]).toEqual([{ newValue: 'test' }]);
```

### Multiple Events Stub

Test components with multiple event handlers:

**Using @vue/test-utils:**

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

// Each event gets its own button
const buttons = wrapper.findAll('button');
await buttons[0].trigger('click'); // Triggers 'save'
await buttons[1].trigger('click'); // Triggers 'cancel'

// Verify events were emitted with correct values
expect(wrapper.emitted('save')).toBeTruthy();
expect(wrapper.emitted('save')?.[0]).toEqual([{ id: 1 }]);
expect(wrapper.emitted('cancel')).toBeTruthy();
expect(wrapper.emitted('cancel')?.[0]).toEqual([undefined]);
```

**Using @testing-library/vue:**

```typescript
import { render, screen } from '@testing-library/vue';
import userEvent from '@testing-library/user-event';
import { getMultiEmittingStubWithProps, type EmittedEvent } from '@sourceallies/vue-testing-library-stubs';

const events: EmittedEvent[] = [
  { name: 'save', value: { id: 1 } },
  { name: 'cancel' },
  { name: 'delete', value: { id: 1 } }
];

const { emitted } = render(MyParentComponent, {
  global: {
    stubs: {
      ...getMultiEmittingStubWithProps('ChildComponent', events, 'title', 'status')
    }
  }
});

// Each event gets its own button
const saveButton = screen.getByRole('button', { name: 'save' });
const cancelButton = screen.getByRole('button', { name: 'cancel' });
await userEvent.click(saveButton);
await userEvent.click(cancelButton);

// Verify events were emitted with correct values
expect(emitted()).toHaveProperty('save');
expect(emitted().save[0]).toEqual([{ id: 1 }]);
expect(emitted()).toHaveProperty('cancel');
expect(emitted().cancel[0]).toEqual([undefined]);
```

### Validation Stubs

Test parent components that call child validation methods:

**Using @vue/test-utils:**

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

// After calling validate on the child component
expect(wrapper.text()).toContain('InputComponent-stub-validated-true');
```

**Using @testing-library/vue:**

```typescript
import { render, screen } from '@testing-library/vue';
import { getExposedValidateStub } from '@sourceallies/vue-testing-library-stubs';

render(MyFormComponent, {
  global: {
    stubs: {
      ...getExposedValidateStub('InputComponent', true) // true = validation passes
    }
  }
});

// After calling validate on the child component
expect(screen.getByText(/InputComponent-stub-validated-true/)).toBeVisible();
```

### Template for Exposed Functions

Test components that use child component's exposed functions:

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

### `getStub(componentName: string)`

Creates a basic stub component with no props or events.

**Parameters:**
- `componentName` (string): The name of the component to stub

**Returns:** An object with a single key (the component name) containing the stub configuration

**Example:**
```typescript
const stub = getStub('MyComponent');
// Renders: <div>MyComponent-stub</div>
```

---

### `getStubWithProps(componentName: string, ...props: (string | object)[])`

Creates a stub component that displays its props in a testable format.

**Parameters:**
- `componentName` (string): The name of the component to stub
- `...props` (string | object): The prop names to accept and display

**Returns:** An object with a single key (the component name) containing the stub configuration

**Features:**
- Automatically converts hyphenated prop names to camelCase
- Displays props as `propName-value` in the rendered output
- Handles object props by JSON stringifying them
- Shows function names for array of functions (useful for validation rules)

**Example:**
```typescript
const stub = getStubWithProps('MyComponent', 'title', 'count', 'is-active');
// Renders props as: title-Hello, count-42, isActive-true
```

---

### `getEmittingStub(componentName: string, emittedEvent: string, ...emittedValues: any[])`

Creates a stub component that emits a single event when a button is clicked.

**Parameters:**
- `componentName` (string): The name of the component to stub
- `emittedEvent` (string): The name of the event to emit
- `...emittedValues` (any[]): The values to emit with the event

**Returns:** An object with a single key (the component name) containing the stub configuration

**Features:**
- Creates a button with the event name as its label
- Emits the specified event with the provided values when clicked
- Includes `validate()`, `reset()`, and `resetValidation()` methods that return valid results

**Example:**
```typescript
const stub = getEmittingStub('MyComponent', 'save', { id: 123 });
// Button click emits: 'save' event with { id: 123 }
```

---

### `getEmittingStubWithProps(componentName: string, emittedEvent: string, emittedValues: any[], ...props: (string | object)[])`

Creates a stub component that combines props display and event emission.

**Parameters:**
- `componentName` (string): The name of the component to stub
- `emittedEvent` (string): The name of the event to emit
- `emittedValues` (any[]): Array of values to emit with the event
- `...props` (string | object): The prop names to accept and display

**Returns:** An object with a single key (the component name) containing the stub configuration

**Features:**
- Combines functionality of `getStubWithProps` and `getEmittingStub`
- Displays props in testable format
- Emits events with specified values
- Includes validation methods

**Example:**
```typescript
const stub = getEmittingStubWithProps('MyComponent', 'update', [{ newValue: 'test' }], 'title', 'isActive');
```

---

### `getMultiEmittingStubWithProps(componentName: string, events: EmittedEvent[], ...props: (string | object)[])`

Creates a stub component that can emit multiple different events.

**Parameters:**
- `componentName` (string): The name of the component to stub
- `events` (EmittedEvent[]): Array of event configurations with `name` and optional `value`
- `...props` (string | object): The prop names to accept and display

**Type Definitions:**
```typescript
type EmittedEvent = {
  name: string;
  value?: any;
};
```

**Returns:** An object with a single key (the component name) containing the stub configuration

**Features:**
- Creates a separate button for each event
- Each button is labeled with its event name
- Supports events with or without values

**Example:**
```typescript
const events: EmittedEvent[] = [
  { name: 'save', value: { id: 1 } },
  { name: 'cancel' },
  { name: 'delete', value: { id: 1 } }
];
const stub = getMultiEmittingStubWithProps('MyComponent', events, 'title');
```

---

### `getExposedValidateStub(componentName: string, isValid: boolean = true)`

Creates a stub component with an exposed `validate()` method for testing form validation.

**Parameters:**
- `componentName` (string): The name of the component to stub
- `isValid` (boolean, optional): Whether validation should pass (default: `true`)

**Returns:** An object with a single key (the component name) containing the stub configuration

**Features:**
- Exposes a `validate()` method that returns `{ valid: boolean, errors: [] }`
- Updates the rendered output to show `{componentName}-stub-validated-true` or `false`
- Includes `resetValidation()` method

**Example:**
```typescript
const stub = getExposedValidateStub('InputComponent', true);
// After calling validate(): renders "InputComponent-stub-validated-true"
```

---

### `getExposedValidateStubWithProps(componentName: string, isValid: boolean = true, ...props: (string | object)[])`

Creates a stub component that combines validation testing with props display.

**Parameters:**
- `componentName` (string): The name of the component to stub
- `isValid` (boolean, optional): Whether validation should pass (default: `true`)
- `...props` (string | object): The prop names to accept and display

**Returns:** An object with a single key (the component name) containing the stub configuration

**Features:**
- Combines functionality of `getExposedValidateStub` and `getStubWithProps`
- Displays props in testable format
- Exposes validation methods

**Example:**
```typescript
const stub = getExposedValidateStubWithProps('InputComponent', true, 'value', 'label');
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

## License

MIT
