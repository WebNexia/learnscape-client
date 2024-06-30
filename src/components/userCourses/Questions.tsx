import { Box } from '@mui/material';
import { QuestionInterface } from '../../interfaces/question';
import Question from './Question';
import { useState } from 'react';
import { generateUniqueId } from '../../utils/uniqueIdGenerator';

interface QuestionsProps {
	questions: QuestionInterface[];
}

const Questions = ({ questions }: QuestionsProps) => {
	const [displayedQuestionNumber, setDisplayedQuestionNumber] = useState<number>(1);
	const numberOfQuestions = questions.length;
	return (
		<Box>
			{questions &&
				questions.map((question, index) => (
					<Question
						key={generateUniqueId(question._id)}
						question={question}
						questionNumber={index + 1}
						numberOfQuestions={numberOfQuestions}
						displayedQuestionNumber={displayedQuestionNumber}
						setDisplayedQuestionNumber={setDisplayedQuestionNumber}
					/>
				))}
		</Box>
	);
};

export default Questions;
