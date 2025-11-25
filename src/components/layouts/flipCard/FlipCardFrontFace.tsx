import { Box, Typography, Tooltip, IconButton } from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import theme from '../../../themes';
import { QuestionInterface } from '../../../interfaces/question';
import { Lesson } from '../../../interfaces/lessons';
import { useContext } from 'react';
import { MediaQueryContext } from '../../../contexts/MediaQueryContextProvider';
import { styled } from '@mui/material/styles';

const StyledTextarea = styled('textarea')<{ isMobile: boolean }>(({ theme, isMobile }) => ({
	'&::placeholder': {
		fontSize: isMobile ? '0.7rem' : '0.9rem',
		color: 'rgba(255, 255, 255, 0.7)',
		fontStyle: 'italic',
		opacity: 0.8,
	},
	'&::-webkit-input-placeholder': {
		fontSize: isMobile ? '0.7rem' : '0.9rem',
		color: 'rgba(255, 255, 255, 0.7)',
		fontStyle: 'italic',
		opacity: 0.8,
	},
	'&::-moz-placeholder': {
		fontSize: isMobile ? '0.7rem' : '0.9rem',
		color: 'rgba(255, 255, 255, 0.7)',
		fontStyle: 'italic',
		opacity: 0.8,
	},
	'&:-ms-input-placeholder': {
		fontSize: isMobile ? '0.7rem' : '0.9rem',
		color: 'rgba(255, 255, 255, 0.7)',
		fontStyle: 'italic',
		opacity: 0.8,
	},
}));

interface FlipCardFrontFaceProps {
	setIsQuestionMissing: React.Dispatch<React.SetStateAction<boolean>>;
	frontText: string;
	setFrontText: React.Dispatch<React.SetStateAction<string>>;
	question?: QuestionInterface;
	newQuestion?: QuestionInterface | undefined;
	setNewQuestion: React.Dispatch<React.SetStateAction<QuestionInterface>> | undefined;
	setSingleLessonBeforeSave: React.Dispatch<React.SetStateAction<Lesson>> | undefined;
	setQuestionAdminQuestions?: React.Dispatch<React.SetStateAction<string>>;
	fromLessonEditPage: boolean | undefined;
	imageUrlAdminQuestions?: string;
	placeholder?: string;
}

const FlipCardFrontFace = ({
	setIsQuestionMissing,
	frontText,
	setFrontText,
	question,
	newQuestion,
	setNewQuestion,
	setSingleLessonBeforeSave,
	setQuestionAdminQuestions,
	fromLessonEditPage,
	imageUrlAdminQuestions,
	placeholder = 'Enter Front Face Text',
}: FlipCardFrontFaceProps) => {
	const {
		isSmallScreen,
		isRotatedMedium,
		isMobilePortrait,
		isMobileLandscape,
		isTabletPortrait,
		isTabletLandscape,
		isDesktopPortrait,
		isDesktopLandscape,
	} = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;

	const FrontFaceImage = (
		<Box
			sx={{
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				background: 'linear-gradient(135deg, #4a7ba7 0%, #5a8bb7 100%)',
				width: isMobilePortrait ? '15rem' : isMobileLandscape ? '18rem' : isTabletPortrait ? '20rem' : '25rem',
				height: isMobilePortrait ? '12rem' : isMobileLandscape ? '14.5rem' : isTabletPortrait ? '16rem' : '15rem',
				padding: '0.5rem',
				border: 'none',
				borderRadius: '0.5rem 0.5rem 0 0',
				objectFit: 'contain',
			}}>
			<img
				src={setNewQuestion ? newQuestion?.imageUrl : fromLessonEditPage ? question?.imageUrl : imageUrlAdminQuestions}
				alt='img'
				style={{
					width: isMobilePortrait ? '13.5rem' : isMobileLandscape ? '16.5rem' : isTabletPortrait ? '19rem' : '25rem',
					height: '100%',
					objectFit: 'contain',
				}}
			/>
		</Box>
	);

	return (
		<Box
			sx={{
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				width: isMobilePortrait ? '15rem' : isMobileLandscape ? '18rem' : isTabletPortrait ? '20rem' : '25rem',
			}}>
			<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
				<Typography variant={isMobileSize ? 'body2' : 'body1'}>Front</Typography>
				<Tooltip
					title={
						<Box sx={{ p: 1 }}>
							<Typography variant='body2' sx={{ fontWeight: 'bold', mb: 0.5, color: 'white' }}>
								Text Formatting Help:
							</Typography>
							<Typography variant='body2' sx={{ mb: 0.5, color: 'white' }}>
								*text* ---&gt; <strong>text</strong>
							</Typography>
							<Typography variant='body2' sx={{ color: 'white' }}>
								_text_ ---&gt; <em>text</em>
							</Typography>
						</Box>
					}
					arrow
					placement='top'
					sx={{
						'& .MuiTooltip-tooltip': {
							backgroundColor: '#2c3e50',
							color: 'white',
							fontSize: '0.875rem',
							border: '1px solid #34495e',
						},
						'& .MuiTooltip-arrow': {
							color: '#2c3e50',
						},
					}}>
					<IconButton size='small' sx={{ p: 0.5 }}>
						<InfoIcon sx={{ fontSize: '1rem' }} />
					</IconButton>
				</Tooltip>
			</Box>

			{question?.imageUrl || newQuestion?.imageUrl ? (
				FrontFaceImage
			) : (
				<Box
					sx={{
						background: 'linear-gradient(135deg, #4a7ba7 0%, #5a8bb7 100%)',
						width: isMobilePortrait ? '15rem' : isMobileLandscape ? '18rem' : isTabletPortrait ? '20rem' : '25rem',
						height: isMobilePortrait ? '12rem' : isMobileLandscape ? '14.5rem' : isTabletPortrait ? '16rem' : '15rem',
						color: 'white',
						padding: '2rem 1rem',
						textAlign: 'center',
						border: 'none',
						borderRadius: '0.5rem 0.5rem 0 0',
						objectFit: 'contain',
					}}>
					<Typography variant='body1' sx={{ color: theme.textColor?.common.main }}>
						No Image
					</Typography>
				</Box>
			)}

			<StyledTextarea
				isMobile={isMobileSize}
				value={frontText}
				maxLength={255}
				onChange={(e) => {
					setFrontText(e.target.value);
					if (setNewQuestion) {
						setNewQuestion((prevData) => {
							if (prevData?.question !== undefined) {
								return {
									...prevData,
									question: e.target.value,
								};
							}
							return prevData;
						});
					}
					if (fromLessonEditPage && setSingleLessonBeforeSave) {
						setSingleLessonBeforeSave((prevData) => {
							if (!prevData.questions) return prevData;

							const updatedQuestions = prevData?.questions?.map((prevQuestion) => {
								if (prevQuestion._id === question?._id) {
									return { ...prevQuestion, question: e.target.value };
								} else {
									return prevQuestion;
								}
							});

							return { ...prevData, questions: updatedQuestions };
						});
					} else if (setQuestionAdminQuestions) {
						setQuestionAdminQuestions(e.target.value);
					}
					setIsQuestionMissing(false);
				}}
				style={{
					background: 'linear-gradient(135deg, #4a7ba7 0%, #5a8bb7 100%)',
					width: isMobilePortrait ? '15rem' : isMobileLandscape ? '18rem' : isTabletPortrait ? '20rem' : '25rem',
					height: isMobilePortrait ? '3rem' : isMobileLandscape ? '3.5rem' : isTabletPortrait ? '4rem' : '5rem',
					color: 'white',
					padding: '0.5rem 0.5rem',
					fontFamily: theme.fontFamily?.main,
					fontSize: isMobileSize ? '1rem' : '1rem',
					textAlign: 'center',
					lineHeight: '1.5rem',
					border: 'none',
					borderTop: `solid 0.1rem ${theme.bgColor?.lessonInProgress}`,
					resize: 'none',
					borderRadius: '0 0 0.5rem 0.5rem',
					margin: 'auto 0',
				}}
				rows={7}
				placeholder={placeholder}
			/>
		</Box>
	);
};

export default FlipCardFrontFace;
