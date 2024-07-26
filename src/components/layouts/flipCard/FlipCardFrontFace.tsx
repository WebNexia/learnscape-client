import { Box, Typography } from '@mui/material';
import theme from '../../../themes';
import { QuestionInterface } from '../../../interfaces/question';
import { Lesson } from '../../../interfaces/lessons';

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
}: FlipCardFrontFaceProps) => {
	const FrontFaceImage = (
		<Box
			sx={{
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				backgroundColor: theme.bgColor?.greenPrimary,
				width: '50vh',
				height: '25vh',
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
		<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', width: '100%' }}>
			<Typography variant='body1' sx={{ width: '50vh' }}>
				Front
			</Typography>

			{question?.imageUrl || newQuestion?.imageUrl ? (
				FrontFaceImage
			) : (
				<Box
					sx={{
						backgroundColor: theme.bgColor?.greenPrimary,
						width: '50vh',
						height: '25vh',
						color: 'white',
						padding: '2rem 1rem',
						textAlign: 'center',
						border: 'none',
						borderRadius: '0.5rem 0.5rem 0 0',
						objectFit: 'contain',
					}}>
					<Typography variant='body1'>No Image</Typography>
				</Box>
			)}

			<textarea
				value={frontText}
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
					width: '50vh',
					height: '15vh',
					color: 'white',
					padding: '1rem 1rem',
					fontFamily: theme.fontFamily?.main,
					fontSize: '1rem',
					textAlign: 'center',
					lineHeight: '1.5rem',
					border: 'none',
					borderTop: `solid 0.1rem ${theme.bgColor?.lessonInProgress}`,
					resize: 'none',
					borderRadius: '0 0 0.5rem 0.5rem',
				}}
				rows={7}
				placeholder='Enter Front Face Text'
			/>
		</Box>
	);
};

export default FlipCardFrontFace;
