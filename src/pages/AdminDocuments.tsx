import {
	Box,
	FormControl,
	InputAdornment,
	Link,
	MenuItem,
	Select,
	Table,
	TableBody,
	TableCell,
	TableRow,
	Snackbar,
	Alert,
	Typography,
	Chip,
} from '@mui/material';
import DashboardPagesLayout from '../components/layouts/dashboardLayout/DashboardPagesLayout';
import { useContext, useEffect, useRef, useState } from 'react';
import axios from '@utils/axiosInstance';
import { Delete, Edit, Info, Search } from '@mui/icons-material';
import CustomSubmitButton from '../components/forms/customButtons/CustomSubmitButton';
import CustomDialog from '../components/layouts/dialog/CustomDialog';
import CustomDialogActions from '../components/layouts/dialog/CustomDialogActions';
import CustomTableHead from '../components/layouts/table/CustomTableHead';
import CustomTableCell from '../components/layouts/table/CustomTableCell';
import CustomTablePagination from '../components/layouts/table/CustomTablePagination';
import CustomActionBtn from '../components/layouts/table/CustomActionBtn';
import { DocumentsContext } from '../contexts/DocumentsContextProvider';
import { Document, Price } from '../interfaces/document';
import { truncateText } from '../utils/utilText';
import { OrganisationContext } from '../contexts/OrganisationContextProvider';
import CustomTextField from '../components/forms/customFields/CustomTextField';
import { MediaQueryContext } from '../contexts/MediaQueryContextProvider';
import { dateFormatter } from '../utils/dateFormatter';
import DocumentInfoModal from '../components/documents/DocumentInfoModal';
import CreateNewDocumentDialog from '../components/documents/CreateNewDocumentDialog';
import EditDocumentDialog from '../components/documents/EditDocumentDialog';
import theme from '../themes';
import { UserAuthContext } from '../contexts/UserAuthContextProvider';
import { validateDocumentUrl, validateImageUrl } from '../utils/urlValidation';
import CustomDeleteButton from '../components/forms/customButtons/CustomDeleteButton';

const AdminDocuments = () => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;

	const { orgId } = useContext(OrganisationContext);
	const { user } = useContext(UserAuthContext);

	const {
		documents,
		error,
		fetchMoreDocuments,
		addNewDocument,
		removeDocument,
		updateDocument,
		totalItems,
		loadedPages,
		documentsPageNumber,
		setDocumentsPageNumber,
	} = useContext(DocumentsContext);

	const { isSmallScreen, isRotatedMedium, isRotated, isVerySmallScreen } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;
	const isMobileSizeSmall = isVerySmallScreen || isRotated;

	const [searchValue, setSearchValue] = useState<string>('');
	const [filterValue, setFilterValue] = useState<string>('');
	const [searchResults, setSearchResults] = useState<Document[]>([]);
	const [isSearchActive, setIsSearchActive] = useState<boolean>(false);
	const [searchResultsPage, setSearchResultsPage] = useState<number>(1);
	const [searchResultsLoadedPages, setSearchResultsLoadedPages] = useState<number[]>([]);
	const [searchResultsTotalItems, setSearchResultsTotalItems] = useState<number>(0);
	const [searchButtonClicked, setSearchButtonClicked] = useState<boolean>(false);
	const [searchedValue, setSearchedValue] = useState<string>('');

	const [orderBy, setOrderBy] = useState<keyof Document>('updatedAt');
	const [order, setOrder] = useState<'asc' | 'desc'>('desc');

	const pageSize = 50;

	// Use search results if active, otherwise use context data
	const displayDocuments = isSearchActive ? searchResults : documents;

	// For pagination, use total items from server when not searching
	const documentsNumberOfPages = isSearchActive ? Math.ceil(searchResultsTotalItems / pageSize) : Math.ceil(totalItems / pageSize);

	// Use appropriate page number for pagination
	const currentPage = isSearchActive ? searchResultsPage : documentsPageNumber;
	const sortedDocuments =
		[...(displayDocuments || [])]?.sort?.((a, b) => {
			const aValue = a[orderBy] ?? '';
			const bValue = b[orderBy] ?? '';

			if (order === 'asc') {
				return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
			} else {
				return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
			}
		}) || [];
	const paginatedDocuments = sortedDocuments?.slice?.((currentPage - 1) * pageSize, currentPage * pageSize) || [];

	// Modal states
	const [isDocumentDeleteModalOpen, setIsDocumentDeleteModalOpen] = useState<boolean[]>([]);
	const [editDocumentModalOpen, setEditDocumentModalOpen] = useState<boolean[]>([]);
	const [isDocumentInfoModalOpen, setIsDocumentInfoModalOpen] = useState<boolean[]>([]);
	const [isDocumentCreateModalOpen, setIsDocumentCreateModalOpen] = useState<boolean>(false);

	const [singleDocument, setSingleDocument] = useState<Document | null>(null);

	const [enterDocUrl, setEnterDocUrl] = useState<boolean>(true);
	const [enterDocImageUrl, setEnterDocImageUrl] = useState<boolean>(true);
	const [enterSamplePageImageUrl, setEnterSamplePageImageUrl] = useState<boolean>(true);

	const [fileUploaded, setFileUploaded] = useState<boolean>(false);
	const [isFree, setIsFree] = useState<boolean>(false);
	const [GBP, setGBP] = useState<Price>({ currency: 'gbp', amount: '0' });
	const [USD, setUSD] = useState<Price>({ currency: 'usd', amount: '0' });
	const [EUR, setEUR] = useState<Price>({ currency: 'eur', amount: '0' });
	const [TRY, setTRY] = useState<Price>({ currency: 'try', amount: '0' });

	// URL validation error handling
	const [isUrlErrorOpen, setIsUrlErrorOpen] = useState<boolean>(false);
	const [urlErrorMessage, setUrlErrorMessage] = useState<string>('');

	// Snackbar states for delete operation
	const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
	const [snackbarMessage, setSnackbarMessage] = useState<string>('');
	const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

	useEffect(() => {
		setDocumentsPageNumber(1);
	}, []);

	const handlePageChange = async (newPage: number) => {
		// Set appropriate page number based on search state
		if (isSearchActive) {
			setSearchResultsPage(newPage);
		} else {
			setDocumentsPageNumber(newPage);
		}

		// If in search mode, handle search results pagination
		if (isSearchActive) {
			// Check if we need to fetch more search results
			const requiredRecords = newPage * pageSize;
			if (searchResults.length < requiredRecords) {
				// Build search parameters
				const params = new URLSearchParams({
					limit: '200',
				});

				if (searchValue && searchValue.trim()) {
					params.append('search', searchValue.trim());
				}
				if (filterValue && filterValue.trim()) {
					params.append('filter', filterValue.trim());
				}
				if (orderBy) {
					params.append('sortBy', orderBy);
				}
				if (order) {
					params.append('sortOrder', order);
				}

				// Calculate which pages we need to fetch
				const currentLoadedPages = searchResultsLoadedPages.length > 0 ? Math.max(...searchResultsLoadedPages) : 0;
				const targetPage = Math.ceil((newPage * pageSize) / 200);

				// Fetch all missing pages in sequence
				for (let page = currentLoadedPages + 1; page <= targetPage; page++) {
					if (!searchResultsLoadedPages?.includes?.(page)) {
						await fetchMoreSearchResults(page, params);
					}
				}
			}
		} else {
			// Check if we need to fetch more data for context
			const requiredRecords = newPage * pageSize;
			if (documents.length < requiredRecords && newPage <= documentsNumberOfPages) {
				// Calculate which pages we need to fetch
				const currentLoadedPages = loadedPages.length > 0 ? Math.max(...loadedPages) : 0;
				const targetPage = Math.ceil((newPage * pageSize) / 200);

				// Fetch all missing pages in sequence
				if (currentLoadedPages < targetPage) {
					await fetchMoreDocuments(currentLoadedPages + 1, targetPage);
				}
			}
		}
	};

	const handleSort = async (property: keyof Document) => {
		const isAsc = orderBy === property && order === 'asc';
		const newOrder = isAsc ? 'desc' : 'asc';
		setOrder(newOrder);
		setOrderBy(property);
	};

	const handleSearch = async () => {
		try {
			// Reset to first page when searching
			setDocumentsPageNumber(1);
			setSearchResultsPage(1);

			// Search button only works when search value exists
			if (searchValue && searchValue.trim()) {
				// Store the searched value
				setSearchedValue(searchValue.trim());
				// Build query parameters
				const params = new URLSearchParams({
					limit: '200',
					search: searchValue.trim(),
				});

				// Add filter if it exists
				if (filterValue && filterValue.trim()) {
					params.append('filter', filterValue.trim());
				}
				if (orderBy) {
					params.append('sortBy', orderBy);
				}
				if (order) {
					params.append('sortOrder', order);
				}

				const response = await axios.get(`${base_url}/documents/organisation/${orgId}?${params.toString()}`);
				setSearchResults(response.data.data);
				setSearchResultsTotalItems(response.data.totalItems || response.data.data.length);
				setSearchResultsLoadedPages([1]);
				setIsSearchActive(true);
				setSearchButtonClicked(true);
			} else {
				// If no search value, clear search results
				setSearchResults([]);
				setSearchResultsLoadedPages([]);
				setSearchResultsTotalItems(0);
				setIsSearchActive(false);
				setSearchButtonClicked(false);
				setSearchedValue('');
			}
		} catch (error) {
			console.error('Search error:', error);
		}
	};

	const fetchMoreSearchResults = async (page: number, searchParams: URLSearchParams) => {
		try {
			// Add page parameter
			searchParams.set('page', page.toString());

			const response = await axios.get(`${base_url}/documents/organisation/${orgId}?${searchParams.toString()}`);

			if (page === 1) {
				// First page - replace all data
				setSearchResults(response.data.data);
				setSearchResultsLoadedPages([1]);
			} else {
				// Subsequent pages - append data
				setSearchResults((prev) => {
					const newData = [...prev, ...response.data.data];
					return newData;
				});
				setSearchResultsLoadedPages((prev) => [...prev, page]);
			}

			setSearchResultsTotalItems(response.data.totalItems || response.data.data.length);
		} catch (error) {
			console.error('Fetch more search results error:', error);
		}
	};

	// Keep track of previous length to avoid unnecessary resets
	const prevLengthRef = useRef<number>(0);

	useEffect(() => {
		if (paginatedDocuments && paginatedDocuments.length !== prevLengthRef.current) {
			prevLengthRef.current = paginatedDocuments.length;
			setIsDocumentDeleteModalOpen(Array(paginatedDocuments.length).fill(false));
			setEditDocumentModalOpen(Array(paginatedDocuments.length).fill(false));
			setIsDocumentInfoModalOpen(Array(paginatedDocuments.length).fill(false));
		}
	}, [displayDocuments, documentsPageNumber]);

	if (error) return <Typography color='error'>{error}</Typography>;

	const resetForm = () => {
		setIsDocumentCreateModalOpen(false);
		setEnterDocUrl(true);
		setEnterDocImageUrl(true);
		setEnterSamplePageImageUrl(true);
		setSingleDocument(null);
		setGBP({ currency: 'gbp', amount: '0' });
		setUSD({ currency: 'usd', amount: '0' });
		setEUR({ currency: 'eur', amount: '0' });
		setTRY({ currency: 'try', amount: '0' });
		setIsFree(false);
		setFileUploaded(false);
	};

	const createDocument = async (): Promise<boolean> => {
		try {
			// Validate URLs before proceeding
			let hasUrlErrors = false;
			let errorMessages: string[] = [];

			// Validate document URL if provided
			if (singleDocument?.documentUrl?.trim()) {
				const docValidation = await validateDocumentUrl(singleDocument.documentUrl.trim());
				if (!docValidation.isValid) {
					errorMessages.push(`Document URL: ${docValidation.error}`);
					hasUrlErrors = true;
				}
			}

			// Validate image URL if provided
			if (singleDocument?.imageUrl?.trim()) {
				const imageValidation = await validateImageUrl(singleDocument.imageUrl.trim());
				if (!imageValidation.isValid) {
					errorMessages.push(`Cover Image URL: ${imageValidation.error}`);
					hasUrlErrors = true;
				}
			}

			// Validate sample page image URL if provided
			if (singleDocument?.samplePageImageUrl?.trim()) {
				const sampleImageValidation = await validateImageUrl(singleDocument.samplePageImageUrl.trim());
				if (!sampleImageValidation.isValid) {
					errorMessages.push(`Sample Page Image URL: ${sampleImageValidation.error}`);
					hasUrlErrors = true;
				}
			}

			// Show error SnackBar if there are validation errors
			if (hasUrlErrors) {
				setUrlErrorMessage(errorMessages.join('\n'));
				setIsUrlErrorOpen(true);
				return false;
			}

			const prices: Price[] = [
				{ currency: 'gbp', amount: isFree ? 'Free' : GBP.amount },
				{ currency: 'usd', amount: isFree ? 'Free' : USD.amount },
				{ currency: 'eur', amount: isFree ? 'Free' : EUR.amount },
				{ currency: 'try', amount: isFree ? 'Free' : TRY.amount },
			];

			const documentResponse = await axios.post(`${base_url}/documents`, {
				name: singleDocument?.name.trim(),
				documentUrl: singleDocument?.documentUrl,
				userId: user?._id,
				orgId,
				imageUrl: singleDocument?.imageUrl,
				samplePageImageUrl: singleDocument?.samplePageImageUrl,
				isOnLandingPage: singleDocument?.isOnLandingPage,
				prices,
				description: singleDocument?.description,
				pageCount: singleDocument?.pageCount,
			});

			const documentResponseData = documentResponse.data;

			addNewDocument({
				_id: documentResponseData._id,
				name: singleDocument?.name.trim(),
				documentUrl: singleDocument?.documentUrl,
				userId: user?._id,
				orgId,
				imageUrl: singleDocument?.imageUrl,
				samplePageImageUrl: singleDocument?.samplePageImageUrl,
				isOnLandingPage: singleDocument?.isOnLandingPage,
				prices,
				description: singleDocument?.description,
				pageCount: singleDocument?.pageCount,
				createdAt: documentResponseData.createdAt,
				createdByImageUrl: documentResponseData.createdByImageUrl,
				createdByName: documentResponseData.createdByName,
				createdByRole: documentResponseData.createdByRole,
				updatedAt: documentResponseData.updatedAt,
				updatedByImageUrl: documentResponseData.updatedByImageUrl,
				updatedByName: documentResponseData.updatedByName,
				updatedByRole: documentResponseData.updatedByRole,
			} as Document);

			return true;
		} catch (error) {
			console.error('Create document error:', error);
			return false;
		}
	};

	const handleDocUpdate = async (): Promise<boolean> => {
		if (singleDocument) {
			try {
				// Validate URLs before proceeding
				let hasUrlErrors = false;
				let errorMessages: string[] = [];

				// Validate document URL if provided
				if (singleDocument.documentUrl?.trim()) {
					const docValidation = await validateDocumentUrl(singleDocument.documentUrl.trim());
					if (!docValidation.isValid) {
						errorMessages.push(`Document URL: ${docValidation.error}`);
						hasUrlErrors = true;
					}
				}

				// Validate image URL if provided
				if (singleDocument.imageUrl?.trim()) {
					const imageValidation = await validateImageUrl(singleDocument.imageUrl.trim());
					if (!imageValidation.isValid) {
						errorMessages.push(`Cover Image URL: ${imageValidation.error}`);
						hasUrlErrors = true;
					}
				}

				// Validate sample page image URL if provided
				if (singleDocument.samplePageImageUrl?.trim()) {
					const sampleImageValidation = await validateImageUrl(singleDocument.samplePageImageUrl.trim());
					if (!sampleImageValidation.isValid) {
						errorMessages.push(`Sample Page Image URL: ${sampleImageValidation.error}`);
						hasUrlErrors = true;
					}
				}

				// Show error SnackBar if there are validation errors
				if (hasUrlErrors) {
					setUrlErrorMessage(errorMessages.join('\n'));
					setIsUrlErrorOpen(true);
					return false;
				}

				const prices: Price[] = [
					{ currency: 'gbp', amount: isFree ? 'Free' : GBP.amount },
					{ currency: 'usd', amount: isFree ? 'Free' : USD.amount },
					{ currency: 'eur', amount: isFree ? 'Free' : EUR.amount },
					{ currency: 'try', amount: isFree ? 'Free' : TRY.amount },
				];

				// Ensure we have all required fields
				if (!singleDocument.name || !singleDocument.documentUrl) {
					console.error('Missing required fields');
					return false;
				}

				const updateData = {
					name: singleDocument.name.trim(),
					documentUrl: singleDocument.documentUrl,
					imageUrl: singleDocument.imageUrl || '',
					samplePageImageUrl: singleDocument.samplePageImageUrl || '',
					isOnLandingPage: singleDocument.isOnLandingPage || false,
					prices,
					description: singleDocument.description || '',
					pageCount: singleDocument.pageCount || 0,
				};

				const response = await axios.patch(`${base_url}/documents/${singleDocument._id}`, updateData);

				if (!response.data || !response.data.data) {
					throw new Error('Invalid response format from server');
				}

				const responseData = response.data.data;

				setSingleDocument(null);
				updateDocument({
					...singleDocument,
					...updateData,
					_id: responseData._id,
					updatedAt: responseData.updatedAt,
					updatedByImageUrl: responseData.updatedByImageUrl,
					updatedByName: responseData.updatedByName,
					updatedByRole: responseData.updatedByRole,
				});

				return true;
			} catch (error: any) {
				console.error('Error updating document:', error);
				if (error.response) {
					// The request was made and the server responded with a status code
					// that falls out of the range of 2xx
					console.error('Error response:', error.response.data);
					console.error('Error status:', error.response.status);
					if (error.response.status === 401) {
						console.error('Authentication error: Please make sure you are logged in');
					} else if (error.response.status === 403) {
						console.error('Authorization error: You do not have permission to update documents');
					}
				} else if (error.request) {
					// The request was made but no response was received
					console.error('Error request:', error.request);
					console.error('No response received. Please check if the server is running.');
				} else {
					// Something happened in setting up the request that triggered an Error
					console.error('Error message:', error.message);
				}
				return false;
			}
		}
		return false;
	};

	const deleteDocument = async (documentId: string): Promise<void> => {
		try {
			const response = await axios.delete(`${base_url}/documents/${documentId}`);

			// Only remove from frontend state if the backend request was successful
			if (response.data.status === 200) {
				// If search is active, also remove from search results
				if (isSearchActive) {
					setSearchResults((prev) => prev?.filter?.((document) => document._id !== documentId) || []);
					setSearchResultsTotalItems((prev) => Math.max(0, prev - 1));
				}
				removeDocument(documentId);
				// Show success message
				setSnackbarMessage('Document deleted successfully');
				setSnackbarSeverity('success');
				setSnackbarOpen(true);
			} else {
				console.error('Delete document failed:', response.data.message);
				setSnackbarMessage(response.data.message || 'Failed to delete document');
				setSnackbarSeverity('error');
				setSnackbarOpen(true);
			}
		} catch (error: any) {
			console.error('Delete document error:', error);
			setSnackbarMessage(error.response?.data?.message || 'Failed to delete document');
			setSnackbarSeverity('error');
			setSnackbarOpen(true);
		}
	};

	const openDeleteDocumentModal = (index: number) => {
		const updatedState = [...isDocumentDeleteModalOpen];
		updatedState[index] = true;
		setIsDocumentDeleteModalOpen(updatedState);
	};
	const closeDeleteDocumentModal = (index: number) => {
		const updatedState = [...isDocumentDeleteModalOpen];
		updatedState[index] = false;
		setIsDocumentDeleteModalOpen(updatedState);
	};

	const openEditDocumentModal = (docId: string) => {
		const documentIndex = displayDocuments.findIndex((d) => d._id === docId);
		if (documentIndex === -1) return;

		const documentToEdit = displayDocuments[documentIndex];
		setSingleDocument(documentToEdit);

		const updatedState = [...editDocumentModalOpen];
		updatedState[documentIndex] = true;
		setEditDocumentModalOpen(updatedState);

		// Set initial price states
		const gbpPrice = documentToEdit.prices?.find?.((p) => p.currency === 'gbp');
		const usdPrice = documentToEdit.prices?.find?.((p) => p.currency === 'usd');
		const eurPrice = documentToEdit.prices?.find?.((p) => p.currency === 'eur');
		const tryPrice = documentToEdit.prices?.find?.((p) => p.currency === 'try');

		setGBP(gbpPrice || { currency: 'gbp', amount: '0' });
		setUSD(usdPrice || { currency: 'usd', amount: '0' });
		setEUR(eurPrice || { currency: 'eur', amount: '0' });
		setTRY(tryPrice || { currency: 'try', amount: '0' });

		setIsFree(documentToEdit.prices?.every?.((p) => p.amount === '0' || p.amount === 'Free') || false);
		setFileUploaded(true);

		// Set initial URL states
		setEnterDocUrl(true);
		setEnterDocImageUrl(true);
		setEnterSamplePageImageUrl(true);
	};

	const closeDocumentEditModal = (index: number) => {
		const newEditModalOpen = [...editDocumentModalOpen];
		newEditModalOpen[index] = false;
		setEditDocumentModalOpen(newEditModalOpen);
	};

	const openDocumentInfoModal = (index: number) => {
		const updatedState = [...isDocumentInfoModalOpen];
		updatedState[index] = true;
		setIsDocumentInfoModalOpen(updatedState);
	};

	const closeDocumentInfoModal = (index: number) => {
		const updatedState = [...isDocumentInfoModalOpen];
		updatedState[index] = false;
		setIsDocumentInfoModalOpen(updatedState);
	};

	return (
		<DashboardPagesLayout pageName='Documents' customSettings={{ justifyContent: 'flex-start' }} showCopyRight={true}>
			<Box sx={{ width: '100%', height: '100%' }}>
				<Box
					sx={{
						display: 'flex',
						justifyContent: 'space-between',
						alignItems: 'center',
						padding: isMobileSizeSmall ? '1rem 1rem 0.5rem 1rem' : '2rem 2rem 1rem 2rem',
						width: '100%',
						mb: '1.25rem',
					}}>
					<Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', flex: 4 }}>
						<Box sx={{ display: 'flex', alignSelf: 'flex-start', width: isVerySmallScreen ? '12.5rem' : 'fit-content' }}>
							<Box sx={{ mr: '1rem' }}>
								<FormControl>
									<Select
										size='small'
										value={filterValue}
										onChange={(e) => {
											const newFilterValue = e.target.value;
											setFilterValue(newFilterValue);

											// Auto-search when filter changes
											if (newFilterValue) {
												// Build query parameters
												const params = new URLSearchParams({
													limit: '200',
													filter: newFilterValue,
												});

												// Include existing search value if it exists
												if (searchValue && searchValue.trim()) {
													params.append('search', searchValue.trim());
												}
												if (orderBy) {
													params.append('sortBy', orderBy);
												}
												if (order) {
													params.append('sortOrder', order);
												}

												// Trigger search immediately
												axios
													.get(`${base_url}/documents/organisation/${orgId}?${params.toString()}`)
													.then((response) => {
														setSearchResults(response.data.data);
														setSearchResultsTotalItems(response.data.totalItems || response.data.data.length);
														setSearchResultsLoadedPages([1]);
														setIsSearchActive(true);
														setSearchResultsPage(1);
													})
													.catch((error) => {
														console.error('Filter error:', error);
													});
											} else {
												// If filter is cleared but search value exists, auto-search with search value
												if (searchValue && searchValue.trim()) {
													handleSearch();
												} else {
													// Clear search results and go back to context data
													setSearchResults([]);
													setSearchResultsLoadedPages([]);
													setSearchResultsTotalItems(0);
													setIsSearchActive(false);
													setSearchResultsPage(1);
												}
											}
										}}
										displayEmpty
										sx={{
											backgroundColor: theme.bgColor?.common,
											width: isMobileSizeSmall ? '7rem' : '10rem',
											fontSize: isMobileSize ? '0.7rem' : '0.85rem',
											textTransform: 'capitalize',
										}}>
										<MenuItem
											disabled
											value='filter'
											selected
											sx={{
												fontSize: isMobileSize ? '0.65rem' : '0.85rem',
												fontStyle: 'italic',
												textTransform: 'capitalize',
												padding: isMobileSize ? '0.25rem 0.5rem' : undefined,
												minHeight: '2rem',
											}}>
											Filter Documents
										</MenuItem>
										<MenuItem
											value=''
											selected
											sx={{
												fontSize: isMobileSize ? '0.65rem' : '0.85rem',
												textTransform: 'capitalize',
												padding: isMobileSize ? '0.25rem 0.5rem' : undefined,
												minHeight: '2rem',
											}}>
											All Documents
										</MenuItem>
										{['Paid Documents', 'Free Documents', 'On Landing Page', 'On Platform Only']?.map?.((type) => (
											<MenuItem
												value={type.toLowerCase()}
												key={type}
												sx={{
													fontSize: isMobileSize ? '0.65rem' : '0.85rem',
													textTransform: 'capitalize',
													padding: isMobileSize ? '0.25rem 0.5rem' : undefined,
													minHeight: '2rem',
												}}>
												{type}
											</MenuItem>
										))}
									</Select>
								</FormControl>
							</Box>
							<CustomTextField
								value={searchValue}
								placeholder={'Search in name, description'}
								onChange={(e) => {
									setSearchValue(e.target.value);
								}}
								sx={{ backgroundColor: '#fff', minWidth: isVerySmallScreen ? '10rem' : '17.5rem' }}
								required={false}
								InputProps={{
									endAdornment: (
										<InputAdornment position='end'>
											<Search
												sx={{
													mr: '-0.5rem',
												}}
												fontSize={isMobileSize ? 'small' : 'medium'}
											/>
										</InputAdornment>
									),
								}}
							/>
							<CustomSubmitButton onClick={handleSearch} sx={{ marginLeft: '1rem' }} disabled={!searchValue}>
								Search
							</CustomSubmitButton>
							<CustomDeleteButton
								onClick={() => {
									setSearchValue('');
									setFilterValue('');
									setSearchResults([]);
									setIsSearchActive(false);
									setDocumentsPageNumber(1);
									setSearchResultsPage(1);
									setSearchResultsLoadedPages([]);
									setSearchResultsTotalItems(0);
									setSearchButtonClicked(false);
									setSearchedValue('');
								}}>
								Reset
							</CustomDeleteButton>
							<Box sx={{ ml: '1rem', display: 'flex', alignItems: 'center', height: '2rem' }}>
								<Typography
									variant='body2'
									sx={{
										color: 'text.secondary',
										fontSize: isMobileSize ? '0.7rem' : '0.85rem',

										whiteSpace: 'nowrap',
									}}>
									{isSearchActive ? searchResultsTotalItems : totalItems}{' '}
									{isSearchActive ? (searchResultsTotalItems === 1 ? 'result' : 'results') : totalItems === 1 ? 'item' : 'items'}
								</Typography>
							</Box>
						</Box>
					</Box>
					<Box sx={{ display: 'flex', gap: 1, mb: '0.85rem', alignItems: 'center' }}>
						<CustomSubmitButton
							onClick={() => {
								setIsDocumentCreateModalOpen(true);
								setEnterDocUrl(true);
								setFileUploaded(false);
								setSingleDocument({
									_id: '',
									name: '',
									orgId,
									userId: user?._id || '',
									documentUrl: '',
									imageUrl: '',
									prices: [
										{ currency: 'gbp', amount: '0' },
										{ currency: 'usd', amount: '0' },
										{ currency: 'eur', amount: '0' },
										{ currency: 'try', amount: '0' },
									],
									description: '',
									pageCount: 0,
									createdAt: '',
									updatedAt: '',
									clonedFromId: '',
									clonedFromTitle: '',
									usedInLessons: [],
									usedInCourses: [],
									samplePageImageUrl: '',
									isOnLandingPage: false,
									isArchived: false,
									createdBy: '',
									updatedBy: '',
									createdByName: '',
									updatedByName: '',
									createdByImageUrl: '',
									updatedByImageUrl: '',
									createdByRole: '',
									updatedByRole: '',
								});
							}}
							sx={{ height: isVerySmallScreen ? '1.75rem' : '2.1rem', fontSize: isMobileSize ? '0.7rem' : undefined }}
							type='button'>
							{isVerySmallScreen ? 'New' : 'New Document'}
						</CustomSubmitButton>
					</Box>
				</Box>

				<CreateNewDocumentDialog
					isOpen={isDocumentCreateModalOpen}
					onClose={resetForm}
					onSubmit={async (e: React.FormEvent<HTMLFormElement>) => {
						e.preventDefault();
						const success = await createDocument();
						if (success) {
							resetForm();
						}
					}}
					singleDocument={singleDocument}
					setSingleDocument={setSingleDocument}
					enterDocUrl={enterDocUrl}
					setEnterDocUrl={setEnterDocUrl}
					enterDocImageUrl={enterDocImageUrl}
					setEnterDocImageUrl={setEnterDocImageUrl}
					enterSamplePageImageUrl={enterSamplePageImageUrl}
					setEnterSamplePageImageUrl={setEnterSamplePageImageUrl}
					fileUploaded={fileUploaded}
					setFileUploaded={setFileUploaded}
					isFree={isFree}
					setIsFree={setIsFree}
					GBP={GBP}
					setGBP={setGBP}
					USD={USD}
					setUSD={setUSD}
					EUR={EUR}
					setEUR={setEUR}
					TRY={TRY}
					setTRY={setTRY}
				/>

				<Box
					sx={{
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'center',
						padding: isVerySmallScreen ? '0rem 0.25rem 2rem 0.25rem' : '0rem 2rem 2rem 2rem',
						width: '100%',
					}}>
					{/* Chips for active search and filter */}
					{((isSearchActive && searchedValue && searchButtonClicked) || (isSearchActive && filterValue && filterValue.trim())) && (
						<Box
							sx={{
								display: 'flex',
								gap: 1,
								flexWrap: 'wrap',
								justifyContent: 'flex-start',
								borderRadius: '4px',
								alignSelf: 'flex-start',
								marginBottom: '1rem',
								marginTop: '-1rem',
							}}>
							{isSearchActive && filterValue && filterValue.trim() && (
								<Chip
									label={`Filter: "${filterValue}"`}
									onDelete={() => {
										setFilterValue('');
										// If search value exists, keep search results
										if (searchValue && searchValue.trim()) {
											handleSearch();
										} else {
											// Clear everything and go back to context data
											setSearchResults([]);
											setSearchResultsLoadedPages([]);
											setSearchResultsTotalItems(0);
											setIsSearchActive(false);
											setSearchResultsPage(1);
										}
									}}
									variant='outlined'
									color='secondary'
									size='small'
									sx={{ backgroundColor: '#1976d2', color: 'white', fontSize: '0.9rem', letterSpacing: '0.025rem' }}
								/>
							)}
							{isSearchActive && searchedValue && searchButtonClicked && (
								<Chip
									label={`Search: "${searchedValue}"`}
									onDelete={() => {
										setSearchValue('');
										setSearchedValue('');
										setSearchButtonClicked(false);
										// If filter is still active, keep filter results
										if (filterValue) {
											// Re-trigger filter search without search value
											const params = new URLSearchParams({
												limit: '200',
												filter: filterValue,
											});
											if (orderBy) {
												params.append('sortBy', orderBy);
											}
											if (order) {
												params.append('sortOrder', order);
											}
											axios
												.get(`${base_url}/documents/organisation/${orgId}?${params.toString()}`)
												.then((response) => {
													setSearchResults(response.data.data);
													setSearchResultsTotalItems(response.data.totalItems || response.data.data.length);
													setSearchResultsLoadedPages([1]);
													setIsSearchActive(true);
													setSearchResultsPage(1);
												})
												.catch((error) => {
													console.error('Filter error:', error);
												});
										} else {
											// Clear everything and go back to context data
											setSearchResults([]);
											setSearchResultsLoadedPages([]);
											setSearchResultsTotalItems(0);
											setIsSearchActive(false);
											setSearchResultsPage(1);
										}
									}}
									color='primary'
									variant='filled'
									size='small'
									sx={{ backgroundColor: '#1EC28B', color: 'white', fontSize: '0.9rem', letterSpacing: '0.025rem' }}
								/>
							)}
						</Box>
					)}
					<Table sx={{ mb: '2rem' }} size='small' aria-label='a dense table'>
						<CustomTableHead<Document>
							orderBy={orderBy}
							order={order}
							handleSort={handleSort}
							columns={[
								{ key: 'clone', label: 'Cloned' },
								{ key: 'name', label: 'Document Name' },
								{ key: 'documentId', label: 'Document URL' },
								{ key: 'createdAt', label: 'Created On' },
								{ key: 'updatedAt', label: 'Updated On' },
								{ key: 'actions', label: 'Actions' },
							]}
						/>
						<TableBody>
							{paginatedDocuments &&
								paginatedDocuments?.map?.((document: Document, index) => {
									return (
										<TableRow key={document._id} hover>
											{' '}
											<TableCell sx={{ textAlign: 'center', width: '0px' }}>
												{document.clonedFromId && (
													<Box
														sx={{
															backgroundColor: theme.palette.info.main,
															color: 'white',
															borderRadius: '50%',
															width: '15px',
															height: '15px',
															display: 'flex',
															alignItems: 'center',
															justifyContent: 'center',
															fontSize: '0.65rem',
															margin: '0 auto',
														}}>
														C
													</Box>
												)}
											</TableCell>
											<CustomTableCell value={document.name} />
											<TableCell sx={{ textAlign: 'center' }}>
												<Link
													href={document.documentUrl}
													target='_blank'
													rel='noopener noreferrer'
													sx={{ fontSize: isMobileSize ? '0.6rem' : undefined }}>
													{isVerySmallScreen ? truncateText(document.documentUrl, 25) : truncateText(document.documentUrl, 40)}
												</Link>
											</TableCell>
											<CustomTableCell value={dateFormatter(document.createdAt)} />
											<CustomTableCell value={dateFormatter(document.updatedAt)} />
											<TableCell
												sx={{
													textAlign: 'center',
												}}>
												<CustomActionBtn
													title='Edit'
													onClick={() => {
														openEditDocumentModal(document._id);
													}}
													icon={<Edit fontSize='small' sx={{ fontSize: isMobileSize ? '0.8rem' : undefined }} />}
												/>

												<EditDocumentDialog
													isOpen={editDocumentModalOpen[displayDocuments.findIndex((d) => d._id === document._id)]}
													onClose={() => {
														closeDocumentEditModal(displayDocuments.findIndex((d) => d._id === document._id));
														resetForm();
													}}
													onSubmit={async (e: React.FormEvent<HTMLFormElement>) => {
														e.preventDefault();
														const fullIndex = displayDocuments.findIndex((d) => d._id === document._id);

														if (singleDocument?.name && singleDocument.name.trim()) {
															const success = await handleDocUpdate();
															if (success) {
																closeDocumentEditModal(fullIndex);
																resetForm();
															}
														}
													}}
													document={singleDocument}
													setDocument={setSingleDocument}
													enterDocUrl={enterDocUrl}
													setEnterDocUrl={setEnterDocUrl}
													enterDocImageUrl={enterDocImageUrl}
													setEnterDocImageUrl={setEnterDocImageUrl}
													enterSamplePageImageUrl={enterSamplePageImageUrl}
													setEnterSamplePageImageUrl={setEnterSamplePageImageUrl}
													setFileUploaded={setFileUploaded}
													isFree={isFree}
													setIsFree={setIsFree}
													GBP={GBP}
													setGBP={setGBP}
													USD={USD}
													setUSD={setUSD}
													EUR={EUR}
													setEUR={setEUR}
													TRY={TRY}
													setTRY={setTRY}
												/>

												<CustomActionBtn
													title='Delete'
													onClick={() => {
														openDeleteDocumentModal(index);
													}}
													icon={<Delete fontSize='small' sx={{ fontSize: isMobileSize ? '0.8rem' : undefined }} />}
												/>

												{isDocumentDeleteModalOpen[index] !== undefined && (
													<CustomDialog
														openModal={isDocumentDeleteModalOpen[index]}
														closeModal={() => closeDeleteDocumentModal(index)}
														title='Delete Document'
														content={`Are you sure you want to delete "${document.name}"?`}
														maxWidth='xs'>
														<CustomDialogActions
															onCancel={() => {
																closeDeleteDocumentModal(index);
																setEnterDocUrl(true);
															}}
															deleteBtn={true}
															onDelete={() => {
																deleteDocument(document._id);
																closeDeleteDocumentModal(index);
															}}
															actionSx={{ mb: '0.5rem' }}
														/>
													</CustomDialog>
												)}

												<CustomActionBtn
													title='More Info'
													onClick={() => {
														openDocumentInfoModal(index);
													}}
													icon={<Info fontSize='small' sx={{ fontSize: isMobileSize ? '0.8rem' : undefined }} />}
												/>
											</TableCell>
										</TableRow>
									);
								})}
						</TableBody>
					</Table>
					<CustomTablePagination count={documentsNumberOfPages} page={currentPage} onChange={handlePageChange} />
				</Box>

				{isDocumentInfoModalOpen?.map?.(
					(isOpen, index) =>
						isOpen && (
							<CustomDialog openModal={isOpen} closeModal={() => closeDocumentInfoModal(index)} title={displayDocuments[index].name} maxWidth='sm'>
								<DocumentInfoModal document={displayDocuments[index]} onClose={() => closeDocumentInfoModal(index)} />
							</CustomDialog>
						)
				)}

				{/* URL validation error SnackBar */}
				<Snackbar
					open={isUrlErrorOpen}
					autoHideDuration={3500}
					anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
					onClose={() => setIsUrlErrorOpen(false)}>
					<Alert severity='error' variant='filled' sx={{ width: '100%' }}>
						{urlErrorMessage}
					</Alert>
				</Snackbar>
				{/* Delete operation snackbar */}
				<Snackbar
					open={snackbarOpen}
					autoHideDuration={5000}
					anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
					sx={{ mt: '4rem' }}
					onClose={() => setSnackbarOpen(false)}>
					<Alert
						onClose={() => setSnackbarOpen(false)}
						severity={snackbarSeverity}
						sx={{
							'width': '100%',
							'backgroundColor': theme.bgColor?.greenSecondary,
							'color': theme.textColor?.common.main,
							'& .MuiAlert-icon': {
								color: 'white',
							},
						}}>
						{snackbarMessage}
					</Alert>
				</Snackbar>
			</Box>
		</DashboardPagesLayout>
	);
};

export default AdminDocuments;
