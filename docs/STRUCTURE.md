# Project Structure Documentation

This document aims to provide a comprehensive overview of the new modern project structure, including the animations system, TypeScript types, hooks, utilities, and guidelines on how to use each component.

## Table of Contents
1. [Project Structure](#project-structure)
2. [Animations System](#animations-system)
3. [TypeScript Types](#typescript-types)
4. [Hooks](#hooks)
5. [Utilities](#utilities)
6. [Usage of Components](#usage-of-components)

## Project Structure

The project is structured in a modular format to enhance readability and maintainability. Here is an outline of the main directories:

- `src/`
  - `components/`
    - Contains reusable components
  - `hooks/`
    - Custom React hooks for shared functionality
  - `utils/`
    - Utility functions used throughout the app
  - `styles/`
    - Global styles and theme configuration
  - `types/`
    - TypeScript type definitions

## Animations System

The animations system is built on [library/framework], providing a smooth user experience. Key features include:

- **Animations for Components:** Each component can have animations applied via props.
- **Custom Animation Hooks:** Use the `useAnimation` hook to trigger animations based on state changes.

### Example of Animation Usage
```javascript
import { useAnimation } from 'hooks/useAnimation';

const MyComponent = () => {
    const animated = useAnimation();
    return <div className={animated}>Hello World</div>;
};
```

## TypeScript Types

Type definitions are stored in the `types/` directory. Here are some commonly used types:

- **ComponentProps:** Base props for all components.
- **AnimationProps:** Props related to animations.

### Example of Type Usage
```typescript
import { ComponentProps } from 'types/componentTypes';

const Button: React.FC<ComponentProps> = ({ label }) => {
    return <button>{label}</button>;
};
```

## Hooks

Custom hooks are defined in the `hooks/` directory. They encapsulate reusable logic.

### Example Hook
- `useFetch`: A hook for data fetching.

### Example Usage
```javascript
import { useFetch } from 'hooks/useFetch';

const DataProvider = () => {
    const { data, loading } = useFetch('/api/data');
    return loading ? <Loader /> : <DataDisplay data={data} />;
};
```

## Utilities

Utility functions are located in the `utils/` directory. These functions assist in operations across components.

### Common Utility Examples
- `formatDate(date: Date): string`
- `generateRandomId()`: Returns a unique identifier.

## Usage of Components

To use a component, import it from the `components/` directory and pass necessary props.

### Example of Component Usage
```javascript
import Button from 'components/Button';

const App = () => <Button label="Click Me" />;
```