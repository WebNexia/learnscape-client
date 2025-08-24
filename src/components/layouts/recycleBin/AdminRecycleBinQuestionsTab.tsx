import { useState, useEffect, useContext } from 'react';
import {
	Box,
	Table,
	TableBody,
	TableCell,
	TableRow,
	Typography,
	IconButton,
	InputAdornment,
	MenuItem,
	FormControl,
	Select,
	Chip,
	DialogContent,
	Snackbar,
	Alert,
} from '@mui/material';
import { Search, Restore, DeleteForever, Info } from '@mui/icons-material';
import axios from '@utils/axiosInstance';
import theme from '../../../themes';
import { MediaQueryContext } from '../../../contexts/MediaQueryContextProvider';
import { OrganisationContext } from '../../../contexts/OrganisationContextProvider';
import { QuestionsContext } from '../../../contexts/QuestionsContextProvider';
import { useRecycleBinQuestions } from '../../../contexts/RecycleBinQuestionsContextProvider';
import { QuestionInterface } from '../../../interfaces/question';
import { dateFormatter } from '../../../utils/dateFormatter';
import CustomTextField from '../../forms/customFields/CustomTextField';
import CustomSubmitButton from '../../forms/customButtons/CustomSubmitButton';
import CustomDeleteButton from '../../forms/customButtons/CustomDeleteButton';
import CustomTableHead from '../table/CustomTableHead';
import CustomTableCell from '../table/CustomTableCell';
import CustomActionBtn from '../table/CustomActionBtn';
import CustomTablePagination from '../table/CustomTablePagination';
import CustomDialog from '../dialog/CustomDialog';
import CustomDialogActions from '../dialog/CustomDialogActions';
import CustomInfoMessageAlignedLeft from '../infoMessage/CustomInfoMessageAlignedLeft';
import { truncateText } from '@utils/utilText';
import { stripHtml } from '@utils/stripHtml';
import { decode } from 'html-entities';

interface ArchivedQuestion extends QuestionInterface {
	archivedAt?: string;
	archivedBy?: string;
	archivedByName?: string;
	questionTypeName?: string;
}

const AdminRecycleBinQuestionsTab = () => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;

	const { orgId } = useContext(OrganisationContext);
	const { addNewQuestion, questionTypes, fetchQuestionTypeName } = useContext(QuestionsContext);
	const {
		archivedQuestions,
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
		fetchArchivedQuestions,
		setCurrentPage,
		setSearchResults,
		setSearchResultsTotalItems,
		setIsSearchActive,
		setArchivedQuestions,
		setTotalItems,
		loadedPages,
		setLoadedPages,
		snackbarOpen,
		snackbarMessage,
		snackbarSeverity,
		setSnackbarOpen,
		setSnackbarMessage,
		setSnackbarSeverity,
	} = useRecycleBinQuestions();

	const vertical = 'top';
	const horizontal = 'center';

	const { isSmallScreen, isRotatedMedium, isRotated, isVerySmallScreen } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;
	const isMobileSizeSmall = isVerySmallScreen || isRotated;

	const pageSize = 50;

	// Use search results if active, otherwise use context data
	const displayQuestions = isSearchActive ? searchResults : archivedQuestions;

	// Add missing state variables for progressive pagination
	const [searchResultsPage, setSearchResultsPage] = useState<number>(1);
	const [searchResultsLoadedPages, setSearchResultsLoadedPages] = useState<number[]>([]);

	// For pagination, use total items from server when not searching
	const questionsNumberOfPages = isSearchActive ? Math.ceil(searchResultsTotalItems / pageSize) : Math.ceil(totalItems / pageSize);

	// Use appropriate page number for pagination
	const currentPageNumber = isSearchActive ? searchResultsPage : currentPage;
	const paginatedQuestions = displayQuestions.slice((currentPageNumber - 1) * pageSize, currentPageNumber * pageSize);

	const [orderBy, setOrderBy] = useState<keyof ArchivedQuestion>('archivedAt');
	const [order, setOrder] = useState<'asc' | 'desc'>('desc');

	// Modal states
	const [restoreModalOpen, setRestoreModalOpen] = useState<boolean[]>([]);
	const [deleteModalOpen, setDeleteModalOpen] = useState<boolean[]>([]);
	const [isBulkRestoreModalOpen, setIsBulkRestoreModalOpen] = useState<boolean>(false);
	const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState<boolean>(false);

	// Selection states
	const [selectedItems, setSelectedItems] = useState<string[]>([]);
	const [selectAll, setSelectAll] = useState<boolean>(false);

	// Load initial data when component mounts
	useEffect(() => {
		fetchArchivedQuestions(1);
		setLoadedPages([1]);
	}, []);

	// Info dialog state
	const [isInfoDialogOpen, setIsInfoDialogOpen] = useState<boolean>(false);

	// Keep track of previous length to avoid unnecessary resets
	useEffect(() => {
		if (displayQuestions && displayQuestions.length !== 0) {
			setRestoreModalOpen(Array(displayQuestions.length).fill(false));
			setDeleteModalOpen(Array(displayQuestions.length).fill(false));
		}
	}, [displayQuestions]);

	useEffect(() => {
		setCurrentPage(1);
	}, []);

	const handlePageChange = async (newPage: number) => {
		if (isSearchActive) {
			setSearchResultsPage(newPage);

			// Check if we need to fetch more data for progressive pagination
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
					if (!searchResultsLoadedPages.includes(page)) {
						await fetchMoreSearchResults(page, params);
					}
				}
			}
		} else {
			// Check if we need to fetch more data for regular archived questions
			const requiredRecords = newPage * pageSize;
			if (archivedQuestions.length < requiredRecords && newPage <= questionsNumberOfPages) {
				// Calculate which pages we need to fetch
				const currentLoadedPages = loadedPages.length > 0 ? Math.max(...loadedPages) : 0;
				const targetPage = Math.ceil((newPage * pageSize) / 200);

				// Fetch all missing pages in sequence
				if (currentLoadedPages < targetPage) {
					for (let page = currentLoadedPages + 1; page <= targetPage; page++) {
						if (!loadedPages.includes(page)) {
							fetchArchivedQuestions(page);
							setLoadedPages((prev) => [...prev, page]);
						}
					}
				}
			}
			setCurrentPage(newPage);
		}
	};

	const fetchMoreSearchResults = async (page: number, searchParams: URLSearchParams) => {
		if (!orgId) return;

		try {
			// Add page parameter
			searchParams.set('page', page.toString());

			const response = await axios.get(`${base_url}/questions/organisation/${orgId}/archived?${searchParams.toString()}`);

			if (response.data.status === 200) {
				const { data, totalItems: total } = response.data;

				if (page === 1) {
					// First page - replace all data
					setSearchResults(data);
					setSearchResultsLoadedPages([1]);
				} else {
					// Additional pages - append data
					setSearchResults((prev) => [...prev, ...data]);
					setSearchResultsLoadedPages((prev) => [...prev, page]);
				}

				setSearchResultsTotalItems(total || data.length);
			}
		} catch (error) {
			console.error('Error fetching more search results:', error);
		}
	};

	const handleSort = (property: keyof ArchivedQuestion) => {
		const isAsc = orderBy === property && order === 'asc';
		setOrder(isAsc ? 'desc' : 'asc');
		setOrderBy(property);
	};

	const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
		const checked = event.target.checked;
		setSelectAll(checked);
		if (checked) {
			setSelectedItems(paginatedQuestions.map((question) => question._id));
			setSelectAll(true);
		} else {
			setSelectedItems([]);
			setSelectAll(false);
		}
	};

	const handleSelectItem = (questionId: string) => {
		setSelectedItems((prev) => {
			if (prev.includes(questionId)) {
				const updatedItems = prev.filter((id) => id !== questionId);
				setSelectAll(false);
				return updatedItems;
			} else {
				const updatedItems = [...prev, questionId];
				if (updatedItems.length === paginatedQuestions.length) {
					setSelectAll(true);
				}
				return updatedItems;
			}
		});
	};

	const openRestoreModal = (index: number) => {
		const newModalState = [...restoreModalOpen];
		newModalState[index] = true;
		setRestoreModalOpen(newModalState);
	};

	const closeRestoreModal = (index: number) => {
		const newModalState = [...restoreModalOpen];
		newModalState[index] = false;
		setRestoreModalOpen(newModalState);
	};

	const openDeleteModal = (index: number) => {
		const newModalState = [...deleteModalOpen];
		newModalState[index] = true;
		setDeleteModalOpen(newModalState);
	};

	const closeDeleteModal = (index: number) => {
		const newModalState = [...deleteModalOpen];
		newModalState[index] = false;
		setDeleteModalOpen(newModalState);
	};

	const handleSearch = async () => {
		try {
			// Reset to first page when searching
			setCurrentPage(1);
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

				const response = await axios.get(`${base_url}/questions/organisation/${orgId}/archived?${params.toString()}`);
				if (response.data.status === 200) {
					setSearchResults(response.data.data);
					setSearchResultsTotalItems(response.data.totalItems || response.data.data.length);
				}
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
			}
		} catch (error) {
			console.error('Search error:', error);
			setSnackbarMessage('Search failed');
			setSnackbarSeverity('error');
			setSnackbarOpen(true);
		}
	};

	const restoreQuestion = async (questionId: string) => {
		try {
			const response = await axios.patch(`${base_url}/questions/${questionId}/restore`);

			if (response.data.status === 200) {
				// Remove from archived questions
				setArchivedQuestions((prev) => prev.filter((question) => question._id !== questionId));
				setTotalItems((prev) => prev - 1);

				// If search is active, also remove from search results
				if (isSearchActive) {
					setSearchResults((prev) => prev.filter((question) => question._id !== questionId));
					setSearchResultsTotalItems((prev) => Math.max(0, prev - 1));
				}

				// Add to questions context
				if (response.data.data) {
					addNewQuestion({ ...response.data.data, questionType: fetchQuestionTypeName(response.data.data) });
					setSelectAll(false);
					setSelectedItems([]);
				}

				setSnackbarMessage('Question restored successfully');
				setSnackbarSeverity('success');
				setSnackbarOpen(true);
			}
		} catch (error) {
			console.error('Restore error:', error);
			setSnackbarMessage('Failed to restore question');
			setSnackbarSeverity('error');
			setSnackbarOpen(true);
		}
	};

	const hardDeleteQuestion = async (questionId: string) => {
		try {
			const response = await axios.delete(`${base_url}/questions/${questionId}/hard`);

			if (response.data.status === 200) {
				// Remove from archived questions
				setArchivedQuestions((prev) => prev.filter((question) => question._id !== questionId));
				setTotalItems((prev) => prev - 1);

				// If search is active, also remove from search results
				if (isSearchActive) {
					setSearchResults((prev) => prev.filter((question) => question._id !== questionId));
					setSearchResultsTotalItems((prev) => Math.max(0, prev - 1));
				}

				setSnackbarMessage('Question permanently deleted');
				setSnackbarSeverity('success');
				setSnackbarOpen(true);
				setSelectAll(false);
				setSelectedItems([]);
			}
		} catch (error) {
			console.error('Delete error:', error);
			setSnackbarMessage('Failed to delete question');
			setSnackbarSeverity('error');
			setSnackbarOpen(true);
		}
	};

	// Handle bulk operations
	const handleBulkRestore = async () => {
		try {
			await Promise.all(
				selectedItems.map(async (questionId) => {
					const response = await axios.patch(`${base_url}/questions/${questionId}/restore`);
					if (response.data.data) {
						addNewQuestion({ ...response.data.data, questionType: fetchQuestionTypeName(response.data.data) });
					}
				})
			);

			// Remove the questions from the list
			setArchivedQuestions((prev) => prev.filter((question) => !selectedItems.includes(question._id)));
			setTotalItems((prev) => prev - selectedItems.length);

			// If search is active, also remove from search results
			if (isSearchActive) {
				setSearchResults((prev) => prev.filter((question) => !selectedItems.includes(question._id)));
				setSearchResultsTotalItems((prev) => Math.max(0, prev - selectedItems.length));
			}

			setSelectedItems([]);
			setSelectAll(false);
			setIsBulkRestoreModalOpen(false);

			setSnackbarMessage(`${selectedItems.length} question(s) restored successfully`);
			setSnackbarSeverity('success');
			setSnackbarOpen(true);
		} catch (error) {
			console.error('Bulk restore error:', error);
			setSnackbarMessage('Failed to restore questions');
			setSnackbarSeverity('error');
			setSnackbarOpen(true);
		}
	};

	const handleBulkDelete = async () => {
		try {
			await Promise.all(selectedItems.map((questionId) => axios.delete(`${base_url}/questions/${questionId}/hard`)));

			// Remove the questions from the list
			setArchivedQuestions((prev) => prev.filter((question) => !selectedItems.includes(question._id)));
			setTotalItems((prev) => prev - selectedItems.length);

			// If search is active, also remove from search results
			if (isSearchActive) {
				setSearchResults((prev) => prev.filter((question) => !selectedItems.includes(question._id)));
				setSearchResultsTotalItems((prev) => Math.max(0, prev - selectedItems.length));
			}

			setSelectedItems([]);
			setSelectAll(false);
			setIsBulkDeleteModalOpen(false);

			setSnackbarMessage(`${selectedItems.length} question(s) permanently deleted`);
			setSnackbarSeverity('success');
			setSnackbarOpen(true);
		} catch (error) {
			console.error('Bulk delete error:', error);
			setSnackbarMessage('Failed to delete questions');
			setSnackbarSeverity('error');
			setSnackbarOpen(true);
		}
	};

	const getDeletionDateStatus = (archivedAt: string) => {
		const archivedDate = new Date(archivedAt);
		const deletionDate = new Date(archivedDate.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days
		const now = new Date();
		const daysUntilDeletion = Math.ceil((deletionDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

		if (daysUntilDeletion <= 0) {
			return { label: `${dateFormatter(deletionDate)}`, color: 'error' as const };
		} else if (daysUntilDeletion <= 1) {
			return { label: `${dateFormatter(deletionDate)}`, color: 'warning' as const };
		} else if (daysUntilDeletion <= 3) {
			return { label: `${dateFormatter(deletionDate)}`, color: 'warning' as const };
		} else {
			return { label: `${dateFormatter(deletionDate)}`, color: 'default' as const };
		}
	};

	return (
		<>
			<Box
				sx={{
					display: 'flex',
					flexDirection: 'row',
					justifyContent: 'space-between',
					padding: isMobileSizeSmall ? '1rem 1rem 0.5rem 1rem' : '2rem 2rem 1rem 2rem',
					width: '100%',
				}}>
				<Box sx={{ display: 'flex', alignSelf: 'flex-start', width: isVerySmallScreen ? '12.5rem' : 'fit-content' }}>
					<Box>
						<FormControl>
							<Select
								size='small'
								value={filterValue}
								onChange={async (e) => {
									const newFilterValue = e.target.value;
									setFilterValue(newFilterValue);

									// Automatically trigger filter
									if (newFilterValue && newFilterValue.trim()) {
										// Reset pagination state
										setCurrentPage(1);
										setSearchResultsPage(1);
										setSearchResultsLoadedPages([]);

										setIsSearchActive(true);
										// Use search results for filtered data
										const params = new URLSearchParams({
											limit: '200',
											filter: newFilterValue.trim(),
										});
										if (searchValue && searchValue.trim()) {
											params.append('search', searchValue.trim());
										}
										if (orderBy) params.append('sortBy', orderBy);
										if (order) params.append('sortOrder', order);

										const response = await axios.get(`${base_url}/questions/organisation/${orgId}/archived?${params.toString()}`);
										if (response.data.status === 200) {
											setSearchResults(response.data.data);
											setSearchResultsTotalItems(response.data.totalItems || response.data.data.length);
											setSearchResultsLoadedPages([1]);
										}
									} else {
										// If no filter, reset to normal view
										setIsSearchActive(false);
										setSearchResults([]);
										setSearchResultsTotalItems(0);
										setSearchResultsLoadedPages([]);
										fetchArchivedQuestions(1);
									}
								}}
								displayEmpty
								sx={{
									backgroundColor: theme.bgColor?.common,
									width: isMobileSizeSmall ? '8rem' : '12rem',
									fontSize: isMobileSize ? '0.7rem' : '0.85rem',
									textTransform: 'capitalize',
									mr: '1rem',
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
									Filter Questions
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
									All deleted questions
								</MenuItem>
								{['Recently deleted', 'AI Generated', 'Non AI Generated'].map((type) => (
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
								<MenuItem
									disabled
									value='types'
									selected
									sx={{
										fontSize: isMobileSize ? '0.6rem' : '0.7rem',
										textTransform: 'inherit',
										fontWeight: 'lighter',
										padding: isMobileSize ? '0.25rem 0.5rem' : undefined,
										minHeight: '2rem',
									}}>
									------ Filter by Type ------
								</MenuItem>
								{questionTypes?.map((type) => (
									<MenuItem
										value={type.name.toLowerCase()}
										key={type._id}
										sx={{
											fontSize: isMobileSize ? '0.65rem' : '0.85rem',
											textTransform: 'capitalize',
											padding: isMobileSize ? '0.25rem 0.5rem' : undefined,
											minHeight: '2rem',
										}}>
										{type.name}
									</MenuItem>
								))}
							</Select>
						</FormControl>
					</Box>

					<CustomTextField
						value={searchValue}
						placeholder={'Search in Question Text'}
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
							onKeyPress: (e) => {
								if (e.key === 'Enter') {
									handleSearch();
								}
							},
						}}
					/>
					<CustomSubmitButton onClick={handleSearch} sx={{ marginLeft: '1rem' }} disabled={!searchValue || !searchValue.trim()}>
						Search
					</CustomSubmitButton>
					<CustomDeleteButton
						onClick={() => {
							setSearchValue('');
							setFilterValue('');
							setSearchedValue('');
							setSearchButtonClicked(false);
							setSearchResults([]);
							setSearchResultsTotalItems(0);
							setIsSearchActive(false);
							setSearchResultsPage(1);
							setSearchResultsLoadedPages([]);
							setCurrentPage(1);
						}}>
						Reset
					</CustomDeleteButton>

					<Box sx={{ ml: '1rem', display: 'flex', alignItems: 'center', height: '2rem' }}>
						{isSearchActive ? (
							<Typography
								variant='body2'
								sx={{
									color: 'text.secondary',
									fontSize: isMobileSize ? '0.7rem' : '0.85rem',
									whiteSpace: 'nowrap',
								}}>
								{searchResultsTotalItems} {searchResultsTotalItems === 1 ? 'result' : 'results'}
							</Typography>
						) : (
							<Typography
								variant='body2'
								sx={{
									color: 'text.secondary',
									fontSize: isMobileSize ? '0.7rem' : '0.85rem',
									whiteSpace: 'nowrap',
								}}>
								{totalItems} {totalItems === 1 ? 'item' : 'items'}
							</Typography>
						)}
					</Box>
				</Box>
				<Box sx={{ display: 'flex', gap: 1, mb: '0.85rem', alignItems: 'center' }}>
					{selectedItems.length > 0 && (
						<>
							<CustomSubmitButton onClick={() => setIsBulkRestoreModalOpen(true)} sx={{ fontSize: isMobileSize ? '0.7rem' : undefined }}>
								Restore ({selectedItems.length})
							</CustomSubmitButton>
							<CustomDeleteButton onClick={() => setIsBulkDeleteModalOpen(true)} sx={{ fontSize: isMobileSize ? '0.7rem' : undefined }}>
								Delete ({selectedItems.length})
							</CustomDeleteButton>
						</>
					)}
				</Box>
			</Box>

			<Box
				sx={{
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					padding: isVerySmallScreen ? '0rem 0.25rem 2rem 0.25rem' : '0rem 2rem 2rem 2rem',
					width: '100%',
				}}>
				{((isSearchActive && searchedValue && searchButtonClicked) || (filterValue && filterValue.trim())) && (
					<Box
						sx={{
							mb: '1rem',
							display: 'flex',
							gap: 1,
							flexWrap: 'wrap',
							justifyContent: 'center',
							borderRadius: '4px',
							alignSelf: 'flex-start',
							marginBottom: '1rem',
						}}>
						{filterValue && filterValue.trim() && (
							<Chip
								label={`Filter: ${filterValue}`}
								onDelete={() => {
									setFilterValue('');
									// If search value exists, keep search results
									if (searchValue && searchValue.trim()) {
										// Reset pagination state
										setCurrentPage(1);
										setSearchResultsPage(1);
										setSearchResultsLoadedPages([]);

										// Trigger search without filter value
										const params = new URLSearchParams({
											limit: '200',
											search: searchValue.trim(),
										});
										if (orderBy) params.append('sortBy', orderBy);
										if (order) params.append('sortOrder', order);

										axios
											.get(`${base_url}/questions/organisation/${orgId}/archived?${params.toString()}`)
											.then((response) => {
												if (response.data.status === 200) {
													setSearchResults(response.data.data);
													setSearchResultsTotalItems(response.data.totalItems || response.data.data.length);
													setSearchResultsLoadedPages([1]);
													setIsSearchActive(true);
												}
											})
											.catch((error) => console.error('Search error:', error));
									} else {
										// No search value, reset to archived questions
										setIsSearchActive(false);
										setSearchResults([]);
										setSearchResultsTotalItems(0);
									}
								}}
								color='secondary'
								variant='outlined'
								size='small'
								sx={{ backgroundColor: '#1976d2', color: 'white', fontSize: '0.9rem', letterSpacing: '0.025rem' }}
							/>
						)}
						{searchedValue && searchButtonClicked && (
							<Chip
								label={`Search: "${searchedValue}"`}
								onDelete={() => {
									setSearchValue('');
									setSearchedValue('');
									setSearchButtonClicked(false);
									// If filter exists, keep filter results
									if (filterValue && filterValue.trim()) {
										// Reset pagination state
										setCurrentPage(1);
										setSearchResultsPage(1);
										setSearchResultsLoadedPages([]);

										// Trigger filter search without search value
										const params = new URLSearchParams({
											limit: '200',
											filter: filterValue.trim(),
										});
										if (orderBy) params.append('sortBy', orderBy);
										if (order) params.append('sortOrder', order);

										axios
											.get(`${base_url}/questions/organisation/${orgId}/archived?${params.toString()}`)
											.then((response) => {
												if (response.data.status === 200) {
													setSearchResults(response.data.data);
													setSearchResultsTotalItems(response.data.totalItems || response.data.data.length);
													setSearchResultsLoadedPages([1]);
													setIsSearchActive(true);
												}
											})
											.catch((error) => console.error('Filter search error:', error));
									} else {
										// No filter, reset to archived questions
										setIsSearchActive(false);
										setSearchResults([]);
										setSearchResultsTotalItems(0);
									}
								}}
								variant='outlined'
								color='secondary'
								size='small'
								sx={{ backgroundColor: '#1EC28B', color: 'white', fontSize: '0.9rem', letterSpacing: '0.025rem' }}
							/>
						)}
					</Box>
				)}

				<Table sx={{ mb: '2rem' }} size='small' aria-label='a dense table'>
					<CustomTableHead<ArchivedQuestion>
						orderBy={orderBy}
						order={order}
						handleSort={handleSort}
						selectAll={selectAll}
						onSelectAll={handleSelectAll}
						columns={
							isVerySmallScreen
								? [
										{ key: 'checkbox', label: '' },
										{ key: 'question', label: 'Question' },
										{ key: 'archivedAt', label: 'Deleted On' },
										{ key: 'actions', label: 'Actions' },
									]
								: [
										{ key: 'checkbox', label: '' },
										{ key: 'question', label: 'Question' },
										{ key: 'questionTypeName', label: 'Type' },
										{ key: 'archivedAt', label: 'Deleted On' },
										{ key: 'archivedByName', label: 'Deleted By' },
										{
											key: 'expiresIn',
											label: 'Auto-Remove On',
											infoIcon: (
												<IconButton
													size='small'
													onClick={(e) => {
														e.stopPropagation();
														setIsInfoDialogOpen(true);
													}}
													sx={{ 'p': 0.5, 'ml': 0.5, '&:hover': { backgroundColor: 'transparent' } }}>
													<Info
														sx={{
															fontSize: '1rem',
															color: 'text.secondary',
														}}
													/>
												</IconButton>
											),
										},
										{ key: 'actions', label: 'Actions' },
									]
						}
					/>
					<TableBody>
						{paginatedQuestions &&
							paginatedQuestions?.map((question: ArchivedQuestion, index) => {
								const deletionDateStatus = getDeletionDateStatus(question.archivedAt || '');
								const isSelected = selectedItems.includes(question._id);

								return (
									<TableRow key={question._id} hover selected={isSelected}>
										<TableCell padding='checkbox'>
											<input type='checkbox' checked={isSelected} onChange={() => handleSelectItem(question._id)} />
										</TableCell>
										<CustomTableCell
											value={
												isVerySmallScreen
													? truncateText(stripHtml(decode(question.question)), 25)
													: truncateText(stripHtml(decode(question.question)), 45)
											}
										/>
										{!isVerySmallScreen && <CustomTableCell value={question.questionTypeName || 'N/A'} />}
										<CustomTableCell value={question.archivedAt ? dateFormatter(question.archivedAt) : 'N/A'} />
										{!isVerySmallScreen && <CustomTableCell value={question.archivedByName || 'N/A'} />}
										{!isVerySmallScreen && <CustomTableCell value={deletionDateStatus.label} />}
										<TableCell sx={{ textAlign: 'center' }}>
											<CustomActionBtn title='Restore Question' onClick={() => openRestoreModal(index)} icon={<Restore fontSize='small' />} />
											<CustomActionBtn title='Delete Permanently' onClick={() => openDeleteModal(index)} icon={<DeleteForever fontSize='small' />} />
										</TableCell>
									</TableRow>
								);
							})}
					</TableBody>
				</Table>
				{paginatedQuestions.length === 0 && (
					<CustomInfoMessageAlignedLeft
						message={isSearchActive ? 'No deleted questions found matching your search criteria.' : 'No deleted questions found.'}
						sx={{ marginTop: '5rem' }}
					/>
				)}

				<CustomTablePagination count={questionsNumberOfPages} page={currentPageNumber} onChange={handlePageChange} />
			</Box>

			{/* Restore Modal */}
			{paginatedQuestions.map((question, index) => (
				<CustomDialog
					key={`restore-${question._id}`}
					openModal={restoreModalOpen[index] || false}
					closeModal={() => closeRestoreModal(index)}
					title='Restore Question'
					maxWidth='xs'>
					<DialogContent>
						<Typography variant='body2' sx={{ lineHeight: 1.7 }}>
							Are you sure you want to restore "{truncateText(stripHtml(decode(question.question)), 25)}"?
						</Typography>
						<Typography variant='body2' sx={{ lineHeight: 1.7, mt: 2 }}>
							This question will become available again on all lessons where it was previously used.
						</Typography>
					</DialogContent>
					<CustomDialogActions
						onCancel={() => closeRestoreModal(index)}
						onSubmit={() => {
							restoreQuestion(question._id);
							closeRestoreModal(index);
						}}
						submitBtnText='Restore'
						actionSx={{ marginBottom: '0.5rem' }}
					/>
				</CustomDialog>
			))}

			{/* Delete Modal */}
			{paginatedQuestions.map((question, index) => (
				<CustomDialog
					key={`delete-${question._id}`}
					openModal={deleteModalOpen[index] || false}
					closeModal={() => closeDeleteModal(index)}
					title='Delete Question Permanently'
					maxWidth='xs'>
					<DialogContent>
						<Typography variant='body2' sx={{ lineHeight: 1.7 }}>
							Are you sure you want to permanently delete "{truncateText(stripHtml(decode(question.question)), 25)}"? This action cannot be undone.
						</Typography>
					</DialogContent>
					<CustomDialogActions
						onCancel={() => closeDeleteModal(index)}
						onDelete={() => {
							hardDeleteQuestion(question._id);
							closeDeleteModal(index);
						}}
						deleteBtn={true}
						deleteBtnText='Delete Permanently'
						actionSx={{ marginBottom: '0.5rem' }}
					/>
				</CustomDialog>
			))}

			{/* Bulk Restore Modal */}
			<CustomDialog
				openModal={isBulkRestoreModalOpen}
				closeModal={() => setIsBulkRestoreModalOpen(false)}
				title='Restore Multiple Questions'
				maxWidth='xs'>
				<DialogContent>
					<Typography variant='body2' sx={{ lineHeight: 1.7 }}>
						Are you sure you want to restore {selectedItems.length} selected question(s)?
					</Typography>
					<Typography variant='body2' sx={{ lineHeight: 1.7, mt: 2 }}>
						These questions will become available again on all lessons where they were previously used.
					</Typography>
				</DialogContent>
				<CustomDialogActions
					onCancel={() => setIsBulkRestoreModalOpen(false)}
					onSubmit={handleBulkRestore}
					submitBtnText='Restore All'
					actionSx={{ marginBottom: '0.5rem' }}
				/>
			</CustomDialog>

			{/* Bulk Delete Modal */}
			<CustomDialog
				openModal={isBulkDeleteModalOpen}
				closeModal={() => setIsBulkDeleteModalOpen(false)}
				title='Delete Multiple Questions Permanently'
				maxWidth='xs'>
				<DialogContent>
					<Typography variant='body2' sx={{ lineHeight: 1.7 }}>
						Are you sure you want to permanently delete {selectedItems.length} selected question(s)? This action cannot be undone.
					</Typography>
				</DialogContent>
				<CustomDialogActions
					onCancel={() => setIsBulkDeleteModalOpen(false)}
					onDelete={handleBulkDelete}
					deleteBtn={true}
					deleteBtnText='Delete All Permanently'
					actionSx={{ marginBottom: '0.5rem' }}
				/>
			</CustomDialog>

			{/* Info Dialog */}
			<CustomDialog openModal={isInfoDialogOpen} closeModal={() => setIsInfoDialogOpen(false)} title='Auto-Removal Information' maxWidth='sm'>
				<DialogContent>
					<Typography variant='body2' sx={{ lineHeight: 1.7 }}>
						Questions in the recycle bin are automatically permanently deleted after 7 days. This action cannot be undone.
					</Typography>
					<Typography variant='body2' sx={{ lineHeight: 1.7, mt: 2 }}>
						You can restore questions before this date or manually delete them immediately using the "Delete Permanently" button.
					</Typography>
				</DialogContent>
				<CustomDialogActions
					onCancel={() => setIsInfoDialogOpen(false)}
					onSubmit={() => setIsInfoDialogOpen(false)}
					submitBtnText='Got it'
					actionSx={{ marginBottom: '0.5rem' }}
				/>
			</CustomDialog>

			{/* Snackbar */}
			<Snackbar open={snackbarOpen} autoHideDuration={5000} onClose={() => setSnackbarOpen(false)} anchorOrigin={{ vertical, horizontal }}>
				<Alert
					onClose={() => setSnackbarOpen(false)}
					severity={snackbarSeverity}
					sx={{
						'mt': '8.5rem',
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
		</>
	);
};

export default AdminRecycleBinQuestionsTab;
