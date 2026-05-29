export function withTimeout<T>(promise: Promise<T>, ms: number, message = 'Request timed out'): Promise<T> {
	return new Promise<T>((resolve, reject) => {
		const timer = window.setTimeout(() => reject(new Error(message)), ms);
		promise
			.then((value) => {
				window.clearTimeout(timer);
				resolve(value);
			})
			.catch((error) => {
				window.clearTimeout(timer);
				reject(error);
			});
	});
}
