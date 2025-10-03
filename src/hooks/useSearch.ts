import { useState, useCallback } from 'react';
import { searchService } from '../utils/searchService';
import { SearchUser, SearchTopic, SearchCourse, SearchPaginationInfo } from '../interfaces/search';

interface UseSearchState<T> {
	data: T[];
	loading: boolean;
	error: string | null;
	pagination: SearchPaginationInfo | null;
}

interface UseSearchReturn<T> extends UseSearchState<T> {
	search: (searchTerm: string) => Promise<void>;
	loadMore: () => Promise<void>;
	reset: () => void;
}

export const useSearch = <T extends SearchUser | SearchTopic | SearchCourse>(
	type: 'users' | 'topics' | 'courses',
	context: 'messages' | 'community' | 'events',
	filters?: { userRole: 'admin' | 'learner' | 'instructor'; courseId?: string; topicId?: string; allowCurrentUser?: boolean }
): UseSearchReturn<T> => {
	const [state, setState] = useState<UseSearchState<T>>({
		data: [],
		loading: false,
		error: null,
		pagination: null,
	});

	const [currentSearchTerm, setCurrentSearchTerm] = useState<string>('');

	const search = useCallback(
		async (searchTerm: string) => {
			if (!searchTerm.trim()) {
				setState({
					data: [],
					loading: false,
					error: null,
					pagination: null,
				});
				return;
			}

			setState((prev) => ({ ...prev, loading: true, error: null }));
			setCurrentSearchTerm(searchTerm);

			try {
				let response;
				const pagination = { page: 1, limit: 20 };

				switch (type) {
					case 'users':
						if (!filters?.userRole) {
							throw new Error('User role is required for user search');
						}
						response = await searchService.searchUsers(searchTerm, context, filters, pagination);
						break;
					case 'topics':
						response = await searchService.searchTopics(searchTerm, context, pagination);
						break;
					case 'courses':
						response = await searchService.searchCourses(searchTerm, context, pagination);
						break;
					default:
						throw new Error('Invalid search type');
				}

				setState({
					data: response.data as T[],
					loading: false,
					error: null,
					pagination: response.pagination,
				});
			} catch (error) {
				console.error('Search error:', error);
				setState({
					data: [],
					loading: false,
					error: error instanceof Error ? error.message : 'Search failed',
					pagination: null,
				});
			}
		},
		[type, context, filters]
	);

	const loadMore = useCallback(async () => {
		if (!currentSearchTerm || !state.pagination?.hasNextPage || state.loading) {
			return;
		}

		setState((prev) => ({ ...prev, loading: true }));

		try {
			const nextPage = state.pagination!.currentPage + 1;
			const pagination = { page: nextPage, limit: 20 };

			let response;
			switch (type) {
				case 'users':
					if (!filters?.userRole) {
						throw new Error('User role is required for user search');
					}
					response = await searchService.searchUsers(currentSearchTerm, context, filters, pagination);
					break;
				case 'topics':
					response = await searchService.searchTopics(currentSearchTerm, context, pagination);
					break;
				case 'courses':
					response = await searchService.searchCourses(currentSearchTerm, context, pagination);
					break;
				default:
					throw new Error('Invalid search type');
			}

			setState((prev) => ({
				...prev,
				data: [...prev.data, ...response.data] as T[],
				loading: false,
				pagination: response.pagination,
			}));
		} catch (error) {
			console.error('Load more error:', error);
			setState((prev) => ({
				...prev,
				loading: false,
				error: error instanceof Error ? error.message : 'Failed to load more results',
			}));
		}
	}, [currentSearchTerm, state.pagination, state.loading, type, context, filters]);

	const reset = useCallback(() => {
		setState({
			data: [],
			loading: false,
			error: null,
			pagination: null,
		});
		setCurrentSearchTerm('');
	}, []);

	return {
		...state,
		search,
		loadMore,
		reset,
	};
};
