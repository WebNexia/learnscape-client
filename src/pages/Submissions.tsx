import { Box, FormControl, InputAdornment, MenuItem, Select, Table, TableBody, TableCell, TableRow, Typography, Chip } from '@mui/material';
import DashboardPagesLayout from '../components/layouts/dashboardLayout/DashboardPagesLayout';
import { useContext, useEffect, useState, useRef } from 'react';
import CustomTableHead from '../components/layouts/table/CustomTableHead';
import CustomTableCell from '../components/layouts/table/CustomTableCell';
import CustomActionBtn from '../components/layouts/table/CustomActionBtn';
import { PendingOutlined, Search } from '@mui/icons-material';
import CustomTablePagination from '../components/layouts/table/CustomTablePagination';
import { QuizSubmission } from '../interfaces/quizSubmission';
import { QuizSubmissionsContext } from '../contexts/QuizSubmissionsContextProvider';
import theme from '../themes';
import CustomTextField from '../components/forms/customFields/CustomTextField';
import { truncateText } from '../utils/utilText';
import { UserCoursesIdsWithCourseIds } from '../contexts/UserCourseLessonDataContextProvider';
import { MediaQueryContext } from '../contexts/MediaQueryContextProvider';
import { useAuth } from '../hooks/useAuth';
import CustomSubmitButton from '../components/forms/customButtons/CustomSubmitButton';
import CustomDeleteButton from '../components/forms/customButtons/CustomDeleteButton';
import axios from '@utils/axiosInstance';

const Submissions = () => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const { sortedUserQuizSubmissionsData, sortUserQuizSubmissionsData, fetchQuizSubmissionsByUserId, fetchMoreQuizSubmissions, loadedPages } =
		useContext(QuizSubmissionsContext);
	const { isSmallScreen, isRotatedMedium, isRotated, isVerySmallScreen } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;
	const isMobileSizeSmall = isVerySmallScreen || isRotated;

	const { user } = useAuth();

	const userCourseData: string[] = JSON.parse(localStorage.getItem('userCourseData') || '[]').map(
		(data: UserCoursesIdsWithCourseIds) => data.courseTitle
	);

	const [submissionsPageNumber, setSubmissionsPageNumber] = useState<number>(1);
	const [searchValue, setSearchValue] = useState<string>('');
	const [filterValue, setFilterValue] = useState<string>('');

	// Progressive pagination and search state
	const [searchResults, setSearchResults] = useState<QuizSubmission[]>([]);
	const [isSearchActive, setIsSearchActive] = useState<boolean>(false);
	const [searchResultsPage, setSearchResultsPage] = useState<number>(1);
	const [searchResultsLoadedPages, setSearchResultsLoadedPages] = useState<number[]>([]);
	const [searchResultsTotalItems, setSearchResultsTotalItems] = useState<number>(0);
	const [searchButtonClicked, setSearchButtonClicked] = useState<boolean>(false);
	const [searchedValue, setSearchedValue] = useState<string>('');

	const pageSize = 50;

	// Use search results if active, otherwise use context data
	const displaySubmissions = isSearchActive ? searchResults : sortedUserQuizSubmissionsData;

	// For pagination, use total items from server when not searching
	const submissionsNumberOfPages = isSearchActive
		? Math.ceil(searchResultsTotalItems / pageSize)
		: Math.ceil(sortedUserQuizSubmissionsData.length / pageSize);

	// Use appropriate page number for pagination
	const currentPage = isSearchActive ? searchResultsPage : submissionsPageNumber;

	// For search results, slice the accumulated data based on current page
	// For context data, use client-side pagination
	const paginatedSubmissions = isSearchActive
		? searchResults.slice((currentPage - 1) * pageSize, currentPage * pageSize)
		: displaySubmissions.slice((currentPage - 1) * pageSize, currentPage * pageSize);

	const [dataLoaded, setDataLoaded] = useState(false);

	// Keep track of previous length to avoid unnecessary resets
	const prevLengthRef = useRef<number>(0);

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
			sortUserQuizSubmissionsData(property, isAsc ? 'desc' : 'asc');
		}
	};

	useEffect(() => {
		setSubmissionsPageNumber(1);
	}, []);

	const handlePageChange = async (newPage: number) => {
		// Set appropriate page number based on search state
		if (isSearchActive) {
			setSearchResultsPage(newPage);
		} else {
			setSubmissionsPageNumber(newPage);
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
					if (!searchResultsLoadedPages.includes(page)) {
						await fetchMoreSearchResults(page, params);
					}
				}
			}
		} else {
			// Check if we need to fetch more data for context
			const requiredRecords = newPage * pageSize;
			if (sortedUserQuizSubmissionsData.length < requiredRecords && newPage <= submissionsNumberOfPages) {
				// Calculate which pages we need to fetch
				const currentLoadedPages = loadedPages.length > 0 ? Math.max(...loadedPages) : 0;
				const targetPage = Math.ceil((newPage * pageSize) / 200);

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
			setSubmissionsPageNumber(1);
			setSearchResultsPage(1);

			// Search button only works when search value exists
			if (searchValue && searchValue.trim()) {
				console.log('Search value being sent:', searchValue.trim());
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

				console.log('Search URL params:', params.toString());
				const response = await axios.get(`${base_url}/quizSubmissions/user/${user?._id}?${params.toString()}`);
				console.log('Search response:', response.data);
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

			const response = await axios.get(`${base_url}/quizSubmissions/user/${user?._id}?${searchParams.toString()}`);

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

	useEffect(() => {
		if (paginatedSubmissions && paginatedSubmissions.length !== prevLengthRef.current) {
			prevLengthRef.current = paginatedSubmissions.length;
		}
	}, [displaySubmissions, submissionsPageNumber]);

	useEffect(() => {
		const fetchData = async () => {
			if (!dataLoaded && sortedUserQuizSubmissionsData.length === 0 && user?._id) {
				try {
					fetchQuizSubmissionsByUserId(user?._id);
					setDataLoaded(true);
				} catch (error) {
					console.error('Error fetching quiz submissions:', error);
				}
			}
		};

		fetchData();
	}, [submissionsPageNumber, user?._id, dataLoaded, sortedUserQuizSubmissionsData]);

	return (
		<DashboardPagesLayout pageName='Quiz Submissions' customSettings={{ justifyContent: 'flex-start' }} showCopyRight={true}>
			<Box
				sx={{
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					padding: isMobileSize ? '1rem' : '1rem 2rem 2rem 2rem',
					width: '100%',
					mt: isMobileSize ? '0.75rem' : '2rem',
				}}>
				<Box
					sx={{
						display: 'flex',
						justifyContent: 'space-between',
						width: '100%',
					}}>
					<Box sx={{ display: 'flex', justifyContent: isMobileSize ? 'center' : 'flex-start', alignContent: 'center', width: '100%' }}>
						<Box>
							<FormControl>
								<Select
									size='small'
									value={filterValue}
									onChange={(e) => {
										const newFilterValue = e.target.value;
										setFilterValue(newFilterValue);

										// Auto-search when filter changes
										if (newFilterValue) {
											console.log('Filter value being sent:', newFilterValue);
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
												.get(`${base_url}/quizSubmissions/user/${user?._id}?${params.toString()}`)
												.then((response) => {
													console.log('Filter response:', response.data);
													setSearchResults(response.data.data);
													setSearchResultsTotalItems(response.data.totalItems || response.data.data.length);
													setSearchResultsLoadedPages([1]);
													setIsSearchActive(true);
													setSearchResultsPage(1);
													setSubmissionsPageNumber(1);
												})
												.catch((error) => {
													console.error('Filter search error:', error);
												});
										} else {
											// No filter, reset to context data
											setSearchResults([]);
											setSearchResultsLoadedPages([]);
											setSearchResultsTotalItems(0);
											setIsSearchActive(false);
											setSearchResultsPage(1);
											setSubmissionsPageNumber(1);
										}
									}}
									displayEmpty
									sx={{
										backgroundColor: theme.bgColor?.common,
										width: '12rem',
										fontSize: isMobileSize ? '0.7rem' : '0.85rem',
										textTransform: 'capitalize',
										mr: isMobileSize ? '0.5rem' : '1rem',
									}}>
									<MenuItem
										disabled
										value='filter'
										selected
										sx={{
											fontSize: isMobileSizeSmall ? '0.65rem' : '0.85rem',
											fontStyle: 'italic',
											textTransform: 'capitalize',
											padding: isMobileSize ? '0.25rem 0.5rem' : undefined,
											minHeight: '2rem',
										}}>
										Filter Submissions
									</MenuItem>
									<MenuItem
										value=''
										selected
										sx={{
											fontSize: isMobileSizeSmall ? '0.7rem' : '0.85rem',
											textTransform: 'capitalize',
											padding: isMobileSize ? '0.25rem 0.5rem' : undefined,
											minHeight: '2rem',
										}}>
										All Submissions
									</MenuItem>
									<MenuItem
										value='checked'
										sx={{
											fontSize: isMobileSizeSmall ? '0.7rem' : '0.85rem',
											textTransform: 'capitalize',
											padding: isMobileSize ? '0.25rem 0.5rem' : undefined,
											minHeight: '2rem',
										}}>
										Checked
									</MenuItem>
									<MenuItem
										value='unchecked'
										sx={{
											fontSize: isMobileSizeSmall ? '0.7rem' : '0.85rem',
											textTransform: 'capitalize',
											padding: isMobileSize ? '0.25rem 0.5rem' : undefined,
											minHeight: '2rem',
										}}>
										Unchecked
									</MenuItem>
									{userCourseData.length > 0 && (
										<MenuItem
											disabled
											value='types'
											selected
											sx={{
												fontSize: '0.65rem',
												textTransform: 'inherit',
												fontWeight: 'lighter',
												padding: isMobileSize ? '0.25rem 0.5rem' : undefined,
												minHeight: '2rem',
											}}>
											------ Filter by Course ------
										</MenuItem>
									)}
									{userCourseData.map((course) => (
										<MenuItem
											value={course.toLowerCase()}
											key={course}
											sx={{
												fontSize: isMobileSizeSmall ? '0.7rem' : '0.85rem',
												textTransform: 'capitalize',
												padding: isMobileSize ? '0.25rem 0.5rem' : undefined,
												minHeight: '2rem',
											}}>
											{truncateText(course, 25)}
										</MenuItem>
									))}
								</Select>
							</FormControl>
						</Box>
						<Box sx={{ alignSelf: 'flex-start', width: '17.5rem' }}>
							<CustomTextField
								value={searchValue}
								placeholder={'Search in Quiz and Course Name'}
								onChange={(e) => {
									setSearchValue(e.target.value);
								}}
								sx={{ backgroundColor: '#fff' }}
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
						</Box>
						<CustomSubmitButton onClick={handleSearch} sx={{ marginLeft: '1rem' }} disabled={!searchValue}>
							Search
						</CustomSubmitButton>
						<CustomDeleteButton
							onClick={() => {
								setSearchValue('');
								setFilterValue('');
								setSearchResults([]);
								setIsSearchActive(false);
								setSubmissionsPageNumber(1);
								setSearchResultsPage(1);
								setSearchResultsLoadedPages([]);
								setSearchResultsTotalItems(0);
								setSearchButtonClicked(false);
								setSearchedValue('');
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
									{sortedUserQuizSubmissionsData.length} {sortedUserQuizSubmissionsData.length === 1 ? 'item' : 'items'}
								</Typography>
							)}
						</Box>
					</Box>
				</Box>

				{/* Chips for active search and filter */}
				{((isSearchActive && searchedValue && searchButtonClicked) || (isSearchActive && filterValue && filterValue.trim())) && (
					<Box
						sx={{
							display: 'flex',
							gap: 1,
							flexWrap: 'wrap',
							justifyContent: 'center',
							borderRadius: '4px',
							alignSelf: 'flex-start',
							marginBottom: '0rem',
							marginTop: '0.75rem',
						}}>
						{isSearchActive && filterValue && filterValue.trim() && (
							<Chip
								label={`Filter: "${filterValue}"`}
								onDelete={() => {
									setFilterValue('');
									// If search value exists, auto-search with remaining search value
									if (searchValue && searchValue.trim()) {
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

										axios
											.get(`${base_url}/quizSubmissions/user/${user?._id}?${params.toString()}`)
											.then((response) => {
												setSearchResults(response.data.data);
												setSearchResultsTotalItems(response.data.totalItems || response.data.data.length);
												setSearchResultsLoadedPages([1]);
												setIsSearchActive(true);
												setSearchResultsPage(1);
												setSubmissionsPageNumber(1);
											})
											.catch((error) => {
												console.error('Search error:', error);
											});
									} else {
										// Clear everything and go back to context data
										setSearchResults([]);
										setSearchResultsLoadedPages([]);
										setSearchResultsTotalItems(0);
										setIsSearchActive(false);
										setSearchResultsPage(1);
										setSubmissionsPageNumber(1);
										setSearchedValue('');
										setSearchButtonClicked(false);
									}
								}}
								color='secondary'
								variant='outlined'
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
										const params = new URLSearchParams({
											limit: '200',
											filter: filterValue.trim(),
										});
										if (orderBy) {
											params.append('sortBy', orderBy);
										}
										if (order) {
											params.append('sortOrder', order);
										}

										axios
											.get(`${base_url}/quizSubmissions/user/${user?._id}?${params.toString()}`)
											.then((response) => {
												setSearchResults(response.data.data);
												setSearchResultsTotalItems(response.data.totalItems || response.data.data.length);
												setSearchResultsLoadedPages([1]);
												setIsSearchActive(true);
												setSearchResultsPage(1);
												setSubmissionsPageNumber(1);
											})
											.catch((error) => {
												console.error('Filter error:', error);
											});
									} else {
										// No filter, reset to context data
										setSearchResults([]);
										setSearchResultsLoadedPages([]);
										setSearchResultsTotalItems(0);
										setIsSearchActive(false);
										setSearchResultsPage(1);
										setSubmissionsPageNumber(1);
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

				<Table sx={{ margin: '1rem 0' }} size='small' aria-label='a dense table'>
					<CustomTableHead<QuizSubmission>
						orderBy={orderBy}
						order={order}
						handleSort={handleSort}
						columns={[
							{ key: 'lessonName', label: 'Quiz Name' },
							{ key: 'courseName', label: 'Course Name' },
							{ key: 'isChecked', label: 'Status' },
							{ key: 'actions', label: 'Actions' },
						]}
					/>
					<TableBody>
						{paginatedSubmissions &&
							paginatedSubmissions.map((submission: QuizSubmission) => (
								<TableRow key={submission._id} hover>
									<CustomTableCell value={submission.lessonName} />
									<CustomTableCell value={submission.courseName} />
									<CustomTableCell value={submission.isChecked ? 'Checked' : 'Unchecked'} />

									<TableCell
										sx={{
											textAlign: 'center',
											padding: isMobileSizeSmall ? '0' : undefined,
										}}>
										<CustomActionBtn
											title='See Details'
											onClick={() => {
												window.open(
													`/submission-feedback/submission/${submission._id}/lesson/${submission.lessonId}/userlesson/${submission.userLessonId}?isChecked=${submission.isChecked}`,
													'_blank'
												);
											}}
											icon={<PendingOutlined fontSize='small' />}
										/>
									</TableCell>
								</TableRow>
							))}
					</TableBody>
				</Table>
				<CustomTablePagination count={submissionsNumberOfPages} page={currentPage} onChange={handlePageChange} />
			</Box>
		</DashboardPagesLayout>
	);
};

export default Submissions;
