import { Box, Typography } from '@mui/material';
import { QuestionInterface } from '../../interfaces/question';

interface QuestionsProps {
	question: QuestionInterface;
	questionNumber: number;
}

const Question = ({ question, questionNumber }: QuestionsProps) => {
	return (
		<Box>
			<Typography variant='h4'>
				{questionNumber + 1}. {question.question}
			</Typography>
			<Typography variant='h6'>a. {question.optionOne}</Typography>
			<Typography variant='h6'>b. {question.optionTwo}</Typography>
			<Typography variant='h6'>c. {question.optionThree}</Typography>
			<Typography variant='h6'>d. {question.optionFour}</Typography>
		</Box>
	);
};

export default Question;
