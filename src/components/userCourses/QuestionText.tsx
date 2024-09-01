import { Box, FormLabel, Typography } from '@mui/material';
import { sanitizeHtml } from '../../utils/sanitizeHtml';
import { QuestionInterface } from '../../interfaces/question';
import { GppBad, GppGood } from '@mui/icons-material';

interface QuestionTextProps {
	question: QuestionInterface;
	questionNumber: number;
	isLessonCompleted?: boolean;
	userQuizAnswer?: string;
	isTrueFalseQuestion?: boolean;
	isMultipleChoiceQuestion?: boolean;
}

const QuestionText = ({
	question,
	questionNumber,
	isLessonCompleted,
	userQuizAnswer,
	isTrueFalseQuestion,
	isMultipleChoiceQuestion,
}: QuestionTextProps) => {
	return (
		<FormLabel
			sx={{
				margin: question.videoUrl || question.imageUrl ? '3rem 0 1rem 0' : '11rem 0 1rem 0',
			}}>
			<Box className='rich-text-content' sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
				<Box sx={{ display: 'flex' }}>
					<Typography variant='h6' sx={{ margin: '0.5rem 0.5rem 0 0' }}>
						{questionNumber})
					</Typography>
					<Typography
						variant='h6'
						component='div'
						dangerouslySetInnerHTML={{ __html: sanitizeHtml(question.question) }}
						sx={{ margin: '0.5rem 0.5rem 0 0' }}
					/>
				</Box>
				{isLessonCompleted &&
					(isTrueFalseQuestion || isMultipleChoiceQuestion) &&
					(userQuizAnswer === question.correctAnswer ? (
						<Box sx={{ marginLeft: '1rem' }}>
							<GppGood color='success' fontSize='large' />
						</Box>
					) : (
						<Box sx={{ marginLeft: '1rem' }}>
							<GppBad color='error' fontSize='large' />
						</Box>
					))}
			</Box>
		</FormLabel>
	);
};

export default QuestionText;
