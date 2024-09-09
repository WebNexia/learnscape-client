import { Box, IconButton, Slide, Typography } from '@mui/material';
import { QuestionInterface } from '../../interfaces/question';
import { QuizQuestionAnswer } from '../../pages/LessonPage';
import theme from '../../themes';
import { Close } from '@mui/icons-material';

interface QuizQuestionsMapProps {
	questions: QuestionInterface[];
	userQuizAnswers: QuizQuestionAnswer[];
	isOpen: boolean;
	setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const QuizQuestionsMap = ({ questions, userQuizAnswers, isOpen, setIsOpen }: QuizQuestionsMapProps) => {
	return (
		<Slide direction='left' in={isOpen} mountOnEnter unmountOnExit timeout={{ enter: 1000, exit: 500 }}>
			<Box
				sx={{
					position: 'fixed',
					bottom: '15vh',
					right: 0,
					width: '30vw',
					height: '40vh',
					boxShadow: 10,
					padding: '1.5rem',
					bgcolor: 'background.paper',
					borderRadius: '0.35rem 0 0 0.35rem',
					overflow: 'auto',
				}}>
				<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
					<Box sx={{ display: 'flex' }}>
						<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginRight: '2rem' }}>
							<Box sx={{ height: '2rem', width: '2rem', backgroundColor: theme.bgColor?.greenPrimary, mr: '0.25rem', borderRadius: '0.35rem' }}></Box>
							<Box>
								<Typography>= Answered</Typography>
							</Box>
						</Box>
						<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
							<Box sx={{ height: '2rem', width: '2rem', backgroundColor: 'lightgray', mr: '0.25rem', borderRadius: '0.35rem' }}></Box>
							<Box>
								<Typography>= Unanswered</Typography>
							</Box>
						</Box>
					</Box>
					<Box>
						<IconButton onClick={() => setIsOpen(false)} sx={{ mr: '-1rem' }}>
							<Close />
						</IconButton>
					</Box>
				</Box>
				<Box
					sx={{
						display: 'flex',
						justifyContent: 'center',
						alignItems: 'flex-start',
						mt: '1rem',
						flexWrap: 'wrap',
						boxShadow: '0.1rem 0 0.3rem 0.2rem rgba(0, 0, 0, 0.2)',
						borderRadius: '0.35rem',
						height: '25vh',
						padding: '0.5rem',
						overflow: 'auto',
						alignContent: 'flex-start',
					}}>
					{questions.map((question, index) => {
						const isAnswered = userQuizAnswers.some(
							(answer) =>
								answer.questionId === question._id &&
								(answer.userAnswer !== '' ||
									answer.audioRecordUrl ||
									answer.videoRecordUrl ||
									(answer.userBlankValuePairAnswers.length !== 0 && answer.userBlankValuePairAnswers.some((pair) => pair.value !== '')) ||
									(answer.userMatchingPairAnswers.length !== 0 && answer.userMatchingPairAnswers.some((pair) => pair.answer !== '')))
						);

						return (
							<Box
								key={index}
								sx={{
									display: 'flex',
									justifyContent: 'center',
									alignItems: 'center',
									height: '2rem',
									width: '2rem',
									margin: '0.5rem',
									backgroundColor: isAnswered ? theme.bgColor?.greenPrimary : 'lightgray',
									borderRadius: '0.35rem',
								}}>
								<Typography variant='body2' sx={{ color: theme.textColor?.common.main }}>
									{index + 1}
								</Typography>
							</Box>
						);
					})}
				</Box>
			</Box>
		</Slide>
	);
};

export default QuizQuestionsMap;
