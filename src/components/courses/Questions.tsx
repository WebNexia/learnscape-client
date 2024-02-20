import { Box } from '@mui/material';
import { QuestionInterface } from '../../interfaces/question';
import Question from './Question';

interface QuestionsProps {
	questions: QuestionInterface[];
}

const Questions = ({ questions }: QuestionsProps) => {
	return (
		<Box>
			{questions.map((question, index) => (
				<Question key={question._id} question={question} questionNumber={index} />
			))}
		</Box>
	);
};

export default Questions;
