import { Box } from '@mui/material';
import ReactPlayer from 'react-player';
import { QuestionInterface } from '../../interfaces/question';
import { useContext } from 'react';
import { MediaQueryContext } from '../../contexts/MediaQueryContextProvider';

interface QuestionMediaProps {
	question: QuestionInterface;
	isStudentFeedbackPage?: boolean;
}

const QuestionMedia = ({ question, isStudentFeedbackPage }: QuestionMediaProps) => {
	const { isSmallScreen, isRotatedMedium, isVerySmallScreen } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;
	// const isMobileSizeSmall = isVerySmallScreen || isRotated;
	return (
		<Box
			sx={{
				display: 'flex',
				flexDirection: isVerySmallScreen ? 'column' : 'row',
				justifyContent: 'center',
				alignItems: 'center',
				width: '100%',
				height:
					question?.imageUrl && question?.videoUrl && isVerySmallScreen
						? '10rem'
						: question?.imageUrl && question?.videoUrl && isRotatedMedium
						? '12rem'
						: (question?.imageUrl || question?.videoUrl) && isVerySmallScreen
						? '10rem'
						: question?.imageUrl || question?.videoUrl
						? '18rem'
						: '0',
				margin:
					isStudentFeedbackPage && question?.imageUrl && question?.videoUrl && isVerySmallScreen
						? '6.5rem 0'
						: isStudentFeedbackPage && (question?.imageUrl || question?.videoUrl)
						? '1.5rem 0'
						: question?.imageUrl && question?.videoUrl && isVerySmallScreen
						? '14.5rem 0 3rem 0'
						: question?.imageUrl && question?.videoUrl && isRotatedMedium
						? '9.5rem 0 -1rem 0'
						: question?.videoUrl && isVerySmallScreen
						? '9rem 0 -2rem 0'
						: question?.imageUrl && isVerySmallScreen
						? '9.5rem 0 -2rem 0'
						: question?.videoUrl && isRotatedMedium
						? '9.5rem 0 0 0'
						: question?.imageUrl && isRotatedMedium
						? '9.5rem 0 0 0'
						: isMobileSize && !question.imageUrl && !question.videoUrl
						? '0rem'
						: isSmallScreen
						? '9.5rem 0 0 0'
						: !question.imageUrl && !question.videoUrl
						? '0rem'
						: '11rem 0 0 0',
			}}>
			{question?.imageUrl && (
				<Box
					sx={{
						height: '100%',
						flex: 1,
						display: 'flex',
						justifyContent: 'center',
						alignItems: 'center',
						mb: isVerySmallScreen ? '1rem' : '0rem',
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
					<ReactPlayer
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
