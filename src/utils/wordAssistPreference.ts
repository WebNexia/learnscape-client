export const WORD_ASSIST_STORAGE_KEY = 'word-assist-enabled';

/** Reset pronunciation assist to off (e.g. on login / logout). */
export function resetWordAssistPreference(): void {
	localStorage.setItem(WORD_ASSIST_STORAGE_KEY, 'false');
}

export function readWordAssistPreference(): boolean {
	return localStorage.getItem(WORD_ASSIST_STORAGE_KEY) === 'true';
}
