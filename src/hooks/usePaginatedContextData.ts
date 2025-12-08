import { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import axios from '@utils/axiosInstance';
import { Roles } from '../interfaces/enums';

interface UsePaginatedEntityOptions<T extends { _id: string; updatedAt: string; isActive?: boolean }> {
	orgId: string | null;
	baseUrl: string; // e.g. `${base_url}/courses/organisation/${orgId}`
	entityKey: string; // e.g. "courses" | "lessons" | "questions"
	enabled: boolean;
	role: Roles;
	staleTime?: number;
	cacheTime?: number;
	initialPage?: number;
	limit?: number;
	disableAutoGapFill?: boolean; // Disable automatic gap filling
	refetchOnWindowFocus?: boolean; // Enable refetch on window focus (default: false)
}

export function usePaginatedEntity<T extends { _id: string; updatedAt: string; isActive?: boolean }>({
	orgId,
	baseUrl,
	entityKey,
	enabled,
	role,
	staleTime = 5 * 60 * 1000,
	cacheTime = 30 * 60 * 1000,
	initialPage = 1,
	limit = 200,
	disableAutoGapFill = false,
	refetchOnWindowFocus = false,
}: UsePaginatedEntityOptions<T>) {
	const queryClient = useQueryClient();

	const [pageNumber, setPageNumber] = useState<number>(initialPage);
	const [totalItems, setTotalItems] = useState<number>(0);
	const [loadedPages, setLoadedPages] = useState<number[]>([]);

	const fetchEntities = async (page: number = 1) => {
		if (!orgId) return [];
		// Check if baseUrl already has query params
		const separator = baseUrl.includes('?') ? '&' : '?';
		const response = await axios.get(`${baseUrl}${separator}page=${page}&limit=${limit}`);
		const entities = response.data.data;
		queryClient.setQueryData([entityKey, orgId, page], entities);
		const totalItems = response.data.totalItems || 0;
		setTotalItems(totalItems);
		setLoadedPages((prev) => Array.from(new Set([...prev, page])));
		return entities;
	};

	const fetchMoreEntities = useCallback(
		async (startPage: number, endPage: number) => {
			if (!orgId) return;

			const pagesToFetch: number[] = [];
			for (let page = startPage; page <= endPage; page++) {
				if (!loadedPages?.includes(page)) pagesToFetch.push(page);
			}
			if (pagesToFetch && pagesToFetch.length === 0) return;

			let newEntities: T[] = [];
			for (const page of pagesToFetch) {
				// Check if baseUrl already has query params
				const separator = baseUrl.includes('?') ? '&' : '?';
				const response = await axios.get(`${baseUrl}${separator}page=${page}&limit=${limit}`);
				newEntities = [...newEntities, ...response.data.data];
			}

			const existingData = queryClient.getQueryData<T[]>([entityKey, orgId, pageNumber]) || [];
			const combined = [...existingData, ...newEntities];
			const unique = combined?.filter((item, index, self) => index === self?.findIndex?.((i) => i._id === item._id)) || [];
			const sorted = unique?.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)) || [];

			queryClient.setQueryData([entityKey, orgId, pageNumber], sorted);
			setLoadedPages((prev) => Array.from(new Set([...prev, ...pagesToFetch])));
		},
		[orgId, baseUrl, limit, loadedPages, queryClient, entityKey, pageNumber]
	);

	const { data, isLoading, isError } = useQuery([entityKey, orgId, pageNumber], () => fetchEntities(pageNumber), {
		enabled: !!orgId && enabled,
		staleTime,
		cacheTime,
		refetchOnWindowFocus, // Configurable - enables immediate updates for admins/instructors
		refetchOnMount: true, // 👈 Enable refetch on mount to get fresh data when navigating back
	});

	// Progressive pagination fill - with debouncing to prevent multiple rapid calls
	useEffect(() => {
		if (loadedPages?.length > 0 && orgId && !disableAutoGapFill) {
			// Debounce to prevent rapid calls during updates
			const timeoutId = setTimeout(() => {
				const sortedPages = [...(loadedPages || [])]?.sort((a, b) => a - b) || [];
				const maxPage = Math.max(...sortedPages);

				let missingStart: number | null = null;

				for (let page = 1; page <= maxPage; page++) {
					if (!loadedPages?.includes(page)) {
						if (missingStart === null) {
							missingStart = page; // start of a gap
						}
					} else if (missingStart !== null) {
						// end of a gap -> fetch missing range
						fetchMoreEntities(missingStart, page - 1);
						missingStart = null;
					}
				}

				// If gap continues till the end
				if (missingStart !== null) {
					fetchMoreEntities(missingStart, maxPage);
				}
			}, 500); // 500ms debounce

			return () => clearTimeout(timeoutId);
		}
	}, [loadedPages, orgId, disableAutoGapFill]);

	// CRUD Helpers
	const addEntity = (newEntity: T) => {
		queryClient.setQueryData<T[]>([entityKey, orgId, pageNumber], (old = []) => [newEntity, ...(old || [])]);
		setTotalItems((prev) => prev + 1);
		setLoadedPages((prev) => (prev && prev.length === 0 ? [1] : prev));

		// Invalidate dashboard cache when new course is created
		if (entityKey === 'allCourses' || entityKey === 'instructorCourses') {
			queryClient.invalidateQueries(['dashboardSummary']);
		}

		// Invalidate questions cache when new question is created
		if (entityKey === 'allQuestions' || entityKey === 'instructorQuestions') {
			queryClient.invalidateQueries([entityKey, orgId]);
			// Force refetch of the current page
			queryClient.refetchQueries([entityKey, orgId, pageNumber]);
		}
	};

	const updateEntity = (updatedEntity: T) => {
		loadedPages?.forEach((page) => {
			queryClient.setQueryData<T[]>(
				[entityKey, orgId, page],
				(old = []) => (old || [])?.map((item) => (item._id === updatedEntity._id ? updatedEntity : item)) || []
			);
		});
		// 👈 Removed cache invalidation to prevent multiple API calls
		// queryClient.invalidateQueries([entityKey, orgId]);
	};

	const toggleEntityActive = (id: string) => {
		loadedPages?.forEach((page) => {
			queryClient.setQueryData<T[]>(
				[entityKey, orgId, page],
				(old = []) => (old || [])?.map((item) => (item._id === id ? { ...item, isActive: !item.isActive } : item)) || []
			);
		});
		// 👈 Removed cache invalidation to prevent multiple API calls
		// queryClient.invalidateQueries([entityKey, orgId]);
	};

	const removeEntity = (id: string) => {
		queryClient.setQueryData<T[]>([entityKey, orgId, pageNumber], (old = []) => (old || [])?.filter((item) => item._id !== id) || []);
		setTotalItems((prev) => Math.max(0, prev - 1));

		// Invalidate dashboard cache when course is removed
		if (entityKey === 'allCourses' || entityKey === 'instructorCourses') {
			queryClient.invalidateQueries(['dashboardSummary']);
		}

		// Invalidate questions cache when question is removed
		if (entityKey === 'allQuestions' || entityKey === 'instructorQuestions') {
			queryClient.invalidateQueries([entityKey, orgId]);
		}
	};

	const sortEntities = (property: keyof T, order: 'asc' | 'desc') => {
		return (
			[...(data || [])]?.sort((a, b) => {
				const aValue = a[property] ?? '';
				const bValue = b[property] ?? '';
				return order === 'asc' ? (aValue > bValue ? 1 : -1) : aValue < bValue ? 1 : -1;
			}) || []
		);
	};

	// Get all accumulated data from all loaded pages
	const getAllAccumulatedData = useCallback(() => {
		if (!orgId || !loadedPages || loadedPages.length === 0) return data || [];

		let allData: T[] = [];
		for (const page of loadedPages) {
			const pageData = queryClient.getQueryData<T[]>([entityKey, orgId, page]) || [];
			allData = [...allData, ...pageData];
		}

		// Remove duplicates and sort by updatedAt
		const unique = allData?.filter((item, index, self) => index === self?.findIndex?.((i) => i._id === item._id)) || [];
		return (
			unique?.sort((a, b) => {
				// Handle cases where updatedAt might be undefined
				const aUpdatedAt = a.updatedAt || (a as any).createdAt || '';
				const bUpdatedAt = b.updatedAt || (b as any).createdAt || '';
				return bUpdatedAt.localeCompare(aUpdatedAt);
			}) || []
		);
	}, [orgId, loadedPages, queryClient, entityKey, data]);

	return {
		data: getAllAccumulatedData(),
		isLoading,
		isError,
		fetchEntities,
		fetchMoreEntities,
		addEntity,
		updateEntity,
		toggleEntityActive,
		removeEntity,
		sortEntities,
		pageNumber,
		setPageNumber,
		totalItems,
		loadedPages,
	};
}
