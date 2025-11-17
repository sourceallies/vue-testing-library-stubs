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

This library provides various stub components for testing Vue applications:

- `getVFormStub()` - Form validation stub
- `getStub()` - Basic component stub
- `getStubWithProps()` - Component stub with props
- `getEmittingStub()` - Component stub that emits events
- `getExposedValidateStub()` - Component stub with exposed validate function
- And more...

See the [source code](src/index.ts) for detailed usage examples.

## License

MIT
