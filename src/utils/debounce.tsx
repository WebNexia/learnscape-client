export const debounce = <T extends (...args: any[]) => void>(func: T, delay: number): ((...args: Parameters<T>) => void) => {
	let timeout: ReturnType<typeof setTimeout>;

	return function (this: void, ...args: Parameters<T>) {
		clearTimeout(timeout);
		timeout = setTimeout(() => {
			func(...args);
		}, delay);
	};
};
