export interface SearchFilters {
	userRole?: 'admin' | 'learner' | 'instructor';
	courseId?: string;
	topicId?: string;
}

export interface SearchPagination {
	page: number;
	limit: number;
}

export interface SearchRequest {
	type: 'users' | 'topics' | 'courses';
	searchTerm: string;
	context: 'messages' | 'community' | 'events';
	filters?: SearchFilters;
	pagination?: SearchPagination;
}

export interface SearchPaginationInfo {
	currentPage: number;
	totalPages: number;
	totalItems: number;
	hasNextPage: boolean;
	hasPrevPage: boolean;
	limit: number;
}

export interface SearchResponse<T> {
	success: boolean;
	data: T[];
	pagination: SearchPaginationInfo;
}

export interface SearchUser {
	_id: string; // MongoDB ObjectId
	firebaseUserId: string;
	username: string;
	firstName?: string;
	lastName?: string;
	email?: string;
	imageUrl: string;
	role: string;
}

export interface SearchTopic {
	_id: string;
	title: string;
	description: string;
}

export interface SearchCourse {
	_id: string;
	title: string;
	description: string;
}
