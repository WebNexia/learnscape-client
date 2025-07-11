import { Box, Typography } from '@mui/material';
import theme from '../../themes';
import { Lesson } from '../../interfaces/lessons';
import { QuestionInterface } from '../../interfaces/question';
import { stripHtml } from '../../utils/stripHtml';
import { truncateText } from '../../utils/utilText';
import { useContext } from 'react';
import { QuestionsContext } from '../../contexts/QuestionsContextProvider';
import { LessonType } from '../../interfaces/enums';
import NoContentBoxAdmin from '../layouts/noContentBox/NoContentBoxAdmin';
import CustomInfoMessageAlignedRight from '../layouts/infoMessage/CustomInfoMessageAlignedRight';
import { AutoAwesome } from '@mui/icons-material';

interface QuestionsBoxNonEditProps {
	singleLesson?: Lesson;
	setIsDisplayNonEditQuestion: React.Dispatch<React.SetStateAction<boolean>>;
	setDisplayedQuestionNonEdit: React.Dispatch<React.SetStateAction<QuestionInterface | null>>;
}

const QuestionsBoxNonEdit = ({ singleLesson, setIsDisplayNonEditQuestion, setDisplayedQuestionNonEdit }: QuestionsBoxNonEditProps) => {
	const { fetchQuestionTypeName } = useContext(QuestionsContext);
	return (
		<Box
			sx={{
				display: 'flex',
				flexDirection: 'column',
				justifyContent: 'flex-start',
				width: '90%',
				mt: singleLesson?.type === LessonType.INSTRUCTIONAL_LESSON ? '1rem' : '0rem',
			}}>
			<Box sx={{ margin: '3rem 0' }}>
				<Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
					<Box>
						<Typography variant='h5'>Questions</Typography>
					</Box>
					<CustomInfoMessageAlignedRight message='Click the questions to preview as a student' />
				</Box>
				{singleLesson?.questionIds?.length === 0 || singleLesson?.questions?.filter((question) => question !== null).length === 0 ? (
					<NoContentBoxAdmin content='No question for this lesson' />
				) : (
					<>
						{singleLesson &&
							singleLesson.questions &&
							singleLesson.questions?.map((question) => {
								if (question !== null) {
									return (
										<Box
											key={question._id}
											sx={{
												display: 'flex',
												alignItems: 'center',
												height: '3rem',
												width: '100%',
												backgroundColor: theme.bgColor?.common,
												margin: '1rem 0',
												borderRadius: '0.25rem',
												boxShadow: '0.1rem 0 0.3rem 0.2rem rgba(0, 0, 0, 0.2)',
												cursor: 'pointer',
												bgcolor: question.isAiGenerated ? '#E3F2FD' : theme.bgColor?.common,
												position: 'relative',
											}}
											onClick={() => {
												setDisplayedQuestionNonEdit(question);
												setIsDisplayNonEditQuestion(true);
											}}>
											{/* AI Icon positioned absolutely in top-right corner */}
											{question.isAiGenerated && (
												<AutoAwesome
													sx={{
														position: 'absolute',
														top: '0.25rem',
														right: '0.25rem',
														fontSize: '1rem',
														color: '#2196F3',
														zIndex: 1,
													}}
												/>
											)}

											<Box
												sx={{
													height: '3rem',
													width: '2rem',
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
											<Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', margin: '0 1rem' }}>
												<Box>
													<Typography variant='body2'>{truncateText(stripHtml(question.question), 60)}</Typography>
												</Box>
												<Box>
													<Typography variant='body2' sx={{ mr: question.isAiGenerated ? '0.5rem' : '0' }}>
														{fetchQuestionTypeName(question)}
													</Typography>
												</Box>
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
