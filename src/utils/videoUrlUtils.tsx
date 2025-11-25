/**
 * Utility functions for handling video URLs
 */

/**
 * Formats a video URL for proper playback in ReactPlayer
 * @param url - The original video URL
 * @returns Formatted URL ready for ReactPlayer
 */
export const formatVideoUrl = (url: string): string => {
	if (!url) return url;

	// Handle Dailymotion URLs
	if (url?.includes('dailymotion.com')) {
		// Extract video ID from various Dailymotion URL formats
		const patterns = [
			/\/video\/([a-zA-Z0-9]+)/, // Standard format
			/dailymotion\.com\/embed\/video\/([a-zA-Z0-9]+)/, // Already embedded
			/dailymotion\.com\/video\/([a-zA-Z0-9]+)/, // Direct video page
		];

		for (const pattern of patterns) {
			const match = url.match(pattern);
			if (match) {
				return `https://www.dailymotion.com/embed/video/${match[1]}`;
			}
		}
	}

	// Handle YouTube URLs
	if (url?.includes('youtube.com') || url?.includes('youtu.be')) {
		// Extract video ID and create clean URL for better compatibility
		const patterns = [/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/, /youtube\.com\/embed\/([a-zA-Z0-9_-]+)/];

		for (const pattern of patterns) {
			const match = url.match(pattern);
			if (match && match[1]) {
				// Return clean watch URL format (ReactPlayer handles this best)
				return `https://www.youtube.com/watch?v=${match[1]}`;
			}
		}

		// Fallback to original URL if pattern doesn't match
		return url;
	}

	// Handle Vimeo URLs
	if (url?.includes('vimeo.com')) {
		// ReactPlayer handles Vimeo URLs automatically
		return url;
	}

	// For other URLs (direct video files, etc.), return as is
	return url;
};

/**
 * Gets the appropriate ReactPlayer configuration for a video URL
 * @param url - The video URL
 * @param controls - Whether to show controls
 * @returns Configuration object for ReactPlayer
 */
export const getVideoPlayerConfig = (url: string, controls: boolean = true) => {
	const config: any = {};

	// Configure Dailymotion
	if (url?.includes('dailymotion.com')) {
		config.dailymotion = {
			params: {
				autoplay: false,
				controls: controls,
				ui: controls ? 'logo' : 'logo',
			},
		};
	}

	// Configure YouTube
	if (url?.includes('youtube.com') || url?.includes('youtu.be')) {
		config.youtube = {
			playerVars: {
				autoplay: 0,
				controls: controls ? 1 : 0,
				modestbranding: 1,
				rel: 0,
			},
		};
	}

	// Configure Vimeo
	if (url?.includes('vimeo.com')) {
		config.vimeo = {
			playerOptions: {
				autoplay: false,
				controls: controls,
				transparent: false,
			},
		};
	}

	return config;
};

/**
 * Validates if a URL is a supported video platform
 * @param url - The URL to validate
 * @returns True if the URL is from a supported platform
 */
export const isSupportedVideoPlatform = (url: string): boolean => {
	if (!url) return false;

	const supportedPlatforms = ['youtube.com', 'youtu.be', 'vimeo.com', 'dailymotion.com', 'twitch.tv'];

	return supportedPlatforms?.some((platform) => url?.includes(platform)) || false;
};

/**
 * Checks if a URL is a Dailymotion URL
 * @param url - The URL to check
 * @returns True if the URL is from Dailymotion
 */
export const isDailymotionUrl = (url: string): boolean => {
	if (!url) return false;
	return url?.includes('dailymotion.com');
};

/**
 * Extracts video ID from various video platform URLs
 * @param url - The video URL
 * @returns Video ID or null if not found
 */
export const extractVideoId = (url: string): string | null => {
	if (!url) return null;

	// Dailymotion
	if (url?.includes('dailymotion.com')) {
		const match = url.match(/\/video\/([a-zA-Z0-9]+)/);
		return match ? match[1] : null;
	}

	// YouTube
	if (url?.includes('youtube.com') || url?.includes('youtu.be')) {
		const patterns = [/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/, /youtube\.com\/embed\/([a-zA-Z0-9_-]+)/];

		for (const pattern of patterns) {
			const match = url.match(pattern);
			if (match) return match[1];
		}
	}

	// Vimeo
	if (url?.includes('vimeo.com')) {
		const match = url.match(/vimeo\.com\/(\d+)/);
		return match ? match[1] : null;
	}

	return null;
};
