import { Box, Table, TableBody, TableCell, TableRow } from '@mui/material';
import AdminTableSkeleton from '../components/layouts/skeleton/AdminTableSkeleton';
import DashboardPagesLayout from '../components/layouts/dashboardLayout/DashboardPagesLayout';
import { useContext } from 'react';
import CustomTableHead from '../components/layouts/table/CustomTableHead';
import CustomTableCell from '../components/layouts/table/CustomTableCell';
import CustomActionBtn from '../components/layouts/table/CustomActionBtn';
import { PendingOutlined } from '@mui/icons-material';
import CustomTablePagination from '../components/layouts/table/CustomTablePagination';
import { QuizSubmission } from '../interfaces/quizSubmission';
import { LearnerQuizSubmissionsContext } from '../contexts/LearnerQuizSubmissionsContextProvider';
import theme from '../themes';
import { truncateText } from '../utils/utilText';
import { UserCoursesIdsWithCourseIds } from '../contexts/UserCourseLessonDataContextProvider';
import { MediaQueryContext } from '../contexts/MediaQueryContextProvider';
import { useAuth } from '../hooks/useAuth';
import { useFilterSearch } from '../hooks/useFilterSearch';
import FilterSearchRow from '../components/layouts/FilterSearchRow';
import CustomInfoMessageAlignedLeft from '../components/layouts/infoMessage/CustomInfoMessageAlignedLeft';

// Responsive column configuration
const getColumns = (isVerySmallScreen: boolean) => {
	return isVerySmallScreen
		? [
				{ key: 'lessonName', label: 'Quiz Name' },
				{ key: 'isChecked', label: 'Status' },
				{ key: 'actions', label: 'Actions' },
			]
		: [
				{ key: 'lessonName', label: 'Quiz Name' },
				{ key: 'courseName', label: 'Course Name' },
				{ key: 'isChecked', label: 'Status' },
				{ key: 'actions', label: 'Actions' },
			];
};

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
			<FilterSearchRow
				filterValue={filterValue}
				onFilterChange={handleFilterChange}
				filterOptions={[
					{ value: '', label: 'All Submissions' },
					{ value: 'checked', label: 'Checked' },
					{ value: 'unchecked', label: 'Unchecked' },
					...(userCourseData?.map((course) => ({
						value: course.toLowerCase(),
						label: truncateText(course, 25),
					})) || []),
				]}
				filterPlaceholder='Filter Submissions'
				searchValue={searchValue}
				onSearchChange={setSearchValue}
				onSearch={handleSearch}
				onReset={resetAll}
				searchPlaceholder='Search in Quiz and Course Name'
				isSearchLoading={isSearchLoading}
				isSearchActive={isSearchActive}
				searchResultsTotalItems={searchResultsTotalItems}
				totalItems={userQuizSubmissions.length}
				searchedValue={searchedValue}
				onResetSearch={resetSearch}
				onResetFilter={resetFilter}
				isSticky={true}
			/>

			<Box
				sx={{
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					padding: isVerySmallScreen ? '0rem 0.25rem 2rem 0.25rem' : '0rem 1rem 2rem 1rem',
					width: '100%',
				}}>
				<Table
					sx={{
						'margin': '1rem 0',
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
					{(isSearchActive && searchedValue) || (isSearchActive && filterValue?.trim() && <Box sx={{ height: '1.5rem' }}></Box>)}
					<CustomTableHead<QuizSubmission>
						orderBy={orderBy as keyof QuizSubmission}
						order={order}
						handleSort={handleSort}
						columns={getColumns(isVerySmallScreen)}
					/>
					<TableBody>
						{paginatedSubmissions &&
							paginatedSubmissions?.map((submission: QuizSubmission) => (
								<TableRow key={submission._id} hover>
									<CustomTableCell value={submission.lessonName} />
									{!isVerySmallScreen && <CustomTableCell value={submission.courseName} />}
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
				{isVerySmallScreen && <CustomInfoMessageAlignedLeft message='Rotate your device for more info' />}
				<CustomTablePagination count={submissionsNumberOfPages} page={currentPage} onChange={handlePageChange} />
			</Box>
		</DashboardPagesLayout>
	);
};

export default Submissions;
