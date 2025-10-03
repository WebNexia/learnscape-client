import axiosInstance from './axiosInstance';
import { SearchRequest, SearchResponse, SearchUser, SearchTopic, SearchCourse } from '../interfaces/search';

const base_url = import.meta.env.VITE_SERVER_BASE_URL;

export const searchService = {
	// Search users
	searchUsers: async (
		searchTerm: string,
		context: 'messages' | 'community' | 'events',
		filters: { userRole: 'admin' | 'learner' | 'instructor'; courseId?: string; topicId?: string; allowCurrentUser?: boolean },
		pagination: { page: number; limit: number } = { page: 1, limit: 20 }
	): Promise<SearchResponse<SearchUser>> => {
		const request: SearchRequest = {
			type: 'users',
			searchTerm,
			context,
			filters,
			pagination,
		};

		const response = await axiosInstance.post(`${base_url}/search`, request);
		return response.data;
	},

	// Search topics
	searchTopics: async (
		searchTerm: string,
		context: 'messages' | 'community' | 'events',
		pagination: { page: number; limit: number } = { page: 1, limit: 20 }
	): Promise<SearchResponse<SearchTopic>> => {
		const request: SearchRequest = {
			type: 'topics',
			searchTerm,
			context,
			pagination,
		};

		const response = await axiosInstance.post(`${base_url}/search`, request);
		return response.data;
	},

	// Search courses
	searchCourses: async (
		searchTerm: string,
		context: 'messages' | 'community' | 'events',
		pagination: { page: number; limit: number } = { page: 1, limit: 20 }
	): Promise<SearchResponse<SearchCourse>> => {
		const request: SearchRequest = {
			type: 'courses',
			searchTerm,
			context,
			pagination,
		};

		const response = await axiosInstance.post(`${base_url}/search`, request);
		return response.data;
	},
};
