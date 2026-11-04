/**
 * Assertion helpers for TMB Fighters E2E Test Suite.
 * Provides clear, informative error reporting without external dependencies.
 */

export class AssertionError extends Error {
  constructor(message, actual, expected) {
    super(message);
    this.name = 'AssertionError';
    this.actual = actual;
    this.expected = expected;
  }
}

export function assertEqual(actual, expected, message = '') {
  if (actual !== expected) {
    const msg = message ? `${message} | ` : '';
    throw new AssertionError(
      `${msg}Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`,
      actual,
      expected
    );
  }
}

export function assertNotEqual(actual, notExpected, message = '') {
  if (actual === notExpected) {
    const msg = message ? `${message} | ` : '';
    throw new AssertionError(
      `${msg}Expected value NOT to equal ${JSON.stringify(notExpected)}`,
      actual,
      notExpected
    );
  }
}

export function assertTrue(value, message = '') {
  if (!value) {
    const msg = message ? `${message} | ` : '';
    throw new AssertionError(`${msg}Expected true, got ${JSON.stringify(value)}`, value, true);
  }
}

export function assertFalse(value, message = '') {
  if (value) {
    const msg = message ? `${message} | ` : '';
    throw new AssertionError(`${msg}Expected false, got ${JSON.stringify(value)}`, value, false);
  }
}

export function assertIncludes(actual, substring, message = '') {
  if (typeof actual === 'string') {
    if (!actual.includes(substring)) {
      const msg = message ? `${message} | ` : '';
      throw new AssertionError(
        `${msg}Expected string to include ${JSON.stringify(substring)}, but it did not.\nString: ${actual.slice(0, 300)}`,
        actual,
        substring
      );
    }
  } else if (Array.isArray(actual)) {
    if (!actual.includes(substring)) {
      const msg = message ? `${message} | ` : '';
      throw new AssertionError(
        `${msg}Expected array to include item ${JSON.stringify(substring)}`,
        actual,
        substring
      );
    }
  } else {
    throw new AssertionError(`assertIncludes called on unsupported type: ${typeof actual}`);
  }
}

export function assertNotIncludes(actual, substring, message = '') {
  if (typeof actual === 'string') {
    if (actual.includes(substring)) {
      const msg = message ? `${message} | ` : '';
      throw new AssertionError(
        `${msg}Expected string to NOT include ${JSON.stringify(substring)}, but found it.\nString: ${actual.slice(0, 300)}`,
        actual,
        substring
      );
    }
  } else if (Array.isArray(actual)) {
    if (actual.includes(substring)) {
      const msg = message ? `${message} | ` : '';
      throw new AssertionError(
        `${msg}Expected array to NOT include item ${JSON.stringify(substring)}`,
        actual,
        substring
      );
    }
  }
}

export function assertMatch(actual, regex, message = '') {
  if (!regex.test(actual)) {
    const msg = message ? `${message} | ` : '';
    throw new AssertionError(
      `${msg}Expected ${JSON.stringify(actual)} to match regex ${regex}`,
      actual,
      regex.toString()
    );
  }
}

export function assertDeepEqual(actual, expected, message = '') {
  const actualStr = JSON.stringify(actual);
  const expectedStr = JSON.stringify(expected);
  if (actualStr !== expectedStr) {
    const msg = message ? `${message} | ` : '';
    throw new AssertionError(
      `${msg}Deep equality failure:\nExpected: ${expectedStr}\nActual:   ${actualStr}`,
      actual,
      expected
    );
  }
}

export async function assertRejects(fn, message = '') {
  let threw = false;
  let result;
  try {
    result = await fn();
  } catch (err) {
    threw = true;
    return err;
  }
  if (!threw) {
    const msg = message ? `${message} | ` : '';
    throw new AssertionError(`${msg}Expected promise to reject, but it resolved with ${JSON.stringify(result)}`);
  }
}
