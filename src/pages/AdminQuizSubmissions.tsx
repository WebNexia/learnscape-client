import { Box, FormControl, InputAdornment, MenuItem, Select, Table, TableBody, TableCell, TableRow, Typography, Chip } from '@mui/material';
import DashboardPagesLayout from '../components/layouts/dashboardLayout/DashboardPagesLayout';
import { useContext, useEffect, useState } from 'react';
import { QuizSubmissionsContext } from '../contexts/QuizSubmissionsContextProvider';
import { QuizSubmission } from '../interfaces/quizSubmission';
import CustomTableHead from '../components/layouts/table/CustomTableHead';
import CustomTableCell from '../components/layouts/table/CustomTableCell';
import CustomActionBtn from '../components/layouts/table/CustomActionBtn';
import { Edit, Search } from '@mui/icons-material';
import CustomTablePagination from '../components/layouts/table/CustomTablePagination';
import { OrganisationContext } from '../contexts/OrganisationContextProvider';
import axios from '@utils/axiosInstance';
import CustomTextField from '../components/forms/customFields/CustomTextField';
import CustomSubmitButton from '../components/forms/customButtons/CustomSubmitButton';
import CustomDeleteButton from '../components/forms/customButtons/CustomDeleteButton';
import theme from '../themes';
import { CoursesContext } from '../contexts/CoursesContextProvider';
import { truncateText } from '../utils/utilText';
import { MediaQueryContext } from '../contexts/MediaQueryContextProvider';

const AdminQuizSubmissions = () => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const { orgId } = useContext(OrganisationContext);

	const { courses } = useContext(CoursesContext);

	const mappedCourses = courses.map((course) => ({ courseId: course._id, courseTitle: course.title }));

	// Function to get course name from course ID
	const getCourseNameById = (courseId: string) => {
		const course = mappedCourses.find((c) => c.courseId === courseId);
		return course ? course.courseTitle : courseId;
	};

	const { isSmallScreen, isRotatedMedium, isRotated, isVerySmallScreen } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;
	const isMobileSizeSmall = isVerySmallScreen || isRotated;

	const {
		quizSubmissions,
		sortQuizSubmissionsData,
		totalItems,
		loadedPages,
		quizSubmissionsPageNumber,
		setQuizSubmissionsPageNumber,
		fetchMoreQuizSubmissions,
	} = useContext(QuizSubmissionsContext);

	const [searchValue, setSearchValue] = useState<string>('');
	const [filterValue, setFilterValue] = useState<string>('');
	const [searchResults, setSearchResults] = useState<QuizSubmission[]>([]);
	const [isSearchActive, setIsSearchActive] = useState<boolean>(false);
	const [searchResultsPage, setSearchResultsPage] = useState<number>(1);
	const [searchResultsLoadedPages, setSearchResultsLoadedPages] = useState<number[]>([]);
	const [searchResultsTotalItems, setSearchResultsTotalItems] = useState<number>(0);
	const [searchButtonClicked, setSearchButtonClicked] = useState<boolean>(false);
	const [searchedValue, setSearchedValue] = useState<string>('');

	const pageSize = 50;

	// Use search results if active, otherwise use context data
	const displaySubmissions = isSearchActive ? searchResults : quizSubmissions;

	// For pagination, use total items from server when not searching
	const submissionsNumberOfPages = isSearchActive ? Math.ceil(searchResultsTotalItems / pageSize) : Math.ceil(totalItems / pageSize);

	// Use appropriate page number for pagination
	const currentPage = isSearchActive ? searchResultsPage : quizSubmissionsPageNumber;

	// For search results, slice the accumulated data based on current page
	// For context data, use client-side pagination
	const paginatedSubmissions = isSearchActive
		? searchResults.slice((currentPage - 1) * pageSize, currentPage * pageSize)
		: displaySubmissions.slice((currentPage - 1) * pageSize, currentPage * pageSize);

	const [orderBy, setOrderBy] = useState<keyof QuizSubmission>('userName');
	const [order, setOrder] = useState<'asc' | 'desc'>('asc');

	const handleSort = (property: keyof QuizSubmission) => {
		const isAsc = orderBy === property && order === 'asc';
		setOrder(isAsc ? 'desc' : 'asc');
		setOrderBy(property);

		// If search is active, trigger server-side sort
		if (isSearchActive) {
			handleSearch();
		} else {
			// Client-side sort for context data
			sortQuizSubmissionsData(property, isAsc ? 'desc' : 'asc');
		}
	};

	useEffect(() => {
		setQuizSubmissionsPageNumber(1);
		// Trigger initial fetch for context data
		if (quizSubmissions.length === 0) {
			// This will trigger the context to fetch data
		}
	}, []);

	const handlePageChange = async (newPage: number) => {
		if (isSearchActive) {
			setSearchResultsPage(newPage);

			// Check if we need to fetch more search results
			const requiredRecords = newPage * pageSize;
			if (searchResults.length < requiredRecords) {
				// Calculate which pages we need to fetch
				const currentLoadedPages = searchResultsLoadedPages.length > 0 ? Math.max(...searchResultsLoadedPages) : 0;
				const targetPage = Math.ceil((newPage * pageSize) / 150);

				// Fetch all missing pages in sequence
				for (let page = currentLoadedPages + 1; page <= targetPage; page++) {
					if (!searchResultsLoadedPages.includes(page)) {
						await fetchMoreSearchResults(page);
					}
				}
			}
		} else {
			setQuizSubmissionsPageNumber(newPage);

			// Check if we need to fetch more data for context
			const requiredRecords = newPage * pageSize;
			if (quizSubmissions.length < requiredRecords && newPage <= submissionsNumberOfPages) {
				// Calculate which pages we need to fetch
				const currentLoadedPages = loadedPages.length > 0 ? Math.max(...loadedPages) : 0;
				const targetPage = Math.ceil((newPage * pageSize) / 150);

				// Fetch all missing pages in sequence
				if (currentLoadedPages < targetPage) {
					await fetchMoreQuizSubmissions(currentLoadedPages + 1, targetPage);
				}
			}
		}
	};

	const handleSearch = async () => {
		try {
			// Reset to first page when searching
			setQuizSubmissionsPageNumber(1);
			setSearchResultsPage(1);

			// Search button only works when search value exists
			if (searchValue && searchValue.trim()) {
				// Store the searched value
				setSearchedValue(searchValue.trim());
				// Build query parameters
				const params = new URLSearchParams({
					limit: '150',
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

				const response = await axios.get(`${base_url}/quizsubmissions/organisation/${orgId}?${params.toString()}`);
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

	const fetchMoreSearchResults = async (page: number) => {
		try {
			// Build query parameters
			const params = new URLSearchParams({
				limit: '150',
				page: page.toString(),
			});

			if (searchedValue) {
				params.append('search', searchedValue);
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

			const response = await axios.get(`${base_url}/quizsubmissions/organisation/${orgId}?${params.toString()}`);

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

	// Check if search button should be disabled
	const isSearchDisabled = !searchValue;

	return (
		<DashboardPagesLayout pageName='Quiz Submissions' customSettings={{ justifyContent: 'flex-start' }} showCopyRight={true}>
			<Box
				sx={{
					display: 'flex',
					justifyContent: isMobileSize ? 'center' : 'space-between',
					width: '100%',
					padding: isMobileSizeSmall ? '1rem 1rem 0.5rem 1rem' : '2rem 2rem 1rem 2rem',
					mb: '1.25rem',
				}}>
				<Box sx={{ display: 'flex', width: '65%' }}>
					<Box sx={{ mr: '1rem' }}>
						<FormControl>
							<Select
								size='small'
								value={filterValue}
								onChange={async (e) => {
									const newFilterValue = e.target.value;
									setFilterValue(newFilterValue);

									// Auto-search when filter is selected
									if (newFilterValue && newFilterValue.trim()) {
										setQuizSubmissionsPageNumber(1);
										setSearchResultsPage(1);
										setIsSearchActive(true);
										setSearchResultsLoadedPages([]);

										try {
											const params = new URLSearchParams({
												limit: '150',
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

											const response = await axios.get(`${base_url}/quizsubmissions/organisation/${orgId}?${params.toString()}`);
											setSearchResults(response.data.data);
											setSearchResultsTotalItems(response.data.totalItems || response.data.data.length);
											setSearchResultsLoadedPages([1]);
										} catch (error) {
											console.error('Filter search error:', error);
										}
									} else {
										// If filter is cleared but search value exists, auto-search with search value
										if (searchValue && searchValue.trim()) {
											setQuizSubmissionsPageNumber(1);
											setSearchResultsPage(1);
											setIsSearchActive(true);
											setSearchResultsLoadedPages([]);

											try {
												const params = new URLSearchParams({
													limit: '150',
													search: searchValue.trim(),
												});

												if (orderBy) {
													params.append('sortBy', orderBy);
												}
												if (order) {
													params.append('sortOrder', order);
												}

												const response = await axios.get(`${base_url}/quizsubmissions/organisation/${orgId}?${params.toString()}`);
												setSearchResults(response.data.data);
												setSearchResultsTotalItems(response.data.totalItems || response.data.data.length);
												setSearchResultsLoadedPages([1]);
											} catch (error) {
												console.error('Search error:', error);
											}
										} else {
											// If no filter and no search, clear search results
											setSearchResults([]);
											setSearchResultsLoadedPages([]);
											setSearchResultsTotalItems(0);
											setIsSearchActive(false);
											setSearchButtonClicked(false);
											setSearchedValue('');
										}
									}
								}}
								displayEmpty
								sx={{
									backgroundColor: theme.bgColor?.common,
									width: isMobileSizeSmall ? '8rem' : '12rem',
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
									Filter Submissions
								</MenuItem>
								<MenuItem
									value=''
									sx={{
										fontSize: isMobileSize ? '0.65rem' : '0.85rem',
										textTransform: 'capitalize',
										padding: isMobileSize ? '0.25rem 0.5rem' : undefined,
										minHeight: '2rem',
									}}>
									All Submissions
								</MenuItem>
								<MenuItem
									value='checked'
									sx={{
										fontSize: isMobileSize ? '0.65rem' : '0.85rem',
										textTransform: 'capitalize',
										padding: isMobileSize ? '0.25rem 0.5rem' : undefined,
										minHeight: '2rem',
									}}>
									Checked
								</MenuItem>
								<MenuItem
									value='unchecked'
									sx={{
										fontSize: isMobileSize ? '0.65rem' : '0.85rem',
										textTransform: 'capitalize',
										padding: isMobileSize ? '0.25rem 0.5rem' : undefined,
										minHeight: '2rem',
									}}>
									Unchecked
								</MenuItem>
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
									------ Filter by Course ------
								</MenuItem>
								{mappedCourses.map((course) => (
									<MenuItem
										key={course.courseId}
										value={course.courseId}
										sx={{
											fontSize: isMobileSize ? '0.65rem' : '0.85rem',
											textTransform: 'capitalize',
											padding: isMobileSize ? '0.25rem 0.5rem' : undefined,
											minHeight: '2rem',
										}}>
										{truncateText(course.courseTitle, 20)}
									</MenuItem>
								))}
							</Select>
						</FormControl>
					</Box>

					<CustomTextField
						value={searchValue}
						placeholder='Search in Student Username and Quiz Name'
						onChange={(e) => {
							setSearchValue(e.target.value);
						}}
						sx={{
							'backgroundColor': '#fff',
							'& .MuiInputBase-input::placeholder': {
								fontSize: '0.75rem', // Change this to your desired font size
							},
						}}
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
					<CustomSubmitButton
						sx={{
							height: isVerySmallScreen ? '1.75rem' : '2rem',
							marginLeft: '0.5rem',
							fontSize: isMobileSize ? '0.7rem' : undefined,
						}}
						type='button'
						disabled={isSearchDisabled}
						onClick={handleSearch}>
						Search
					</CustomSubmitButton>
					<CustomDeleteButton
						sx={{ height: isVerySmallScreen ? '1.75rem' : '2rem', marginLeft: '0.5rem', fontSize: isMobileSize ? '0.7rem' : undefined }}
						type='button'
						onClick={() => {
							setSearchValue('');
							setFilterValue('');
							setSearchResults([]);
							setSearchResultsLoadedPages([]);
							setSearchResultsTotalItems(0);
							setIsSearchActive(false);
							setSearchButtonClicked(false);
							setSearchedValue('');
							setQuizSubmissionsPageNumber(1);
							setSearchResultsPage(1);
						}}>
						Reset
					</CustomDeleteButton>
					<Box sx={{ display: 'flex', gap: 1, mb: '0.85rem', alignItems: 'center', ml: '1rem' }}>
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
			</Box>

			<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', padding: isMobileSizeSmall ? '0 1rem' : '0 2rem' }}>
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
								label={`Filter: "${getCourseNameById(filterValue)}"`}
								onDelete={() => {
									setFilterValue('');
									// If search value exists, auto-search with search value
									if (searchValue && searchValue.trim()) {
										handleSearch();
									} else {
										// Clear search results
										setSearchResults([]);
										setSearchResultsLoadedPages([]);
										setSearchResultsTotalItems(0);
										setIsSearchActive(false);
										setSearchButtonClicked(false);
										setSearchedValue('');
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
											limit: '150',
											filter: filterValue,
										});
										if (orderBy) {
											params.append('sortBy', orderBy);
										}
										if (order) {
											params.append('sortOrder', order);
										}
										axios
											.get(`${base_url}/quizsubmissions/organisation/${orgId}?${params.toString()}`)
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
					<CustomTableHead<QuizSubmission>
						orderBy={orderBy}
						order={order}
						handleSort={handleSort}
						columns={[
							{ key: 'userName', label: isVerySmallScreen ? 'Username' : 'Student Username' },
							{ key: 'lessonName', label: isVerySmallScreen ? 'Quiz' : 'Quiz Name' },
							{ key: 'courseName', label: isVerySmallScreen ? 'Course' : 'Course Name' },
							{ key: 'isChecked', label: 'Status' },
							{ key: 'actions', label: 'Actions' },
						]}
					/>
					<TableBody>
						{paginatedSubmissions &&
							paginatedSubmissions?.map((submission: QuizSubmission) => {
								return (
									<TableRow key={submission._id} hover>
										<CustomTableCell value={submission.userName} />
										<CustomTableCell value={submission.lessonName} />
										<CustomTableCell value={submission.courseName} />
										<CustomTableCell value={submission.isChecked ? 'Checked' : 'Unchecked'} />

										<TableCell
											sx={{
												textAlign: 'center',
											}}>
											<CustomActionBtn
												title='Check Quiz'
												onClick={() => {
													window.open(
														`/admin/check-submission/submission/${submission._id}/lesson/${submission.lessonId}/userlesson/${submission.userLessonId}?isChecked=${submission.isChecked}`,
														'_blank'
													);
													window.scrollTo({ top: 0, behavior: 'smooth' });
												}}
												icon={<Edit fontSize='small' sx={{ fontSize: isMobileSize ? '0.8rem' : undefined }} />}
											/>
										</TableCell>
									</TableRow>
								);
							})}
					</TableBody>
				</Table>

				<CustomTablePagination count={submissionsNumberOfPages} page={currentPage} onChange={handlePageChange} />
			</Box>
		</DashboardPagesLayout>
	);
};

export default AdminQuizSubmissions;
