import { Box } from '@mui/material';
import { QuestionInterface } from '../../interfaces/question';
import { useContext } from 'react';
import { MediaQueryContext } from '../../contexts/MediaQueryContextProvider';
import UniversalVideoPlayer from '../video/UniversalVideoPlayer';

interface QuestionMediaProps {
	question: QuestionInterface;
	isStudentFeedbackPage?: boolean;
}

const QuestionMedia = ({ question, isStudentFeedbackPage }: QuestionMediaProps) => {
	const { isSmallScreen, isRotatedMedium } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;
	// const isMobileSizeSmall = isVerySmallScreen || isRotated;
	return (
		<Box
			sx={{
				display: 'flex',
				flexDirection: isMobileSize ? 'column' : 'row',
				justifyContent: 'center',
				alignItems: 'center',
				width: '100%',
				height: (() => {
					if (!question?.imageUrl && !question?.videoUrl) return '0';
					if (question?.imageUrl && question?.videoUrl) return isMobileSize ? '10rem' : '18rem';
					return isMobileSize ? '10rem' : '18rem';
				})(),
				margin: (() => {
					// Student feedback page margins
					if (isStudentFeedbackPage) {
						if (question?.imageUrl && question?.videoUrl) return isMobileSize ? '6.5rem 0' : '1.5rem 0';
						if (question?.imageUrl || question?.videoUrl) return '1.5rem 0';
						return '0';
					}

					// Regular page margins
					if (question?.imageUrl && question?.videoUrl) {
						return isMobileSize ? '12rem 0 4rem 0' : '9rem 0 0 0';
					}
					if (question?.imageUrl || question?.videoUrl) {
						return isMobileSize ? '6.5rem 0 -1rem 0' : '9rem 0 0 0';
					}
					return '0';
				})(),
			}}>
			{question?.imageUrl && (
				<Box
					sx={{
						height: '100%',
						flex: 1,
						display: 'flex',
						justifyContent: 'center',
						alignItems: 'center',
						mb: isMobileSize ? '1rem' : '0rem',
					}}>
					<img
						src={question?.imageUrl}
						alt='question_img'
						style={{
							height: '100%',
							width: 'fit-content',
							borderRadius: '0.2rem',
							boxShadow: '0 0.1rem 0.4rem 0.2rem rgba(0,0,0,0.3)',
							objectFit: 'contain',
						}}
					/>
				</Box>
			)}

			{question?.videoUrl && (
				<Box
					sx={{
						height: '100%',
						flex: 1,
						display: 'flex',
						justifyContent: 'center',
						alignItems: 'center',
					}}>
					<UniversalVideoPlayer
						url={question.videoUrl}
						width={question?.imageUrl || (!question.imageUrl && isMobileSize) ? '90%' : '50%'}
						height='100%'
						style={{
							boxShadow: '0 0.1rem 0.4rem 0.2rem rgba(0,0,0,0.3)',
						}}
						controls
					/>
				</Box>
			)}
		</Box>
	);
};

export default QuestionMedia;
