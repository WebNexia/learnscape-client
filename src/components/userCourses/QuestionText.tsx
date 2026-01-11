import { Box, FormLabel, Typography } from '@mui/material';
import { sanitizeHtml } from '../../utils/sanitizeHtml';
import { QuestionInterface } from '../../interfaces/question';
import { useContext } from 'react';
import { MediaQueryContext } from '../../contexts/MediaQueryContextProvider';
import { decode } from 'html-entities';

interface QuestionTextProps {
	question: QuestionInterface;
	questionNumber: number;
	isMatching?: boolean;
}

const QuestionText = ({ question, questionNumber, isMatching }: QuestionTextProps) => {
	const { isSmallScreen, isRotatedMedium, isVerySmallScreen, isRotated } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;
	const isMobileSizeSmall = isVerySmallScreen || isRotated;

	return (
		<FormLabel
			sx={{
				margin:
					question.videoUrl || question.imageUrl
						? '3rem 0 0rem 0'
						: isMatching && isMobileSize
							? '6.5rem 0 -1rem 0'
							: isMatching
								? '8rem 0 -1rem 0'
								: isMobileSize
									? '6.5rem 0 1rem 0'
									: '8rem 0 1rem 0',
			}}>
			<Box className='rich-text-content' sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
				<Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
					<Box>
						<Typography
							variant='body2'
							component='div'
							dangerouslySetInnerHTML={{ __html: sanitizeHtml(decode(question.question)) }}
							sx={{
								'margin': '-0.25rem 0.5rem 0 0',
								'fontSize': isMobileSizeSmall ? '0.75rem' : '0.95rem',
								'& *': {
									fontSize: `${isMobileSizeSmall ? '0.75rem' : '0.95rem'} !important`,
									lineHeight: '1.9 !important',
									fontFamily: 'inherit !important',
									color: 'inherit !important',
								},
								'& p, & div, & span': {
									fontSize: `${isMobileSizeSmall ? '0.75rem' : '0.95rem'} !important`,
									lineHeight: '1.9 !important',
									fontFamily: 'inherit !important',
									color: 'inherit !important',
								},
								'& img': {
									maxWidth: '100%',
									height: 'auto',
									borderRadius: '0.25rem',
									margin: '0.5rem 0',
									boxShadow: '0 0.1rem 0.2rem 0.1rem rgba(0,0,0,0.15)',
								},
								'lineHeight': 1.9,
								'color': 'inherit',
							}}
						/>
					</Box>
				</Box>
			</Box>
		</FormLabel>
	);
};

export default QuestionText;
