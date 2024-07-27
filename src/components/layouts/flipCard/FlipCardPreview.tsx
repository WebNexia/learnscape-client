import { Box, styled, Typography } from '@mui/material';
import { useState } from 'react';
import theme from '../../../themes';
import { QuestionInterface } from '../../../interfaces/question';

interface FlipCardInnerProps {
	isFlipped: boolean;
}

const FlipCardContainer = styled(Box)({
	position: 'relative',
	display: 'flex',
	width: '50vh',
	height: '40vh',
	perspective: '50rem',
	margin: '0 auto 3rem auto',
	cursor: 'pointer',
});

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
	backgroundColor: theme.bgColor?.greenPrimary,
});

const FlipCardBack = styled(FlipCardSide)({
	backgroundColor: 'coral',
	transform: 'rotateY(180deg)',
});

// const Label = styled(Typography)({
// 	position: 'absolute',
// 	top: '0.5rem',
// 	right: '0.5rem',
// 	color: theme.bgColor?.lessonInProgress,
// 	fontSize: '0.85rem',
// });

interface FlipCardPreviewProps {
	questionNonEditModal?: boolean;
	fromPracticeQuestionUser?: boolean;
	newQuestion?: QuestionInterface;
	question?: QuestionInterface;
	frontText?: string;
	backText?: string;
	fromLessonEditPage?: boolean;
	imageUrlAdminQuestions?: string;
	setNewQuestion?: React.Dispatch<React.SetStateAction<QuestionInterface>> | undefined;
	setIsCardFlipped?: React.Dispatch<React.SetStateAction<boolean>>;
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
	setNewQuestion,
	setIsCardFlipped,
}: FlipCardPreviewProps) => {
	const [isFlipped, setIsFlipped] = useState<boolean>(false);

	const handleClick = () => {
		setIsFlipped(!isFlipped);
		if (setIsCardFlipped) setIsCardFlipped(true);
	};

	return (
		<FlipCardContainer>
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
						}}>
						<Typography
							variant={question?.imageUrl ? 'body2' : 'body1'}
							sx={{
								whiteSpace: 'pre-wrap',
								wordWrap: 'break-word',
								textOverflow: 'ellipsis',
								color: theme.textColor?.common.main,
							}}>
							{frontText || question?.question}
						</Typography>
					</Box>
				</FlipCardFront>

				<FlipCardBack>
					{/* <Label>Back</Label> */}
					<Typography
						variant='body1'
						sx={{
							color: theme.textColor?.common.main,
						}}>
						{backText || question?.correctAnswer}
					</Typography>
				</FlipCardBack>
			</FlipCardInner>
		</FlipCardContainer>
	);
};

export default FlipCardPreview;
