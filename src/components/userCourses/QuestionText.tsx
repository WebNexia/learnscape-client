import { Box, FormLabel, Typography } from '@mui/material';
import { sanitizeHtml } from '../../utils/sanitizeHtml';
import { QuestionInterface } from '../../interfaces/question';
import { useContext, useMemo } from 'react';
import { MediaQueryContext } from '../../contexts/MediaQueryContextProvider';
import { decode } from 'html-entities';
import WordAssistPopper from './WordAssistPopper';
import { useWordAssist, wrapWordsForHover } from '../../hooks/useWordAssist';

interface QuestionTextProps {
	question: QuestionInterface;
	questionNumber: number;
	isMatching?: boolean;
	enableWordAssist?: boolean;
}

const QuestionText = ({ question, questionNumber, isMatching, enableWordAssist = true }: QuestionTextProps) => {
	const { isSmallScreen, isRotatedMedium, isVerySmallScreen, isRotated } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;
	const isMobileSizeSmall = isVerySmallScreen || isRotated;
	const { anchorEl, activeWord, wordInfo, isLoadingWordInfo, handleWordHover, handleWordTouchStart, handleWordTouchEnd, handleMouseLeave } = useWordAssist({
		enabled: enableWordAssist,
		hoverDelayMs: 1000,
	});

	const sanitizedQuestionHtml = useMemo(() => sanitizeHtml(decode(question.question)), [question.question]);
	const questionHtmlWithWordSpans = useMemo(() => wrapWordsForHover(sanitizedQuestionHtml), [sanitizedQuestionHtml]);

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
									? '7.5rem 0 1rem 0'
									: '9.5rem 0 1rem 0',
				width: '100%',
				display: 'flex',
				justifyContent: 'center',
			}}>
			<Box
				className='rich-text-content'
				onMouseOver={handleWordHover}
				onMouseLeave={handleMouseLeave}
				onTouchStart={handleWordTouchStart}
				onTouchEnd={handleWordTouchEnd}
				onTouchCancel={handleWordTouchEnd}
				sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
				<Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
					<Box>
						<Typography
							variant='body2'
							component='div'
							dangerouslySetInnerHTML={{ __html: questionHtmlWithWordSpans }}
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
								'& .pronounceable-word': {
									cursor: enableWordAssist ? 'pointer' : 'default',
									borderRadius: '0.2rem',
									padding: '0 0.1rem',
									transition: 'background-color 0.15s ease',
								},
								'& .pronounceable-word:hover': {
									backgroundColor: enableWordAssist ? 'rgba(1, 67, 90, 0.14)' : 'transparent',
								},
								'lineHeight': 1.9,
								'color': 'inherit',
							}}
						/>
					</Box>
				</Box>
			</Box>
			<WordAssistPopper
				open={Boolean(anchorEl) && enableWordAssist}
				anchorEl={anchorEl}
				activeWord={activeWord}
				wordInfo={wordInfo}
				isLoadingWordInfo={isLoadingWordInfo}
			/>
		</FormLabel>
	);
};

export default QuestionText;
