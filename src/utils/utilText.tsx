import { decode } from 'html-entities';

export const truncateText = (text: string, maxLength: number) => {
	if (text && text.length <= maxLength) {
		return text;
	}
	return text?.slice(0, maxLength) + '...';
};

// Function to decode HTML entities (e.g., &amp; -> &)
export const decodeHtmlEntities = (text: string): string => {
	if (typeof text !== 'string') return text;
	return decode(text);
};
