export const hardReloadPage = (): void => {
	window.location.reload();
};

export const goToHomePage = (): void => {
	window.location.assign('/');
};

export const reportApplicationBug = (error?: Error | null, context?: string): void => {
	const params = new URLSearchParams();
	params.set('subject', 'Application Error Report');

	if (context) {
		params.set('context', context);
	}

	if (error?.message) {
		params.set('message', error.message.slice(0, 500));
	}

	window.location.assign(`/contact-us?${params.toString()}`);
};
