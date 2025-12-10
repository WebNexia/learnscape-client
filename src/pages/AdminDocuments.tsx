import { Box, Table, TableBody, TableCell, TableRow, Snackbar, Alert, Typography, Link, DialogContent } from '@mui/material';
import AdminTableSkeleton from '../components/layouts/skeleton/AdminTableSkeleton';
import DashboardPagesLayout from '../components/layouts/dashboardLayout/DashboardPagesLayout';
import AdminPageErrorBoundary from '../components/error/AdminPageErrorBoundary';
import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import axios from '@utils/axiosInstance';
import { Delete, Edit, Info } from '@mui/icons-material';
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
import { MediaQueryContext } from '../contexts/MediaQueryContextProvider';
import { dateFormatter } from '../utils/dateFormatter';
import DocumentInfoModal from '../components/documents/DocumentInfoModal';
import CreateNewDocumentDialog from '../components/documents/CreateNewDocumentDialog';
import EditDocumentDialog from '../components/documents/EditDocumentDialog';
import theme from '../themes';
import { UserAuthContext } from '../contexts/UserAuthContextProvider';
import { validateDocumentUrl, validateImageUrl } from '../utils/urlValidation';
import { useAuth } from '../hooks/useAuth';
import { useFilterSearch } from '../hooks/useFilterSearch';
import FilterSearchRow from '../components/layouts/FilterSearchRow';
import CustomInfoMessageAlignedLeft from '../components/layouts/infoMessage/CustomInfoMessageAlignedLeft';

const AdminDocuments = () => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;

	const { orgId } = useContext(OrganisationContext);
	const { user } = useContext(UserAuthContext);
	const { isInstructor } = useAuth();

	const {
		documents,
		loading,
		error,
		fetchMoreDocuments,
		addNewDocument,
		removeDocument,
		updateDocument,
		totalItems,
		loadedPages,

		enableDocumentsFetch,
		setDocumentsPageNumber,
	} = useContext(DocumentsContext);

	const { isSmallScreen, isRotatedMedium } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;

	// Responsive column configuration
	const getColumns = (isMobileSize: boolean) => {
		return isMobileSize
			? [
					{ key: 'name', label: isMobileSize ? 'Name' : 'Document Name' },
					{ key: 'documentUrl', label: isMobileSize ? 'URL' : 'Document URL' },
					{ key: 'actions', label: 'Actions' },
				]
			: isInstructor
				? [
						{ key: 'name', label: 'Document Name' },
						{ key: 'documentUrl', label: 'Document URL' },
						{ key: 'createdAt', label: 'Created On' },
						{ key: 'updatedAt', label: 'Updated On' },
						{ key: 'actions', label: 'Actions' },
					]
				: [
						{ key: 'isOnLandingPage', label: 'Landing Page' },
						{ key: 'name', label: 'Document Name' },
						{ key: 'documentUrl', label: 'Document URL' },
						{ key: 'createdByName', label: 'Created By' },
						{ key: 'updatedAt', label: 'Updated On' },
						{ key: 'actions', label: 'Actions' },
					];
	};

	const pageSize = 50;

	// Use the filter search hook
	const {
		searchValue,
		setSearchValue,
		filterValue,
		displayData: displayDocuments,
		numberOfPages: documentsNumberOfPages,
		currentPage: documentsCurrentPage,
		searchResultsTotalItems,
		searchedValue,
		orderBy,
		order,
		isSearchActive,
		isLoading: isSearchLoading,
		handleSearch,
		handleFilterChange,
		handlePageChange,
		handleSort,
		resetSearch,
		resetFilter,
		resetAll,
		removeFromSearchResults,
	} = useFilterSearch<Document>({
		getEndpoint: () => `${base_url}/documents/organisation/${orgId}`,
		limit: 200,
		pageSize,
		contextData: documents,
		setContextPageNumber: setDocumentsPageNumber,
		fetchMoreContextData: fetchMoreDocuments,
		contextLoadedPages: loadedPages,
		contextTotalItems: totalItems,
		defaultOrderBy: 'updatedAt',
		defaultOrder: 'desc',
	});

	const sortedDocuments = useMemo(() => {
		if (!displayDocuments) return [];
		return [...displayDocuments].sort((a, b) => {
			const aValue = (a as any)[orderBy] ?? '';
			const bValue = (b as any)[orderBy] ?? '';
			return order === 'asc' ? (aValue > bValue ? 1 : aValue < bValue ? -1 : 0) : aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
		});
	}, [displayDocuments, orderBy, order]);

	const paginatedDocuments = sortedDocuments;

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

	// Loading states for create/update operations
	const [isCreating, setIsCreating] = useState<boolean>(false);
	const [isUpdating, setIsUpdating] = useState<boolean>(false);

	useEffect(() => {
		enableDocumentsFetch();
	}, []);

	// Keep track of previous length to avoid unnecessary resets
	const prevLengthRef = useRef<number>(0);

	useEffect(() => {
		if (paginatedDocuments && paginatedDocuments.length !== prevLengthRef.current) {
			prevLengthRef.current = paginatedDocuments.length;
			setIsDocumentDeleteModalOpen(Array(paginatedDocuments.length).fill(false));
			setEditDocumentModalOpen(Array(paginatedDocuments.length).fill(false));
			setIsDocumentInfoModalOpen(Array(paginatedDocuments.length).fill(false));
		}
	}, [documentsCurrentPage, filterValue, searchValue]);

	if (error) return <Typography color='error'>{error}</Typography>;

	// Show loading state while documents are being fetched or when data is empty and not loading yet
	if (loading) {
		return (
			<DashboardPagesLayout
				pageName={isInstructor ? 'My Documents' : 'Documents'}
				customSettings={{ justifyContent: 'flex-start' }}
				showCopyRight={true}>
				<AdminTableSkeleton rows={8} columns={5} />
			</DashboardPagesLayout>
		);
	}

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
		setIsCreating(true);
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

			const documentResponse = await axios.post(`${base_url}/documents${isInstructor ? '/instructor' : ''}`, {
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
		} finally {
			setIsCreating(false);
		}
	};

	const handleDocUpdate = async (): Promise<boolean> => {
		if (singleDocument) {
			setIsUpdating(true);
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

				const response = await axios.patch(`${base_url}/documents${isInstructor ? '/instructor' : ''}/${singleDocument._id}`, updateData);

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
			} finally {
				setIsUpdating(false);
			}
		}
		return false;
	};

	const deleteDocument = async (documentId: string): Promise<void> => {
		try {
			const response = await axios.delete(`${base_url}/documents${isInstructor ? '/instructor' : ''}/${documentId}`);

			// Only remove from frontend state if the backend request was successful
			if (response.data.status === 200) {
				removeDocument(documentId);

				// If search is active, remove from search results; otherwise context data is already updated
				if (isSearchActive) {
					removeFromSearchResults(documentId);
				}

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
		const documentIndex = paginatedDocuments.findIndex((d) => d._id === docId);
		if (documentIndex === -1) return;

		const documentToEdit = paginatedDocuments[documentIndex];
		setSingleDocument(documentToEdit);

		const updatedState = [...editDocumentModalOpen];
		updatedState[documentIndex] = true;
		setEditDocumentModalOpen(updatedState);

		// Set initial price states
		const gbpPrice = documentToEdit.prices?.find((p) => p.currency === 'gbp');
		const usdPrice = documentToEdit.prices?.find((p) => p.currency === 'usd');
		const eurPrice = documentToEdit.prices?.find((p) => p.currency === 'eur');
		const tryPrice = documentToEdit.prices?.find((p) => p.currency === 'try');

		setGBP(gbpPrice || { currency: 'gbp', amount: '0' });
		setUSD(usdPrice || { currency: 'usd', amount: '0' });
		setEUR(eurPrice || { currency: 'eur', amount: '0' });
		setTRY(tryPrice || { currency: 'try', amount: '0' });

		setIsFree(documentToEdit.prices?.every((p) => p.amount === '0' || p.amount === 'Free') || false);
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
		<AdminPageErrorBoundary pageName={isInstructor ? 'My Documents' : 'Documents'}>
			<DashboardPagesLayout
				pageName={isInstructor ? 'My Documents' : 'Documents'}
				customSettings={{ justifyContent: 'flex-start' }}
				showCopyRight={true}>
				<Box sx={{ width: '100%', height: '100%' }}>
					<FilterSearchRow
						filterValue={filterValue}
						onFilterChange={handleFilterChange}
						filterOptions={[
							{ value: '', label: 'All Documents' },
							{ value: 'paid documents', label: 'Paid Documents' },
							{ value: 'free documents', label: 'Free Documents' },
							{ value: 'on landing page', label: 'On Landing Page' },
							{ value: 'on platform only', label: 'On Platform Only' },
						]}
						filterPlaceholder='Filter Documents'
						searchValue={searchValue}
						onSearchChange={setSearchValue}
						onSearch={handleSearch}
						onReset={resetAll}
						searchPlaceholder='Search in name, description'
						isSearchLoading={isSearchLoading}
						isSearchActive={isSearchActive}
						searchResultsTotalItems={searchResultsTotalItems}
						totalItems={totalItems || documents?.length || 0}
						searchedValue={searchedValue}
						onResetSearch={resetSearch}
						onResetFilter={resetFilter}
						actionButtons={[
							{
								label: isMobileSize ? 'New' : 'New Document',
								onClick: () => {
									setIsDocumentCreateModalOpen(true);
									setSingleDocument({
										name: '',
										documentUrl: '',
										userId: user?._id,
										orgId,
										imageUrl: '',
										samplePageImageUrl: '',
										isOnLandingPage: false,
										prices: [
											{ currency: 'gbp', amount: '0' },
											{ currency: 'usd', amount: '0' },
											{ currency: 'eur', amount: '0' },
											{ currency: 'try', amount: '0' },
										],
										description: '',
										pageCount: 0,
									} as Document);
									setIsFree(false);
									setGBP({ currency: 'gbp', amount: '0' });
									setUSD({ currency: 'usd', amount: '0' });
									setEUR({ currency: 'eur', amount: '0' });
									setTRY({ currency: 'try', amount: '0' });
									setFileUploaded(false);
									setEnterDocUrl(true);
									setEnterDocImageUrl(true);
									setEnterSamplePageImageUrl(true);
								},
							},
						]}
						isSticky={true}
					/>

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
						isCreating={isCreating}
					/>

					<Box
						sx={{
							display: 'flex',
							flexDirection: 'column',
							alignItems: 'center',
							padding: isMobileSize ? '0rem 0.25rem 2rem 0.25rem' : '0rem 0rem 2rem 0rem',
							width: '100%',
						}}>
						<Table
							sx={{
								'mb': '2rem',
								'tableLayout': 'fixed',
								'width': '100%',
								'borderCollapse': 'collapse',
								'borderSpacing': 0,
								'& .MuiTableHead-root': {
									position: 'fixed',
									top:
										(isSearchActive && searchedValue) || (isSearchActive && filterValue?.trim())
											? !isMobileSize
												? '10rem'
												: '12.5rem'
											: isMobileSize
												? '10.25rem'
												: '8rem',
									left: isMobileSize ? 0 : '10rem',
									right: 0,
									zIndex: 99,
									backgroundColor: theme.bgColor?.secondary,
									boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
									display: 'table',
									tableLayout: 'fixed',
									width: isMobileSize ? '100%' : 'calc(100% - 10rem)',
								},
								'& .MuiTableHead-root .MuiTableCell-root': {
									backgroundColor: theme.bgColor?.secondary,
									padding: '0.75rem 1rem',
									boxSizing: 'border-box',
									margin: 0,
									verticalAlign: 'center',
								},
								'& .MuiTableHead-root .MuiTableCell-root:last-child': {
									borderRight: 'none',
								},
								'& .MuiTableBody-root .MuiTableCell-root': {
									padding: '0.5rem 1rem',
									boxSizing: 'border-box',
									margin: 0,
									verticalAlign: 'center',
								},
								'& .MuiTableBody-root .MuiTableCell-root:last-child': {
									borderRight: 'none',
								},
								// Column widths for header cells
								'& .MuiTableHead-root .MuiTableCell-root:nth-of-type(1)': {
									minWidth: isMobileSize ? '150px' : isInstructor ? '150px' : '100px',
									width: isMobileSize ? '40%' : isInstructor ? '25%' : '13%',
								},
								'& .MuiTableHead-root .MuiTableCell-root:nth-of-type(2)': {
									minWidth: isMobileSize ? '200px' : isInstructor ? '200px' : '200px',
									width: isMobileSize ? '30%' : isInstructor ? '30%' : '27%',
								},
								'& .MuiTableHead-root .MuiTableCell-root:nth-of-type(3)': {
									minWidth: isMobileSize ? '100px' : isInstructor ? '100px' : '100px',
									width: isMobileSize ? '30%' : isInstructor ? '15%' : '20%',
								},
								'& .MuiTableHead-root .MuiTableCell-root:nth-of-type(4)': {
									minWidth: isMobileSize ? '0px' : isInstructor ? '100px' : '100px',
									width: isMobileSize ? '0%' : isInstructor ? '15%' : '13%',
								},
								'& .MuiTableHead-root .MuiTableCell-root:nth-of-type(5)': {
									minWidth: isMobileSize ? '0px' : isInstructor ? '0px' : '100px',
									width: isMobileSize ? '0%' : isInstructor ? '15%' : '12%',
								},
								'& .MuiTableHead-root .MuiTableCell-root:nth-of-type(6)': {
									minWidth: isMobileSize ? '0px' : isInstructor ? '0px' : '80px',
									width: isMobileSize ? '0%' : isInstructor ? '0%' : '15%',
								},
								// Column widths for body cells - exact same as header
								'& .MuiTableBody-root .MuiTableCell-root:nth-of-type(1)': {
									minWidth: isMobileSize ? '150px' : isInstructor ? '150px' : '100px',
									width: isMobileSize ? '40%' : isInstructor ? '25%' : '13%',
								},
								'& .MuiTableBody-root .MuiTableCell-root:nth-of-type(2)': {
									minWidth: isMobileSize ? '200px' : isInstructor ? '200px' : '200px',
									width: isMobileSize ? '30%' : isInstructor ? '30%' : '27%',
								},
								'& .MuiTableBody-root .MuiTableCell-root:nth-of-type(3)': {
									minWidth: isMobileSize ? '100px' : isInstructor ? '100px' : '100px',
									width: isMobileSize ? '30%' : isInstructor ? '15%' : '20%',
								},
								'& .MuiTableBody-root .MuiTableCell-root:nth-of-type(4)': {
									minWidth: isMobileSize ? '0px' : isInstructor ? '100px' : '100px',
									width: isMobileSize ? '0%' : isInstructor ? '15%' : '13%',
								},
								'& .MuiTableBody-root .MuiTableCell-root:nth-of-type(5)': {
									minWidth: isMobileSize ? '0px' : isInstructor ? '0px' : '100px',
									width: isMobileSize ? '0%' : isInstructor ? '15%' : '12%',
								},
								'& .MuiTableBody-root .MuiTableCell-root:nth-of-type(6)': {
									minWidth: isMobileSize ? '0px' : isInstructor ? '0px' : '80px',
									width: isMobileSize ? '0%' : isInstructor ? '0%' : '15%',
								},
							}}
							size='small'
							aria-label='a dense table'>
							<TableBody>
								{/* Spacer row to ensure header alignment */}
								<TableRow sx={{ height: 0, visibility: 'hidden' }}>
									<TableCell sx={{ width: isMobileSize ? '40%' : isInstructor ? '25%' : '13%', padding: 0, border: 'none' }} />
									<TableCell sx={{ width: isMobileSize ? '30%' : isInstructor ? '30%' : '27%', padding: 0, border: 'none' }} />
									<TableCell sx={{ width: isMobileSize ? '30%' : isInstructor ? '15%' : '20%', padding: 0, border: 'none' }} />
									<TableCell sx={{ width: isMobileSize ? '0%' : isInstructor ? '15%' : '13%', padding: 0, border: 'none' }} />
									<TableCell sx={{ width: isMobileSize ? '0%' : isInstructor ? '15%' : '12%', padding: 0, border: 'none' }} />
									<TableCell sx={{ width: isMobileSize ? '0%' : isInstructor ? '0%' : '15%', padding: 0, border: 'none' }} />
								</TableRow>
							</TableBody>
							<CustomTableHead<Document>
								orderBy={orderBy as keyof Document}
								order={order}
								handleSort={handleSort}
								columns={getColumns(isMobileSize)}
							/>
							<TableBody>
								{paginatedDocuments &&
									paginatedDocuments?.map((document: Document, index) => {
										return (
											<TableRow key={document._id} hover>
												{!isMobileSize && !isInstructor && <CustomTableCell value={document.isOnLandingPage ? 'Yes' : 'No'} />}
												<CustomTableCell value={document.name || ''} />
												<TableCell sx={{ textAlign: 'center' }}>
													<Link
														href={document.documentUrl}
														target='_blank'
														rel='noopener noreferrer'
														sx={{ fontSize: isMobileSize ? '0.6rem' : undefined }}>
														{isMobileSize ? truncateText(document.documentUrl, 20) : truncateText(document.documentUrl, 27)}
													</Link>
												</TableCell>
												{!isMobileSize && !isInstructor && <CustomTableCell value={document.createdByName || 'N/A'} />}
												{!isMobileSize && isInstructor && <CustomTableCell value={dateFormatter(document.createdAt)} />}
												{!isMobileSize && <CustomTableCell value={dateFormatter(document.updatedAt)} />}
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
														isOpen={editDocumentModalOpen[paginatedDocuments.findIndex((d) => d._id === document._id)]}
														onClose={() => {
															closeDocumentEditModal(paginatedDocuments.findIndex((d) => d._id === document._id));
															resetForm();
														}}
														onSubmit={async (e: React.FormEvent<HTMLFormElement>) => {
															e.preventDefault();
															const fullIndex = paginatedDocuments.findIndex((d) => d._id === document._id);

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
														isUpdating={isUpdating}
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
															maxWidth='xs'>
															<DialogContent>
																<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem', mb: '0.5rem' }}>
																	Are you sure you want to delete "{document.name || ''}"?
																</Typography>
																<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem', mb: '0.5rem', mt: '1.5rem' }}>
																	You can restore it later from the recycle bin
																</Typography>
															</DialogContent>
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
						{displayDocuments && displayDocuments.length === 0 && (
							<CustomInfoMessageAlignedLeft
								message={isSearchActive ? 'No documents found matching your search criteria.' : 'No documents found.'}
								sx={{ marginTop: isMobileSize ? '3rem' : '5rem', marginBottom: '1rem' }}
							/>
						)}
						{isMobileSize && !(displayDocuments && displayDocuments.length === 0) && (
							<CustomInfoMessageAlignedLeft message='Rotate your device or use desktop for more info' />
						)}
						<CustomTablePagination count={documentsNumberOfPages} page={documentsCurrentPage} onChange={handlePageChange} />
					</Box>

					{isDocumentInfoModalOpen?.map(
						(isOpen, index) =>
							isOpen && (
								<CustomDialog
									key={index}
									openModal={isOpen}
									closeModal={() => closeDocumentInfoModal(index)}
									title={displayDocuments[index].name}
									maxWidth='sm'>
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
						<Alert severity='error' variant='filled' sx={{ width: isMobileSize ? '60%' : '100%', fontSize: isMobileSize ? '0.75rem' : undefined }}>
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
								'width': isMobileSize ? '60%' : '100%',
								'backgroundColor': theme.bgColor?.greenSecondary,
								'color': theme.textColor?.common.main,
								'fontSize': isMobileSize ? '0.75rem' : undefined,
								'& .MuiAlert-icon': {
									color: 'white',
								},
							}}>
							{snackbarMessage}
						</Alert>
					</Snackbar>
				</Box>
			</DashboardPagesLayout>
		</AdminPageErrorBoundary>
	);
};

export default AdminDocuments;
