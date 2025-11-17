# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-01-17

### Added
- Initial release of vue-testing-library-stubs
- `getStub()` - Create basic stub components
- `getStubWithProps()` - Create stubs that display props in testable format
- `getEmittingStub()` - Create stubs that emit events
- `getEmittingStubWithProps()` - Create stubs with both props and events
- `getMultiEmittingStubWithProps()` - Create stubs that emit multiple events
- `getExposedValidateStub()` - Create stubs with validation methods
- `getExposedValidateStubWithProps()` - Create stubs with validation and props
- `getTemplateComponentForExposedFunction()` - Create wrapper components for testing exposed functions
- Full TypeScript support with type definitions
- Support for both `@vue/test-utils` and `@testing-library/vue`
- Comprehensive documentation with usage examples
- MIT License
- GitHub Actions CI/CD workflows

### Features
- Automatic conversion of hyphenated prop names to camelCase
- Props displayed in testable `propName-value` format
- JSON stringification for object props
- Function name display for validation rule arrays
- Event emission with custom payloads
- Form validation testing support
