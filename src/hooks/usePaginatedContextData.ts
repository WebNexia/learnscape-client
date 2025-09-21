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
}: UsePaginatedEntityOptions<T>) {
	const queryClient = useQueryClient();

	const [pageNumber, setPageNumber] = useState<number>(initialPage);
	const [totalItems, setTotalItems] = useState<number>(0);
	const [loadedPages, setLoadedPages] = useState<number[]>([]);

	const fetchEntities = async (page: number = 1) => {
		if (!orgId) return [];
		const response = await axios.get(`${baseUrl}?page=${page}&limit=${limit}`);
		const entities = response.data.data;
		queryClient.setQueryData([entityKey, orgId, page], entities);
		setTotalItems(response.data.totalItems);
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
				const response = await axios.get(`${baseUrl}?page=${page}&limit=${limit}`);
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
		refetchOnWindowFocus: false, // 👈 Disabled to prevent multiple API calls
		refetchOnMount: false, // 👈 Disabled to prevent multiple API calls
	});

	// Progressive pagination fill - with debouncing to prevent multiple rapid calls
	useEffect(() => {
		if (loadedPages?.length > 0 && orgId) {
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
	}, [loadedPages, orgId]);

	// CRUD Helpers
	const addEntity = (newEntity: T) => {
		queryClient.setQueryData<T[]>([entityKey, orgId, pageNumber], (old = []) => [newEntity, ...(old || [])]);
		setTotalItems((prev) => prev + 1);
		setLoadedPages((prev) => (prev && prev.length === 0 ? [1] : prev));
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

	return {
		data: data || [],
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
