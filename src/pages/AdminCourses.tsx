import {
	Box,
	Table,
	TableBody,
	TableRow,
	TableCell,
	FormControlLabel,
	Checkbox,
	Tooltip,
	Typography,
	FormControl,
	Select,
	MenuItem,
	InputAdornment,
	DialogContent,
	Snackbar,
	Alert,
	DialogActions,
	Chip,
} from '@mui/material';
import AdminTableSkeleton from '../components/layouts/skeleton/AdminTableSkeleton';
import DashboardPagesLayout from '../components/layouts/dashboardLayout/DashboardPagesLayout';
import AdminPageErrorBoundary from '../components/error/AdminPageErrorBoundary';
import React, { useContext, useEffect, useRef, useState } from 'react';
import { CoursesContext } from '../contexts/CoursesContextProvider';
import { Instructor, Price, SingleCourse } from '../interfaces/course';
import { Delete, Edit, FileCopy, Search, Visibility } from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

import CustomTextField from '../components/forms/customFields/CustomTextField';
import CustomSubmitButton from '../components/forms/customButtons/CustomSubmitButton';
import CustomDialog from '../components/layouts/dialog/CustomDialog';
import CustomDialogActions from '../components/layouts/dialog/CustomDialogActions';
import CustomTableHead from '../components/layouts/table/CustomTableHead';
import CustomTableCell from '../components/layouts/table/CustomTableCell';
import CustomTablePagination from '../components/layouts/table/CustomTablePagination';
import CustomActionBtn from '../components/layouts/table/CustomActionBtn';
import { OrganisationContext } from '../contexts/OrganisationContextProvider';
import { dateFormatter } from '../utils/dateFormatter';
import theme from '../themes';
import { MediaQueryContext } from '../contexts/MediaQueryContextProvider';
import CustomInfoMessageAlignedLeft from '../components/layouts/infoMessage/CustomInfoMessageAlignedLeft';
import axios from '@utils/axiosInstance';
import CustomDeleteButton from '../components/forms/customButtons/CustomDeleteButton';
import { UserAuthContext } from '../contexts/UserAuthContextProvider';
import CustomCancelButton from '../components/forms/customButtons/CustomCancelButton';
import { Roles } from '../interfaces/enums';

const AdminCourses = () => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const navigate = useNavigate();
	const location = useLocation();

	const {
		courses,
		loading,
		error,
		fetchMoreCourses,
		addNewCourse,
		removeCourse,
		totalItems,
		loadedPages,
		coursesPageNumber,
		setCoursesPageNumber,
		enableCoursesFetch,
	} = useContext(CoursesContext);
	const { orgId } = useContext(OrganisationContext);
	const { user } = useContext(UserAuthContext);

	// Role-based endpoint detection
	const isInstructor = user?.role === 'instructor';
	const baseEndpoint = isInstructor ? `/courses/instructor/${user?._id}` : `/courses/organisation/${orgId}`;

	const vertical = 'top';
	const horizontal = 'center';

	const { isSmallScreen, isRotatedMedium, isRotated, isVerySmallScreen } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;
	const isMobileSizeSmall = isVerySmallScreen || isRotated;

	const [searchValue, setSearchValue] = useState<string>('');
	const [filterValue, setFilterValue] = useState<string>('');
	const [searchResults, setSearchResults] = useState<SingleCourse[]>([]);
	const [isSearchActive, setIsSearchActive] = useState<boolean>(false);
	const [searchResultsPage, setSearchResultsPage] = useState<number>(1);
	const [searchResultsLoadedPages, setSearchResultsLoadedPages] = useState<number[]>([]);
	const [searchResultsTotalItems, setSearchResultsTotalItems] = useState<number>(0);
	const [searchButtonClicked, setSearchButtonClicked] = useState<boolean>(false);
	const [searchedValue, setSearchedValue] = useState<string>('');

	const [title, setTitle] = useState<string>('');
	const [description, setDescription] = useState<string>('');
	const [GBP, setGBP] = useState<Price | null>(null);
	const [USD, setUSD] = useState<Price | null>(null);
	const [EUR, setEUR] = useState<Price | null>(null);
	const [TRY, setTRY] = useState<Price | null>(null);

	const [checked, setChecked] = useState<boolean>(false);
	const [isExternal, setIsExternal] = useState<boolean>(false);

	const [orderBy, setOrderBy] = useState<keyof SingleCourse>('updatedAt');
	const [order, setOrder] = useState<'asc' | 'desc'>('desc');

	const pageSize = 50;

	// Use search results if active, otherwise use context data
	const displayCourses = isSearchActive ? searchResults : courses;

	// For pagination, use total items from server when not searching
	const coursesNumberOfPages = isSearchActive ? Math.ceil(searchResultsTotalItems / pageSize) : Math.ceil(totalItems / pageSize);

	// Use appropriate page number for pagination
	const currentPage = isSearchActive ? searchResultsPage : coursesPageNumber;
	const sortedCourses = [...(displayCourses || [])]?.sort((a, b) => {
		const aValue = a[orderBy] ?? '';
		const bValue = b[orderBy] ?? '';

		if (order === 'asc') {
			return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
		} else {
			return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
		}
	});
	const paginatedCourses = sortedCourses?.slice((currentPage - 1) * pageSize, currentPage * pageSize) || [];

	// Modal states - moved to top to avoid hooks after early returns
	const [isCourseCreateModalOpen, setIsCourseCreateModalOpen] = useState<boolean>(false);
	const [isCloning, setIsCloning] = useState<boolean>(false);
	const [isCourseDeleteModalOpen, setIsCourseDeleteModalOpen] = useState<boolean[]>([]);
	const [isCourseCloneModalOpen, setIsCourseCloneModalOpen] = useState<boolean[]>([]);
	const [isCourseCloned, setIsCourseCloned] = useState<boolean>(false);

	// Snackbar states for delete operation
	const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
	const [snackbarMessage, setSnackbarMessage] = useState<string>('');
	const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

	// Keep track of previous length to avoid unnecessary resets
	const prevLengthRef = useRef<number>(0);

	// useEffect hooks - moved to top to avoid hooks after early returns
	useEffect(() => {
		if (paginatedCourses && paginatedCourses.length !== prevLengthRef.current) {
			prevLengthRef.current = paginatedCourses.length;
			setIsCourseDeleteModalOpen(Array(paginatedCourses.length).fill(false));
			setIsCourseCloneModalOpen(Array(paginatedCourses.length).fill(false));
		}
	}, [displayCourses, coursesPageNumber]);

	useEffect(() => {
		setCoursesPageNumber(1);
		enableCoursesFetch();
	}, []);

	// Cleanup search state function
	const cleanupSearchState = () => {
		setSearchResults([]);
		setSearchResultsLoadedPages([]);
		setSearchResultsTotalItems(0);
		setIsSearchActive(false);
		setSearchValue('');
		setFilterValue('');
		setSearchedValue('');
		setSearchButtonClicked(false);
	};

	// Cleanup on component unmount
	useEffect(() => {
		return () => {
			cleanupSearchState();
		};
	}, []);

	// Cleanup when navigating away from page
	useEffect(() => {
		return () => {
			cleanupSearchState();
		};
	}, [location.pathname]);

	// Early returns AFTER all hooks
	if (error) return <Typography color='error'>{error}</Typography>;

	// Show loading state while courses are being fetched
	if (loading) {
		return (
			<DashboardPagesLayout pageName='Courses' customSettings={{ justifyContent: 'flex-start' }} showCopyRight={true}>
				<AdminTableSkeleton rows={8} columns={6} />
			</DashboardPagesLayout>
		);
	}

	const openNewCourseModal = () => {
		setIsCourseCreateModalOpen(true);
		setTitle('');
		setDescription('');
		setChecked(false);
		setIsExternal(false);

		setGBP({ amount: '', currency: 'gbp' });
		setUSD({ amount: '', currency: 'usd' });
		setEUR({ amount: '', currency: 'eur' });
		setTRY({ amount: '', currency: 'try' });
	};
	const closeNewCourseModal = () => setIsCourseCreateModalOpen(false);

	const handlePageChange = async (newPage: number) => {
		// Set appropriate page number based on search state
		if (isSearchActive) {
			setSearchResultsPage(newPage);
		} else {
			setCoursesPageNumber(newPage);
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
				const currentLoadedPages = searchResultsLoadedPages && searchResultsLoadedPages.length > 0 ? Math.max(...searchResultsLoadedPages) : 0;
				const targetPage = Math.ceil((newPage * pageSize) / 200);

				// Fetch all missing pages in sequence
				for (let page = currentLoadedPages + 1; page <= targetPage; page++) {
					if (!searchResultsLoadedPages?.includes(page)) {
						await fetchMoreSearchResults(page, params);
					}
				}
			}
		} else {
			// Check if we need to fetch more data for context
			const requiredRecords = newPage * pageSize;
			if (courses.length < requiredRecords && newPage <= coursesNumberOfPages) {
				// Calculate which pages we need to fetch
				const currentLoadedPages = loadedPages && loadedPages.length > 0 ? Math.max(...loadedPages) : 0;
				const targetPage = Math.ceil((newPage * pageSize) / 200);

				// Fetch all missing pages in sequence
				if (currentLoadedPages < targetPage) {
					await fetchMoreCourses(currentLoadedPages + 1, targetPage);
				}
			}
		}
	};

	const handleSort = (property: keyof SingleCourse) => {
		const isAsc = orderBy === property && order === 'asc';
		setOrder(isAsc ? 'desc' : 'asc');
		setOrderBy(property);
	};

	const handleSearch = async () => {
		try {
			// Reset to first page when searching
			setCoursesPageNumber(1);
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

				const response = await axios.get(`${base_url}${baseEndpoint}?${params.toString()}`);
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

	const fetchMoreSearchResults = async (page: number, searchParams: URLSearchParams) => {
		try {
			// Add page parameter
			searchParams.set('page', page.toString());

			const response = await axios.get(`${base_url}${baseEndpoint}?${searchParams.toString()}`);

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

	const openCloneCourseModal = (index: number) => {
		const updatedState = [...isCourseCloneModalOpen];
		updatedState[index] = true;
		setIsCourseCloneModalOpen(updatedState);
	};

	const closeCloneCourseModal = (index: number) => {
		const updatedState = [...isCourseCloneModalOpen];
		updatedState[index] = false;
		setIsCourseCloneModalOpen(updatedState);
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

	const createCourse = async (): Promise<void> => {
		// For instructors, allow creating courses without prices
		// For admins, always include prices
		const prices: Price[] = isInstructor
			? []
			: [
					{ amount: checked ? 'Free' : GBP?.amount!, currency: 'gbp' },
					{ amount: checked ? 'Free' : USD?.amount!, currency: 'usd' },
					{ amount: checked ? 'Free' : EUR?.amount!, currency: 'eur' },
					{ amount: checked ? 'Free' : TRY?.amount!, currency: 'try' },
				];
		try {
			const response = await axios.post(`${base_url}${isInstructor ? '/courses/instructor' : '/courses'}`, {
				title: title.trim(),
				description: description.trim(),
				prices,
				startingDate: '',
				orgId,
				imageUrl: '',
				durationWeeks: null,
				durationHours: null,
				format: '',
				courseManagement: {
					isExternal: isExternal,
					externalProvider: '',
					externalUrl: '',
					externalNotes: '',
				},
				instructor: {
					name: `${(user?.firstName ?? '').charAt(0).toUpperCase()}${(user?.firstName ?? '').slice(1)} ${(user?.lastName ?? '').charAt(0).toUpperCase()}${(user?.lastName ?? '').slice(1)}`,
					userId: user?._id,
					imageUrl: user?.imageUrl,
					email: user?.email,
				},
			});

			// Notify context provider to update courses with the new course
			addNewCourse({
				_id: response.data._id,
				title: title.trim(),
				description: description.trim(),
				prices,
				orgId,
				imageUrl: '',
				durationWeeks: null,
				durationHours: null,
				format: '',
				createdAt: response.data.createdAt,
				updatedAt: response.data.updatedAt,
				courseManagement: {
					isExternal: isExternal,
					externalProvider: '',
					externalUrl: '',
					externalNotes: '',
				},
				instructor: {
					name: user?.firstName.toUpperCase() + ' ' + user?.lastName.toUpperCase(),
					userId: user?._id!,
					imageUrl: user?.imageUrl!,
					email: user?.email!,
				} as Instructor,
			} as SingleCourse);
		} catch (error) {
			console.error('Create course error:', error);
		}
	};

	const handleClone = async (courseId: string, index: number) => {
		setIsCloning(true);
		try {
			const response = await axios.post(`${base_url}${isInstructor ? '/courses/instructor' : '/courses'}/${courseId}/clone`, { courseId });
			closeCloneCourseModal(index);

			addNewCourse({
				_id: response.data.clonedCourse._id,
				title: response.data.clonedCourse.title,
				clonedFromId: response.data.clonedCourse.clonedFromId,
				clonedFromTitle: response.data.clonedCourse.clonedFromTitle,
				createdAt: response.data.clonedCourse.createdAt,
				updatedAt: response.data.clonedCourse.updatedAt,
			} as SingleCourse);

			setIsCourseCloned(true);
		} catch (error: any) {
			console.error('Clone course error:', error);

			// Show user-friendly error message
			let errorMessage = 'Failed to clone course. Please try again.';

			if (error.response?.status === 500) {
				const serverError = error.response.data?.error;
				if (serverError?.includes('title') && serverError?.includes('longer than')) {
					errorMessage = 'Course title is too long for cloning. Please contact support.';
				} else if (serverError?.includes('validation failed')) {
					errorMessage = 'Course data validation failed. Please check the course details.';
				}
			} else if (error.response?.status === 429) {
				errorMessage = 'Cloning is already in progress for this course. Please wait.';
			} else if (error.response?.status === 404) {
				errorMessage = 'Course not found. It may have been deleted.';
			} else if (error.response?.status === 403) {
				errorMessage = 'You do not have permission to clone courses.';
			}

			// Show error snackbar
			setSnackbarMessage(errorMessage);
			setSnackbarSeverity('error');
			setSnackbarOpen(true);
		} finally {
			setIsCloning(false);
		}
	};

	const deleteCourse = async (courseId: string): Promise<void> => {
		try {
			const response = await axios.delete(`${base_url}${isInstructor ? '/courses/instructor' : '/courses'}/${courseId}`);

			// Only remove from frontend state if the backend request was successful
			if (response.data.status === 200) {
				// If search is active, also remove from search results
				if (isSearchActive) {
					setSearchResults((prev) => prev?.filter((course) => course._id !== courseId) || []);
					setSearchResultsTotalItems((prev) => Math.max(0, prev - 1));
				}
				removeCourse(courseId);

				// Show success message
				setSnackbarMessage('Course deleted successfully');
				setSnackbarSeverity('success');
				setSnackbarOpen(true);
			} else {
				console.error('Delete course failed:', response.data.message);
				setSnackbarMessage(response.data.message || 'Failed to delete course');
				setSnackbarSeverity('error');
				setSnackbarOpen(true);
			}
		} catch (error: any) {
			console.error('Delete course error:', error);
			// Don't remove from frontend state if the request failed
			setSnackbarMessage(error.response?.data?.message || 'Failed to delete course');
			setSnackbarSeverity('error');
			setSnackbarOpen(true);
		}
	};

	return (
		<AdminPageErrorBoundary pageName='Courses'>
			<DashboardPagesLayout pageName={isInstructor ? 'My Courses' : 'Courses'} customSettings={{ justifyContent: 'flex-start' }} showCopyRight={true}>
				<CustomDialog openModal={isCourseCreateModalOpen} closeModal={closeNewCourseModal} title='Create New Course' maxWidth='sm'>
					<form
						onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
							e.preventDefault();
							createCourse();
							closeNewCourseModal();
						}}
						style={{ display: 'flex', flexDirection: 'column', marginTop: '-1rem' }}>
						<Tooltip title='Max 50 Characters' placement='top' arrow>
							<CustomTextField
								fullWidth={false}
								label='Title'
								value={title}
								onChange={(e) => setTitle(e.target.value)}
								sx={{ margin: '1rem 2rem' }}
								InputLabelProps={{
									sx: { fontSize: '0.8rem' },
								}}
								InputProps={{ inputProps: { maxLength: 50 } }}
							/>
						</Tooltip>

						<Tooltip title='Max 500 characters' placement='top' arrow>
							<CustomTextField
								fullWidth={false}
								label='Description'
								value={description}
								onChange={(e) => setDescription(e.target.value)}
								sx={{ margin: '1rem 2rem' }}
								InputLabelProps={{
									sx: { fontSize: '0.8rem' },
								}}
								InputProps={{ inputProps: { maxLength: 500 } }}
								multiline
								rows={5}
								resizable
							/>
						</Tooltip>

						{!isInstructor && (
							<Box sx={{ display: 'flex', alignItems: 'center' }}>
								<Box sx={{ margin: '1rem 2rem 1rem 2rem', flex: 2 }}>
									<Box sx={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
										<Typography variant='h6' sx={{ fontSize: '0.9rem', mb: '0.25rem' }}>
											Prices
										</Typography>
										<Tooltip title='Check to make this course free in all currencies.' placement='top' arrow>
											<FormControlLabel
												control={
													<Checkbox
														checked={checked}
														onChange={(e) => {
															setChecked(e.target.checked);
															setTRY((prevData) => ({ ...prevData!, amount: '' }));
															setEUR((prevData) => ({ ...prevData!, amount: '' }));
															setUSD((prevData) => ({ ...prevData!, amount: '' }));
															setGBP((prevData) => ({ ...prevData!, amount: '' }));
														}}
														sx={{
															'& .MuiSvgIcon-root': {
																fontSize: '1rem',
															},
														}}
													/>
												}
												label='Free Course'
												sx={{
													'mr': '0rem',
													'& .MuiFormControlLabel-label': {
														fontSize: '0.75rem',
													},
												}}
											/>
										</Tooltip>
									</Box>

									<CustomTextField
										label='GBP'
										value={checked ? '' : GBP?.amount}
										onChange={(e) => setGBP((prevData) => ({ ...prevData!, amount: e.target.value }))}
										type='number'
										disabled={checked}
										sx={{ backgroundColor: checked ? 'transparent' : '#fff' }}
										InputLabelProps={{
											sx: { fontSize: '0.8rem' },
										}}
									/>
									<CustomTextField
										label='USD'
										value={checked ? '' : USD?.amount}
										onChange={(e) => setUSD((prevData) => ({ ...prevData!, amount: e.target.value }))}
										type='number'
										disabled={checked}
										sx={{ backgroundColor: checked ? 'transparent' : '#fff' }}
										InputLabelProps={{
											sx: { fontSize: '0.8rem' },
										}}
									/>
									<CustomTextField
										label='EUR'
										value={checked ? '' : EUR?.amount}
										onChange={(e) => setEUR((prevData) => ({ ...prevData!, amount: e.target.value }))}
										type='number'
										disabled={checked}
										sx={{ backgroundColor: checked ? 'transparent' : '#fff' }}
										InputLabelProps={{
											sx: { fontSize: '0.8rem' },
										}}
									/>
									<CustomTextField
										label='TRY'
										value={checked ? '' : TRY?.amount}
										onChange={(e) => setTRY((prevData) => ({ ...prevData!, amount: e.target.value }))}
										type='number'
										disabled={checked}
										sx={{ backgroundColor: checked ? 'transparent' : '#fff' }}
										InputLabelProps={{
											sx: { fontSize: '0.8rem' },
										}}
									/>
								</Box>
							</Box>
						)}

						<Box sx={{ margin: '0 2rem', display: 'flex', alignItems: 'center' }}>
							<Tooltip title='This course will be managed outside the platform.' placement='top' arrow>
								<FormControlLabel
									control={
										<Checkbox
											checked={isExternal}
											onChange={(e) => {
												setIsExternal(e.target.checked);
											}}
											sx={{
												'& .MuiSvgIcon-root': {
													fontSize: '1.25rem',
												},
											}}
										/>
									}
									label='External Course'
									sx={{
										'& .MuiFormControlLabel-label': {
											fontSize: '0.85rem',
										},
									}}
								/>
							</Tooltip>
						</Box>

						<CustomDialogActions onCancel={closeNewCourseModal} actionSx={{ width: '95%', margin: '0.75rem auto' }} />
					</form>
				</CustomDialog>

				<Box
					sx={{
						display: 'flex',
						flexDirection: 'row',
						justifyContent: 'space-between',
						padding: isMobileSizeSmall ? '1rem 1rem 0.5rem 1rem' : '2rem 2rem 1rem 2rem',
						width: '100%',
						mb: '1.25rem',
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

										// Auto-search when filter is selected
										if (newFilterValue && newFilterValue.trim()) {
											setCoursesPageNumber(1);
											setSearchResultsPage(1);
											setIsSearchActive(true);
											setSearchResultsLoadedPages([]);

											try {
												const params = new URLSearchParams({
													limit: '200',
													filter: newFilterValue.trim(),
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

												const response = await axios.get(`${base_url}${baseEndpoint}?${params.toString()}`);
												setSearchResults(response.data.data);
												setSearchResultsTotalItems(response.data.totalItems || response.data.data.length);
												setSearchResultsLoadedPages([1]);
											} catch (error) {
												console.error('Filter search error:', error);
											}
										} else {
											// If filter is cleared but search value exists, auto-search with search value
											if (searchValue && searchValue.trim()) {
												setCoursesPageNumber(1);
												setSearchResultsPage(1);
												setIsSearchActive(true);
												setSearchResultsLoadedPages([]);

												try {
													const params = new URLSearchParams({
														limit: '200',
														search: searchValue.trim(),
													});

													if (orderBy) {
														params.append('sortBy', orderBy);
													}
													if (order) {
														params.append('sortOrder', order);
													}

													const response = await axios.get(`${base_url}${baseEndpoint}?${params.toString()}`);
													setSearchResults(response.data.data);
													setSearchResultsTotalItems(response.data.totalItems || response.data.data.length);
													setSearchResultsLoadedPages([1]);
												} catch (error) {
													console.error('Auto-search error:', error);
												}
											} else {
												// If no search value, reset to context data
												setIsSearchActive(false);
												setSearchResults([]);
												setSearchResultsLoadedPages([]);
												setSearchResultsTotalItems(0);
											}
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
										All Courses
									</MenuItem>
									{[
										'Published Courses',
										'Unpublished Courses',
										'Paid Courses',
										'Free Courses',
										'Unpriced Courses',
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
						<CustomSubmitButton onClick={handleSearch} sx={{ marginLeft: '1rem' }} disabled={!searchValue}>
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
								setCoursesPageNumber(1);
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
						<CustomSubmitButton onClick={openNewCourseModal} sx={{ fontSize: isMobileSize ? '0.7rem' : undefined }}>
							{isVerySmallScreen ? 'New' : 'New Course'}
						</CustomSubmitButton>
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
								marginTop: '-1rem',
							}}>
							{isSearchActive && filterValue && filterValue.trim() && (
								<Chip
									label={`Filter: "${filterValue}"`}
									onDelete={() => {
										setFilterValue('');
										// If search exists, keep search results
										if (searchValue && searchValue.trim()) {
											// Trigger search without filter value
											const params = new URLSearchParams({
												limit: '200',
												search: searchValue.trim(),
											});
											if (orderBy) params.append('sortBy', orderBy);
											if (order) params.append('sortOrder', order);

											axios
												.get(`${base_url}${baseEndpoint}?${params.toString()}`)
												.then((response) => {
													setSearchResults(response.data.data);
													setSearchResultsTotalItems(response.data.totalItems || response.data.data.length);
													setSearchResultsLoadedPages([1]);
													setIsSearchActive(true);
													setCoursesPageNumber(1);
													setSearchResultsPage(1);
												})
												.catch((error) => console.error('Search error:', error));
										} else {
											// No search, reset to context data
											setIsSearchActive(false);
											setSearchResults([]);
											setSearchResultsLoadedPages([]);
											setSearchResultsTotalItems(0);
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
												.get(`${base_url}${baseEndpoint}?${params.toString()}`)
												.then((response) => {
													setSearchResults(response.data.data);
													setSearchResultsTotalItems(response.data.totalItems || response.data.data.length);
													setSearchResultsLoadedPages([1]);
													setIsSearchActive(true);
													setCoursesPageNumber(1);
													setSearchResultsPage(1);
												})
												.catch((error) => console.error('Filter search error:', error));
										} else {
											// No filter, reset to context data
											setIsSearchActive(false);
											setSearchResults([]);
											setSearchResultsLoadedPages([]);
											setSearchResultsTotalItems(0);
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
						<CustomTableHead<SingleCourse>
							orderBy={orderBy}
							order={order}
							handleSort={handleSort}
							columns={
								isVerySmallScreen
									? [
											{ key: 'clone', label: 'Cloned' },
											{ key: 'title', label: 'Title' },
											{ key: 'isActive', label: 'Status' },
											{ key: 'startingDate', label: 'Starting Date' },
											{ key: 'actions', label: 'Actions' },
										]
									: [
											{ key: 'clone', label: 'Cloned' },
											{ key: 'title', label: 'Title' },
											{ key: 'isActive', label: 'Status' },
											{ key: 'startingDate', label: 'Starting Date' },
											{ key: 'durationWeeks', label: 'Weeks #' },
											{ key: 'createdAt', label: 'Created On' },
											{ key: 'updatedAt', label: 'Updated On' },
											{ key: 'actions', label: 'Actions' },
										]
							}
						/>
						<TableBody>
							{paginatedCourses &&
								paginatedCourses?.map((course: SingleCourse, index) => {
									return (
										<TableRow key={course._id} hover>
											<TableCell sx={{ textAlign: 'center', width: '0px' }}>
												{course.clonedFromId && (
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
											<CustomTableCell value={course.title} />
											<CustomTableCell
												value={
													course.isActive
														? course.isExpired
															? 'Published - Closed'
															: 'Published - Open'
														: course.isExpired
															? 'Unpublished - Closed'
															: 'Unpublished - Open'
												}
											/>

											<CustomTableCell value={dateFormatter(course.startingDate) || 'N/A'} />
											{!isVerySmallScreen && <CustomTableCell value={course.durationWeeks || 'N/A'} />}
											{!isVerySmallScreen && <CustomTableCell value={dateFormatter(course.createdAt)} />}
											{!isVerySmallScreen && <CustomTableCell value={dateFormatter(course.updatedAt)} />}

											<TableCell
												sx={{
													textAlign: 'center',
												}}>
												<CustomActionBtn
													title='Clone'
													onClick={() => openCloneCourseModal(index)}
													icon={<FileCopy fontSize='small' sx={{ fontSize: isMobileSize ? '0.8rem' : undefined }} />}
												/>

												{!course.isExpired ? (
													<CustomActionBtn
														title='Edit'
														onClick={() => {
															if (isInstructor) {
																navigate(`/instructor/course-edit/course/${course._id}`);
															} else {
																navigate(`/admin/course-edit/course/${course._id}`);
															}
														}}
														icon={<Edit fontSize='small' sx={{ fontSize: isMobileSize ? '0.8rem' : undefined }} />}
													/>
												) : (
													<CustomActionBtn
														title='View'
														onClick={() => {
															if (isInstructor) {
																navigate(`/instructor/course-edit/course/${course._id}`);
															} else {
																navigate(`/admin/course-edit/course/${course._id}`);
															}
														}}
														icon={<Visibility fontSize='small' sx={{ fontSize: isMobileSize ? '0.8rem' : undefined }} />}
													/>
												)}
												<CustomActionBtn
													title='Delete'
													onClick={() => {
														openDeleteCourseModal(index);
													}}
													disabled={(() => {
														// If user is admin, they can delete any course
														if (user?.role === Roles.ADMIN) {
															return false;
														}

														// If user is instructor, they can only delete courses where:
														// 1. They are the instructor of the course
														// 2. The course was not created by an admin
														if (user?.role === Roles.INSTRUCTOR) {
															const isInstructorOfCourse = course?.instructor?.userId === user?._id;
															const wasCreatedByAdmin = course?.createdByRole === Roles.ADMIN;

															// Can delete if they're the instructor AND course was not created by admin
															return !(isInstructorOfCourse && !wasCreatedByAdmin);
														}

														// Default: disable for other roles
														return true;
													})()}
													icon={<Delete fontSize='small' sx={{ fontSize: isMobileSize ? '0.8rem' : undefined }} />}
												/>
												{isCourseDeleteModalOpen[index] !== undefined && !course.isActive && (
													<CustomDialog
														openModal={isCourseDeleteModalOpen[index]}
														closeModal={() => closeDeleteCourseModal(index)}
														title='Delete Course'
														content={`Are you sure you want to delete "${course.title}"?`}
														maxWidth='xs'>
														<CustomDialogActions
															onCancel={() => closeDeleteCourseModal(index)}
															deleteBtn={true}
															onDelete={() => {
																deleteCourse(course._id);
																closeDeleteCourseModal(index);
															}}
															actionSx={{ mb: '0.5rem' }}
														/>
													</CustomDialog>
												)}

												{isCourseDeleteModalOpen[index] !== undefined && course.isActive && (
													<CustomDialog
														openModal={isCourseDeleteModalOpen[index]}
														closeModal={() => closeDeleteCourseModal(index)}
														title='Unpublish Course'
														content='You cannot delete published course. Please unpublish it first.'
														maxWidth='xs'>
														<DialogActions>
															<CustomCancelButton
																onClick={() => closeDeleteCourseModal(index)}
																sx={{
																	margin: '0 0.5rem 0.5rem 0',
																}}>
																Cancel
															</CustomCancelButton>
														</DialogActions>
													</CustomDialog>
												)}

												{isCourseCloneModalOpen[index] !== undefined && (
													<CustomDialog
														openModal={isCourseCloneModalOpen[index]}
														closeModal={() => closeCloneCourseModal(index)}
														title='Clone Course'
														content='Are you sure you want to clone the course?'
														maxWidth='sm'>
														<DialogContent sx={{ mt: '-0.75rem' }}>
															<Typography variant='body2'>Cloning this course will:</Typography>
															<ul style={{ paddingLeft: '1.2rem', marginTop: '0.5rem' }}>
																<li>
																	<Typography variant='body2' sx={{ mb: '0.25rem' }}>
																		Create a new course with a copy of all its chapters, lessons, questions, and documents
																	</Typography>
																</li>
																<li>
																	<Typography variant='body2' sx={{ mb: '0.25rem' }}>
																		Preserve the original course and its content without any changes
																	</Typography>
																</li>
																<li>
																	<Typography variant='body2' sx={{ mb: '0.25rem' }}>
																		Allow you to safely edit the new course without affecting previous versions
																	</Typography>
																</li>
																<li>
																	<Typography variant='body2' sx={{ mb: '0.25rem' }}>
																		Keep the original pricing for all currencies
																	</Typography>
																</li>
																<li>
																	<Typography variant='body2'>Mark the cloned course as unpublished by default</Typography>
																</li>
															</ul>
															<Typography variant='body2' sx={{ marginTop: '1rem' }}>
																You can customize the cloned course (including pricing) before publishing it.
															</Typography>
														</DialogContent>

														<CustomDialogActions
															onCancel={() => closeCloneCourseModal(index)}
															submitBtnText={isCloning ? 'Cloning...' : 'Clone'}
															onSubmit={() => handleClone(course._id, index)}
														/>
													</CustomDialog>
												)}
												<Snackbar
													open={isCourseCloned}
													autoHideDuration={2250}
													anchorOrigin={{ vertical, horizontal }}
													sx={{ mt: '5rem' }}
													onClose={() => setIsCourseCloned(false)}>
													<Alert severity='success' variant='filled' sx={{ width: '100%', color: theme.textColor?.common.main }}>
														Course is cloned successfully!
													</Alert>
												</Snackbar>

												{/* Delete operation snackbar */}
												<Snackbar
													open={snackbarOpen}
													autoHideDuration={5000}
													anchorOrigin={{ vertical, horizontal }}
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
											</TableCell>
										</TableRow>
									);
								})}
						</TableBody>
					</Table>
					{isVerySmallScreen && <CustomInfoMessageAlignedLeft message='Rotate your device for more info' />}
					<CustomTablePagination count={coursesNumberOfPages} page={currentPage} onChange={handlePageChange} />
				</Box>
			</DashboardPagesLayout>
		</AdminPageErrorBoundary>
	);
};

export default AdminCourses;
