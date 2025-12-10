import { Box, Table, TableBody, TableCell, TableRow, Typography, Snackbar, Alert, DialogContent, DialogActions } from '@mui/material';
import AdminTableSkeleton from '../components/layouts/skeleton/AdminTableSkeleton';
import DashboardPagesLayout from '../components/layouts/dashboardLayout/DashboardPagesLayout';
import AdminPageErrorBoundary from '../components/error/AdminPageErrorBoundary';
import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from '@utils/axiosInstance';
import { Delete, Visibility, Download as DownloadIcon, ArrowBack } from '@mui/icons-material';
import CustomDialog from '../components/layouts/dialog/CustomDialog';
import CustomDialogActions from '../components/layouts/dialog/CustomDialogActions';
import CustomTableHead from '../components/layouts/table/CustomTableHead';
import CustomTableCell from '../components/layouts/table/CustomTableCell';
import CustomTablePagination from '../components/layouts/table/CustomTablePagination';
import CustomActionBtn from '../components/layouts/table/CustomActionBtn';
import { Feedback } from '../interfaces/feedback';
import theme from '../themes';
import { OrganisationContext } from '../contexts/OrganisationContextProvider';
import { MediaQueryContext } from '../contexts/MediaQueryContextProvider';
import CustomInfoMessageAlignedLeft from '../components/layouts/infoMessage/CustomInfoMessageAlignedLeft';
import { dateFormatter } from '../utils/dateFormatter';
import { useFilterSearch } from '../hooks/useFilterSearch';
import FilterSearchRow from '../components/layouts/FilterSearchRow';
import { truncateText } from '../utils/utilText';
import { useQuery, useQueryClient } from 'react-query';
import CustomCancelButton from '../components/forms/customButtons/CustomCancelButton';

const AdminCheckoutsFeedback = () => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const { orgId, organisation } = useContext(OrganisationContext);
	const [searchParams] = useSearchParams();
	const navigate = useNavigate();
	const courseId = searchParams.get('courseId');

	const { isSmallScreen, isRotatedMedium } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;

	const queryClient = useQueryClient();
	const [feedbacksPageNumber, setFeedbacksPageNumber] = useState<number>(1);
	const [totalItems, setTotalItems] = useState<number>(0);
	const [loadedPages, setLoadedPages] = useState<number[]>([]);

	// Build endpoint with courseId filter if present
	const buildEndpoint = () => {
		if (courseId) {
			return `${base_url}/feedback/organisation/${orgId}/course/${courseId}`;
		}
		return `${base_url}/feedback/organisation/${orgId}`;
	};

	// Fetch feedbacks directly when page loads
	const fetchFeedbacks = async (page: number = 1) => {
		if (!orgId) return [];
		try {
			const endpoint = buildEndpoint();
			const separator = endpoint.includes('?') ? '&' : '?';
			const response = await axios.get(`${endpoint}${separator}page=${page}&limit=200`);
			const feedbacks = response.data?.data || [];
			queryClient.setQueryData(['feedbacks', orgId, courseId, page], feedbacks);
			const total = response.data?.totalItems || 0;
			setTotalItems(total);
			setLoadedPages((prev) => Array.from(new Set([...prev, page])));
			return feedbacks;
		} catch (error: any) {
			console.error('Error fetching feedbacks:', error);
			console.error('Error response:', error.response?.data);
			return [];
		}
	};

	const fetchMoreFeedbacks = async (startPage: number, endPage: number) => {
		if (!orgId) return;
		const pagesToFetch: number[] = [];
		for (let page = startPage; page <= endPage; page++) {
			if (!loadedPages.includes(page)) pagesToFetch.push(page);
		}
		if (pagesToFetch.length === 0) return;

		let newFeedbacks: Feedback[] = [];
		const endpoint = buildEndpoint();
		const separator = endpoint.includes('?') ? '&' : '?';
		for (const page of pagesToFetch) {
			const response = await axios.get(`${endpoint}${separator}page=${page}&limit=200`);
			newFeedbacks = [...newFeedbacks, ...response.data.data];
		}

		const existingData = queryClient.getQueryData<Feedback[]>(['feedbacks', orgId, courseId, feedbacksPageNumber]) || [];
		const combined = [...existingData, ...newFeedbacks];
		const unique = combined.filter((item, index, self) => index === self.findIndex((i) => i._id === item._id));
		const sorted = unique.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

		queryClient.setQueryData(['feedbacks', orgId, courseId, feedbacksPageNumber], sorted);
		setLoadedPages((prev) => Array.from(new Set([...prev, ...pagesToFetch])));
	};

	const {
		data: feedbacks,
		isLoading,
		isError,
	} = useQuery(['feedbacks', orgId, courseId, feedbacksPageNumber], () => fetchFeedbacks(feedbacksPageNumber), {
		enabled: !!orgId,
		staleTime: 0,
		cacheTime: 30 * 60 * 1000,
		refetchOnWindowFocus: false,
		refetchOnMount: true,
	});

	const removeFeedback = (feedbackId: string) => {
		const currentData = queryClient.getQueryData<Feedback[]>(['feedbacks', orgId, courseId, feedbacksPageNumber]) || [];
		const updated = currentData.filter((f) => f._id !== feedbackId);
		queryClient.setQueryData(['feedbacks', orgId, courseId, feedbacksPageNumber], updated);
		setTotalItems((prev) => Math.max(0, prev - 1));
	};

	// Responsive column configuration
	const getColumns = (isMobileSize: boolean) => {
		return isMobileSize
			? [
					{ key: 'username', label: 'Username' },
					{ key: 'chapter', label: 'Chapter' },
					{ key: 'feedback', label: 'Feedback' },
					{ key: 'actions', label: 'Actions' },
				]
			: [
					{ key: 'username', label: 'Username' },
					{ key: 'chapter', label: 'Chapter' },
					{ key: 'feedback', label: 'Feedback' },
					{ key: 'createdAt', label: 'Submitted On' },
					{ key: 'actions', label: 'Actions' },
				];
	};

	const pageSize = 50;

	// Use the filter search hook
	const {
		searchValue,
		setSearchValue,
		filterValue,
		displayData: displayFeedbacks,
		numberOfPages: feedbacksNumberOfPages,
		currentPage: feedbacksCurrentPage,
		searchResultsTotalItems,
		searchedValue,
		searchButtonClicked,
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
	} = useFilterSearch<Feedback>({
		getEndpoint: () => buildEndpoint(),
		limit: 200,
		pageSize,
		contextData: feedbacks || [],
		setContextPageNumber: setFeedbacksPageNumber,
		fetchMoreContextData: fetchMoreFeedbacks,
		contextLoadedPages: loadedPages,
		contextTotalItems: totalItems,
		defaultOrderBy: 'createdAt',
		defaultOrder: 'desc',
	});

	const sortedFeedbacks = useMemo(() => {
		if (!displayFeedbacks) return [];

		return [...displayFeedbacks].sort((a, b) => {
			const aValue = (a as any)[orderBy] ?? '';
			const bValue = (b as any)[orderBy] ?? '';

			if (order === 'asc') {
				return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
			} else {
				return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
			}
		});
	}, [displayFeedbacks, orderBy, order]);

	const paginatedFeedbacks = sortedFeedbacks;

	const [isFeedbackDeleteModalOpen, setIsFeedbackDeleteModalOpen] = useState<boolean[]>([]);
	const [isFeedbackViewModalOpen, setIsFeedbackViewModalOpen] = useState<boolean[]>([]);

	// Snackbar states for delete operation
	const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
	const [snackbarMessage, setSnackbarMessage] = useState<string>('');
	const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

	// Keep track of previous length to avoid unnecessary resets
	const prevLengthRef = useRef<number>(0);

	useEffect(() => {
		if (paginatedFeedbacks && paginatedFeedbacks.length !== prevLengthRef.current) {
			prevLengthRef.current = paginatedFeedbacks.length;
			setIsFeedbackDeleteModalOpen(Array(paginatedFeedbacks.length).fill(false));
			setIsFeedbackViewModalOpen(Array(paginatedFeedbacks.length).fill(false));
		}
	}, [feedbacksCurrentPage, filterValue, searchValue, paginatedFeedbacks]);

	if (isError) return <Typography color='error'>Failed to fetch feedbacks</Typography>;

	// Show loading state while feedbacks are being fetched or when data is empty and not loading yet
	if (isLoading) {
		return (
			<DashboardPagesLayout pageName='Feedbacks' customSettings={{ justifyContent: 'flex-start' }} showCopyRight={true}>
				<AdminTableSkeleton rows={8} columns={4} />
			</DashboardPagesLayout>
		);
	}

	const openDeleteFeedbackModal = (index: number) => {
		const updatedState = [...isFeedbackDeleteModalOpen];
		updatedState[index] = true;
		setIsFeedbackDeleteModalOpen(updatedState);
	};
	const closeDeleteFeedbackModal = (index: number) => {
		const updatedState = [...isFeedbackDeleteModalOpen];
		updatedState[index] = false;
		setIsFeedbackDeleteModalOpen(updatedState);
	};

	const deleteFeedback = async (feedbackId: string): Promise<void> => {
		try {
			const response = await axios.delete(`${base_url}/feedback/admin/${feedbackId}`);

			// Only remove from frontend state if the backend request was successful
			if (response.data.status === 200) {
				removeFeedback(feedbackId);

				// If search is active, remove from search results; otherwise context data is already updated
				if (isSearchActive) {
					removeFromSearchResults(feedbackId);
				}

				// Show success message
				setSnackbarMessage('Feedback deleted successfully');
				setSnackbarSeverity('success');
				setSnackbarOpen(true);
			} else {
				console.error('Delete feedback failed:', response.data.message);
				setSnackbarMessage(response.data.message || 'Failed to delete feedback');
				setSnackbarSeverity('error');
				setSnackbarOpen(true);
			}
		} catch (error: any) {
			console.error('Delete feedback error:', error);
			setSnackbarMessage(error.response?.data?.message || 'Failed to delete feedback');
			setSnackbarSeverity('error');
			setSnackbarOpen(true);
		}
	};

	const openFeedbackViewModal = (index: number) => {
		const updatedState = [...isFeedbackViewModalOpen];
		updatedState[index] = true;
		setIsFeedbackViewModalOpen(updatedState);
	};

	const closeFeedbackViewModal = (index: number) => {
		const updatedState = [...isFeedbackViewModalOpen];
		updatedState[index] = false;
		setIsFeedbackViewModalOpen(updatedState);
	};

	const getChapterTitle = (feedback: Feedback): string => {
		if (typeof feedback.chapterId === 'object' && feedback.chapterId?.title) {
			return feedback.chapterId.title;
		}
		return 'N/A';
	};

	const getUsername = (feedback: Feedback): string => {
		if (typeof feedback.userId === 'object' && feedback.userId) {
			return feedback.userId.username || `${feedback.userId.firstName || ''} ${feedback.userId.lastName || ''}`.trim() || 'N/A';
		}
		return 'N/A';
	};

	const getUserEmail = (feedback: Feedback): string => {
		if (typeof feedback.userId === 'object' && feedback.userId?.email) {
			return feedback.userId.email;
		}
		return 'N/A';
	};

	const getCourseTitle = (feedback: Feedback): string => {
		if (typeof feedback.courseId === 'object' && feedback.courseId?.title) {
			return feedback.courseId.title;
		}
		return 'N/A';
	};

	const handleDownloadFeedbacks = async () => {
		try {
			let dataToExport: Feedback[];

			if (searchButtonClicked) {
				// If search is active, fetch ALL matching results (not just what's displayed)
				const endpoint = buildEndpoint();
				const separator = endpoint.includes('?') ? '&' : '?';

				// Build search parameters
				const params = new URLSearchParams();
				params.append('limit', '1000'); // Fetch 1000 per page
				if (searchValue && searchValue.trim()) {
					params.append('search', searchValue.trim());
				}
				if (filterValue && filterValue.trim()) {
					params.append('filter', filterValue.trim());
				}
				if (orderBy) {
					params.append('sortBy', orderBy.toString());
				}
				if (order) {
					params.append('sortOrder', order);
				}

				// First, get the total count to know how many pages we need
				const countResponse = await axios.get(`${endpoint}${separator}${params.toString()}`);
				const totalItems = countResponse.data.totalItems;

				// Calculate how many pages we need to fetch all matching data
				const itemsPerPage = 1000;
				const totalPages = Math.ceil(totalItems / itemsPerPage);

				// Fetch all pages of search results
				let allFeedbacks: Feedback[] = [];
				for (let page = 1; page <= totalPages; page++) {
					const pageParams = new URLSearchParams(params);
					pageParams.set('page', page.toString());
					const response = await axios.get(`${endpoint}${separator}${pageParams.toString()}`);
					allFeedbacks = [...allFeedbacks, ...response.data.data];
				}

				dataToExport = allFeedbacks;
			} else {
				// First, get the total count to know how many pages we need
				const endpoint = buildEndpoint();
				const separator = endpoint.includes('?') ? '&' : '?';
				const countResponse = await axios.get(`${endpoint}${separator}page=1&limit=1`);
				const totalItems = countResponse.data.totalItems;

				// Calculate how many pages we need to fetch all data
				const itemsPerPage = 1000; // Fetch 1000 per page
				const totalPages = Math.ceil(totalItems / itemsPerPage);

				// Fetch all pages
				let allFeedbacks: Feedback[] = [];
				for (let page = 1; page <= totalPages; page++) {
					const response = await axios.get(`${endpoint}${separator}page=${page}&limit=${itemsPerPage}`);
					allFeedbacks = [...allFeedbacks, ...response.data.data];
				}

				dataToExport = allFeedbacks;
			}

			// Get course title from first feedback if available
			const courseTitle = dataToExport && dataToExport.length > 0 ? getCourseTitle(dataToExport[0]) : '';
			const courseTitleForFilename = courseTitle && courseTitle !== 'N/A' ? courseTitle.replace(/[^a-zA-Z0-9]/g, '_') : '';

			// Helper function to get user full name
			const getUserFullName = (feedback: Feedback): string => {
				if (typeof feedback.userId === 'object' && feedback.userId) {
					const firstName = feedback.userId.firstName || '';
					const lastName = feedback.userId.lastName || '';
					return `${firstName} ${lastName}`.trim() || 'N/A';
				}
				return 'N/A';
			};

			// Create Excel data
			const excelData = dataToExport?.map((feedback: Feedback) => ({
				'Chapter': getChapterTitle(feedback),
				'Full Name': getUserFullName(feedback),
				'Username': getUsername(feedback),
				'Email': getUserEmail(feedback),
				'Feedback': feedback.feedback || '',
				'Submitted On': new Date(feedback.createdAt).toLocaleDateString(),
			}));

			// Create and download Excel file
			const XLSX = await import('xlsx');
			const ws = XLSX.utils.json_to_sheet(excelData);
			const wb = XLSX.utils.book_new();
			XLSX.utils.book_append_sheet(wb, ws, 'Feedbacks');

			// Build filename with course title if available
			const filename = courseTitleForFilename
				? `${organisation?.orgName || 'Feedbacks'}_${courseTitleForFilename}_Feedbacks_${new Date().toISOString().split('T')[0]}.xlsx`
				: `${organisation?.orgName || 'Feedbacks'}_Feedbacks_${new Date().toISOString().split('T')[0]}.xlsx`;

			XLSX.writeFile(wb, filename);
		} catch (error) {
			console.error('Download error:', error);
		}
	};

	return (
		<AdminPageErrorBoundary pageName='Checkout Feedback'>
			<DashboardPagesLayout pageName='Checkout Feedback' customSettings={{ justifyContent: 'flex-start' }} showCopyRight={true}>
				<Box sx={{ width: '100%', height: '100%' }}>
					<FilterSearchRow
						filterValue={filterValue}
						onFilterChange={handleFilterChange}
						filterOptions={[{ value: '', label: 'All Feedback' }]}
						filterPlaceholder='Filter Feedback'
						searchValue={searchValue}
						onSearchChange={setSearchValue}
						onSearch={handleSearch}
						onReset={resetAll}
						searchPlaceholder='Search in first & last name, username, feedback'
						isSearchLoading={isSearchLoading}
						isSearchActive={isSearchActive}
						searchResultsTotalItems={searchResultsTotalItems}
						totalItems={totalItems || feedbacks?.length || 0}
						searchedValue={searchedValue}
						onResetSearch={resetSearch}
						onResetFilter={resetFilter}
						actionButtons={[
							...(courseId
								? [
										{
											label: 'Back',
											onClick: () => navigate(`/admin/course-edit/course/${courseId}`),
											startIcon: isMobileSize ? undefined : <ArrowBack />,
										},
									]
								: []),
							{
								label: isMobileSize ? 'Download' : `Download ${searchButtonClicked ? 'Filtered' : 'All'} Feedback`,
								onClick: handleDownloadFeedbacks,
								startIcon: isMobileSize ? undefined : <DownloadIcon />,
								disabled: paginatedFeedbacks && paginatedFeedbacks.length === 0,
							},
						]}
						isSticky={true}
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
									padding: '0.5rem 1rem',
									boxSizing: 'border-box',
									margin: 0,
									verticalAlign: 'center',
								},
								'& .MuiTableHead-root .MuiTableCell-root:last-child': {
									borderRight: 'none',
								},
								'& .MuiTableBody-root .MuiTableCell-root': {
									padding: '0.35rem 1rem',
									boxSizing: 'border-box',
									margin: 0,
									verticalAlign: 'center',
								},
								'& .MuiTableBody-root .MuiTableCell-root:last-child': {
									borderRight: 'none',
								},
								'& .MuiTableHead-root .MuiTableCell-root:nth-of-type(1)': {
									minWidth: isMobileSize ? '100px' : '120px',
									width: isMobileSize ? '20%' : '15%',
								},
								'& .MuiTableHead-root .MuiTableCell-root:nth-of-type(2)': {
									minWidth: isMobileSize ? '100px' : '150px',
									width: isMobileSize ? '27.5%' : '20%',
								},
								'& .MuiTableHead-root .MuiTableCell-root:nth-of-type(3)': {
									minWidth: isMobileSize ? '80px' : '200px',
									width: isMobileSize ? '30%' : '30%',
								},
								'& .MuiTableHead-root .MuiTableCell-root:nth-of-type(4)': {
									minWidth: isMobileSize ? '80px' : '120px',
									width: isMobileSize ? '15%' : '20%',
								},
								'& .MuiTableHead-root .MuiTableCell-root:nth-of-type(5)': {
									minWidth: isMobileSize ? '80px' : '100px',
									width: isMobileSize ? '22.5%' : '15%',
								},
								'& .MuiTableBody-root .MuiTableCell-root:nth-of-type(1)': {
									minWidth: isMobileSize ? '100px' : '120px',
									width: isMobileSize ? '20%' : '15%',
								},
								'& .MuiTableBody-root .MuiTableCell-root:nth-of-type(2)': {
									minWidth: isMobileSize ? '100px' : '150px',
									width: isMobileSize ? '27.5%' : '20%',
								},
								'& .MuiTableBody-root .MuiTableCell-root:nth-of-type(3)': {
									minWidth: isMobileSize ? '80px' : '200px',
									width: isMobileSize ? '30%' : '30%',
								},
								'& .MuiTableBody-root .MuiTableCell-root:nth-of-type(4)': {
									minWidth: isMobileSize ? '80px' : '120px',
									width: isMobileSize ? '15%' : '20%',
								},
								'& .MuiTableBody-root .MuiTableCell-root:nth-of-type(5)': {
									minWidth: isMobileSize ? '80px' : '100px',
									width: isMobileSize ? '22.5%' : '15%',
								},
							}}
							size='small'
							aria-label='a dense table'>
							<TableBody>
								{/* Spacer row to ensure header alignment */}
								<TableRow sx={{ height: 0, visibility: 'hidden' }}>
									<TableCell sx={{ width: isMobileSize ? '20%' : '15%', padding: 0, border: 'none' }} />
									<TableCell sx={{ width: isMobileSize ? '27.5%' : '20%', padding: 0, border: 'none' }} />
									<TableCell sx={{ width: isMobileSize ? '30%' : '30%', padding: 0, border: 'none' }} />
									{!isMobileSize && <TableCell sx={{ width: '20%', padding: 0, border: 'none' }} />}
									<TableCell sx={{ width: isMobileSize ? '22.5%' : '15%', padding: 0, border: 'none' }} />
								</TableRow>
							</TableBody>
							<CustomTableHead<Feedback>
								orderBy={orderBy as keyof Feedback}
								order={order}
								handleSort={handleSort}
								columns={getColumns(isMobileSize)}
							/>
							<TableBody>
								{paginatedFeedbacks &&
									paginatedFeedbacks?.map((feedback: Feedback, index) => {
										return (
											<TableRow key={feedback._id} hover>
												<CustomTableCell value={getUsername(feedback)} />
												<CustomTableCell value={truncateText(getChapterTitle(feedback), 40)} />
												<CustomTableCell value={truncateText(feedback.feedback, 40)} />
												{!isMobileSize && <CustomTableCell value={dateFormatter(feedback.createdAt)} />}
												<TableCell
													sx={{
														textAlign: 'center',
													}}>
													<CustomActionBtn
														title='View'
														onClick={() => {
															openFeedbackViewModal(index);
														}}
														icon={<Visibility fontSize='small' sx={{ fontSize: isMobileSize ? '0.8rem' : undefined }} />}
													/>

													<CustomActionBtn
														title='Delete'
														onClick={() => {
															openDeleteFeedbackModal(index);
														}}
														icon={<Delete fontSize='small' sx={{ fontSize: isMobileSize ? '0.8rem' : undefined }} />}
													/>

													{isFeedbackDeleteModalOpen[index] !== undefined && (
														<CustomDialog
															openModal={isFeedbackDeleteModalOpen[index]}
															closeModal={() => closeDeleteFeedbackModal(index)}
															title='Delete Feedback'
															content={``}
															maxWidth='xs'>
															<DialogContent>
																<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem', mb: '0.5rem' }}>
																	Are you sure you want to delete this feedback?
																</Typography>
															</DialogContent>
															<CustomDialogActions
																onCancel={() => closeDeleteFeedbackModal(index)}
																deleteBtn={true}
																onDelete={() => {
																	deleteFeedback(feedback._id);
																	closeDeleteFeedbackModal(index);
																}}
																actionSx={{ mb: '0.5rem' }}
															/>
														</CustomDialog>
													)}

													{isFeedbackViewModalOpen[index] !== undefined && (
														<CustomDialog
															openModal={isFeedbackViewModalOpen[index]}
															closeModal={() => closeFeedbackViewModal(index)}
															title='Feedback Details'
															maxWidth='sm'>
															<DialogContent>
																<Box sx={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
																	{/* Chapter and Username/Email side by side */}
																	<Box sx={{ display: 'flex', gap: '2.5rem' }}>
																		<Box sx={{ display: 'flex', gap: '0.5rem' }}>
																			<Typography
																				variant='body2'
																				sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem', fontWeight: 600, mb: '0.25rem' }}>
																				Course:
																			</Typography>
																			<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
																				{getCourseTitle(feedback)}
																			</Typography>
																		</Box>
																		<Box sx={{ display: 'flex', gap: '0.5rem' }}>
																			<Typography
																				variant='body2'
																				sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem', fontWeight: 600, mb: '0.25rem' }}>
																				Chapter:
																			</Typography>
																			<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
																				{getChapterTitle(feedback)}
																			</Typography>
																		</Box>
																	</Box>

																	<Box
																		sx={{
																			display: 'flex',
																			justifyContent: 'flex-start',
																			alignItems: 'center',
																			gap: '2.5rem',
																		}}>
																		<Box sx={{ display: 'flex', gap: '0.5rem' }}>
																			<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem', fontWeight: 600 }}>
																				Username:
																			</Typography>
																			<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
																				{getUsername(feedback)}
																			</Typography>
																		</Box>
																		<Box sx={{ display: 'flex', gap: '0.5rem' }}>
																			<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem', fontWeight: 600 }}>
																				Email:
																			</Typography>
																			<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
																				{getUserEmail(feedback)}
																			</Typography>
																		</Box>
																	</Box>
																	{/* Feedback message */}
																	<Box>
																		<Typography
																			variant='body2'
																			sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem', fontWeight: 600, mb: '0.25rem' }}>
																			Feedback:
																		</Typography>
																		<Typography
																			variant='body2'
																			sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem', whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>
																			{feedback.feedback || 'No feedback provided'}
																		</Typography>
																	</Box>
																	{/* Submitted On */}
																	<Box sx={{ display: 'flex', gap: '0.5rem' }}>
																		<Typography
																			variant='body2'
																			sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem', fontWeight: 600, mb: '0.25rem' }}>
																			Submitted On:
																		</Typography>
																		<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
																			{dateFormatter(feedback.createdAt)}
																		</Typography>
																	</Box>
																</Box>
															</DialogContent>
															<DialogActions>
																<CustomCancelButton onClick={() => closeFeedbackViewModal(index)} sx={{ margin: '0 1rem 1rem 0' }}>
																	Close
																</CustomCancelButton>
															</DialogActions>
														</CustomDialog>
													)}
												</TableCell>
											</TableRow>
										);
									})}
							</TableBody>
						</Table>
						{displayFeedbacks && displayFeedbacks.length === 0 && (
							<CustomInfoMessageAlignedLeft
								message={isSearchActive ? 'No feedback found matching your search criteria.' : 'No feedback found.'}
								sx={{ marginTop: isMobileSize ? '3rem' : '5rem', marginBottom: '1rem' }}
							/>
						)}

						<CustomTablePagination count={feedbacksNumberOfPages} page={feedbacksCurrentPage} onChange={handlePageChange} />
					</Box>
				</Box>

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
			</DashboardPagesLayout>
		</AdminPageErrorBoundary>
	);
};

export default AdminCheckoutsFeedback;
