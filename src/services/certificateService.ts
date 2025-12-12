import axiosInstance from '../utils/axiosInstance';

const base_url = import.meta.env.VITE_SERVER_BASE_URL;

export const certificateService = {
	/**
	 * Download course completion certificate as PDF
	 * @param {string} courseId - Course ID
	 * @returns {Promise<Blob>} PDF blob
	 */
	downloadCourseCertificate: async (courseId: string): Promise<Blob> => {
		const response = await axiosInstance.get(`${base_url}/courses/${courseId}/certificate/download`, {
			responseType: 'blob', // Important: responseType must be 'blob' for binary data
		});
		return response.data;
	},
};
