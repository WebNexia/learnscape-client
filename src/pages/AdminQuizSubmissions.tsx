import { Box, FormControl, InputAdornment, MenuItem, Select, Table, TableBody, TableCell, TableRow } from '@mui/material';
import DashboardPagesLayout from '../components/layouts/dashboardLayout/DashboardPagesLayout';
import { useContext, useEffect, useState } from 'react';
import { QuizSubmissionsContext } from '../contexts/QuizSubmissionsContextProvider';
import { useParams } from 'react-router-dom';
import { QuizSubmission } from '../interfaces/quizSubmission';
import CustomTableHead from '../components/layouts/table/CustomTableHead';
import CustomTableCell from '../components/layouts/table/CustomTableCell';
import CustomActionBtn from '../components/layouts/table/CustomActionBtn';
import { Edit, Search } from '@mui/icons-material';
import CustomTablePagination from '../components/layouts/table/CustomTablePagination';
import { OrganisationContext } from '../contexts/OrganisationContextProvider';
import axios from 'axios';
import CustomTextField from '../components/forms/customFields/CustomTextField';
import CustomSubmitButton from '../components/forms/customButtons/CustomSubmitButton';
import CustomDeleteButton from '../components/forms/customButtons/CustomDeleteButton';
import theme from '../themes';
import { CoursesContext } from '../contexts/CoursesContextProvider';
import CustomInfoMessageAlignedLeft from '../components/layouts/infoMessage/CustomInfoMessageAlignedLeft';
import { truncateText } from '../utils/utilText';

const AdminQuizSubmissions = () => {
	const { userId } = useParams();
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const { orgId } = useContext(OrganisationContext);

	const { sortedCoursesData } = useContext(CoursesContext);

	const courses = sortedCoursesData.map((course) => ({ courseId: course._id, courseTitle: course.title }));

	const {
		sortedQuizSubmissionsData,
		sortQuizSubmissionsData,
		numberOfPages,
		setNumberOfPages,
		quizSubmissionsPageNumber,
		setQuizSubmissionsPageNumber,
		fetchQuizSubmissions,
	} = useContext(QuizSubmissionsContext);

	const [filteredSubmissions, setFilteredSubmissions] = useState<QuizSubmission[]>(sortedQuizSubmissionsData);
	const [originalSubmissions, setOriginalSubmissions] = useState<QuizSubmission[]>(sortedQuizSubmissionsData);
	const [numberOfPagesOfAllSubmissions, setNumberOfPagesOfAllSubmissions] = useState<number>(numberOfPages);

	const [searchValue, setSearchValue] = useState<string>('');
	const [filterValue, setFilterValue] = useState<string>('');

	const [dataLoaded, setDataLoaded] = useState(false);

	const [orderBy, setOrderBy] = useState<keyof QuizSubmission>('userName');
	const [order, setOrder] = useState<'asc' | 'desc'>('asc');

	const handleSort = (property: keyof QuizSubmission) => {
		const isAsc = orderBy === property && order === 'asc';
		setOrder(isAsc ? 'desc' : 'asc');
		setOrderBy(property);
		sortQuizSubmissionsData(property, isAsc ? 'desc' : 'asc');
	};

	useEffect(() => {
		setQuizSubmissionsPageNumber(1);
	}, []);

	useEffect(() => {
		if (!dataLoaded) {
			try {
				fetchQuizSubmissions(quizSubmissionsPageNumber);
				setDataLoaded(true);
			} catch (error) {
				console.log(error);
			}
		}
	}, [quizSubmissionsPageNumber, dataLoaded]);

	const handleSearchQuestions = async (page: number) => {
		if (!searchValue) {
			setNumberOfPages(numberOfPagesOfAllSubmissions);
			setFilteredSubmissions(originalSubmissions);

			return;
		}

		try {
			const response = await axios.post(`${base_url}/quizSubmissions/search`, {
				orgId,
				page,
				limit: 75,
				search: searchValue,
			});
			setFilteredSubmissions(response.data.data);
			setNumberOfPages(response.data.pages);
		} catch (error) {
			console.error(error);
		}
	};

	const handleFilterQuestions = async (page: number, filterValue: string) => {
		let isChecked;
		let courseId;

		if (!filterValue) {
			setNumberOfPages(numberOfPagesOfAllSubmissions);
			setFilteredSubmissions(originalSubmissions);
			return;
		}

		if (filterValue === 'checked') {
			isChecked = true;
		} else if (filterValue === 'unchecked') {
			isChecked = false;
		} else {
			courseId = filterValue;
		}

		try {
			const response = await axios.post(`${base_url}/quizSubmissions/filter`, {
				orgId,
				page,
				limit: 75,
				isChecked,
				courseId,
			});
			setFilteredSubmissions(response.data.data);
			setNumberOfPages(response.data.pages);
		} catch (error) {
			console.error(error);
		}
	};

	return (
		<DashboardPagesLayout pageName='Quiz Submissions' customSettings={{ justifyContent: 'flex-start' }}>
			<Box sx={{ display: 'flex', justifyContent: 'flex-start', width: '100%', padding: '2rem 2rem 1rem 2rem' }}>
				<Box sx={{ mr: '1rem' }}>
					<FormControl>
						<Select
							size='small'
							value={filterValue}
							onChange={async (e) => {
								setSearchValue('');
								setFilterValue(e.target.value);
								if (e.target.value !== '') {
									await handleFilterQuestions(1, e.target.value);
								} else {
									setFilteredSubmissions(originalSubmissions);
								}
							}}
							displayEmpty
							sx={{
								backgroundColor: theme.bgColor?.common,
								width: '13rem',
								fontSize: '0.85rem',
								textTransform: 'capitalize',
							}}>
							<MenuItem disabled value='filter' selected sx={{ fontSize: '0.85rem', fontStyle: 'italic', textTransform: 'capitalize' }}>
								Filter Submissions
							</MenuItem>
							<MenuItem value='' selected sx={{ fontSize: '0.85rem', textTransform: 'capitalize' }}>
								All Submissions
							</MenuItem>
							<MenuItem value='checked' sx={{ fontSize: '0.85rem', textTransform: 'capitalize' }}>
								Checked
							</MenuItem>
							<MenuItem value='unchecked' sx={{ fontSize: '0.85rem', textTransform: 'capitalize' }}>
								Unchecked
							</MenuItem>
							<MenuItem disabled value='types' selected sx={{ fontSize: '0.7rem', textTransform: 'inherit', fontWeight: 'lighter' }}>
								------ Filter by Course ------
							</MenuItem>
							{courses.map((course) => (
								<MenuItem value={course.courseId} key={course.courseId} sx={{ fontSize: '0.85rem', textTransform: 'capitalize' }}>
									{truncateText(course.courseTitle, 25)}
								</MenuItem>
							))}
						</Select>
					</FormControl>
				</Box>
				<Box sx={{ display: 'flex', flexDirection: 'column', alignSelf: 'flex-start', width: '30rem' }}>
					<Box sx={{ display: 'flex' }}>
						<CustomTextField
							value={searchValue}
							placeholder='Search in Student Username and Quiz Name'
							onChange={(e) => {
								setSearchValue(e.target.value);
								setFilterValue('filter');
								if (e.target.value === '') {
									setFilterValue('');
								}
							}}
							sx={{
								backgroundColor: '#fff',
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
										/>
									</InputAdornment>
								),
							}}
						/>
						<CustomSubmitButton
							sx={{ height: '2rem', marginLeft: '0.5rem' }}
							type='button'
							onClick={async () => {
								await handleSearchQuestions(1);
							}}>
							Search
						</CustomSubmitButton>
						<CustomDeleteButton
							sx={{ height: '2rem', marginLeft: '0.5rem' }}
							type='button'
							onClick={async () => {
								setFilterValue('');
								setSearchValue('');
								setFilteredSubmissions(originalSubmissions);
								setQuizSubmissionsPageNumber(1);
								setNumberOfPages(numberOfPagesOfAllSubmissions);
							}}>
							Reset
						</CustomDeleteButton>
					</Box>
				</Box>
			</Box>
			<Box
				sx={{
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					padding: '0rem 2rem 2rem 2rem',
					width: '100%',
				}}>
				<Table sx={{ mb: '2rem' }} size='small' aria-label='a dense table'>
					<CustomTableHead<QuizSubmission>
						orderBy={orderBy}
						order={order}
						handleSort={handleSort}
						columns={[
							{ key: 'userName', label: 'Student Username' },
							{ key: 'lessonName', label: 'Quiz Name' },
							{ key: 'courseName', label: 'Course Name' },
							{ key: 'isChecked', label: 'Status' },
							{ key: 'actions', label: 'Actions' },
						]}
					/>
					<TableBody>
						{filteredSubmissions &&
							filteredSubmissions?.map((submission: QuizSubmission) => {
								return (
									<TableRow key={submission._id}>
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
														`/admin/check-submission/user/${userId}/submission/${submission._id}/lesson/${submission.lessonId}/userlesson/${submission.userLessonId}?isChecked=${submission.isChecked}`,
														'_blank'
													);
													window.scrollTo({ top: 0, behavior: 'smooth' });
												}}
												icon={<Edit fontSize='small' />}
											/>
										</TableCell>
									</TableRow>
								);
							})}
					</TableBody>
				</Table>
				<CustomTablePagination count={numberOfPages} page={quizSubmissionsPageNumber} onChange={setQuizSubmissionsPageNumber} />
			</Box>
		</DashboardPagesLayout>
	);
};

export default AdminQuizSubmissions;
