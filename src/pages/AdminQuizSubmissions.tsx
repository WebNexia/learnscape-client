import { Box, Table, TableBody, TableCell, TableRow } from '@mui/material';
import DashboardPagesLayout from '../components/layouts/dashboardLayout/DashboardPagesLayout';
import { useContext, useEffect, useState } from 'react';
import { QuizSubmissionsContext } from '../contexts/QuizSubmissionsContextProvider';
import { useParams } from 'react-router-dom';
import { QuizSubmission } from '../interfaces/quizSubmission';
import CustomTableHead from '../components/layouts/table/CustomTableHead';
import CustomTableCell from '../components/layouts/table/CustomTableCell';
import CustomActionBtn from '../components/layouts/table/CustomActionBtn';
import { Edit } from '@mui/icons-material';
import CustomTablePagination from '../components/layouts/table/CustomTablePagination';

const AdminQuizSubmissions = () => {
	const {
		sortedQuizSubmissionsData,
		sortQuizSubmissionsData,
		numberOfPages,
		quizSubmissionsPageNumber,
		setQuizSubmissionsPageNumber,
		fetchQuizSubmissions,
	} = useContext(QuizSubmissionsContext);

	const { userId } = useParams();

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

	return (
		<DashboardPagesLayout pageName='Quiz Submissions' customSettings={{ justifyContent: 'flex-start' }}>
			<Box
				sx={{
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					padding: '1rem 2rem 2rem 2rem',
					width: '100%',
					mt: '2rem',
				}}>
				<Table sx={{ mb: '2rem' }} size='small' aria-label='a dense table'>
					<CustomTableHead<QuizSubmission>
						orderBy={orderBy}
						order={order}
						handleSort={handleSort}
						columns={[
							{ key: 'userName', label: 'Student Name' },
							{ key: 'lessonName', label: 'Quiz Name' },
							{ key: 'courseName', label: 'Course Name' },
							{ key: 'isChecked', label: 'Status' },
							{ key: 'actions', label: 'Actions' },
						]}
					/>
					<TableBody>
						{sortedQuizSubmissionsData &&
							sortedQuizSubmissionsData?.map((submission: QuizSubmission) => {
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
