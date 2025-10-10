import axios from '@utils/axiosInstance';
import { ReactNode, createContext, useContext, useState } from 'react';
import { Document } from '../interfaces/document';
import { OrganisationContext } from './OrganisationContextProvider';

interface ArchivedDocument extends Document {
	archivedAt?: string;
	archivedBy?: string;
	archivedByName?: string;
}

interface RecycleBinDocumentsContextTypes {
	archivedDocuments: ArchivedDocument[];
	totalItems: number;
	currentPage: number;
	searchResults: ArchivedDocument[];
	searchResultsTotalItems: number;
	isSearchActive: boolean;
	searchValue: string;
	setSearchValue: React.Dispatch<React.SetStateAction<string>>;
	filterValue: string;
	setFilterValue: React.Dispatch<React.SetStateAction<string>>;
	searchedValue: string;
	setSearchedValue: React.Dispatch<React.SetStateAction<string>>;
	searchButtonClicked: boolean;
	setSearchButtonClicked: React.Dispatch<React.SetStateAction<boolean>>;
	fetchArchivedDocuments: (page?: number) => void;
	setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
	setSearchResults: React.Dispatch<React.SetStateAction<ArchivedDocument[]>>;
	setSearchResultsTotalItems: React.Dispatch<React.SetStateAction<number>>;
	setIsSearchActive: React.Dispatch<React.SetStateAction<boolean>>;
	setArchivedDocuments: React.Dispatch<React.SetStateAction<ArchivedDocument[]>>;
	setTotalItems: React.Dispatch<React.SetStateAction<number>>;
	loadedPages: number[];
	setLoadedPages: React.Dispatch<React.SetStateAction<number[]>>;
	snackbarOpen: boolean;
	snackbarMessage: string;
	snackbarSeverity: 'success' | 'error' | 'warning' | 'info';
	setSnackbarOpen: React.Dispatch<React.SetStateAction<boolean>>;
	setSnackbarMessage: React.Dispatch<React.SetStateAction<string>>;
	setSnackbarSeverity: React.Dispatch<React.SetStateAction<'success' | 'error' | 'warning' | 'info'>>;
}

interface RecycleBinDocumentsContextProviderProps {
	children: ReactNode;
}

export const RecycleBinDocumentsContext = createContext<RecycleBinDocumentsContextTypes>({
	archivedDocuments: [],
	totalItems: 0,
	currentPage: 1,
	searchResults: [],
	searchResultsTotalItems: 0,
	isSearchActive: false,
	searchValue: '',
	setSearchValue: () => {},
	filterValue: '',
	setFilterValue: () => {},
	searchedValue: '',
	setSearchedValue: () => {},
	searchButtonClicked: false,
	setSearchButtonClicked: () => {},
	fetchArchivedDocuments: () => {},
	setCurrentPage: () => {},
	setSearchResults: () => {},
	setSearchResultsTotalItems: () => {},
	setIsSearchActive: () => {},
	setArchivedDocuments: () => {},
	setTotalItems: () => {},
	loadedPages: [],
	setLoadedPages: () => {},
	snackbarOpen: false,
	snackbarMessage: '',
	snackbarSeverity: 'info',
	setSnackbarOpen: () => {},
	setSnackbarMessage: () => {},
	setSnackbarSeverity: () => {},
});

export const RecycleBinDocumentsProvider = ({ children }: RecycleBinDocumentsContextProviderProps) => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const { orgId } = useContext(OrganisationContext);

	const [archivedDocuments, setArchivedDocuments] = useState<ArchivedDocument[]>([]);
	const [totalItems, setTotalItems] = useState<number>(0);
	const [currentPage, setCurrentPage] = useState<number>(1);
	const [searchResults, setSearchResults] = useState<ArchivedDocument[]>([]);
	const [loadedPages, setLoadedPages] = useState<number[]>([]);
	const [searchResultsTotalItems, setSearchResultsTotalItems] = useState<number>(0);
	const [isSearchActive, setIsSearchActive] = useState<boolean>(false);
	const [searchValue, setSearchValue] = useState<string>('');
	const [filterValue, setFilterValue] = useState<string>('');
	const [searchedValue, setSearchedValue] = useState<string>('');
	const [searchButtonClicked, setSearchButtonClicked] = useState<boolean>(false);
	const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
	const [snackbarMessage, setSnackbarMessage] = useState<string>('');
	const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'warning' | 'info'>('info');

	const fetchArchivedDocuments = async (page: number = 1) => {
		if (!orgId) return;

		try {
			const response = await axios.get(`${base_url}/documents/organisation/${orgId}/archived?page=${page}&limit=200`);

			if (response.data.status === 200) {
				const { data, totalItems: total } = response.data;

				if (page === 1) {
					// First page - replace all data
					setArchivedDocuments(data);
					setTotalItems(total);
					setLoadedPages([1]);
				} else {
					// Additional pages - append data
					setArchivedDocuments((prev) => [...prev, ...data]);
					setLoadedPages((prev) => [...prev, page]);
				}

				return data;
			}
		} catch (error) {
			console.error('Error fetching archived documents:', error);
			throw error;
		}
	};

	const contextValue: RecycleBinDocumentsContextTypes = {
		archivedDocuments,
		totalItems,
		currentPage,
		searchResults,
		searchResultsTotalItems,
		isSearchActive,
		searchValue,
		setSearchValue,
		filterValue,
		setFilterValue,
		searchedValue,
		setSearchedValue,
		searchButtonClicked,
		setSearchButtonClicked,
		fetchArchivedDocuments,
		setCurrentPage,
		setSearchResults,
		setSearchResultsTotalItems,
		setIsSearchActive,
		setArchivedDocuments,
		setTotalItems,
		loadedPages,
		setLoadedPages,
		snackbarOpen,
		snackbarMessage,
		snackbarSeverity,
		setSnackbarOpen,
		setSnackbarMessage,
		setSnackbarSeverity,
	};

	return <RecycleBinDocumentsContext.Provider value={contextValue}>{children}</RecycleBinDocumentsContext.Provider>;
};

export const useRecycleBinDocuments = () => {
	const context = useContext(RecycleBinDocumentsContext);
	if (!context) {
		throw new Error('useRecycleBinDocuments must be used within a RecycleBinDocumentsProvider');
	}
	return context;
};
