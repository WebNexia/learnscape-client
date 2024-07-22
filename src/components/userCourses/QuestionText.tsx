import { Box, FormLabel, Typography } from '@mui/material';
import { sanitizeHtml } from '../../utils/sanitizeHtml';
import { QuestionInterface } from '../../interfaces/question';

interface QuestionTextProps {
	question: QuestionInterface;
	questionNumber: number;
}

const QuestionText = ({ question, questionNumber }: QuestionTextProps) => {
	return (
		<FormLabel
			sx={{
				margin: question.videoUrl || question.imageUrl ? '3rem 0 1rem 0' : '11rem 0 1rem 0',
			}}>
			<Box className='rich-text-content' sx={{ display: 'flex', justifyContent: 'center' }}>
				<Typography variant='h6' sx={{ mr: '0.5rem' }}>
					{questionNumber})
				</Typography>
				<Typography variant='h6' component='div' dangerouslySetInnerHTML={{ __html: sanitizeHtml(question.question) }} />
			</Box>
		</FormLabel>
	);
};

export default QuestionText;
