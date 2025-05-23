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

export const dateTimeFormatter = (dateString: string | undefined | null | Date): string => {
	let formattedDateTime: string = '';

	if (dateString !== undefined && dateString !== null) {
		const date: Date = new Date(dateString);
		// Format the date parts separately
		const day = date.getDate();
		const month = date.toLocaleString('en-US', { month: 'short' });
		const year = date.getFullYear();
		const time = date.toLocaleString('en-US', { 
			hour: '2-digit', 
			minute: '2-digit',
			hour12: true 
		});
		
		formattedDateTime = `${day} ${month} ${year}, ${time}`;
	}

	return formattedDateTime;
};
