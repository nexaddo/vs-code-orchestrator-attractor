// Windows reserved device names that are illegal as filenames on any Windows path.
const WINDOWS_RESERVED_NAMES = /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])[. ]*$/i;

/**
 * Asserts that `id` is safe to use as a storage path segment.
 *
 * Rejects empty strings, path separators, colons, null bytes, and Windows
 * reserved device names so that callers cannot escape their storage root or
 * produce unreadable files on Windows.
 *
 * @param id    The identifier to validate.
 * @param label Human-readable entity name used in error messages (e.g. "Run id").
 */
export const assertSafeStorageId = (id: string, label: string): void => {
  if (!id) {
    throw new Error(`${label} must not be empty`);
  }
  if (id.includes("/") || id.includes("\\")) {
    throw new Error(`${label} must not contain path separators: ${id}`);
  }
  if (id.includes(":")) {
    throw new Error(`${label} must not contain a colon: ${id}`);
  }
  if (id.includes("\0")) {
    throw new Error(`${label} must not contain null bytes: ${id}`);
  }
  if (WINDOWS_RESERVED_NAMES.test(id)) {
    throw new Error(`${label} is a reserved filename on Windows: ${id}`);
  }
};
