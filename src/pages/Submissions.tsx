import { Box, FormControl, InputAdornment, MenuItem, Select, Table, TableBody, TableCell, TableRow } from '@mui/material';
import DashboardPagesLayout from '../components/layouts/dashboardLayout/DashboardPagesLayout';
import { useContext, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
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

const Submissions = () => {
	const { sortedUserQuizSubmissionsData, sortUserQuizSubmissionsData, fetchQuizSubmissionsByUserId } = useContext(QuizSubmissionsContext);

	const { isSmallScreen, isRotatedMedium, isRotated, isVerySmallScreen } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;
	const isMobileSizeSmall = isVerySmallScreen || isRotated;

	const { userId } = useParams();

	const userCourseData: string[] = JSON.parse(localStorage.getItem('userCourseData') || '[]').map(
		(data: UserCoursesIdsWithCourseIds) => data.courseTitle
	);

	const [submissionsPageNumber, setSubmissionsPageNumber] = useState<number>(1);
	const [searchValue, setSearchValue] = useState<string>('');
	const [filterValue, setFilterValue] = useState<string>('');

	const pageSize = 50;

	const filteredSubmissions = sortedUserQuizSubmissionsData.filter((submission) => {
		if (searchValue) {
			const lowerSearch = searchValue.toLowerCase();
			return submission?.lessonName?.toLowerCase().includes(lowerSearch);
		}
		if (filterValue) {
			if (filterValue === 'checked' && submission.isChecked) return true;
			if (filterValue === 'unchecked' && !submission.isChecked) return true;
			if (filterValue === submission.courseName.toLowerCase()) return true;
		}
		return !searchValue && !filterValue;
	});

	const submissionsNumberOfPages = Math.ceil(filteredSubmissions.length / pageSize);

	const paginatedSubmissions = filteredSubmissions.slice((submissionsPageNumber - 1) * pageSize, submissionsPageNumber * pageSize);

	const [dataLoaded, setDataLoaded] = useState(false);

	const [orderBy, setOrderBy] = useState<keyof QuizSubmission>('userName');
	const [order, setOrder] = useState<'asc' | 'desc'>('asc');

	const handleSort = (property: keyof QuizSubmission) => {
		const isAsc = orderBy === property && order === 'asc';
		setOrder(isAsc ? 'desc' : 'asc');
		setOrderBy(property);
		sortUserQuizSubmissionsData(property, isAsc ? 'desc' : 'asc');
	};

	useEffect(() => {
		setSubmissionsPageNumber(1);
	}, []);

	useEffect(() => {
		const fetchData = async () => {
			if (!dataLoaded && sortedUserQuizSubmissionsData.length === 0) {
				try {
					fetchQuizSubmissionsByUserId(userId!);
					setDataLoaded(true);
				} catch (error) {
					console.error('Error fetching quiz submissions:', error);
				}
			}
		};

		fetchData();
	}, [submissionsPageNumber, userId, dataLoaded, sortedUserQuizSubmissionsData]);

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
										setSearchValue('');
										setFilterValue(e.target.value);
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
								placeholder={'Search in Quiz Name'}
								onChange={(e) => {
									setSearchValue(e.target.value);
									setFilterValue('filter');
									if (e.target.value === '') {
										setFilterValue('');
									}
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
					</Box>
				</Box>
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
								<TableRow key={submission._id}>
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
													`/submission-feedback/user/${userId}/submission/${submission._id}/lesson/${submission.lessonId}/userlesson/${submission.userLessonId}?isChecked=${submission.isChecked}`,
													'_blank'
												);
												window.scrollTo({ top: 0, behavior: 'smooth' });
											}}
											icon={<PendingOutlined fontSize={isMobileSize ? 'small' : 'medium'} />}
										/>
									</TableCell>
								</TableRow>
							))}
					</TableBody>
				</Table>
				<CustomTablePagination count={submissionsNumberOfPages} page={submissionsPageNumber} onChange={setSubmissionsPageNumber} />
			</Box>
		</DashboardPagesLayout>
	);
};

export default Submissions;
