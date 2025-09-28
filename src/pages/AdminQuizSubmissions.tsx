import { Box, Table, TableBody, TableCell, TableRow } from '@mui/material';
import AdminTableSkeleton from '../components/layouts/skeleton/AdminTableSkeleton';
import DashboardPagesLayout from '../components/layouts/dashboardLayout/DashboardPagesLayout';
import AdminPageErrorBoundary from '../components/error/AdminPageErrorBoundary';
import { useContext, useEffect } from 'react';
import { AdminQuizSubmissionsContext } from '../contexts/AdminQuizSubmissionsContextProvider';
import { QuizSubmission } from '../interfaces/quizSubmission';
import CustomTableHead from '../components/layouts/table/CustomTableHead';
import CustomTableCell from '../components/layouts/table/CustomTableCell';
import CustomActionBtn from '../components/layouts/table/CustomActionBtn';
import { Edit } from '@mui/icons-material';
import CustomTablePagination from '../components/layouts/table/CustomTablePagination';
import { OrganisationContext } from '../contexts/OrganisationContextProvider';
import theme from '../themes';
import { CoursesContext } from '../contexts/CoursesContextProvider';
import { truncateText } from '../utils/utilText';
import { MediaQueryContext } from '../contexts/MediaQueryContextProvider';
import { useAuth } from '../hooks/useAuth';
import { useFilterSearch } from '../hooks/useFilterSearch';
import FilterSearchRow from '../components/layouts/FilterSearchRow';
import CustomInfoMessageAlignedLeft from '../components/layouts/infoMessage/CustomInfoMessageAlignedLeft';

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
				<FilterSearchRow
					filterValue={filterValue}
					onFilterChange={handleFilterChange}
					filterOptions={[
						{ value: '', label: 'All Submissions' },
						{ value: 'checked', label: 'Checked' },
						{ value: 'unchecked', label: 'Unchecked' },
						...(mappedCourses?.map((course) => ({
							value: course.courseId,
							label: truncateText(course.courseTitle, 20),
						})) || []),
					]}
					filterPlaceholder='Filter Submissions'
					searchValue={searchValue}
					onSearchChange={setSearchValue}
					onSearch={handleSearch}
					onReset={resetAll}
					searchPlaceholder='Search in Student Username and Quiz Name'
					isSearchLoading={isSearchLoading}
					isSearchActive={isSearchActive}
					searchResultsTotalItems={searchResultsTotalItems}
					totalItems={totalItems}
					searchedValue={searchedValue}
					onResetSearch={resetSearch}
					onResetFilter={resetFilter}
					isSticky={true}
				/>

				<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', padding: isMobileSizeSmall ? '0 1rem' : '0 1rem' }}>
					<Table
						sx={{
							'mb': '2rem',
							'tableLayout': 'fixed',
							'width': '100%',
							'& .MuiTableHead-root': {
								position: 'fixed',
								top: (isSearchActive && searchedValue) || (isSearchActive && filterValue?.trim()) ? '11rem' : '8rem',
								left: isMobileSize ? 0 : '10rem',
								right: 0,
								zIndex: 99,
								backgroundColor: theme.palette.background.paper,
								boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
								display: 'table',
								tableLayout: 'fixed',
								width: isMobileSize ? '100%' : 'calc(100% - 10rem)',
							},
							'& .MuiTableHead-root .MuiTableCell-root': {
								backgroundColor: theme.palette.background.paper,
								padding: '0.25rem 1rem',
							},
						}}
						size='small'
						aria-label='a dense table'>
						{((isSearchActive && searchedValue) || (isSearchActive && filterValue?.trim())) && <Box sx={{ height: '1.5rem' }}></Box>}
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
					{isVerySmallScreen && <CustomInfoMessageAlignedLeft message='Rotate your device for more info' />}
					<CustomTablePagination count={submissionsNumberOfPages} page={currentPage} onChange={handlePageChange} />
				</Box>
			</DashboardPagesLayout>
		</AdminPageErrorBoundary>
	);
};

export default AdminQuizSubmissions;
