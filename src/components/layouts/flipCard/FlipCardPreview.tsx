import { Box, styled, Typography } from '@mui/material';
import { useContext, useState } from 'react';
import theme from '../../../themes';
import { QuestionInterface } from '../../../interfaces/question';
import { useUserCourseLessonData } from '../../../hooks/useUserCourseLessonData';
import { MediaQueryContext } from '../../../contexts/MediaQueryContextProvider';

interface FlipCardInnerProps {
	isFlipped: boolean;
}

const FlipCardContainer = styled(Box)(({ isMobileSize }: { isMobileSize: boolean }) => ({
	position: 'relative',
	display: 'flex',
	width: isMobileSize ? '15rem' : '25rem',
	height: isMobileSize ? '15rem' : '40vh',
	perspective: '50rem',
	cursor: 'pointer',
}));

const FlipCardInner = styled(Box, {
	shouldForwardProp: (prop) => prop !== 'isFlipped',
})<FlipCardInnerProps>(({ isFlipped }) => ({
	position: 'absolute',
	width: '100%',
	height: '100%',
	transition: 'transform 0.6s',
	transformStyle: 'preserve-3d',
	transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
	boxShadow: '0 0 0.4rem 0.2rem rgba(0,0,0,0.2)',
	borderRadius: '0.5rem',
}));

const FlipCardSide = styled(Box)({
	position: 'absolute',
	width: '100%',
	height: '100%',
	backfaceVisibility: 'hidden',
	display: 'flex',
	flexDirection: 'column',
	justifyContent: 'center',
	alignItems: 'center',
	padding: '2rem',
	color: 'white',
	borderRadius: '0.5rem',
	overflow: 'hidden',
});

const FlipCardFront = styled(FlipCardSide)({
	background: 'linear-gradient(135deg, #4a7ba7 0%, #5a8bb7 100%)',
});

const FlipCardBack = styled(FlipCardSide)({
	background: 'linear-gradient(135deg, #c47a6a 0%, #d48a7a 100%)',
	transform: 'rotateY(180deg)',
});

interface FlipCardPreviewProps {
	questionNonEditModal?: boolean;
	fromPracticeQuestionUser?: boolean;
	newQuestion?: QuestionInterface;
	question?: QuestionInterface;
	frontText?: string;
	backText?: string;
	fromLessonEditPage?: boolean;
	imageUrlAdminQuestions?: string;
	displayedQuestionNumber?: number;
	numberOfQuestions?: number;
	setNewQuestion?: React.Dispatch<React.SetStateAction<QuestionInterface>> | undefined;
	setIsCardFlipped?: React.Dispatch<React.SetStateAction<boolean>>;
	setIsLessonCompleted?: React.Dispatch<React.SetStateAction<boolean>>;
	setShowQuestionSelector?: React.Dispatch<React.SetStateAction<boolean>>;
}

const FlipCardPreview = ({
	questionNonEditModal,
	fromPracticeQuestionUser,
	newQuestion,
	question,
	frontText,
	backText,
	fromLessonEditPage,
	imageUrlAdminQuestions,
	displayedQuestionNumber,
	numberOfQuestions,
	setNewQuestion,
	setIsCardFlipped,
	setIsLessonCompleted,
	setShowQuestionSelector,
}: FlipCardPreviewProps) => {
	const [isFlipped, setIsFlipped] = useState<boolean>(false);
	const { updateLastQuestion, getLastQuestion, handleNextLesson } = useUserCourseLessonData();

	const { isSmallScreen, isRotatedMedium, isVerySmallScreen } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;

	const handleClick = async () => {
		setIsFlipped(!isFlipped);
		if (setIsCardFlipped) setIsCardFlipped(true);

		if (displayedQuestionNumber && numberOfQuestions) {
			if (displayedQuestionNumber + 1 <= numberOfQuestions && getLastQuestion() <= displayedQuestionNumber) {
				updateLastQuestion(displayedQuestionNumber + 1);
			}
			if (displayedQuestionNumber === numberOfQuestions) {
				await handleNextLesson();
				if (setIsLessonCompleted) setIsLessonCompleted(true);
				if (setShowQuestionSelector) setShowQuestionSelector(true);
			}
		}
	};

	return (
		<FlipCardContainer isMobileSize={isMobileSize}>
			<FlipCardInner isFlipped={isFlipped} onClick={handleClick}>
				<FlipCardFront>
					{/* <Label>Front</Label> */}
					{(question?.imageUrl || newQuestion?.imageUrl) && (
						<img
							src={
								setNewQuestion
									? newQuestion?.imageUrl
									: fromLessonEditPage || fromPracticeQuestionUser || questionNonEditModal
										? question?.imageUrl
										: imageUrlAdminQuestions
							}
							alt='img'
							style={{
								width: '100%',
								height: question?.question ? '70%' : '90%',
								objectFit: 'contain',
								borderRadius: '0.5rem 0.5rem 0 0',
							}}
						/>
					)}
					<Box
						sx={{
							marginTop: question?.imageUrl ? '1rem' : 0,
							textAlign: 'center',
							padding: '0 1rem',
							maxHeight: question?.imageUrl ? 'calc(70% - 1rem)' : '100%',
							overflow: 'auto',
							width: '100%',
						}}>
						<Typography
							variant={question?.imageUrl ? 'body2' : 'body1'}
							sx={{
								'whiteSpace': 'pre-wrap',
								'wordWrap': 'break-word',
								'textOverflow': 'ellipsis',
								'color': theme.textColor?.common.main,
								'fontSize': isMobileSize
									? (frontText?.length && frontText.length > 40) || (question?.question?.length && question?.question?.length > 40)
										? '1.15rem'
										: '1.75rem'
									: (frontText?.length && frontText.length > 40) || (question?.question?.length && question?.question?.length > 40)
										? '1.75rem'
										: '2.75rem',
								'& strong': {
									fontWeight: 'bold',
								},
								'& em': {
									fontStyle: 'italic',
								},
								'& strong em, & em strong': {
									fontWeight: 'bold',
									fontStyle: 'italic',
								},
							}}
							dangerouslySetInnerHTML={{
								__html: (frontText || question?.question || '').replace(/\*(.*?)\*/g, '<strong>$1</strong>').replace(/_(.*?)_/g, '<em>$1</em>'),
							}}
						/>
					</Box>
				</FlipCardFront>

				<FlipCardBack>
					<Typography
						variant={isMobileSize ? 'body2' : 'body1'}
						sx={{
							'whiteSpace': 'pre-wrap',
							'wordWrap': 'break-word',
							'textOverflow': 'ellipsis',
							'textAlign': 'center',
							'color': theme.textColor?.common.main,
							'fontSize': isMobileSize
								? (backText?.length && backText.length > 40) || (question?.correctAnswer?.length && question?.correctAnswer?.length > 40)
									? '1.15rem'
									: '1.5rem'
								: (backText?.length && backText.length > 40) || (question?.correctAnswer?.length && question?.correctAnswer?.length > 40)
									? '1.75rem'
									: '2.75rem',
							'& strong': {
								fontWeight: 'bold',
							},
							'& em': {
								fontStyle: 'italic',
							},
							'& strong em, & em strong': {
								fontWeight: 'bold',
								fontStyle: 'italic',
							},
						}}
						dangerouslySetInnerHTML={{
							__html: (backText || question?.correctAnswer || '').replace(/\*(.*?)\*/g, '<strong>$1</strong>').replace(/_(.*?)_/g, '<em>$1</em>'),
						}}
					/>
				</FlipCardBack>
			</FlipCardInner>
		</FlipCardContainer>
	);
};

export default FlipCardPreview;
