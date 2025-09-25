import { Box, FormControl, InputAdornment, MenuItem, Select, Table, TableBody, TableCell, TableRow, Typography, Chip } from '@mui/material';
import AdminTableSkeleton from '../components/layouts/skeleton/AdminTableSkeleton';
import DashboardPagesLayout from '../components/layouts/dashboardLayout/DashboardPagesLayout';
import { useContext } from 'react';
import CustomTableHead from '../components/layouts/table/CustomTableHead';
import CustomTableCell from '../components/layouts/table/CustomTableCell';
import CustomActionBtn from '../components/layouts/table/CustomActionBtn';
import { PendingOutlined, Search } from '@mui/icons-material';
import CustomTablePagination from '../components/layouts/table/CustomTablePagination';
import { QuizSubmission } from '../interfaces/quizSubmission';
import { LearnerQuizSubmissionsContext } from '../contexts/LearnerQuizSubmissionsContextProvider';
import theme from '../themes';
import CustomTextField from '../components/forms/customFields/CustomTextField';
import { truncateText } from '../utils/utilText';
import { UserCoursesIdsWithCourseIds } from '../contexts/UserCourseLessonDataContextProvider';
import { MediaQueryContext } from '../contexts/MediaQueryContextProvider';
import { useAuth } from '../hooks/useAuth';
import CustomSubmitButton from '../components/forms/customButtons/CustomSubmitButton';
import CustomDeleteButton from '../components/forms/customButtons/CustomDeleteButton';
import { useFilterSearch } from '../hooks/useFilterSearch';

const Submissions = () => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const { userQuizSubmissions, fetchMoreUserQuizSubmissions, loadedPages, userSubmissionsPageNumber, setUserSubmissionsPageNumber, loading } =
		useContext(LearnerQuizSubmissionsContext);
	const { isSmallScreen, isRotatedMedium, isRotated, isVerySmallScreen } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;
	const isMobileSizeSmall = isVerySmallScreen || isRotated;

	const { user } = useAuth();

	const userCourseData: string[] =
		JSON.parse(localStorage.getItem('userCourseData') || '[]')?.map((data: UserCoursesIdsWithCourseIds) => data.courseTitle) || [];

	const pageSize = 50;

	// Use the filter search hook
	const {
		searchValue,
		setSearchValue,
		filterValue,
		displayData: displaySubmissions,
		numberOfPages: submissionsNumberOfPages,
		searchResultsPage,
		searchResultsTotalItems,
		searchButtonClicked,
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
	} = useFilterSearch<QuizSubmission>({
		getEndpoint: () => `${base_url}/quizSubmissions/user/${user?._id}`,
		limit: 150,
		pageSize,
		contextData: userQuizSubmissions || [],
		setContextPageNumber: setUserSubmissionsPageNumber,
		fetchMoreContextData: fetchMoreUserQuizSubmissions,
		contextLoadedPages: loadedPages,
		defaultOrderBy: 'updatedAt',
		defaultOrder: 'desc',
	});

	// Use appropriate page number for pagination
	const currentPage = isSearchActive ? searchResultsPage : userSubmissionsPageNumber;

	const sortedSubmissions =
		[...(displaySubmissions || [])]?.sort((a, b) => {
			const aValue = (a as any)[orderBy] ?? '';
			const bValue = (b as any)[orderBy] ?? '';

			if (order === 'asc') {
				return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
			} else {
				return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
			}
		}) || [];

	// For search results, slice the accumulated data based on current page
	// For context data, use client-side pagination
	const paginatedSubmissions = sortedSubmissions?.slice((currentPage - 1) * pageSize, currentPage * pageSize) || [];

	// React Query handles data loading automatically

	// Show loading state while quiz submissions are being fetched or when data is empty and not loading yet
	if (loading) {
		return (
			<DashboardPagesLayout pageName='Quiz Submissions' customSettings={{ justifyContent: 'flex-start' }} showCopyRight={true}>
				<AdminTableSkeleton rows={8} columns={4} />
			</DashboardPagesLayout>
		);
	}

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
									onChange={(e) => handleFilterChange(e.target.value)}
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
									{userCourseData && userCourseData.length > 0 && (
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
									{userCourseData?.map((course) => (
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
									onKeyDown: (e) => {
										if (e.key === 'Enter') {
											e.preventDefault();
											if (searchValue.trim() && !isSearchLoading) {
												handleSearch();
											}
										}
									},
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
						<CustomSubmitButton onClick={handleSearch} sx={{ marginLeft: '1rem' }} disabled={!searchValue || isSearchLoading}>
							Search
						</CustomSubmitButton>
						<CustomDeleteButton onClick={resetAll}>Reset</CustomDeleteButton>
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
									{userQuizSubmissions.length} {userQuizSubmissions.length === 1 ? 'item' : 'items'}
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
								onDelete={resetFilter}
								color='secondary'
								variant='outlined'
								size='small'
								sx={{ backgroundColor: '#1976d2', color: 'white', fontSize: '0.9rem', letterSpacing: '0.025rem' }}
							/>
						)}
						{isSearchActive && searchedValue && searchButtonClicked && (
							<Chip
								label={`Search: "${searchedValue}"`}
								onDelete={resetSearch}
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
						orderBy={orderBy as keyof QuizSubmission}
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
							paginatedSubmissions?.map((submission: QuizSubmission) => (
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
