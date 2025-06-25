export const dateFormatter = (dateString: string | undefined | null | Date): string => {
	let formattedDate: string = '';

	const options: Intl.DateTimeFormatOptions = {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
	};
	if (dateString !== undefined && dateString !== null) {
		const date: Date = new Date(dateString);
		formattedDate = date.toLocaleString(undefined, options);
	}

	return formattedDate;
};

export const dateTimeFormatter = (dateString: string | undefined | null | Date): string => {
	let formattedDateTime: string = '';

	if (dateString !== undefined && dateString !== null) {
		const date: Date = new Date(dateString);
		formattedDateTime = date.toLocaleString(undefined, {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
			hour12: true,
			timeZoneName: 'short',
		});
	}

	return formattedDateTime;
};
