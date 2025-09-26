/**
 * Gets a nested value from an object using a string path.
 * @param {object} obj The object to retrieve the value from.
 * @param {string} path The path to the value (e.g., 'a.b.c').
 * @returns {*} The value at the specified path, or undefined if not found.
 */
export function getValueByPath(obj, path) {
  return path.split('.').reduce((acc, part) => acc && acc[part], obj);
}

/**
 * Sets a nested value in an object using a string path.
 * Creates nested objects if they don't exist.
 * @param {object} obj The object to modify.
 * @param {string} path The path to the value (e.g., 'a.b.c').
 * @param {*} value The value to set.
 */
export function setValueByPath(obj, path, value) {
  const keys = path.split('.');
  const lastKey = keys.pop();
  const lastObj = keys.reduce((acc, key) => {
    if (!acc[key]) {
      acc[key] = {};
    }
    return acc[key];
  }, obj);
  lastObj[lastKey] = value;
}
