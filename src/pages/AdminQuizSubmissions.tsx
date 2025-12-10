import { Box, Table, TableBody, TableCell, TableRow, Typography } from '@mui/material';
import AdminTableSkeleton from '../components/layouts/skeleton/AdminTableSkeleton';
import DashboardPagesLayout from '../components/layouts/dashboardLayout/DashboardPagesLayout';
import AdminPageErrorBoundary from '../components/error/AdminPageErrorBoundary';
import { useContext, useEffect, useMemo } from 'react';
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
import { LessonType } from '../interfaces/enums';
import { calculateQuizTotalScoreFromScores } from '../utils/calculateQuizTotalScoreFromScores';
import { calculateScorePercentage } from '../utils/calculateScorePercentage';

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

	const { isSmallScreen, isRotatedMedium } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;

	const {
		quizSubmissions,
		loading,
		totalItems,
		loadedPages,
		fetchMoreQuizSubmissions,
		enableAdminQuizSubmissionsFetch,
		setQuizSubmissionsPageNumber,
	} = useContext(AdminQuizSubmissionsContext);

	const pageSize = 50;

	// Use the filter search hook
	const {
		searchValue,
		setSearchValue,
		filterValue,
		displayData: displaySubmissions,
		numberOfPages: submissionsNumberOfPages,
		currentPage: quizSubmissionsCurrentPage,
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
		limit: 200,
		pageSize,
		contextData: quizSubmissions || [],
		setContextPageNumber: setQuizSubmissionsPageNumber,
		fetchMoreContextData: fetchMoreQuizSubmissions,
		contextLoadedPages: loadedPages,
		contextTotalItems: totalItems,
		defaultOrderBy: 'createdAt',
		defaultOrder: 'desc',
	});

	// Sort the display data
	const sortedSubmissions = useMemo(() => {
		if (!displaySubmissions) return [];
		return [...displaySubmissions].sort((a, b) => {
			const aValue = (a as any)[orderBy] ?? '';
			const bValue = (b as any)[orderBy] ?? '';
			return order === 'asc' ? (aValue > bValue ? 1 : aValue < bValue ? -1 : 0) : aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
		});
	}, [displaySubmissions, orderBy, order]);

	// For context data, use client-side pagination
	const paginatedQuizSubmissions = sortedSubmissions;

	// Enable admin quiz submissions fetching only once when component mounts
	useEffect(() => {
		enableAdminQuizSubmissionsFetch();
	}, []);

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
					totalItems={totalItems || quizSubmissions?.length || 0}
					searchedValue={searchedValue}
					onResetSearch={resetSearch}
					onResetFilter={resetFilter}
					isSticky={true}
				/>

				<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', padding: '0rem' }}>
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
								padding: '0.75rem 1rem',
								boxSizing: 'border-box',
								margin: 0,
								verticalAlign: 'center',
							},
							'& .MuiTableHead-root .MuiTableCell-root:last-child': {
								borderRight: 'none',
							},
							'& .MuiTableBody-root .MuiTableCell-root': {
								padding: '0.5rem 1rem',
								boxSizing: 'border-box',
								margin: 0,
								verticalAlign: 'center',
							},
							'& .MuiTableBody-root .MuiTableCell-root:last-child': {
								borderRight: 'none',
							},
							// Column widths for header cells
							'& .MuiTableHead-root .MuiTableCell-root:nth-of-type(1)': {
								minWidth: isMobileSize ? '100px' : '150px',
								width: isMobileSize ? '25%' : '15%',
							},
							'& .MuiTableHead-root .MuiTableCell-root:nth-of-type(2)': {
								minWidth: isMobileSize ? '120px' : '200px',
								width: isMobileSize ? '35%' : '25%',
							},
							'& .MuiTableHead-root .MuiTableCell-root:nth-of-type(3)': {
								minWidth: isMobileSize ? '0px' : '150px',
								width: isMobileSize ? '0%' : '20%',
								display: isMobileSize ? 'none' : 'table-cell',
							},
							'& .MuiTableHead-root .MuiTableCell-root:nth-of-type(4)': {
								minWidth: isMobileSize ? '100px' : '100px',
								width: isMobileSize ? '25%' : '15%',
							},
							'& .MuiTableHead-root .MuiTableCell-root:nth-of-type(5)': {
								minWidth: isMobileSize ? '0px' : '100px',
								width: isMobileSize ? '0%' : '10%',
								display: isMobileSize ? 'none' : 'table-cell',
							},
							'& .MuiTableHead-root .MuiTableCell-root:nth-of-type(6)': {
								minWidth: isMobileSize ? '60px' : '80px',
								width: isMobileSize ? '15%' : '15%',
							},
							// Column widths for body cells
							'& .MuiTableBody-root .MuiTableCell-root:nth-of-type(1)': {
								minWidth: isMobileSize ? '100px' : '150px',
								width: isMobileSize ? '25%' : '15%',
							},
							'& .MuiTableBody-root .MuiTableCell-root:nth-of-type(2)': {
								minWidth: isMobileSize ? '120px' : '200px',
								width: isMobileSize ? '35%' : '25%',
							},
							'& .MuiTableBody-root .MuiTableCell-root:nth-of-type(3)': {
								minWidth: isMobileSize ? '0px' : '150px',
								width: isMobileSize ? '0%' : '20%',
								display: isMobileSize ? 'none' : 'table-cell',
							},
							'& .MuiTableBody-root .MuiTableCell-root:nth-of-type(4)': {
								minWidth: isMobileSize ? '100px' : '100px',
								width: isMobileSize ? '25%' : '15%',
							},
							'& .MuiTableBody-root .MuiTableCell-root:nth-of-type(5)': {
								minWidth: isMobileSize ? '0px' : '100px',
								width: isMobileSize ? '0%' : '10%',
								display: isMobileSize ? 'none' : 'table-cell',
							},
							'& .MuiTableBody-root .MuiTableCell-root:nth-of-type(6)': {
								minWidth: isMobileSize ? '60px' : '80px',
								width: isMobileSize ? '15%' : '15%',
							},
						}}
						size='small'
						aria-label='a dense table'>
						<TableBody>
							{/* Spacer row to ensure header alignment */}
							<TableRow sx={{ height: 0, visibility: 'hidden' }}>
								<TableCell sx={{ width: isMobileSize ? '25%' : '15%', padding: 0, border: 'none' }} />
								<TableCell sx={{ width: isMobileSize ? '35%' : '25%', padding: 0, border: 'none' }} />
								<TableCell sx={{ width: isMobileSize ? '0%' : '20%', padding: 0, border: 'none' }} />
								<TableCell sx={{ width: isMobileSize ? '25%' : '15%', padding: 0, border: 'none' }} />
								<TableCell sx={{ width: isMobileSize ? '0%' : '10%', padding: 0, border: 'none' }} />
								<TableCell sx={{ width: isMobileSize ? '15%' : '15%', padding: 0, border: 'none' }} />
							</TableRow>
						</TableBody>
						<CustomTableHead<QuizSubmission>
							orderBy={orderBy as keyof QuizSubmission}
							order={order}
							handleSort={handleSort}
							columns={[
								{ key: 'userName', label: isMobileSize ? 'Username' : 'Username' },
								{ key: 'lessonName', label: isMobileSize ? 'Quiz' : 'Quiz Name' },
								{ key: 'courseName', label: isMobileSize ? 'Course' : 'Course Name' },
								{ key: 'score', label: 'Score' },
								{ key: 'isChecked', label: 'Status' },
								{ key: 'actions', label: 'Actions' },
							]}
						/>
						<TableBody>
							{paginatedQuizSubmissions &&
								paginatedQuizSubmissions?.map((submission: QuizSubmission) => {
									const totalEarned = submission.totalEarned ?? 0;

									const isQuiz = submission.lessonType === LessonType.QUIZ;
									const isGraded = !!submission.lessonIsGraded && isQuiz;

									const totalPossible =
										isGraded && submission.lessonQuestionScores
											? calculateQuizTotalScoreFromScores({ questionScores: submission.lessonQuestionScores })
											: 0;
									const percentage = calculateScorePercentage(totalEarned, totalPossible);

									return (
										<TableRow key={submission._id} hover>
											<CustomTableCell value={submission.userName} />
											<CustomTableCell value={submission.lessonName} />
											<CustomTableCell value={submission.courseName} />
											<TableCell sx={{ textAlign: 'center' }}>
												{(() => {
													// If not a quiz or not graded, show N/A
													if (!isQuiz || !isGraded) {
														return (
															<Typography
																variant='body2'
																sx={{
																	fontSize: isMobileSize ? '0.7rem' : '0.85rem',
																	color: theme.palette.text.secondary,
																}}>
																N/A
															</Typography>
														);
													}

													// If graded quiz and has possible points, show score
													if (totalPossible > 0) {
														return (
															<Typography
																variant='body2'
																sx={{
																	fontSize: isMobileSize ? '0.7rem' : '0.85rem',
																	fontWeight: 600,
																}}>
																{totalEarned}/{totalPossible}
																{percentage !== null && (
																	<Typography
																		component='span'
																		sx={{
																			fontSize: isMobileSize ? '0.65rem' : '0.75rem',
																			color: theme.palette.text.secondary,
																			ml: '0.25rem',
																		}}>
																		({percentage}%)
																	</Typography>
																)}
															</Typography>
														);
													}

													// If graded quiz but no points possible (shouldn't happen, but fallback)
													return (
														<Typography
															variant='body2'
															sx={{
																fontSize: isMobileSize ? '0.7rem' : '0.85rem',
																color: theme.palette.text.secondary,
															}}>
															N/A
														</Typography>
													);
												})()}
											</TableCell>
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
					{displaySubmissions && displaySubmissions.length === 0 && (
						<CustomInfoMessageAlignedLeft
							message={isSearchActive ? 'No quiz submissions found matching your search criteria.' : 'No quiz submissions found.'}
							sx={{ marginTop: isMobileSize ? '3rem' : '5rem', marginBottom: '1rem' }}
						/>
					)}

					<CustomTablePagination count={submissionsNumberOfPages} page={quizSubmissionsCurrentPage} onChange={handlePageChange} />
				</Box>
			</DashboardPagesLayout>
		</AdminPageErrorBoundary>
	);
};

export default AdminQuizSubmissions;
