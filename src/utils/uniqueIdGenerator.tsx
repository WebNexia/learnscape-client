export const generateUniqueId = (str: string): string => {
	// Generate a longer random string of characters
	const randomString = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

	// Generate a timestamp to ensure uniqueness
	const timestamp = Date.now().toString(36);

	// Concatenate random string and timestamp to create a unique ID
	const uniqueId = str + randomString + timestamp;

	return uniqueId;
};
