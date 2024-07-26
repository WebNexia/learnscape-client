import { useState } from 'react';
import { Box, Typography } from '@mui/material';
import { styled } from '@mui/system';
import theme from '../../../themes'; // Adjust the import according to your project structure
import { QuestionInterface } from '../../../interfaces/question';
import FlipCardFrontFace from './FlipCardFrontFace';
import FlipCardBackFace from './FlipCardBackFace';
import { Lesson } from '../../../interfaces/lessons';

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
	boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
	overflow: 'hidden', // Ensure no overflow
});

const FlipCardFront = styled(FlipCardSide)({
	backgroundColor: theme.bgColor?.greenPrimary,
});

const FlipCardBack = styled(FlipCardSide)({
	backgroundColor: 'coral',
	transform: 'rotateY(180deg)',
});

interface FlipCardProps {
	newQuestion?: QuestionInterface;
	question?: QuestionInterface;
	setCorrectAnswer: React.Dispatch<React.SetStateAction<string>>;
	setNewQuestion?: React.Dispatch<React.SetStateAction<QuestionInterface>>;
	setIsQuestionMissing: React.Dispatch<React.SetStateAction<boolean>>;
	setSingleLessonBeforeSave?: React.Dispatch<React.SetStateAction<Lesson>> | undefined;
	setQuestionAdminQuestions?: React.Dispatch<React.SetStateAction<string>>;
	setCorrectAnswerAdminQuestions?: React.Dispatch<React.SetStateAction<string>>;
	setIsCorrectAnswerMissing: React.Dispatch<React.SetStateAction<boolean>>;
	fromLessonEditPage?: boolean;
	imageUrlAdminQuestions?: string;
}

const FlipCard = ({
	newQuestion,
	question,
	setCorrectAnswer,
	setNewQuestion,
	setIsQuestionMissing,
	setSingleLessonBeforeSave,
	setQuestionAdminQuestions,
	setCorrectAnswerAdminQuestions,
	setIsCorrectAnswerMissing,
	fromLessonEditPage,
	imageUrlAdminQuestions,
}: FlipCardProps) => {
	const [isFlipped, setIsFlipped] = useState<boolean>(false);
	const [frontText, setFrontText] = useState<string>(question?.question || newQuestion?.question || '');
	const [backText, setBackText] = useState<string>(question?.correctAnswer || newQuestion?.question || '');

	const handleClick = () => {
		setIsFlipped(!isFlipped);
	};

	return (
		<Box sx={{ width: '100%' }}>
			<Box sx={{ display: 'flex' }}>
				<FlipCardFrontFace
					frontText={frontText}
					setIsQuestionMissing={setIsQuestionMissing}
					setFrontText={setFrontText}
					question={question}
					newQuestion={newQuestion}
					setNewQuestion={setNewQuestion}
					setSingleLessonBeforeSave={setSingleLessonBeforeSave}
					setQuestionAdminQuestions={setQuestionAdminQuestions}
					fromLessonEditPage={fromLessonEditPage}
					imageUrlAdminQuestions={imageUrlAdminQuestions}
				/>
				<FlipCardBackFace
					backText={backText}
					setBackText={setBackText}
					setCorrectAnswer={setCorrectAnswer}
					setCorrectAnswerAdminQuestions={setCorrectAnswerAdminQuestions}
					fromLessonEditPage={fromLessonEditPage}
					setIsCorrectAnswerMissing={setIsCorrectAnswerMissing}
				/>
			</Box>

			{/* Flip Card Preview */}
			<Box>
				<Typography variant='body1' sx={{ margin: '3rem auto 0 auto', width: '50vh' }}>
					Preview
				</Typography>
			</Box>
			<FlipCardContainer>
				<FlipCardInner isFlipped={isFlipped} onClick={handleClick}>
					<FlipCardFront>
						{(question?.imageUrl || newQuestion?.imageUrl) && (
							<img
								src={setNewQuestion ? newQuestion?.imageUrl : fromLessonEditPage ? question?.imageUrl : imageUrlAdminQuestions}
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
								{frontText}
							</Typography>
						</Box>
					</FlipCardFront>

					<FlipCardBack>
						<Typography
							variant='body1'
							sx={{
								color: theme.textColor?.common.main,
							}}>
							{backText}
						</Typography>
					</FlipCardBack>
				</FlipCardInner>
			</FlipCardContainer>
		</Box>
	);
};

export default FlipCard;
