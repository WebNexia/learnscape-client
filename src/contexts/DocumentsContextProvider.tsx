import { ReactNode, createContext, useContext, useState } from 'react';
import { useIsLandingPageRoute } from '../hooks/useIsLandingPageRoute';
import DataFetchErrorBoundary from '../components/error/DataFetchErrorBoundary';

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
	enableDocumentsFetch: () => void;
	disableDocumentsFetch: () => void;
}

interface DocumentsContextProviderProps {
	children: ReactNode;
}

export const DocumentsContext = createContext<DocumentsContextTypes>({} as DocumentsContextTypes);

const DocumentsContextProvider = ({ children }: DocumentsContextProviderProps) => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const { orgId } = useContext(OrganisationContext);
	const { isAuthenticated, hasAdminAccess, isLearner, isInstructor } = useAuth();
	const { user } = useContext(UserAuthContext);

	const isLandingPageRoute = useIsLandingPageRoute();
	const [isEnabled, setIsEnabled] = useState<boolean>(true); // Start enabled to prevent flash

	// Role-aware endpoint and entity key
	const baseUrl = isInstructor ? `${base_url}/documents/organisation/${orgId}/instructor` : `${base_url}/documents/organisation/${orgId}`;
	const entityKey = isInstructor ? 'instructorDocuments' : 'allDocuments';

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
		baseUrl,
		entityKey,
		enabled: isEnabled && isAuthenticated && (hasAdminAccess || isLearner || isInstructor) && !isLandingPageRoute,
		role: user?.role as Roles,
		staleTime: user?.role !== Roles.USER ? 0 : 5 * 60 * 1000,
		cacheTime: 30 * 60 * 1000,
		limit: 200,
		disableAutoGapFill: true,
	});

	const enableDocumentsFetch = () => setIsEnabled(true);
	const disableDocumentsFetch = () => setIsEnabled(false);

	return (
		<DocumentsContext.Provider
			value={{
				documents: documents || [],
				loading: isLoading || (isEnabled && !documents),
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
				enableDocumentsFetch,
				disableDocumentsFetch,
			}}>
			<DataFetchErrorBoundary context='Documents'>{children}</DataFetchErrorBoundary>
		</DocumentsContext.Provider>
	);
};

export default DocumentsContextProvider;
