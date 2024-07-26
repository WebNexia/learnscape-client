import { useState } from 'react';
import { Box, Typography } from '@mui/material';
import { QuestionInterface } from '../../../interfaces/question';
import FlipCardFrontFace from './FlipCardFrontFace';
import FlipCardBackFace from './FlipCardBackFace';
import { Lesson } from '../../../interfaces/lessons';
import FlipCardPreview from './FlipCardPreview';

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
	const [frontText, setFrontText] = useState<string>(question?.question || newQuestion?.question || '');
	const [backText, setBackText] = useState<string>(question?.correctAnswer || newQuestion?.question || '');

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
			<FlipCardPreview
				question={question}
				newQuestion={newQuestion}
				fromLessonEditPage={fromLessonEditPage}
				imageUrlAdminQuestions={imageUrlAdminQuestions}
				frontText={frontText}
				backText={backText}
				setNewQuestion={setNewQuestion}
			/>
		</Box>
	);
};

export default FlipCard;
