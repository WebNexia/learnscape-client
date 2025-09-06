// DocumentsContextProvider.tsx
import { ReactNode, createContext, useContext } from 'react';
import { useLocation } from 'react-router-dom';
import Loading from '../components/layouts/loading/Loading';
import LoadingError from '../components/layouts/loading/LoadingError';
import { OrganisationContext } from './OrganisationContextProvider';
import { useAuth } from '../hooks/useAuth';
import { UserAuthContext } from './UserAuthContextProvider';
import { Roles } from '../interfaces/enums';
import { Document } from '../interfaces/document';
import { usePaginatedEntity } from '../hooks/usePaginatedContextData';

interface DocumentsContextTypes {
	documents: Document[];
	loading: boolean;
	error: string | null;
	fetchDocuments: (page?: number) => Promise<Document[]>;
	fetchMoreDocuments: (startPage: number, endPage: number) => Promise<void>;
	addNewDocument: (newDocument: Document) => void;
	updateDocument: (singleDocument: Document) => void;
	removeDocument: (id: string) => void;
	sortDocumentsData: (property: keyof Document, order: 'asc' | 'desc') => Document[];
	documentsPageNumber: number;
	setDocumentsPageNumber: React.Dispatch<React.SetStateAction<number>>;
	totalItems: number;
	loadedPages: number[];
}

interface DocumentsContextProviderProps {
	children: ReactNode;
}

export const DocumentsContext = createContext<DocumentsContextTypes>({} as DocumentsContextTypes);

const DocumentsContextProvider = ({ children }: DocumentsContextProviderProps) => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const { orgId } = useContext(OrganisationContext);
	const { isAuthenticated, isAdmin, isLearner } = useAuth();
	const { user } = useContext(UserAuthContext);
	const location = useLocation();

	const isLandingPageRoute =
		location.pathname === '/' ||
		location.pathname === '/landing-page-courses' ||
		location.pathname === '/resources' ||
		location.pathname === '/contact-us' ||
		location.pathname === '/about-us' ||
		location.pathname === '/auth' ||
		(location.pathname.startsWith('/course/') && !location.pathname?.includes?.('/userCourseId/'));

	const {
		data: documents,
		isLoading,
		isError,
		fetchEntities: fetchDocuments,
		fetchMoreEntities: fetchMoreDocuments,
		addEntity: addNewDocument,
		updateEntity: updateDocument,
		removeEntity: removeDocument,
		sortEntities: sortDocumentsData,
		pageNumber: documentsPageNumber,
		setPageNumber: setDocumentsPageNumber,
		totalItems,
		loadedPages,
	} = usePaginatedEntity<Document>({
		orgId,
		baseUrl: `${base_url}/documents/organisation/${orgId}`,
		entityKey: 'allDocuments',
		enabled: isAuthenticated && (isAdmin || isLearner) && !isLandingPageRoute,
		role: user?.role as Roles,
		staleTime: user?.role !== Roles.USER ? 0 : 5 * 60 * 1000,
		cacheTime: 30 * 60 * 1000,
	});

	if (isLoading && isAuthenticated) return <Loading />;
	if (isError && isAuthenticated) return <LoadingError />;

	return (
		<DocumentsContext.Provider
			value={{
				documents,
				loading: isLoading,
				error: isError ? 'Failed to fetch documents' : null,
				fetchDocuments,
				fetchMoreDocuments,
				addNewDocument,
				updateDocument,
				removeDocument,
				sortDocumentsData,
				documentsPageNumber,
				setDocumentsPageNumber,
				totalItems,
				loadedPages,
			}}>
			{children}
		</DocumentsContext.Provider>
	);
};

export default DocumentsContextProvider;

// import axios from '@utils/axiosInstance';
// import { ReactNode, createContext, useContext, useState, useEffect } from 'react';
// import { useQuery, useQueryClient } from 'react-query';
// import Loading from '../components/layouts/loading/Loading';
// import LoadingError from '../components/layouts/loading/LoadingError';
// import { OrganisationContext } from './OrganisationContextProvider';
// import { Document } from '../interfaces/document';
// import { useAuth } from '../hooks/useAuth';
// import { useLocation } from 'react-router-dom';

// interface DocumentsContextTypes {
// 	documents: Document[];
// 	loading: boolean;
// 	error: string | null;
// 	fetchDocuments: (page?: number) => Promise<Document[]>;
// 	fetchMoreDocuments: (startBatch: number, endBatch: number) => Promise<void>;
// 	addNewDocument: (newDocument: any) => void;
// 	removeDocument: (id: string) => void;
// 	updateDocuments: (singleDocument: Document) => void;
// 	sortDocumentsData: (property: keyof Document, order: 'asc' | 'desc') => void;
// 	totalItems: number;
// 	loadedPages: number[];
// 	documentsPageNumber: number;
// 	setDocumentsPageNumber: React.Dispatch<React.SetStateAction<number>>;
// }

// interface DocumentsContextProviderProps {
// 	children: ReactNode;
// }

// export const DocumentsContext = createContext<DocumentsContextTypes>({
// 	documents: [],
// 	loading: false,
// 	error: null,
// 	fetchDocuments: async () => [],
// 	fetchMoreDocuments: async () => {},
// 	addNewDocument: () => {},
// 	removeDocument: () => {},
// 	updateDocuments: () => {},
// 	sortDocumentsData: () => {},
// 	totalItems: 0,
// 	loadedPages: [],
// 	documentsPageNumber: 1,
// 	setDocumentsPageNumber: () => {},
// });

// const DocumentsContextProvider = (props: DocumentsContextProviderProps) => {
// 	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
// 	const { orgId } = useContext(OrganisationContext);
// 	const { isAuthenticated, isAdmin, isLearner } = useAuth();
// 	const location = useLocation();
// 	const queryClient = useQueryClient();
// 	const isLandingPageRoute =
// 		location.pathname === '/' ||
// 		location.pathname === '/landing-page-courses' ||
// 		location.pathname === '/resources' ||
// 		location.pathname === '/contact-us' ||
// 		location.pathname === '/about-us' ||
// 		location.pathname === '/auth' ||
// 		// Only consider course preview pages as landing pages, not enrolled course pages
// 		(location.pathname.startsWith('/course/') && !location.pathname?.includes?.('/userCourseId/'));

// 	const [totalItems, setTotalItems] = useState<number>(0);
// 	const [loadedPages, setLoadedPages] = useState<number[]>([]);
// 	const [documentsPageNumber, setDocumentsPageNumber] = useState<number>(1);

// 	const fetchDocuments = async (page: number = 1) => {
// 		if (!orgId) return [];
// 		try {
// 			const response = await axios.get(`${base_url}/documents/organisation/${orgId}?page=${page}&limit=200`);

// 			const documentsData = response.data.data;

// 			// React Query cache'i güncelle
// 			queryClient.setQueryData(['allDocuments', orgId, documentsPageNumber], documentsData);

// 			setTotalItems(response.data.totalItems || response.data.data.length);
// 			setLoadedPages((prev) => Array.from(new Set([...prev, page])));

// 			return documentsData;
// 		} catch (error: any) {
// 			throw error;
// 		}
// 	};

// 	const fetchMoreDocuments = async (startBatch: number, endBatch: number) => {
// 		if (!orgId) return;
// 		try {
// 			const promises = [];
// 			for (let batch = startBatch; batch <= endBatch; batch++) {
// 				promises.push(axios.get(`${base_url}/documents/organisation/${orgId}?page=${batch}&limit=200`));
// 			}

// 			const responses = await Promise.all(promises);
// 			const newDocuments: Document[] = [];

// 			responses.forEach((response, _) => {
// 				newDocuments.push(...response.data.data);
// 			});

// 			// Combine with existing data, remove duplicates, and sort
// 			const combinedData = [...(documentsData || []), ...newDocuments];
// 			const uniqueData = combinedData.filter((doc, index, self) => index === self.findIndex((d) => d._id === doc._id));
// 			const sortedData = uniqueData.sort((a: Document, b: Document) => b.updatedAt.localeCompare(a.updatedAt));
// 			queryClient.setQueryData(['allDocuments', orgId], sortedData);
// 			setLoadedPages([...loadedPages, ...Array.from({ length: endBatch - startBatch + 1 }, (_, i) => startBatch + i)]);
// 		} catch (error: any) {
// 			console.error('Error fetching more documents:', error);
// 		}
// 	};

// 	const {
// 		data: documentsData,
// 		isLoading,
// 		isError,
// 	} = useQuery(['allDocuments', orgId], () => fetchDocuments(documentsPageNumber), {
// 		enabled: !!orgId && isAuthenticated && (isAdmin || isLearner) && !isLandingPageRoute,
// 		staleTime: 5 * 60 * 1000, // 5 minutes - data stays fresh
// 		cacheTime: 30 * 60 * 1000, // 30 minutes - data stays in cache
// 		refetchOnWindowFocus: false, // No refetch on window focus
// 		refetchOnMount: false, // No refetch on component remount
// 	});

// 	const sortDocumentsData = (property: keyof Document, order: 'asc' | 'desc') => {
// 		// React Query data'yı sort et, local state'e set etme
// 		const sortedDataCopy = [...(documentsData || [])].sort((a, b) => {
// 			const aValue = a[property];
// 			const bValue = b[property];

// 			if (typeof aValue === 'string' && typeof bValue === 'string') {
// 				return order === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
// 			}

// 			if (aValue < bValue) return order === 'asc' ? -1 : 1;
// 			if (aValue > bValue) return order === 'asc' ? 1 : -1;
// 			return 0;
// 		});
// 		// Local state'e set etme, sadece sort edilmiş data'yı return et
// 		return sortedDataCopy;
// 	};

// 	const addNewDocument = (newDocument: any) => {
// 		// React Query cache'i güncelle
// 		queryClient.setQueryData(['allDocuments', orgId], (oldData: any) => {
// 			return oldData ? [newDocument, ...oldData] : [newDocument];
// 		});
// 	};

// 	const updateDocuments = (singleDocument: Document) => {
// 		// React Query cache'i güncelle
// 		queryClient.setQueryData(['allDocuments', orgId], (oldData: any) => {
// 			return oldData?.map((doc: Document) => (doc._id === singleDocument._id ? singleDocument : doc));
// 		});
// 	};

// 	const removeDocument = (id: string) => {
// 		// React Query cache'i güncelle
// 		queryClient.setQueryData(['allDocuments', orgId], (oldData: any) => {
// 			return oldData?.filter((doc: Document) => doc._id !== id);
// 		});
// 	};

// 	// useEffect ile documentsData değiştiğinde local state'i güncelle
// 	useEffect(() => {
// 		if (documentsData) {
// 			// Don't override totalItems from server - only set loadedPages
// 			// setTotalItems(documentsData.length); // ❌ This breaks pagination

// 			setLoadedPages((prev) => (prev.length === 0 ? [1] : prev));
// 		}
// 	}, [documentsData]);

// 	if (isLoading) {
// 		return <Loading />;
// 	}

// 	if (isError) {
// 		return <LoadingError />;
// 	}

// 	return (
// 		<DocumentsContext.Provider
// 			value={{
// 				documents: documentsData || [], // React Query data kullan
// 				loading: isLoading,
// 				error: isError ? 'Failed to fetch documents' : null,
// 				fetchDocuments,
// 				fetchMoreDocuments,
// 				addNewDocument,
// 				removeDocument,
// 				updateDocuments,
// 				sortDocumentsData,
// 				totalItems,
// 				loadedPages,
// 				documentsPageNumber,
// 				setDocumentsPageNumber,
// 			}}>
// 			{props.children}
// 		</DocumentsContext.Provider>
// 	);
// };

// export default DocumentsContextProvider;
