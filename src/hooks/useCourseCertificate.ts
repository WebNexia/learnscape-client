import { useState, useCallback } from 'react';
import { certificateService } from '../services/certificateService';

export const useCourseCertificate = (courseId?: string) => {
	const [isDownloading, setIsDownloading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const downloadCertificate = useCallback(async () => {
		if (!courseId) {
			setError('Course ID is required');
			return;
		}

		setIsDownloading(true);
		setError(null);

		try {
			const blob = await certificateService.downloadCourseCertificate(courseId);

			// Check if the response is actually an error (JSON) instead of a PDF
			if (blob.type === 'application/json') {
				// Parse the error message from the blob
				const text = await blob.text();
				let errorMessage = 'Failed to download certificate';
				try {
					const errorData = JSON.parse(text);
					errorMessage = errorData.message || errorData.error || errorMessage;
				} catch (parseError) {
					// If parsing fails, use the text directly or default message
					errorMessage = text || errorMessage;
				}
				setError(errorMessage);
				return;
			}

			// Verify it's a PDF
			if (blob.type !== 'application/pdf' && !blob.type.includes('pdf')) {
				setError('Invalid response format. Expected PDF but received: ' + blob.type);
				return;
			}

			// Create download link
			const url = window.URL.createObjectURL(blob);
			const link = document.createElement('a');
			link.href = url;

			// Generate filename
			const timestamp = new Date().toISOString().split('T')[0];
			link.download = `course_certificate_${timestamp}.pdf`;

			// Trigger download
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);

			// Cleanup
			window.URL.revokeObjectURL(url);
		} catch (err: any) {
			console.error('Error downloading certificate:', err);

			// Try to extract error message from response
			let errorMessage = 'Failed to download certificate';

			if (err?.response?.data) {
				// If response.data is a Blob (JSON error), parse it
				if (err.response.data instanceof Blob && err.response.data.type === 'application/json') {
					try {
						const text = await err.response.data.text();
						const errorData = JSON.parse(text);
						errorMessage = errorData.message || errorData.error || errorMessage;
					} catch (parseError) {
						// If parsing fails, use default message
					}
				} else if (typeof err.response.data === 'object' && err.response.data.message) {
					errorMessage = err.response.data.message;
				} else if (typeof err.response.data === 'string') {
					errorMessage = err.response.data;
				}
			} else if (err?.message) {
				errorMessage = err.message;
			}

			setError(errorMessage);
		} finally {
			setIsDownloading(false);
		}
	}, [courseId]);

	return {
		downloadCertificate,
		isDownloading,
		error,
	};
};
