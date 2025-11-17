# Vue Testing Library Stubs

Contains stubbing functions for Vue components to unit test components without requiring the full component to be loaded.

## Installation

```bash
npm install vue-testing-library-stubs
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

The compiled output will be in the `dist/` directory.

### Project Structure

```
src/
├── index.ts              # Main entry point with stub functions
├── types.ts              # TypeScript type definitions
├── utils/
│   └── rules.ts         # Validation rules
└── generators/
    └── miscGenerators.ts # Test data generators
```

## Usage

This library provides various stub components for testing Vue applications with `@vue/test-utils` or `@testing-library/vue`.

### Basic Stub

Create a simple stub component for testing:

**Using @vue/test-utils:**

```typescript
import { mount } from '@vue/test-utils';
import { getStub } from 'vue-testing-library-stubs';

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
import { getStub } from 'vue-testing-library-stubs';

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
import { getStubWithProps } from 'vue-testing-library-stubs';

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
import { getStubWithProps } from 'vue-testing-library-stubs';

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
import { getEmittingStub } from 'vue-testing-library-stubs';

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
import { getEmittingStub } from 'vue-testing-library-stubs';

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
import { getEmittingStubWithProps } from 'vue-testing-library-stubs';

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
import { getEmittingStubWithProps } from 'vue-testing-library-stubs';

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
import { getMultiEmittingStubWithProps, type EmittedEvent } from 'vue-testing-library-stubs';

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
import { getMultiEmittingStubWithProps, type EmittedEvent } from 'vue-testing-library-stubs';

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
import { getExposedValidateStub } from 'vue-testing-library-stubs';

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
import { getExposedValidateStub } from 'vue-testing-library-stubs';

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
import { getTemplateComponentForExposedFunction } from 'vue-testing-library-stubs';

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
import { getTemplateComponentForExposedFunction } from 'vue-testing-library-stubs';

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

## License

MIT
