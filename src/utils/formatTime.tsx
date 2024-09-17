import { format, isToday, isYesterday } from 'date-fns';

export const formatMessageTime = (timestamp: any) => {
	if (!timestamp) return ''; // If there's no timestamp, return empty string

	let messageDate;

	// If the timestamp is a Firestore timestamp object, use toDate()
	if (typeof timestamp.toDate === 'function') {
		messageDate = timestamp.toDate(); // Convert Firestore timestamp to JavaScript Date
	} else {
		messageDate = new Date(timestamp); // Otherwise, assume it's a standard JS Date
	}

	if (isNaN(messageDate.getTime())) {
		return ''; // If the date is invalid, return empty string to avoid errors
	}

	// If it's today, show time only
	if (isToday(messageDate)) {
		return format(messageDate, 'HH:mm'); // Example: "14:30"
	}

	// If it's yesterday, show 'Yesterday'
	if (isYesterday(messageDate)) {
		return 'Yesterday';
	}

	// Otherwise, show the date in 'MMM dd' format
	return format(messageDate, 'MMM dd'); // Example: "Sep 17"
};
