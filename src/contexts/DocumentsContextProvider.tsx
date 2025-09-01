import axios from '@utils/axiosInstance';
import { ReactNode, createContext, useContext, useState } from 'react';
import { useQuery } from 'react-query';
import Loading from '../components/layouts/loading/Loading';
import LoadingError from '../components/layouts/loading/LoadingError';
import { OrganisationContext } from './OrganisationContextProvider';
import { Document } from '../interfaces/document';
import { useAuth } from '../hooks/useAuth';
import { useLocation } from 'react-router-dom';

interface DocumentsContextTypes {
	documents: Document[];
	sortedLandingPageDocumentsData: Document[];
	loading: boolean;
	error: string | null;
	fetchDocuments: (page?: number) => void;
	fetchMoreDocuments: (startBatch: number, endBatch: number) => void;
	addNewDocument: (newDocument: any) => void;
	removeDocument: (id: string) => void;
	updateDocuments: (singleDocument: Document) => void;
	sortDocumentsData: (property: keyof Document, order: 'asc' | 'desc') => void;
	totalItems: number;
	loadedPages: number[];
	documentsPageNumber: number;
	setDocumentsPageNumber: React.Dispatch<React.SetStateAction<number>>;
}

interface DocumentsContextProviderProps {
	children: ReactNode;
}

export const DocumentsContext = createContext<DocumentsContextTypes>({
	documents: [],
	sortedLandingPageDocumentsData: [],
	loading: false,
	error: null,
	fetchDocuments: () => {},
	fetchMoreDocuments: () => {},
	addNewDocument: () => {},
	removeDocument: () => {},
	updateDocuments: () => {},
	sortDocumentsData: () => {},
	totalItems: 0,
	loadedPages: [],
	documentsPageNumber: 1,
	setDocumentsPageNumber: () => {},
});

const DocumentsContextProvider = (props: DocumentsContextProviderProps) => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const { orgId } = useContext(OrganisationContext);
	const { isAuthenticated, isAdmin, isLearner } = useAuth();
	const location = useLocation();
	const isLandingPageRoute =
		location.pathname === '/' ||
		location.pathname === '/landing-page-courses' ||
		location.pathname === '/resources' ||
		location.pathname === '/contact-us' ||
		location.pathname === '/about-us' ||
		location.pathname === '/auth' ||
		// Only consider course preview pages as landing pages, not enrolled course pages
		(location.pathname.startsWith('/course/') && !location.pathname.includes('/userCourseId/'));

	const [documents, setDocuments] = useState<Document[]>([]);
	const [sortedLandingPageDocumentsData, setSortedLandingPageDocumentsData] = useState<Document[]>([]);
	const [loading, setLoading] = useState<boolean>(false);
	const [error, setError] = useState<string | null>(null);
	const [totalItems, setTotalItems] = useState<number>(0);
	const [loadedPages, setLoadedPages] = useState<number[]>([]);
	const [documentsPageNumber, setDocumentsPageNumber] = useState<number>(1);

	const [isLoaded, setIsLoaded] = useState<boolean>(false);

	const fetchDocuments = async (page: number = 1) => {
		if (!orgId) return;

		setLoading(true);
		setError(null);

		try {
			const response = await axios.get(`${base_url}/documents/organisation/${orgId}?page=${page}&limit=200`);

			if (page === 1) {
				// First page - replace all data
				setDocuments(response.data.data);
				setLoadedPages([1]);
			} else {
				// Subsequent pages - append data
				setDocuments((prev) => [...prev, ...response.data.data]);
				setLoadedPages((prev) => [...prev, page]);
			}

			setTotalItems(response.data.totalItems || response.data.data.length);
			setIsLoaded(true);
			return response.data.data;
		} catch (error: any) {
			setError(error.message || 'Failed to fetch documents');
			setIsLoaded(true);
			throw error;
		} finally {
			setLoading(false);
		}
	};

	const fetchMoreDocuments = async (startBatch: number, endBatch: number) => {
		if (!orgId) return;

		try {
			const promises = [];
			for (let batch = startBatch; batch <= endBatch; batch++) {
				promises.push(axios.get(`${base_url}/documents/organisation/${orgId}?page=${batch}&limit=200`));
			}

			const responses = await Promise.all(promises);
			const newDocuments: Document[] = [];
			let totalItemsCount = 0;

			responses.forEach((response, index) => {
				newDocuments.push(...response.data.data);
				if (index === 0) {
					totalItemsCount = response.data.totalItems || response.data.data.length;
				}
			});

			setDocuments((prev) => [...prev, ...newDocuments]);
			setLoadedPages((prev) => [...prev, ...Array.from({ length: endBatch - startBatch + 1 }, (_, i) => startBatch + i)]);
			setTotalItems(totalItemsCount);
		} catch (error: any) {
			setError(error.message || 'Failed to fetch more documents');
		}
	};

	const { data, isLoading, isError } = useQuery(['allDocuments', orgId, documentsPageNumber], () => fetchDocuments(documentsPageNumber), {
		enabled: !!orgId && isAuthenticated && (isAdmin || isLearner) && !isLoaded && !isLandingPageRoute,
	});

	const fetchLandingPageDocuments = async () => {
		if (!orgId) return;

		try {
			const response = await axios.get(`${base_url}/documents/landing/${orgId}`);

			// Initial sorting when fetching data
			const sortedLandingPageDocumentsDataCopy = [...response.data.data].sort((a: Document, b: Document) => b.createdAt.localeCompare(a.createdAt));
			setSortedLandingPageDocumentsData(sortedLandingPageDocumentsDataCopy);
			setIsLoaded(true);
			return response.data.data;
		} catch (error) {
			setIsLoaded(true);
			throw error;
		}
	};

	const {
		data: landingPageData,
		isLoading: isLandingPageLoading,
		isError: isLandingPageError,
	} = useQuery(['landingPageDocuments', orgId], () => fetchLandingPageDocuments(), {
		enabled: !!orgId && !isLoaded && isLandingPageRoute,
	});

	const sortDocumentsData = (property: keyof Document, order: 'asc' | 'desc') => {
		const sortedData = [...documents].sort((a, b) => {
			const aValue = a[property];
			const bValue = b[property];

			if (typeof aValue === 'string' && typeof bValue === 'string') {
				return order === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
			}

			if (aValue < bValue) return order === 'asc' ? -1 : 1;
			if (aValue > bValue) return order === 'asc' ? 1 : -1;
			return 0;
		});

		setDocuments(sortedData);
	};

	const addNewDocument = (newDocument: any) => {
		setDocuments((prev) => [newDocument, ...prev]);
		setTotalItems((prev) => prev + 1);
	};

	const updateDocuments = (singleDocument: Document) => {
		setDocuments((prev) => prev.map((doc) => (doc._id === singleDocument._id ? singleDocument : doc)));
	};

	const removeDocument = (id: string) => {
		setDocuments((prev) => prev.filter((doc) => doc._id !== id));
		setTotalItems((prev) => Math.max(0, prev - 1));
	};

	const contextValue: DocumentsContextTypes = {
		documents,
		sortedLandingPageDocumentsData,
		loading: isLoading || loading,
		error: isError ? 'Failed to fetch documents' : error,
		fetchDocuments,
		fetchMoreDocuments,
		addNewDocument,
		removeDocument,
		updateDocuments,
		sortDocumentsData,
		totalItems,
		loadedPages,
		documentsPageNumber,
		setDocumentsPageNumber,
	};

	return (
		<DocumentsContext.Provider value={contextValue}>
			{isLoading || isLandingPageLoading ? <Loading /> : isError || isLandingPageError ? <LoadingError /> : props.children}
		</DocumentsContext.Provider>
	);
};

export default DocumentsContextProvider;
