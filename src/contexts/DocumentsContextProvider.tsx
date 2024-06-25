import axios from 'axios';
import { ReactNode, createContext, useContext, useState } from 'react';
import { useQuery } from 'react-query';
import Loading from '../components/layouts/loading/Loading';
import LoadingError from '../components/layouts/loading/LoadingError';
import { OrganisationContext } from './OrganisationContextProvider';
import { Document } from '../interfaces/document';

interface DocumentsContextTypes {
	sortedDocumentsData: Document[];
	sortDocumentsData: (property: keyof Document, order: 'asc' | 'desc') => void;
	addNewDocument: (newDocument: any) => void;
	removeDocument: (id: string) => void;
	updateDocuments: (singleDocument: Document) => void;
	numberOfPages: number;
	documentsPageNumber: number;
	setDocumentsPageNumber: React.Dispatch<React.SetStateAction<number>>;
	fetchDocuments: (page: number) => void;
}

interface DocumentsContextProviderProps {
	children: ReactNode;
}

export const DocumentsContext = createContext<DocumentsContextTypes>({
	sortedDocumentsData: [],
	sortDocumentsData: () => {},
	addNewDocument: () => {},
	removeDocument: () => {},
	updateDocuments: () => {},
	numberOfPages: 1,
	documentsPageNumber: 1,
	setDocumentsPageNumber: () => {},
	fetchDocuments: () => {},
});

const DocumentsContextProvider = (props: DocumentsContextProviderProps) => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const { orgId } = useContext(OrganisationContext);

	const [sortedDocumentsData, setSortedDocumentsData] = useState<Document[]>([]);
	const [numberOfPages, setNumberOfPages] = useState<number>(1);
	const [documentsPageNumber, setDocumentsPageNumber] = useState<number>(1);

	const [isLoaded, setIsLoaded] = useState<boolean>(false);

	const fetchDocuments = async (page: number) => {
		if (!orgId) return;

		try {
			const response = await axios.get(`${base_url}/documents/organisation/${orgId}?page=${page}&limit=50`);

			// Initial sorting when fetching data
			const sortedDocumentsDataCopy = [...response.data.data].sort((a: Document, b: Document) => b.updatedAt.localeCompare(a.updatedAt));
			setSortedDocumentsData(sortedDocumentsDataCopy);
			setNumberOfPages(response.data.pages);
			setIsLoaded(true);
			return response.data.data;
		} catch (error) {
			setIsLoaded(true); // Set isLoading to false in case of an error
			throw error; // Rethrow the error to be handled by React Query
		}
	};

	const { data, isLoading, isError } = useQuery(['allDocuments', orgId, documentsPageNumber], () => fetchDocuments(documentsPageNumber), {
		enabled: !!orgId && !isLoaded,
	});

	// Function to handle sorting
	const sortDocumentsData = (property: keyof Document, order: 'asc' | 'desc') => {
		const sortedDocumentsDataCopy = [...sortedDocumentsData].sort((a: Document, b: Document) => {
			if (order === 'asc') {
				return a[property] > b[property] ? 1 : -1;
			} else {
				return a[property] < b[property] ? 1 : -1;
			}
		});
		setSortedDocumentsData(sortedDocumentsDataCopy);
	};
	// Function to update sortedDocumentsData with new document data
	const addNewDocument = (newDocument: any) => {
		setSortedDocumentsData((prevSortedData) => [newDocument, ...prevSortedData]);
	};

	const updateDocuments = (singleDocument: Document) => {
		const updatedDocumentList = sortedDocumentsData?.map((document) => {
			if (singleDocument._id === document._id) {
				return singleDocument;
			}
			return document;
		});
		setSortedDocumentsData(updatedDocumentList);
	};

	const removeDocument = (id: string) => {
		setSortedDocumentsData((prevSortedData) => prevSortedData?.filter((data) => data._id !== id));
	};

	if (isLoading) {
		return <Loading />;
	}

	if (isError) {
		return <LoadingError />;
	}

	return (
		<DocumentsContext.Provider
			value={{
				sortedDocumentsData,
				sortDocumentsData,
				addNewDocument,
				removeDocument,
				updateDocuments,
				numberOfPages,
				documentsPageNumber,
				setDocumentsPageNumber,
				fetchDocuments,
			}}>
			{props.children}
		</DocumentsContext.Provider>
	);
};

export default DocumentsContextProvider;
