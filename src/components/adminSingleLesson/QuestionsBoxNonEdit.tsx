import { Box, Typography } from '@mui/material';
import theme from '../../themes';
import { Lesson } from '../../interfaces/lessons';
import { QuestionInterface } from '../../interfaces/question';

interface QuestionsBoxNonEditProps {
	singleLesson?: Lesson;
	setIsDisplayNonEditQuestion: React.Dispatch<React.SetStateAction<boolean>>;
	setDisplayedQuestionNonEdit: React.Dispatch<React.SetStateAction<QuestionInterface | null>>;
}

const QuestionsBoxNonEdit = ({ singleLesson, setIsDisplayNonEditQuestion, setDisplayedQuestionNonEdit }: QuestionsBoxNonEditProps) => {
	return (
		<Box
			sx={{
				display: 'flex',
				flexDirection: 'column',
				justifyContent: 'flex-start',
				width: '90%',
				mt: '3rem',
			}}>
			<Box sx={{ mt: '3rem', minHeight: '40vh' }}>
				<Typography variant='h4'>Questions</Typography>
				{singleLesson?.questionIds?.length === 0 || singleLesson?.questions.filter((question) => question !== null).length === 0 ? (
					<Box
						sx={{
							display: 'flex',
							justifyContent: 'center',
							alignItems: 'center',
							height: '30vh',
						}}>
						<Typography variant='body1'>No question for this lesson</Typography>
					</Box>
				) : (
					<>
						{singleLesson &&
							singleLesson.questions &&
							singleLesson.questions.map((question) => {
								if (question !== null) {
									return (
										<Box
											key={question._id}
											sx={{
												display: 'flex',
												alignItems: 'center',
												height: '5rem',
												width: '80%',
												backgroundColor: theme.bgColor?.common,
												margin: '1.25rem 0',
												borderRadius: '0.25rem',
												boxShadow: '0.1rem 0 0.3rem 0.2rem rgba(0, 0, 0, 0.2)',
												cursor: 'pointer',
											}}
											onClick={() => {
												setDisplayedQuestionNonEdit(question);
												setIsDisplayNonEditQuestion(true);
											}}>
											<Box
												sx={{
													height: '5rem',
													width: '4rem',
												}}>
												<img
													src='https://images.unsplash.com/photo-1601027847350-0285867c31f7?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8N3x8cXVlc3Rpb24lMjBtYXJrfGVufDB8fDB8fHww'
													alt='question_img'
													height='100%'
													width='100%'
													style={{
														borderRadius: '0.25rem 0 0 0.25rem',
													}}
												/>
											</Box>
											<Box sx={{ ml: '1rem' }}>
												<Typography variant='h6'>{question.question}</Typography>
											</Box>
										</Box>
									);
								}
							})}
					</>
				)}
			</Box>
		</Box>
	);
};

export default QuestionsBoxNonEdit;
