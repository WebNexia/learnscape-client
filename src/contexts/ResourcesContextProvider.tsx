import { ReactNode, createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import { useIsLandingPageRoute } from '../hooks/useIsLandingPageRoute';
import DataFetchErrorBoundary from '../components/error/DataFetchErrorBoundary';
import { OrganisationContext } from './OrganisationContextProvider';
import { useAuth } from '../hooks/useAuth';
import { UserAuthContext } from './UserAuthContextProvider';
import { Roles } from '../interfaces/enums';
import { ResourceFolder, ResourceItem, ResourceAccessInfo } from '../interfaces/resource';
import { useQuery, useQueryClient, useMutation } from 'react-query';
import axios from '@utils/axiosInstance';
import { useLocation } from 'react-router-dom';

interface ResourcesContextTypes {
	// Folders
	folders: ResourceFolder[];
	foldersLoading: boolean;
	foldersError: string | null;
	fetchFolders: (page?: number) => Promise<ResourceFolder[]>;
	fetchMoreFolders: (startPage: number, endPage: number) => Promise<void>;
	foldersPageNumber: number;
	setFoldersPageNumber: React.Dispatch<React.SetStateAction<number>>;
	foldersTotalItems: number;
	foldersLoadedPages: number[];

	// Items
	items: ResourceItem[];
	itemsLoading: boolean;
	itemsError: string | null;
	fetchItems: (folderId?: string, page?: number) => Promise<ResourceItem[]>;
	fetchMoreItems: (startPage: number, endPage: number) => Promise<void>;
	itemsPageNumber: number;
	setItemsPageNumber: React.Dispatch<React.SetStateAction<number>>;
	itemsTotalItems: number;
	itemsLoadedPages: number[];
	currentFolderId: string | null;
	setCurrentFolderId: React.Dispatch<React.SetStateAction<string | null>>;

	// Search
	searchResources: (query: string, folderId?: string) => Promise<{ items: ResourceItem[]; folders: ResourceFolder[] }>;

	// Access
	accessInfo: ResourceAccessInfo | null;
	resourcesAccessLoading: boolean;
	resourcesAccessDenied: boolean;
	checkAccess: () => Promise<ResourceAccessInfo>;

	// Admin mutations
	createFolder: (folder: Partial<ResourceFolder>) => Promise<ResourceFolder>;
	updateFolder: (id: string, folder: Partial<ResourceFolder>) => Promise<ResourceFolder>;
	deleteFolder: (id: string) => Promise<void>;
	createItem: (item: Partial<ResourceItem>) => Promise<ResourceItem>;
	updateItem: (id: string, item: Partial<ResourceItem>) => Promise<ResourceItem>;
	deleteItem: (id: string) => Promise<void>;

	// Enable/disable
	enableResourcesFetch: () => void;
	disableResourcesFetch: () => void;
}

interface ResourcesContextProviderProps {
	children: ReactNode;
}

export const ResourcesContext = createContext<ResourcesContextTypes>({} as ResourcesContextTypes);

const ResourcesContextProvider = ({ children }: ResourcesContextProviderProps) => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const { orgId } = useContext(OrganisationContext);
	const { isAuthenticated, hasAdminAccess, isLearner, isInstructor } = useAuth();
	const { user } = useContext(UserAuthContext);

	const isLandingPageRoute = useIsLandingPageRoute();
	const location = useLocation();
	const isResourceFolderRoute = /\/resources\/folder\/[^/]+/.test(location.pathname);
	const [isEnabled, setIsEnabled] = useState<boolean>(true);
	const queryClient = useQueryClient();

	// Folders state
	const [foldersPageNumber, setFoldersPageNumber] = useState<number>(1);
	const [foldersTotalItems, setFoldersTotalItems] = useState<number>(0);
	const [foldersLoadedPages, setFoldersLoadedPages] = useState<number[]>([]);

	// Items state
	const [itemsPageNumber, setItemsPageNumber] = useState<number>(1);
	const [itemsTotalItems, setItemsTotalItems] = useState<number>(0);
	const [itemsLoadedPages, setItemsLoadedPages] = useState<number[]>([]);
	const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);

	// Reset items pagination when folder changes
	useEffect(() => {
		setItemsPageNumber(1);
		setItemsLoadedPages([]);
		setItemsTotalItems(0);
	}, [currentFolderId]);

	const enabled = isEnabled && isAuthenticated && (hasAdminAccess || isLearner || isInstructor) && !isLandingPageRoute;

	// Fetch folders
	const fetchFolders = useCallback(
		async (page: number = 1) => {
			if (!orgId) return [];
			try {
				const response = await axios.get(`${base_url}/resources/folders?page=${page}&limit=100`);
				if (response.data.status === 200) {
					const folders = Array.isArray(response.data.data) ? response.data.data : [];
					const total = response.data.total || 0;
					setFoldersTotalItems(total);
					queryClient.setQueryData(['resourceFolders', orgId, page], folders);
					setFoldersLoadedPages((prev) => Array.from(new Set([...prev, page])));
					return folders;
				}
				return [];
			} catch (error) {
				console.error('Error fetching folders:', error);
				throw error;
			}
		},
		[orgId, base_url, queryClient]
	);

	// Fetch more folders (progressive pagination)
	const fetchMoreFolders = useCallback(
		async (startPage: number, endPage: number) => {
			if (!orgId) return;

			const pagesToFetch: number[] = [];
			for (let page = startPage; page <= endPage; page++) {
				if (!foldersLoadedPages.includes(page)) {
					pagesToFetch.push(page);
				}
			}
			if (pagesToFetch.length === 0) return;

			for (const page of pagesToFetch) {
				await fetchFolders(page);
			}
		},
		[orgId, foldersLoadedPages, fetchFolders]
	);

	// Fetch items
	const fetchItems = useCallback(
		async (folderId?: string, page: number = 1) => {
			if (!orgId) return [];
			try {
				const folderParam = folderId ? `&folderId=${folderId}` : '';
				const response = await axios.get(`${base_url}/resources/items?page=${page}&limit=100${folderParam}`);
				if (response.data.status === 200) {
					const items = Array.isArray(response.data.data) ? response.data.data : [];
					const total = response.data.total || 0;
					setItemsTotalItems(total);
					queryClient.setQueryData(['resourceItems', orgId, folderId || 'all', page], items);
					setItemsLoadedPages((prev) => Array.from(new Set([...prev, page])));
					return items;
				}
				return [];
			} catch (error) {
				console.error('Error fetching items:', error);
				throw error;
			}
		},
		[orgId, base_url, queryClient]
	);

	// Fetch more items (progressive pagination)
	const fetchMoreItems = useCallback(
		async (startPage: number, endPage: number) => {
			if (!orgId) return;

			const pagesToFetch: number[] = [];
			for (let page = startPage; page <= endPage; page++) {
				if (!itemsLoadedPages.includes(page)) {
					pagesToFetch.push(page);
				}
			}
			if (pagesToFetch.length === 0) return;

			for (const page of pagesToFetch) {
				await fetchItems(currentFolderId || undefined, page);
			}
		},
		[orgId, itemsLoadedPages, currentFolderId, fetchItems]
	);

	// Search resources
	const searchResources = useCallback(
		async (query: string, folderId?: string) => {
			if (!orgId || !query.trim()) return { items: [], folders: [] };
			try {
				const folderParam = folderId ? `&folderId=${folderId}` : '';
				const response = await axios.get(`${base_url}/resources/search?q=${encodeURIComponent(query)}${folderParam}`);
				if (response.data.status === 200) {
					return {
						items: response.data.data.items || [],
						folders: response.data.data.folders || [],
					};
				}
				return { items: [], folders: [] };
			} catch (error) {
				console.error('Error searching resources:', error);
				return { items: [], folders: [] };
			}
		},
		[orgId, base_url]
	);

	// Check access
	const checkAccess = useCallback(async () => {
		if (!isAuthenticated) {
			return {
				canAccess: false,
				accessLevel: 'limited',
				source: 'not_authenticated',
				validUntil: null,
				reason: 'Authentication required',
			};
		}
		try {
			const response = await axios.get(`${base_url}/resources/me/access`);
			if (response.data.status === 200) {
				return response.data.data as ResourceAccessInfo;
			}
			return {
				canAccess: false,
				accessLevel: 'limited',
				source: 'error',
				validUntil: null,
				reason: 'Error checking access',
			};
		} catch (error) {
			console.error('Error checking access:', error);
			return {
				canAccess: false,
				accessLevel: 'limited',
				source: 'error',
				validUntil: null,
				reason: 'Error checking access',
			};
		}
	}, [isAuthenticated, base_url]);

	const { data: accessInfo, isLoading: accessInfoLoading } = useQuery(['resourceAccess', orgId], checkAccess, {
		enabled: !!orgId && isAuthenticated && isLearner,
		staleTime: 5 * 60 * 1000,
		cacheTime: 30 * 60 * 1000,
		refetchOnWindowFocus: false,
	});

	const learnerResourcesAccessDenied = isLearner && accessInfo !== undefined && !accessInfo.canAccess;
	const canFetchResourcesData = enabled && (!isLearner || accessInfo?.canAccess === true);

	// React Query hooks for folders
	const {
		data: folders,
		isLoading: foldersLoading,
		isError: foldersError,
	} = useQuery(['resourceFolders', orgId, foldersPageNumber], () => fetchFolders(foldersPageNumber), {
		enabled: !!orgId && canFetchResourcesData && !isResourceFolderRoute,
		staleTime: user?.role !== Roles.USER ? 0 : 3 * 60 * 1000, // Real-time for admins/instructors, 3 min for learners
		cacheTime: 30 * 60 * 1000,
		refetchOnMount: true,
		refetchOnWindowFocus: false, // Consistent with other admin pages
	});

	// React Query hooks for items
	const {
		data: items,
		isLoading: itemsLoading,
		isError: itemsError,
	} = useQuery(
		['resourceItems', orgId, currentFolderId, itemsPageNumber],
		() => fetchItems(currentFolderId!, itemsPageNumber),
		{
			enabled: !!orgId && canFetchResourcesData && !!currentFolderId,
			staleTime: user?.role !== Roles.USER ? 0 : 3 * 60 * 1000, // Real-time for admins/instructors, 3 min for learners
			cacheTime: 30 * 60 * 1000,
			refetchOnMount: true,
			refetchOnWindowFocus: false, // Consistent with other admin pages
		}
	);

	// Admin mutations
	const createFolderMutation = useMutation(
		(folder: Partial<ResourceFolder>) => axios.post(`${base_url}/resources/admin/folders`, folder),
		{
			onSuccess: () => {
				queryClient.invalidateQueries(['resourceFolders', orgId]);
			},
		}
	);

	const updateFolderMutation = useMutation(
		({ id, folder }: { id: string; folder: Partial<ResourceFolder> }) =>
			axios.patch(`${base_url}/resources/admin/folders/${id}`, folder),
		{
			onSuccess: (_data, variables) => {
				queryClient.invalidateQueries(['resourceFolders', orgId]);
				queryClient.invalidateQueries(['resourceFolder', orgId, variables.id]);
			},
		}
	);

	const deleteFolderMutation = useMutation(
		(id: string) => axios.delete(`${base_url}/resources/admin/folders/${id}`),
		{
			onSuccess: (_data, id) => {
				queryClient.invalidateQueries(['resourceFolders', orgId]);
				queryClient.removeQueries(['resourceFolder', orgId, id]);
				queryClient.invalidateQueries(['resourceItems', orgId]);
			},
		}
	);

	const createItemMutation = useMutation(
		(item: Partial<ResourceItem>) => axios.post(`${base_url}/resources/admin/items`, item),
		{
			onSuccess: () => {
				queryClient.invalidateQueries(['resourceItems', orgId]);
				queryClient.invalidateQueries(['resourceFolders', orgId]); // Update itemCount
			},
		}
	);

	const updateItemMutation = useMutation(
		({ id, item }: { id: string; item: Partial<ResourceItem> }) =>
			axios.patch(`${base_url}/resources/admin/items/${id}`, item),
		{
			onSuccess: () => {
				queryClient.invalidateQueries(['resourceItems', orgId]);
				queryClient.invalidateQueries(['resourceFolders', orgId]); // Update itemCount if folder changed
			},
		}
	);

	const deleteItemMutation = useMutation(
		(id: string) => axios.delete(`${base_url}/resources/admin/items/${id}`),
		{
			onSuccess: () => {
				queryClient.invalidateQueries(['resourceItems', orgId]);
				queryClient.invalidateQueries(['resourceFolders', orgId]); // Update itemCount
			},
		}
	);

	const enableResourcesFetch = () => setIsEnabled(true);
	const disableResourcesFetch = () => setIsEnabled(false);

	// Note: Gap-filling is handled by useFilterSearch when needed (consistent with other admin pages)

	// Accumulate all folders from all loaded pages
	const allFolders = useMemo(() => {
		if (!orgId) return [];
		if (foldersLoadedPages.length === 0) {
			return Array.isArray(folders) ? folders : [];
		}

		const uniqueFolders = new Map<string, ResourceFolder>();
		for (const page of foldersLoadedPages) {
			const pageData = queryClient.getQueryData<ResourceFolder[]>(['resourceFolders', orgId, page]);
			if (!Array.isArray(pageData)) continue;
			for (const folder of pageData) {
				if (folder?._id) uniqueFolders.set(folder._id, folder);
			}
		}

		if (uniqueFolders.size === 0 && Array.isArray(folders)) {
			return folders;
		}

		return Array.from(uniqueFolders.values()).sort((a, b) => a.name.localeCompare(b.name));
	}, [orgId, foldersLoadedPages, folders, queryClient]);

	// Accumulate all items from all loaded pages
	const allItems = useMemo(() => {
		if (!orgId) return [];
		if (itemsLoadedPages.length === 0) {
			return Array.isArray(items) ? items : [];
		}

		const uniqueItems = new Map<string, ResourceItem>();
		for (const page of itemsLoadedPages) {
			const pageData = queryClient.getQueryData<ResourceItem[]>(['resourceItems', orgId, currentFolderId, page]);
			if (!Array.isArray(pageData)) continue;
			for (const item of pageData) {
				if (item?._id) uniqueItems.set(item._id, item);
			}
		}

		if (uniqueItems.size === 0 && Array.isArray(items)) {
			return items;
		}

		return Array.from(uniqueItems.values()).sort((a, b) => a.title.localeCompare(b.title));
	}, [orgId, itemsLoadedPages, items, currentFolderId, queryClient]);

	return (
		<ResourcesContext.Provider
			value={{
				// Folders
				folders: allFolders,
				foldersLoading: foldersLoading || (isEnabled && !folders),
				foldersError: foldersError ? 'Failed to fetch folders' : null,
				fetchFolders,
				fetchMoreFolders,
				foldersPageNumber,
				setFoldersPageNumber,
				foldersTotalItems,
				foldersLoadedPages,

				// Items
				items: allItems,
				itemsLoading: !!currentFolderId && (itemsLoading || (canFetchResourcesData && items === undefined)),
				itemsError: itemsError ? 'Failed to fetch items' : null,
				fetchItems,
				fetchMoreItems,
				itemsPageNumber,
				setItemsPageNumber,
				itemsTotalItems,
				itemsLoadedPages,
				currentFolderId,
				setCurrentFolderId,

				// Search
				searchResources,

				// Access
				accessInfo: accessInfo || null,
				resourcesAccessLoading: isLearner && accessInfoLoading,
				resourcesAccessDenied: learnerResourcesAccessDenied,
				checkAccess,

				// Admin mutations
				createFolder: async (folder) => {
					const response = await createFolderMutation.mutateAsync(folder);
					return response.data.data;
				},
				updateFolder: async (id, folder) => {
					const response = await updateFolderMutation.mutateAsync({ id, folder });
					return response.data.data;
				},
				deleteFolder: async (id) => {
					await deleteFolderMutation.mutateAsync(id);
				},
				createItem: async (item) => {
					const response = await createItemMutation.mutateAsync(item);
					return response.data.data;
				},
				updateItem: async (id, item) => {
					const response = await updateItemMutation.mutateAsync({ id, item });
					return response.data.data;
				},
				deleteItem: async (id) => {
					await deleteItemMutation.mutateAsync(id);
				},

				// Enable/disable
				enableResourcesFetch,
				disableResourcesFetch,
			}}>
			<DataFetchErrorBoundary context='Resources'>{children}</DataFetchErrorBoundary>
		</ResourcesContext.Provider>
	);
};

export default ResourcesContextProvider;
