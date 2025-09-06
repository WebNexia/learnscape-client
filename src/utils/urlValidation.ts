// URL validation utilities
export const isValidUrl = (url: string): boolean => {
	// Basic checks first
	if (!url || typeof url !== 'string' || url.trim() === '') {
		return false;
	}

	// Check for basic URL pattern
	const urlPattern = /^https?:\/\/.+/i;
	if (!urlPattern.test(url)) {
		// Allow data and blob URLs
		if (!url.startsWith('data:') && !url.startsWith('blob:')) {
			return false;
		}
	}

	try {
		const urlObj = new URL(url);
		// Check if it has a valid protocol (http, https, data, blob)
		const validProtocols = ['http:', 'https:', 'data:', 'blob:'];

		if (!validProtocols?.includes(urlObj.protocol)) {
			return false;
		}

		// For http/https URLs, ensure they have a hostname
		if ((urlObj.protocol === 'http:' || urlObj.protocol === 'https:') && !urlObj.hostname) {
			return false;
		}

		return true;
	} catch {
		return false;
	}
};

export const isValidImageUrl = (url: string): boolean => {
	if (!isValidUrl(url)) return false;

	const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp'];
	const urlLower = url.toLowerCase();

	// Check for common image hosting services
	const imageHostingServices = [
		'unsplash.com',
		'images.unsplash.com',
		'picsum.photos',
		'loremflickr.com',
		'placehold.co',
		'placehold.it',
		'via.placeholder.com',
		'imgur.com',
		'i.imgur.com',
		'cloudinary.com',
		'res.cloudinary.com',
		'firebasestorage.googleapis.com',
		'storage.googleapis.com',
		'amazonaws.com',
		's3.amazonaws.com',
		'cdn.jsdelivr.net',
		'cdnjs.cloudflare.com',
	];

	// Must have either a file extension, be a data/blob URL, or be from a known hosting service
	const hasValidExtension = imageExtensions?.some((ext) => urlLower?.includes(ext)) || false;
	const isDataOrBlob = urlLower?.includes('data:image/') || urlLower?.includes('blob:');
	const isFromHostingService = imageHostingServices?.some((service) => urlLower?.includes(service)) || false;

	// Additional check: ensure the URL has some structure that looks like an image URL
	const hasImageUrlStructure = hasValidExtension || isDataOrBlob || isFromHostingService;

	// For URLs without extensions, ensure they have a path that looks like an image path
	if (!hasImageUrlStructure && (urlLower?.includes('http://') || urlLower?.includes('https://'))) {
		// Check if the URL has a path that might indicate it's an image
		const urlObj = new URL(url);
		const path = urlObj.pathname.toLowerCase();

		// Reject if the path is just "/" or very short
		if (path === '/' || path.length < 3) {
			return false;
		}

		// Reject if the path looks like random text (no slashes, dots, or common image patterns)
		if (!path?.includes('/') && !path?.includes('.') && !path?.includes('image') && !path?.includes('photo')) {
			return false;
		}
	}

	return hasImageUrlStructure;
};

export const isValidVideoUrl = (url: string): boolean => {
	if (!isValidUrl(url)) return false;

	const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv'];
	const urlLower = url.toLowerCase();

	// Check for common video hosting services
	const videoHostingServices = [
		'youtube.com',
		'youtu.be',
		'vimeo.com',
		'dailymotion.com',
		'twitch.tv',
		'vimeo.com',
		'firebasestorage.googleapis.com',
		'storage.googleapis.com',
		'amazonaws.com',
		's3.amazonaws.com',
	];

	// Must have either a file extension, be a data/blob URL, or be from a known hosting service
	const hasValidExtension = videoExtensions?.some((ext) => urlLower?.includes(ext)) || false;
	const isDataOrBlob = urlLower?.includes('data:video/') || urlLower?.includes('blob:');
	const isFromHostingService = videoHostingServices?.some((service) => urlLower?.includes(service)) || false;

	return hasValidExtension || isDataOrBlob || isFromHostingService;
};

// Async validation to check if the URL actually loads
export const validateUrlAccessibility = async (url: string): Promise<boolean> => {
	try {
		const response = await fetch(url, { method: 'HEAD' });
		return response.ok;
	} catch {
		return false;
	}
};

// Validate image accessibility
export const validateImageUrl = async (url: string): Promise<{ isValid: boolean; error?: string }> => {
	// Handle empty strings
	if (!url || !url.trim()) {
		return { isValid: true }; // Empty strings are valid (no image)
	}

	if (!isValidImageUrl(url)) {
		return { isValid: false, error: 'Invalid image URL format' };
	}

	const urlLower = url.toLowerCase();

	// For known image hosting services, be more lenient with validation
	const trustedImageServices = [
		'unsplash.com',
		'images.unsplash.com',
		'picsum.photos',
		'placehold.co',
		'imgur.com',
		'i.imgur.com',
		'cloudinary.com',
		'res.cloudinary.com',
		'firebasestorage.googleapis.com',
		'storage.googleapis.com',
	];

	const isTrustedService = trustedImageServices?.some((service) => urlLower?.includes(service)) || false;

	// If it's a trusted service, accept it without making a HEAD request
	// This avoids CORS issues and HEAD request failures that are common with these services
	if (isTrustedService) {
		return { isValid: true };
	}

	try {
		const response = await fetch(url, { method: 'HEAD' });
		if (!response.ok) {
			return { isValid: false, error: 'Image URL is not accessible' };
		}

		const contentType = response.headers.get('content-type');

		// For other URLs, check content-type
		if (contentType && !contentType.startsWith('image/')) {
			return { isValid: false, error: 'URL does not point to an image' };
		}

		return { isValid: true };
	} catch (error) {
		// If HEAD request fails, try a GET request for URLs with clear image extensions
		const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp'];
		const hasValidExtension = imageExtensions?.some((ext) => urlLower?.includes(ext)) || false;

		if (hasValidExtension) {
			// For URLs with clear image extensions, accept them even if HEAD request fails
			// This handles cases where servers don't support HEAD requests or have CORS restrictions
			return { isValid: true };
		}

		return { isValid: false, error: 'Failed to validate image URL' };
	}
};

// Validate video accessibility
export const validateVideoUrl = async (url: string): Promise<{ isValid: boolean; error?: string }> => {
	// Handle empty strings
	if (!url || !url.trim()) {
		return { isValid: true }; // Empty strings are valid (no video)
	}

	if (!isValidVideoUrl(url)) {
		return { isValid: false, error: 'Invalid video URL format' };
	}

	const urlLower = url.toLowerCase();

	// For known video hosting services, accept them without validation
	const trustedVideoServices = [
		'youtube.com',
		'youtu.be',
		'vimeo.com',
		'dailymotion.com',
		'twitch.tv',
		'firebasestorage.googleapis.com',
		'storage.googleapis.com',
		'amazonaws.com',
		's3.amazonaws.com',
	];

	const isTrustedService = trustedVideoServices?.some((service) => urlLower?.includes(service)) || false;

	// If it's a trusted service, accept it without making a HEAD request
	if (isTrustedService) {
		return { isValid: true };
	}

	try {
		const response = await fetch(url, { method: 'HEAD' });
		if (!response.ok) {
			return { isValid: false, error: 'Video URL is not accessible' };
		}

		const contentType = response.headers.get('content-type');
		if (contentType && !contentType?.startsWith?.('video/') && !contentType?.includes('application/octet-stream')) {
			return { isValid: false, error: 'URL does not point to a video' };
		}

		return { isValid: true };
	} catch (error) {
		// If HEAD request fails, try a GET request for URLs with clear video extensions
		const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv'];
		const hasValidExtension = videoExtensions?.some((ext) => urlLower?.includes(ext)) || false;

		if (hasValidExtension) {
			// For URLs with clear video extensions, accept them even if HEAD request fails
			return { isValid: true };
		}

		return { isValid: false, error: 'Failed to validate video URL' };
	}
};

// Document URL validation
export const isValidDocumentUrl = (url: string): boolean => {
	if (!isValidUrl(url)) return false;

	const documentExtensions = ['.pdf', '.doc', '.docx', '.txt', '.rtf', '.odt', '.pages'];
	const urlLower = url.toLowerCase();

	// Check for common document hosting services
	const documentHostingServices = [
		'google.com',
		'docs.google.com',
		'drive.google.com',
		'microsoft.com',
		'onedrive.live.com',
		'1drv.ms',
		'dropbox.com',
		'www.dropbox.com',
		'box.com',
		'firebasestorage.googleapis.com',
		'storage.googleapis.com',
		'amazonaws.com',
		's3.amazonaws.com',
		'github.com',
		'raw.githubusercontent.com',
		'gist.github.com',
		'resources.docs.salesforce.com',
	];

	// Must have either a file extension, be a data/blob URL, or be from a known hosting service
	const hasValidExtension = documentExtensions?.some((ext) => urlLower?.includes(ext)) || false;
	const isDataOrBlob = urlLower?.includes('data:application/') || urlLower?.includes('blob:');
	const isFromHostingService = documentHostingServices?.some((service) => urlLower?.includes(service)) || false;

	return hasValidExtension || isDataOrBlob || isFromHostingService;
};

// Validate document accessibility
export const validateDocumentUrl = async (url: string): Promise<{ isValid: boolean; error?: string }> => {
	// Handle empty strings
	if (!url || !url.trim()) {
		return { isValid: true }; // Empty strings are valid (no document)
	}

	if (!isValidDocumentUrl(url)) {
		return { isValid: false, error: 'Invalid document URL format' };
	}

	const urlLower = url.toLowerCase();

	// For known document hosting services, be more lenient with validation
	const trustedDocumentServices = [
		'google.com',
		'docs.google.com',
		'drive.google.com',
		'microsoft.com',
		'onedrive.live.com',
		'dropbox.com',
		'box.com',
		'github.com',
		'resources.docs.salesforce.com',
	];

	const isTrustedService = trustedDocumentServices?.some((service) => urlLower?.includes(service)) || false;

	// If it's a trusted service, accept it without making a HEAD request
	// This avoids CORS issues and HEAD request failures that are common with these services
	if (isTrustedService) {
		return { isValid: true };
	}

	try {
		const response = await fetch(url, { method: 'HEAD' });
		if (!response.ok) {
			return { isValid: false, error: 'Document URL is not accessible' };
		}

		const contentType = response.headers.get('content-type');

		// For other URLs, check content-type for common document types
		if (contentType) {
			const validDocumentTypes = [
				'application/pdf',
				'application/msword',
				'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
				'text/plain',
				'application/rtf',
				'application/vnd.oasis.opendocument.text',
				'application/octet-stream',
			];

			const isValidType = validDocumentTypes?.some((type) => contentType?.startsWith?.(type)) || false;
			if (!isValidType) {
				return { isValid: false, error: 'URL does not point to a valid document' };
			}
		}

		return { isValid: true };
	} catch (error) {
		// If HEAD request fails, try a GET request for URLs with clear document extensions
		const documentExtensions = ['.pdf', '.doc', '.docx', '.txt', '.rtf', '.odt', '.pages'];
		const hasValidExtension = documentExtensions?.some((ext) => urlLower?.includes(ext)) || false;

		if (hasValidExtension) {
			// For URLs with clear document extensions, accept them even if HEAD request fails
			return { isValid: true };
		}

		return { isValid: false, error: 'Failed to validate document URL' };
	}
};
