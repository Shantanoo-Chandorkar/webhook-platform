'use client';

import { useState } from 'react';

/**
 * useState-like hook that persists its value to localStorage.
 *
 * On the first render the value is read from localStorage; if nothing is
 * stored the `initialValue` is used instead. Hydration mismatches are avoided
 * because the read happens inside useState's lazy initialiser (client-only).
 *
 * @template T
 * @param {string} key - localStorage key
 * @param {T} initialValue - Value used when the key is absent
 * @returns {[T, function(T|function(T):T): void]} State tuple — same interface as useState
 */
export function useLocalStorage(key, initialValue) {
	const [storedValue, setStoredValue] = useState(() => {
		try {
			const item = window.localStorage.getItem(key);
			return item !== null ? JSON.parse(item) : initialValue;
		} catch {
			// localStorage may be unavailable in some environments (private browsing
			// with certain browser settings). Fall back to in-memory state.
			return initialValue;
		}
	});

	/**
	 * Persists a new value to both localStorage and component state.
	 *
	 * @param {T|function(T):T} valueOrUpdater - New value or updater function (same as setState)
	 */
	function setValue(valueOrUpdater) {
		setStoredValue((prev) => {
			const next =
				typeof valueOrUpdater === 'function' ? valueOrUpdater(prev) : valueOrUpdater;
			try {
				window.localStorage.setItem(key, JSON.stringify(next));
			} catch {
				// Write failure is non-fatal — the UI continues to work with in-memory state.
			}
			return next;
		});
	}

	return [storedValue, setValue];
}
