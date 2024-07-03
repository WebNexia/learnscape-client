import { Box } from '@mui/material';
import { QuestionInterface } from '../../interfaces/question';
import Question from './Question';
import { useState } from 'react';

interface QuestionsProps {
	questions: QuestionInterface[];
	lessonType?: string;
}

const Questions = ({ questions, lessonType }: QuestionsProps) => {
	const [displayedQuestionNumber, setDisplayedQuestionNumber] = useState<number>(1);
	const numberOfQuestions = questions.length;
	return (
		<Box>
			{questions &&
				questions.map((question, index) => (
					<Question
						key={question._id}
						question={question}
						questionNumber={index + 1}
						numberOfQuestions={numberOfQuestions}
						displayedQuestionNumber={displayedQuestionNumber}
						setDisplayedQuestionNumber={setDisplayedQuestionNumber}
						lessonType={lessonType}
					/>
				))}
		</Box>
	);
};

export default Questions;
