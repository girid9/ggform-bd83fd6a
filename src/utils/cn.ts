// Utility function for managing class names

/**
 * Function to conditionally join class names together.
 * @param {...(string|boolean)} classes - Class names or conditions to include.
 * @returns {string} - A string of class names.
 */
export function classNames(...classes) {
    return classes.filter(Boolean).join(' ');
}