// Utility function to convert titles into a consistent format
export const processTitle = (title: string) => {
	return title.toLowerCase().replace(/[^a-z0-9]/g, '_'); // Replace all non-alphanumeric characters with underscores
};
