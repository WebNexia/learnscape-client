export const dateFormatter = (dateString: string | undefined | null | Date): string => {
	let formattedDate: string = '';

	const options: Intl.DateTimeFormatOptions = {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
	};
	if (dateString !== undefined && dateString !== null) {
		const date: Date = new Date(dateString);
		formattedDate = date.toLocaleString('en-US', options);
	}

	return formattedDate;
};
