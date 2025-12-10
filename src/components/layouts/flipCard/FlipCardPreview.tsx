import { Box, styled, Typography } from '@mui/material';
import { useContext, useState } from 'react';
import theme from '../../../themes';
import { QuestionInterface } from '../../../interfaces/question';
import { useUserCourseLessonData } from '../../../hooks/useUserCourseLessonData';
import { MediaQueryContext } from '../../../contexts/MediaQueryContextProvider';
import { useSoundEffect } from '../../../hooks/useSoundEffect';

interface FlipCardInnerProps {
	isFlipped: boolean;
}

const FlipCardContainer = styled(Box)(
	({
		isMobilePortrait,
		isMobileLandscape,
		isTabletPortrait,
	}: {
		isMobilePortrait: boolean;
		isMobileLandscape: boolean;
		isTabletPortrait: boolean;
	}) => ({
		position: 'relative',
		display: 'flex',
		width: isMobilePortrait ? '15rem' : isMobileLandscape ? '18rem' : isTabletPortrait ? '20rem' : '25rem',
		height: isMobilePortrait ? '15rem' : isMobileLandscape ? '18rem' : isTabletPortrait ? '20rem' : '20rem',
		perspective: '50rem',
		cursor: 'pointer',
	})
);

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

interface FlipCardSideProps {
	$isImageQuestionPresent?: boolean;
}

const FlipCardSide = styled(Box, {
	shouldForwardProp: (prop) => prop !== '$isImageQuestionPresent',
})<FlipCardSideProps>(({ $isImageQuestionPresent }) => ({
	position: 'absolute',
	width: '100%',
	height: '100%',
	backfaceVisibility: 'hidden',
	display: 'flex',
	flexDirection: 'column',
	justifyContent: 'center',
	alignItems: 'center',
	padding: '0.25rem',
	color: 'white',
	borderRadius: '0.5rem',
	overflow: 'hidden',
}));

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
	isSoundMuted?: boolean;
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
	isSoundMuted = false,
}: FlipCardPreviewProps) => {
	const [isFlipped, setIsFlipped] = useState<boolean>(false);
	const { updateLastQuestion, getLastQuestion, handleNextLesson } = useUserCourseLessonData();

	const { isSmallScreen, isRotatedMedium, isMobilePortrait, isMobileLandscape, isTabletPortrait, isDesktopLandscape, isDesktopPortrait } =
		useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;

	// Sound effect for flip - enabled only for practice questions (not for edit/preview modes)
	const { playFlipSound } = useSoundEffect(fromPracticeQuestionUser, isSoundMuted);

	const handleClick = async () => {
		const newFlippedState = !isFlipped;
		setIsFlipped(newFlippedState);

		// Play flip sound when card is flipped (only in practice/question mode, not in edit mode)
		if (fromPracticeQuestionUser || questionNonEditModal) {
			playFlipSound();
		}

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

	const isImageQuestionPresent = !!(question?.imageUrl || newQuestion?.imageUrl) && !!(question?.question || newQuestion?.question);

	return (
		<FlipCardContainer isMobilePortrait={isMobilePortrait} isMobileLandscape={isMobileLandscape} isTabletPortrait={isTabletPortrait}>
			<FlipCardInner isFlipped={isFlipped} onClick={handleClick}>
				<FlipCardFront $isImageQuestionPresent={isImageQuestionPresent}>
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
								width: isMobilePortrait ? '13.5rem' : isMobileLandscape ? '16.5rem' : isTabletPortrait ? '18.5rem' : '22.5rem',
								height:
									(question?.question || newQuestion?.question) && isMobilePortrait
										? '12rem'
										: !(question?.question || newQuestion?.question) && isMobilePortrait
											? '13.5rem'
											: (question?.question || newQuestion?.question) && isMobileLandscape
												? '13rem'
												: !(question?.question || newQuestion?.question) && isMobileLandscape
													? '16rem'
													: (question?.question || newQuestion?.question) && isTabletPortrait
														? '16rem'
														: !(question?.question || newQuestion?.question) && isTabletPortrait
															? '19rem'
															: '18rem',
								objectFit: 'contain',
								borderRadius: '0.35rem',
							}}
						/>
					)}
					<Box
						sx={{
							display: 'flex',
							justifyContent: 'center',
							alignItems: 'center',
							marginTop: question?.imageUrl ? '1rem' : 0,
							textAlign: 'center',
							overflow: 'auto',
							width: '100%',
							padding: isDesktopLandscape ? '0rem 1rem' : '0rem 0.5rem',
							height: !(question?.question || newQuestion?.question)
								? '0rem'
								: isMobilePortrait
									? isImageQuestionPresent
										? '3rem'
										: '14rem'
									: isTabletPortrait
										? isImageQuestionPresent
											? '4rem'
											: '19rem'
										: isDesktopLandscape
											? isImageQuestionPresent
												? '5rem'
												: '19rem'
											: '5rem',
						}}>
						<Typography
							variant={question?.imageUrl ? 'body2' : 'body1'}
							sx={{
								'whiteSpace': 'pre-wrap',
								'wordWrap': 'break-word',
								'textOverflow': 'ellipsis',
								'color': theme.textColor?.common.main,
								'fontSize':
									isMobilePortrait || isMobileLandscape
										? isImageQuestionPresent
											? (frontText?.length && frontText.length > 20) || (question?.question?.length && question?.question?.length > 20)
												? '1rem'
												: '1.5rem'
											: !(question?.imageUrl || newQuestion?.imageUrl) && (question?.question || newQuestion?.question)
												? '1.5rem'
												: '1.75rem'
										: isTabletPortrait
											? isImageQuestionPresent
												? (frontText?.length && frontText.length > 20) || (question?.question?.length && question?.question?.length > 20)
													? '1.15rem'
													: '1.5rem'
												: !(question?.imageUrl || newQuestion?.imageUrl) && (question?.question || newQuestion?.question)
													? '2rem'
													: '1.75rem'
											: (frontText?.length && frontText.length > 20) || (question?.question?.length && question?.question?.length > 20)
												? '1.5rem'
												: '2.25rem',
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

				<FlipCardBack $isImageQuestionPresent={isImageQuestionPresent}>
					<Typography
						variant='body1'
						sx={{
							'whiteSpace': 'pre-wrap',
							'wordWrap': 'break-word',
							'textOverflow': 'ellipsis',
							'textAlign': 'center',
							'color': theme.textColor?.common.main,
							'fontSize': isMobilePortrait
								? (backText?.length && backText.length > 25) || (question?.correctAnswer?.length && question?.correctAnswer?.length > 25)
									? '1.15rem'
									: '1.5rem'
								: (backText?.length && backText.length > 25) || (question?.correctAnswer?.length && question?.correctAnswer?.length > 25)
									? '1.75rem'
									: '2.5rem',
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
