import { Box, Typography } from '@mui/material';
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
	const { isSmallScreen, isRotatedMedium } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;
	const FrontFaceImage = (
		<Box
			sx={{
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				backgroundColor: theme.bgColor?.greenPrimary,
				width: isMobileSize ? '20rem' : '25rem',
				height: isMobileSize ? '20rem' : '40vh',
				padding: '0.5rem',
				border: 'none',
				borderRadius: '0.5rem 0.5rem 0 0',
				objectFit: 'contain',
			}}>
			<img
				src={setNewQuestion ? newQuestion?.imageUrl : fromLessonEditPage ? question?.imageUrl : imageUrlAdminQuestions}
				alt='img'
				style={{
					width: '100%',
					height: '100%',
					objectFit: 'contain',
				}}
			/>
		</Box>
	);

	return (
		<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: isMobileSize ? '20rem' : '25rem' }}>
			<Typography variant={isMobileSize ? 'body2' : 'body1'}>Front</Typography>

			{question?.imageUrl || newQuestion?.imageUrl ? (
				FrontFaceImage
			) : (
				<Box
					sx={{
						backgroundColor: theme.bgColor?.greenPrimary,
						width: isMobileSize ? '15rem' : '25rem',
						height: isMobileSize ? '10rem' : '30vh',
						color: 'white',
						padding: '2rem 1rem',
						textAlign: 'center',
						border: 'none',
						borderRadius: '0.5rem 0.5rem 0 0',
						objectFit: 'contain',
					}}>
					<Typography variant={isMobileSize ? 'body2' : 'body1'}>No Image</Typography>
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
					backgroundColor: theme.bgColor?.greenPrimary,
					width: isMobileSize ? '15rem' : '25rem',
					height: isMobileSize ? '5rem' : '10vh',
					color: 'white',
					padding: '1rem 1rem',
					fontFamily: theme.fontFamily?.main,
					fontSize: isMobileSize ? '0.8rem' : '1rem',
					textAlign: 'center',
					lineHeight: '1.5rem',
					border: 'none',
					borderTop: `solid 0.1rem ${theme.bgColor?.lessonInProgress}`,
					resize: 'none',
					borderRadius: '0 0 0.5rem 0.5rem',
				}}
				rows={7}
				placeholder={placeholder}
			/>
		</Box>
	);
};

export default FlipCardFrontFace;
