import { Box, Table, TableBody, TableCell, TableRow } from '@mui/material';
import DashboardPagesLayout from '../components/layouts/dashboardLayout/DashboardPagesLayout';
import { useContext, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import CustomTableHead from '../components/layouts/table/CustomTableHead';
import CustomTableCell from '../components/layouts/table/CustomTableCell';
import CustomActionBtn from '../components/layouts/table/CustomActionBtn';
import { PendingOutlined } from '@mui/icons-material';
import CustomTablePagination from '../components/layouts/table/CustomTablePagination';
import { QuizSubmission } from '../interfaces/quizSubmission';
import { QuizSubmissionsContext } from '../contexts/QuizSubmissionsContextProvider';

const Submissions = () => {
	const {
		sortedUserQuizSubmissionsData,
		sortUserQuizSubmissionsData,
		userNumberOfPages,
		userQuizSubmissionsPageNumber,
		setUserQuizSubmissionsPageNumber,
		fetchQuizSubmissionsByUserId,
	} = useContext(QuizSubmissionsContext);

	const { userId } = useParams();

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
		setUserQuizSubmissionsPageNumber(1);
	}, []);

	useEffect(() => {
		const fetchData = async () => {
			if (!dataLoaded) {
				try {
					fetchQuizSubmissionsByUserId(userId!, userQuizSubmissionsPageNumber);
					setDataLoaded(true);
				} catch (error) {
					console.error('Error fetching quiz submissions:', error);
				}
			}
		};

		fetchData();
	}, [userQuizSubmissionsPageNumber, userId, dataLoaded]);

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
							{ key: 'lessonName', label: 'Quiz Name' },
							{ key: 'courseName', label: 'Course Name' },
							{ key: 'isChecked', label: 'Feedback' },
							{ key: 'actions', label: 'Actions' },
						]}
					/>
					<TableBody>
						{sortedUserQuizSubmissionsData.map((submission: QuizSubmission) => (
							<TableRow key={submission._id}>
								<CustomTableCell value={submission.lessonName} />
								<CustomTableCell value={submission.courseName} />
								<CustomTableCell value={submission.isChecked ? 'Given' : 'Not Given'} />

								<TableCell
									sx={{
										textAlign: 'center',
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
										icon={<PendingOutlined />}
									/>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
				<CustomTablePagination count={userNumberOfPages} page={userQuizSubmissionsPageNumber} onChange={setUserQuizSubmissionsPageNumber} />
			</Box>
		</DashboardPagesLayout>
	);
};

export default Submissions;
