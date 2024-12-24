import { Box, FormLabel, Typography } from '@mui/material';
import { sanitizeHtml } from '../../utils/sanitizeHtml';
import { QuestionInterface } from '../../interfaces/question';
import { useContext } from 'react';
import { MediaQueryContext } from '../../contexts/MediaQueryContextProvider';

interface QuestionTextProps {
	question: QuestionInterface;
	questionNumber: number;
	isMatching?: boolean;
}

const QuestionText = ({ question, questionNumber, isMatching }: QuestionTextProps) => {
	const { isSmallScreen, isRotatedMedium } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;

	return (
		<FormLabel
			sx={{
				margin:
					question.videoUrl || question.imageUrl
						? '3rem 0 0rem 0'
						: isMatching && isMobileSize
						? '8.5rem 0 -1rem 0'
						: isMatching
						? '10rem 0 -1rem 0'
						: isMobileSize
						? '8.5rem 0 1rem 0'
						: '11rem 0 1rem 0',
			}}>
			<Box className='rich-text-content' sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
				<Box sx={{ display: 'flex' }}>
					<Typography variant='h6' sx={{ margin: '0.5rem 0.5rem 0 0', fontSize: isMobileSize ? '0.8rem' : undefined }}>
						{questionNumber})
					</Typography>
					<Typography
						variant='h6'
						component='div'
						dangerouslySetInnerHTML={{ __html: sanitizeHtml(question.question) }}
						sx={{ margin: '0.5rem 0.5rem 0 0', fontSize: isMobileSize ? '0.8rem' : undefined }}
					/>
				</Box>
			</Box>
		</FormLabel>
	);
};

export default QuestionText;
