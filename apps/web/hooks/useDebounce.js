'use client';

import { useState, useEffect } from 'react';

/**
 * Returns a debounced copy of `value` that only updates after `delay` ms of
 * inactivity. Useful for deferring expensive operations (API calls, filtering,
 * URL writes) until the user has stopped typing.
 *
 * @param {*} value - The value to debounce
 * @param {number} delay - Milliseconds to wait before committing the update
 * @returns {*} The debounced value
 */
export function useDebounce(value, delay) {
	const [debounced, setDebounced] = useState(value);

	useEffect(() => {
		const timer = setTimeout(() => setDebounced(value), delay);
		return () => clearTimeout(timer);
	}, [value, delay]);

	return debounced;
}
