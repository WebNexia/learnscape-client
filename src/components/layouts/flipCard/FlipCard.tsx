import { useContext, useState } from 'react';
import { Box, Typography } from '@mui/material';
import { QuestionInterface } from '../../../interfaces/question';
import FlipCardFrontFace from './FlipCardFrontFace';
import FlipCardBackFace from './FlipCardBackFace';
import { Lesson } from '../../../interfaces/lessons';
import FlipCardPreview from './FlipCardPreview';
import { MediaQueryContext } from '../../../contexts/MediaQueryContextProvider';

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

	const { isSmallScreen, isRotatedMedium } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;

	return (
		<Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', mt: isMobileSize ? '2rem' : '0rem' }}>
			<Box
				sx={{
					display: 'flex',
					flexDirection: isMobileSize ? 'column' : 'row',
					justifyContent: 'center',
					alignItems: 'center',
					width: '100%',
					mt: isMobileSize ? '-3rem' : undefined,
				}}>
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
			<Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', mt: '3rem' }}>
				<Box>
					<Typography variant={isMobileSize ? 'body2' : 'body1'} sx={{ textAlign: 'center' }}>
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
		</Box>
	);
};

export default FlipCard;
