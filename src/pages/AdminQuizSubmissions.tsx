import { Box, FormControl, InputAdornment, MenuItem, Select, Table, TableBody, TableCell, TableRow, Typography, Chip } from '@mui/material';
import AdminTableSkeleton from '../components/layouts/skeleton/AdminTableSkeleton';
import DashboardPagesLayout from '../components/layouts/dashboardLayout/DashboardPagesLayout';
import AdminPageErrorBoundary from '../components/error/AdminPageErrorBoundary';
import { useContext, useEffect } from 'react';
import { AdminQuizSubmissionsContext } from '../contexts/AdminQuizSubmissionsContextProvider';
import { QuizSubmission } from '../interfaces/quizSubmission';
import CustomTableHead from '../components/layouts/table/CustomTableHead';
import CustomTableCell from '../components/layouts/table/CustomTableCell';
import CustomActionBtn from '../components/layouts/table/CustomActionBtn';
import { Edit, Search } from '@mui/icons-material';
import CustomTablePagination from '../components/layouts/table/CustomTablePagination';
import { OrganisationContext } from '../contexts/OrganisationContextProvider';
import CustomTextField from '../components/forms/customFields/CustomTextField';
import CustomSubmitButton from '../components/forms/customButtons/CustomSubmitButton';
import CustomDeleteButton from '../components/forms/customButtons/CustomDeleteButton';
import theme from '../themes';
import { CoursesContext } from '../contexts/CoursesContextProvider';
import { truncateText } from '../utils/utilText';
import { MediaQueryContext } from '../contexts/MediaQueryContextProvider';
import { useAuth } from '../hooks/useAuth';
import { useFilterSearch } from '../hooks/useFilterSearch';

const AdminQuizSubmissions = () => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const { orgId } = useContext(OrganisationContext);
	const { isInstructor } = useAuth();

	const { courses } = useContext(CoursesContext);

	const mappedCourses = courses?.map((course) => ({ courseId: course._id, courseTitle: course.title })) || [];

	// Determine the correct API endpoint based on user role
	const getApiEndpoint = () => {
		if (isInstructor) {
			return `${base_url}/quizsubmissions/instructor/organisation/${orgId}`;
		}
		return `${base_url}/quizsubmissions/organisation/${orgId}`;
	};

	// Function to get course name from course ID
	const getCourseNameById = (courseId: string) => {
		const course = mappedCourses?.find((c) => c.courseId === courseId);
		return course ? course.courseTitle : courseId;
	};

	const { isSmallScreen, isRotatedMedium, isRotated, isVerySmallScreen } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;
	const isMobileSizeSmall = isVerySmallScreen || isRotated;

	const {
		quizSubmissions,
		totalItems,
		loadedPages,
		quizSubmissionsPageNumber,
		setQuizSubmissionsPageNumber,
		fetchMoreQuizSubmissions,
		loading,
		enableAdminQuizSubmissionsFetch,
	} = useContext(AdminQuizSubmissionsContext);

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
		getEndpoint: getApiEndpoint,
		limit: 150,
		pageSize: 50,
		contextData: quizSubmissions || [],
		setContextPageNumber: setQuizSubmissionsPageNumber,
		fetchMoreContextData: fetchMoreQuizSubmissions,
		contextLoadedPages: loadedPages,
		defaultOrderBy: 'createdAt',
		defaultOrder: 'desc',
	});

	const pageSize = 50;

	// Sort the display data
	const sortedSubmissions =
		displaySubmissions?.sort((a, b) => {
			const aValue = (a as any)[orderBy] ?? '';
			const bValue = (b as any)[orderBy] ?? '';

			if (order === 'asc') {
				return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
			} else {
				return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
			}
		}) || [];

	// Use appropriate page number for pagination
	const currentPage = isSearchActive ? searchResultsPage : quizSubmissionsPageNumber;

	// For search results, slice the accumulated data based on current page
	// For context data, use client-side pagination
	const paginatedSubmissions = sortedSubmissions?.slice((currentPage - 1) * pageSize, currentPage * pageSize) || [];

	// Enable admin quiz submissions fetching only once when component mounts
	useEffect(() => {
		enableAdminQuizSubmissionsFetch();
	}, []); // Empty dependency array - only run once

	useEffect(() => {
		setQuizSubmissionsPageNumber(1);
	}, []); // Reset page number only once on mount

	// Show loading state while quiz submissions are being fetched
	if (loading) {
		return (
			<DashboardPagesLayout pageName='Quiz Submissions' customSettings={{ justifyContent: 'flex-start' }} showCopyRight={true}>
				<AdminTableSkeleton rows={8} columns={6} />
			</DashboardPagesLayout>
		);
	}

	return (
		<AdminPageErrorBoundary pageName='Quiz Submissions'>
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
									onChange={(e) => handleFilterChange(e.target.value)}
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
									{mappedCourses?.map((course) => (
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
						<CustomSubmitButton
							sx={{
								height: isVerySmallScreen ? '1.75rem' : '2rem',
								marginLeft: '0.5rem',
								fontSize: isMobileSize ? '0.7rem' : undefined,
							}}
							type='button'
							disabled={!searchValue || isSearchLoading}
							onClick={handleSearch}>
							Search
						</CustomSubmitButton>
						<CustomDeleteButton
							sx={{ height: isVerySmallScreen ? '1.75rem' : '2rem', marginLeft: '0.5rem', fontSize: isMobileSize ? '0.7rem' : undefined }}
							type='button'
							onClick={resetAll}>
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
									onDelete={resetFilter}
									variant='outlined'
									color='secondary'
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
					<Table sx={{ mb: '2rem' }} size='small' aria-label='a dense table'>
						<CustomTableHead<QuizSubmission>
							orderBy={orderBy as keyof QuizSubmission}
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
														if (isInstructor) {
															window.open(
																`/instructor/check-submission/submission/${submission._id}/lesson/${submission.lessonId}/userlesson/${submission.userLessonId}?isChecked=${submission.isChecked}`,
																'_blank'
															);
														} else {
															window.open(
																`/admin/check-submission/submission/${submission._id}/lesson/${submission.lessonId}/userlesson/${submission.userLessonId}?isChecked=${submission.isChecked}`,
																'_blank'
															);
														}
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
		</AdminPageErrorBoundary>
	);
};

export default AdminQuizSubmissions;
