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
			</Box>
		</FormLabel>
	);
};

export default QuestionText;
