const parseDate = (value: string | undefined | null | Date): Date | null => {
	if (value === undefined || value === null) return null;
	const date = value instanceof Date ? value : new Date(value);
	return Number.isNaN(date.getTime()) ? null : date;
};

const DEFAULT_DATE_OPTIONS: Intl.DateTimeFormatOptions = {
	year: 'numeric',
	month: 'short',
	day: 'numeric',
};

const DEFAULT_DATE_TIME_OPTIONS: Intl.DateTimeFormatOptions = {
	year: 'numeric',
	month: 'short',
	day: 'numeric',
	hour: '2-digit',
	minute: '2-digit',
	hour12: true,
	timeZoneName: 'short',
};

const EVENT_DATE_TIME_OPTIONS: Intl.DateTimeFormatOptions = {
	weekday: 'long',
	year: 'numeric',
	month: 'long',
	day: 'numeric',
	hour: '2-digit',
	minute: '2-digit',
	timeZoneName: 'short',
};

export const dateFormatter = (dateString: string | undefined | null | Date): string => {
	const date = parseDate(dateString);
	if (!date) return '';
	return date.toLocaleString(undefined, DEFAULT_DATE_OPTIONS);
};

export const dateTimeFormatter = (dateString: string | undefined | null | Date): string => {
	const date = parseDate(dateString);
	if (!date) return '';
	return date.toLocaleString(undefined, DEFAULT_DATE_TIME_OPTIONS);
};

/** Long weekday + date + time — calendar event details, public events */
export const eventDateTimeFormatter = (dateString: string | undefined | null | Date): string => {
	const date = parseDate(dateString);
	if (!date) return '';
	return date.toLocaleString(undefined, EVENT_DATE_TIME_OPTIONS);
};
