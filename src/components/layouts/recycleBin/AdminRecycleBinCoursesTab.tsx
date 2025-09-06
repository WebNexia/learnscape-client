import {
	Box,
	Table,
	TableBody,
	TableRow,
	TableCell,
	Typography,
	FormControl,
	Select,
	MenuItem,
	InputAdornment,
	DialogContent,
	Snackbar,
	Alert,
	Chip,
	IconButton,
} from '@mui/material';
import React, { useContext, useEffect, useState } from 'react';
import { Restore, DeleteForever, Search, Info } from '@mui/icons-material';

import CustomTextField from '../../forms/customFields/CustomTextField';
import CustomSubmitButton from '../../forms/customButtons/CustomSubmitButton';
import CustomDialog from '../dialog/CustomDialog';
import CustomDialogActions from '../dialog/CustomDialogActions';
import CustomTableHead from '../table/CustomTableHead';
import CustomTableCell from '../table/CustomTableCell';
import CustomTablePagination from '../table/CustomTablePagination';
import CustomActionBtn from '../table/CustomActionBtn';
import { OrganisationContext } from '../../../contexts/OrganisationContextProvider';
import { dateFormatter } from '../../../utils/dateFormatter';
import theme from '../../../themes';
import { MediaQueryContext } from '../../../contexts/MediaQueryContextProvider';
import CustomInfoMessageAlignedLeft from '../infoMessage/CustomInfoMessageAlignedLeft';
import axios from '@utils/axiosInstance';
import CustomDeleteButton from '../../forms/customButtons/CustomDeleteButton';
import { ArchivedCourse } from '../../../interfaces/course';
import { CoursesContext } from '../../../contexts/CoursesContextProvider';
import { useRecycleBinCourses } from '../../../contexts/RecycleBinCoursesContextProvider';

const AdminRecycleBinCoursesTab = () => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;

	const { orgId } = useContext(OrganisationContext);
	const { addNewCourse } = useContext(CoursesContext);
	const {
		archivedCourses,
		totalItems,
		currentPage,
		searchResults,
		searchResultsTotalItems,
		searchResultsPage,
		isSearchActive,
		searchValue,
		setSearchValue,
		filterValue,
		setFilterValue,
		searchedValue,
		setSearchedValue,
		error,
		fetchArchivedCourses,
		setCurrentPage,
		setSearchResultsPage,
		setIsSearchActive,
		setArchivedCourses,
		setSearchResults,
		setSearchResultsTotalItems,
		setTotalItems,
		loadedPages,
		setLoadedPages,
	} = useRecycleBinCourses();

	const vertical = 'top';
	const horizontal = 'center';

	const { isSmallScreen, isRotatedMedium, isRotated, isVerySmallScreen } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;
	const isMobileSizeSmall = isVerySmallScreen || isRotated;

	const [searchResultsLoadedPages, setSearchResultsLoadedPages] = useState<number[]>([]);
	const [searchButtonClicked, setSearchButtonClicked] = useState<boolean>(false);

	const pageSize = 50;

	// Use search results if active, otherwise use archived courses
	const displayCourses = isSearchActive ? searchResults : archivedCourses;
	const coursesNumberOfPages = isSearchActive ? Math.ceil(searchResultsTotalItems / pageSize) : Math.ceil(totalItems / pageSize);
	const currentPageNumber = isSearchActive ? searchResultsPage : currentPage;
	const paginatedCourses = displayCourses?.slice((currentPageNumber - 1) * pageSize, currentPageNumber * pageSize) || [];

	const [orderBy, setOrderBy] = useState<keyof ArchivedCourse>('archivedAt');
	const [order, setOrder] = useState<'asc' | 'desc'>('desc');

	// Modal states
	const [isCourseRestoreModalOpen, setIsCourseRestoreModalOpen] = useState<boolean[]>([]);
	const [isCourseDeleteModalOpen, setIsCourseDeleteModalOpen] = useState<boolean[]>([]);
	const [isBulkRestoreModalOpen, setIsBulkRestoreModalOpen] = useState<boolean>(false);
	const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState<boolean>(false);

	// Selection states
	const [selectedItems, setSelectedItems] = useState<string[]>([]);
	const [selectAll, setSelectAll] = useState<boolean>(false);

	// Snackbar states
	const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
	const [snackbarMessage, setSnackbarMessage] = useState<string>('');
	const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

	// Info dialog state
	const [isInfoDialogOpen, setIsInfoDialogOpen] = useState<boolean>(false);

	// Load initial data when component mounts
	useEffect(() => {
		fetchArchivedCourses(1);
		setLoadedPages([1]);
	}, []);

	// Keep track of previous length to avoid unnecessary resets
	useEffect(() => {
		if (paginatedCourses && paginatedCourses.length !== 0) {
			setIsCourseRestoreModalOpen(Array(paginatedCourses.length).fill(false));
			setIsCourseDeleteModalOpen(Array(paginatedCourses.length).fill(false));
		}
	}, [displayCourses, currentPageNumber]);

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
					if (!searchResultsLoadedPages?.includes(page)) {
						await fetchMoreSearchResults(page, params);
					}
				}
			}
		} else {
			// Check if we need to fetch more data for regular archived courses
			const requiredRecords = newPage * pageSize;
			if (archivedCourses.length < requiredRecords && newPage <= coursesNumberOfPages) {
				// Calculate which pages we need to fetch
				const currentLoadedPages = loadedPages.length > 0 ? Math.max(...loadedPages) : 0;
				const targetPage = Math.ceil((newPage * pageSize) / 200);

				// Fetch all missing pages in sequence
				if (currentLoadedPages < targetPage) {
					for (let page = currentLoadedPages + 1; page <= targetPage; page++) {
						if (!loadedPages?.includes(page)) {
							await fetchArchivedCourses(page);
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

			const response = await axios.get(`${base_url}/courses/organisation/${orgId}/archived?${searchParams.toString()}`);

			if (page === 1) {
				// First page - replace all data
				setSearchResults(response.data.data);
				setSearchResultsLoadedPages([1]);
			} else {
				// Additional pages - append data
				setSearchResults((prev) => [...prev, ...response.data.data]);
				setSearchResultsLoadedPages((prev) => [...prev, page]);
			}

			setSearchResultsTotalItems(response.data.totalItems || response.data.data.length);
		} catch (error) {
			console.error('Error fetching more search results:', error);
		}
	};

	const handleSort = (property: keyof ArchivedCourse) => {
		const isAsc = orderBy === property && order === 'asc';
		setOrder(isAsc ? 'desc' : 'asc');
		setOrderBy(property);

		// Client-side sort for displayed items (both search results and regular courses)
		const sortedCourses = [...(displayCourses || [])]?.sort((a, b) => {
			let aValue: any = a[property];
			let bValue: any = b[property];

			// Handle nested properties
			if (property === 'instructor') {
				aValue = a.instructor?.name || '';
				bValue = b.instructor?.name || '';
			}

			// Handle date properties
			if (property === 'archivedAt') {
				aValue = new Date(aValue || 0);
				bValue = new Date(bValue || 0);
			}

			// Handle string comparison
			if (typeof aValue === 'string' && typeof bValue === 'string') {
				aValue = aValue.toLowerCase();
				bValue = bValue.toLowerCase();
			}

			if (aValue < bValue) {
				return order === 'asc' ? -1 : 1;
			}
			if (aValue > bValue) {
				return order === 'asc' ? 1 : -1;
			}
			return 0;
		});

		// Update the appropriate state based on what's currently displayed
		if (isSearchActive) {
			setSearchResults(sortedCourses);
		} else {
			setArchivedCourses(sortedCourses);
		}
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

				const response = await axios.get(`${base_url}/courses/organisation/${orgId}/archived?${params.toString()}`);
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
			}
		} catch (error) {
			console.error('Search error:', error);
		}
	};

	const openRestoreCourseModal = (index: number) => {
		const updatedState = [...isCourseRestoreModalOpen];
		updatedState[index] = true;
		setIsCourseRestoreModalOpen(updatedState);
	};

	const closeRestoreCourseModal = (index: number) => {
		const updatedState = [...isCourseRestoreModalOpen];
		updatedState[index] = false;
		setIsCourseRestoreModalOpen(updatedState);
	};

	const openDeleteCourseModal = (index: number) => {
		const updatedState = [...isCourseDeleteModalOpen];
		updatedState[index] = true;
		setIsCourseDeleteModalOpen(updatedState);
	};

	const closeDeleteCourseModal = (index: number) => {
		const updatedState = [...isCourseDeleteModalOpen];
		updatedState[index] = false;
		setIsCourseDeleteModalOpen(updatedState);
	};

	const restoreCourse = async (courseId: string): Promise<void> => {
		try {
			const response = await axios.patch(`${base_url}/courses/${courseId}/restore`);
			addNewCourse(response.data.data);
			setSelectedItems([]);
			setSelectAll(false);

			// Remove the course from the list
			setArchivedCourses((prev) => prev?.filter((course) => course._id !== courseId) || []);
			setTotalItems((prev) => prev - 1);

			// If search is active, also remove from search results
			if (isSearchActive) {
				setSearchResults((prev) => prev?.filter((course) => course._id !== courseId) || []);
				setSearchResultsTotalItems((prev) => Math.max(0, prev - 1));
			}

			setSnackbarMessage('Course restored successfully');
			setSnackbarSeverity('success');
			setSnackbarOpen(true);
		} catch (error) {
			console.error('Restore course error:', error);
			setSnackbarMessage('Failed to restore course');
			setSnackbarSeverity('error');
			setSnackbarOpen(true);
		}
	};

	const hardDeleteCourse = async (courseId: string): Promise<void> => {
		try {
			await axios.delete(`${base_url}/courses/${courseId}/hard`);

			// Remove the course from the list
			setArchivedCourses((prev) => prev?.filter((course) => course._id !== courseId) || []);
			setTotalItems((prev) => prev - 1);

			// If search is active, also remove from search results
			if (isSearchActive) {
				setSearchResults((prev) => prev?.filter((course) => course._id !== courseId) || []);
				setSearchResultsTotalItems((prev) => Math.max(0, prev - 1));
			}

			setSnackbarMessage('Course permanently deleted');
			setSnackbarSeverity('success');
			setSnackbarOpen(true);
			setSelectedItems([]);
			setSelectAll(false);
		} catch (error) {
			console.error('Hard delete course error:', error);
			setSnackbarMessage('Failed to delete course');
			setSnackbarSeverity('error');
			setSnackbarOpen(true);
		}
	};

	// Handle bulk selection
	const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
		if (event.target.checked) {
			setSelectedItems(paginatedCourses?.map((course) => course._id) || []);
			setSelectAll(true);
		} else {
			setSelectedItems([]);
			setSelectAll(false);
		}
	};

	const handleSelectItem = (courseId: string) => {
		setSelectedItems((prev) => {
			if (prev?.includes(courseId)) {
				const updatedItems = prev?.filter((id) => id !== courseId) || [];
				setSelectAll(false);
				return updatedItems;
			} else {
				const updatedItems = [...prev, courseId];
				if (updatedItems.length === paginatedCourses.length) {
					setSelectAll(true);
				}
				return updatedItems;
			}
		});
	};

	// Handle bulk operations
	const handleBulkRestore = async () => {
		try {
			await Promise.all(
				selectedItems?.map((courseId) => {
					return (async () => {
						const response = await axios.patch(`${base_url}/courses/${courseId}/restore`);
						addNewCourse(response.data.data);
					})();
				}) || []
			);

			// Remove the courses from the list
			setArchivedCourses((prev) => prev?.filter((course) => !selectedItems?.includes(course._id)) || []);
			setTotalItems((prev) => prev - selectedItems.length);

			// If search is active, also remove from search results
			if (isSearchActive) {
				setSearchResults((prev) => prev?.filter((course) => !selectedItems?.includes(course._id)) || []);
				setSearchResultsTotalItems((prev) => Math.max(0, prev - selectedItems.length));
			}

			setSelectedItems([]);
			setSelectAll(false);
			setIsBulkRestoreModalOpen(false);

			setSnackbarMessage(`${selectedItems.length} course(s) restored successfully`);
			setSnackbarSeverity('success');
			setSnackbarOpen(true);
		} catch (error) {
			console.error('Bulk restore error:', error);
			setSnackbarMessage('Failed to restore courses');
			setSnackbarSeverity('error');
			setSnackbarOpen(true);
		}
	};

	const handleBulkDelete = async () => {
		try {
			await Promise.all(selectedItems?.map((courseId) => axios.delete(`${base_url}/courses/${courseId}/hard`)) || []);

			// Remove the courses from the list
			setArchivedCourses((prev) => prev?.filter((course) => !selectedItems?.includes(course._id)) || []);
			setTotalItems((prev) => prev - selectedItems.length);

			// If search is active, also remove from search results
			if (isSearchActive) {
				setSearchResults((prev) => prev?.filter((course) => !selectedItems?.includes(course._id)) || []);
				setSearchResultsTotalItems((prev) => Math.max(0, prev - selectedItems.length));
			}

			setSelectedItems([]);
			setSelectAll(false);
			setIsBulkDeleteModalOpen(false);

			setSnackbarMessage(`${selectedItems.length} course(s) permanently deleted`);
			setSnackbarSeverity('success');
			setSnackbarOpen(true);
		} catch (error) {
			console.error('Bulk delete error:', error);
			setSnackbarMessage('Failed to delete courses');
			setSnackbarSeverity('error');
			setSnackbarOpen(true);
		}
	};

	// Get deletion date status
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

	if (error) return <Typography color='error'>{error}</Typography>;

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

										const response = await axios.get(`${base_url}/courses/organisation/${orgId}/archived?${params.toString()}`);
										if (response.data.status === 200) {
											setSearchResults(response.data.data);
											setSearchResultsTotalItems(response.data.totalItems || response.data.data.length);
											setSearchResultsLoadedPages([1]);
											setCurrentPage(1);
											setSearchResultsPage(1);
										}
									} else {
										// If no filter, reset to normal view
										setIsSearchActive(false);
										setSearchResults([]);
										setSearchResultsLoadedPages([]);
										setSearchResultsTotalItems(0);
										await fetchArchivedCourses(1, searchValue);
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
									Filter Courses
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
									All deleted courses
								</MenuItem>
								{[
									'Recently deleted',
									'Expired Courses',
									'Paid Courses',
									'Free Courses',
									'Open Courses',
									'Closed Courses',
									'External Courses',
									'Platform Courses',
								]?.map((type) => (
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
						placeholder={'Search in Title and Description'}
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
							setSearchResultsLoadedPages([]);
							setSearchResultsTotalItems(0);
							setIsSearchActive(false);
							setCurrentPage(1);
							setSearchResultsPage(1);
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
										// Trigger search without filter value
										const params = new URLSearchParams({
											limit: '200',
											search: searchValue.trim(),
										});
										if (orderBy) params.append('sortBy', orderBy);
										if (order) params.append('sortOrder', order);

										axios
											.get(`${base_url}/courses/organisation/${orgId}/archived?${params.toString()}`)
											.then((response) => {
												setSearchResults(response.data.data);
												setSearchResultsTotalItems(response.data.totalItems || response.data.data.length);
												setSearchResultsLoadedPages([1]);
												setIsSearchActive(true);
												setCurrentPage(1);
												setSearchResultsPage(1);
											})
											.catch((error) => console.error('Search error:', error));
									} else {
										// No search value, reset to archived courses
										setIsSearchActive(false);
										setSearchResults([]);
										setSearchResultsLoadedPages([]);
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
										// Trigger filter search without search value
										const params = new URLSearchParams({
											limit: '200',
											filter: filterValue.trim(),
										});
										if (orderBy) params.append('sortBy', orderBy);
										if (order) params.append('sortOrder', order);

										axios
											.get(`${base_url}/courses/organisation/${orgId}/archived?${params.toString()}`)
											.then((response) => {
												setSearchResults(response.data.data);
												setSearchResultsTotalItems(response.data.totalItems || response.data.data.length);
												setSearchResultsLoadedPages([1]);
												setIsSearchActive(true);
												setCurrentPage(1);
												setSearchResultsPage(1);
											})
											.catch((error) => console.error('Filter search error:', error));
									} else {
										// No filter, reset to archived courses
										setIsSearchActive(false);
										setSearchResults([]);
										setSearchResultsLoadedPages([]);
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
					<CustomTableHead<ArchivedCourse>
						orderBy={orderBy}
						order={order}
						handleSort={handleSort}
						selectAll={selectAll}
						onSelectAll={handleSelectAll}
						columns={
							isVerySmallScreen
								? [
										{ key: 'checkbox', label: '' },
										{ key: 'title', label: 'Title' },
										{ key: 'archivedAt', label: 'Deleted On' },
										{ key: 'actions', label: 'Actions' },
									]
								: [
										{ key: 'checkbox', label: '' },
										{ key: 'title', label: 'Title' },
										{ key: 'instructor', label: 'Instructor' },
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
						{paginatedCourses &&
							paginatedCourses?.map((course: ArchivedCourse, index) => {
								const deletionDateStatus = getDeletionDateStatus(course.archivedAt || '');
								const isSelected = selectedItems?.includes(course._id);

								return (
									<TableRow key={course._id} hover selected={isSelected}>
										<TableCell padding='checkbox'>
											<input type='checkbox' checked={isSelected} onChange={() => handleSelectItem(course._id)} />
										</TableCell>
										<CustomTableCell value={course.title} />
										{!isVerySmallScreen && <CustomTableCell value={course.instructor?.name || 'N/A'} />}
										<CustomTableCell value={course.archivedAt ? dateFormatter(course.archivedAt) : 'N/A'} />
										{!isVerySmallScreen && <CustomTableCell value={course.archivedByName || 'N/A'} />}
										{!isVerySmallScreen && <CustomTableCell value={deletionDateStatus.label} />}
										<TableCell sx={{ textAlign: 'center' }}>
											<CustomActionBtn title='Restore Course' onClick={() => openRestoreCourseModal(index)} icon={<Restore fontSize='small' />} />
											<CustomActionBtn
												title='Delete Permanently'
												onClick={() => openDeleteCourseModal(index)}
												icon={<DeleteForever fontSize='small' />}
											/>
										</TableCell>
									</TableRow>
								);
							})}
					</TableBody>
				</Table>
				{paginatedCourses.length === 0 && (
					<CustomInfoMessageAlignedLeft
						message={isSearchActive ? 'No deleted courses found matching your search criteria.' : 'No deleted courses found.'}
						sx={{ marginTop: '5rem' }}
					/>
				)}

				<CustomTablePagination count={coursesNumberOfPages} page={currentPageNumber} onChange={handlePageChange} />
			</Box>

			{/* Restore Course Modal */}
			{paginatedCourses?.map((course, index) => (
				<CustomDialog
					key={`restore-${course._id}`}
					openModal={isCourseRestoreModalOpen[index]}
					closeModal={() => closeRestoreCourseModal(index)}
					title='Restore Course'
					maxWidth='xs'>
					<DialogContent>
						<Typography variant='body2' sx={{ lineHeight: 1.7 }}>
							Are you sure you want to restore "{course.title}"? This will make the course available again.
						</Typography>
					</DialogContent>
					<CustomDialogActions
						onCancel={() => closeRestoreCourseModal(index)}
						onSubmit={() => {
							restoreCourse(course._id);
							closeRestoreCourseModal(index);
						}}
						submitBtnText='Restore'
						actionSx={{ marginBottom: '0.5rem' }}
					/>
				</CustomDialog>
			))}

			{/* Delete Course Modal */}
			{paginatedCourses?.map((course, index) => (
				<CustomDialog
					key={`delete-${course._id}`}
					openModal={isCourseDeleteModalOpen[index]}
					closeModal={() => closeDeleteCourseModal(index)}
					title='Delete Course Permanently'
					maxWidth='xs'>
					<DialogContent>
						<Typography variant='body2' sx={{ lineHeight: 1.7 }}>
							Are you sure you want to permanently delete "{course.title}"? This action cannot be undone.
						</Typography>
					</DialogContent>
					<CustomDialogActions
						onCancel={() => closeDeleteCourseModal(index)}
						onDelete={() => {
							hardDeleteCourse(course._id);
							closeDeleteCourseModal(index);
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
				title='Restore Multiple Courses'
				maxWidth='xs'>
				<DialogContent>
					<Typography variant='body2' sx={{ lineHeight: 1.7 }}>
						Are you sure you want to restore {selectedItems.length} selected course(s)? This will make them available again.
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
				title='Delete Multiple Courses Permanently'
				maxWidth='xs'>
				<DialogContent>
					<Typography variant='body2' sx={{ lineHeight: 1.7 }}>
						Are you sure you want to permanently delete {selectedItems.length} selected course(s)? This action cannot be undone.
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
						Courses in the recycle bin are automatically permanently deleted after 7 days. This action cannot be undone.
					</Typography>
					<Typography variant='body2' sx={{ lineHeight: 1.7, mt: 2 }}>
						You can restore courses before this date or manually delete them immediately using the "Delete Permanently" button.
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

export default AdminRecycleBinCoursesTab;
