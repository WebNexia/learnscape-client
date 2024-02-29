import {
	Box,
	Button,
	FormControl,
	FormControlLabel,
	FormHelperText,
	FormLabel,
	Radio,
	RadioGroup,
} from '@mui/material';
import { QuestionInterface } from '../../interfaces/question';
import { useState } from 'react';

interface QuestionsProps {
	question: QuestionInterface;
	questionNumber: number;
	numberOfQuestions: number;
	displayedQuestionNumber: number;
	setDisplayedQuestionNumber: React.Dispatch<React.SetStateAction<number>>;
}

const Question = ({
	question,
	questionNumber,
	numberOfQuestions,
	displayedQuestionNumber,
	setDisplayedQuestionNumber,
}: QuestionsProps) => {
	const [value, setValue] = useState<string>('');
	const [error, setError] = useState<boolean>(false);
	const [helperText, setHelperText] = useState<string>('Choose wisely');
	const [isAnswerCorrect, setIsAnswerCorrect] = useState<boolean>(false);

	const handleRadioChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		setValue((event.target as HTMLInputElement).value);
		setHelperText(' ');
		setError(false);
	};

	const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		if (value === question.correctAnswer?.toString()) {
			setHelperText('You got it!');
			setError(false);
			setIsAnswerCorrect(true);
		} else if (value !== question.correctAnswer && value !== '') {
			setHelperText('Sorry, wrong answer!');
			setError(true);
			setIsAnswerCorrect(false);
		} else {
			setHelperText('Please select an option.');
			setError(true);
			setIsAnswerCorrect(false);
		}
	};
	return (
		<Box
			sx={{
				display: displayedQuestionNumber === questionNumber ? 'flex' : 'none',
				flexDirection: 'column',
				alignItems: 'center',
			}}>
			<form onSubmit={handleSubmit}>
				<FormControl sx={{ m: 3 }} error={error} variant='standard'>
					<FormLabel>
						{questionNumber}. {question.question}
					</FormLabel>
					<RadioGroup name='question' value={value} onChange={handleRadioChange}>
						<FormControlLabel value={question.optionOne} control={<Radio />} label={question.optionOne} />
						<FormControlLabel value={question.optionTwo} control={<Radio />} label={question.optionTwo} />
						<FormControlLabel
							value={question.optionThree}
							control={<Radio />}
							label={question.optionThree}
						/>
						<FormControlLabel value={question.optionFour} control={<Radio />} label={question.optionFour} />
					</RadioGroup>
					<FormHelperText>{helperText}</FormHelperText>
					<Button sx={{ mt: '2rem' }} type='submit' variant='outlined'>
						Check Answer
					</Button>
				</FormControl>
			</form>

			<Box sx={{ display: 'flex', justifyContent: 'space-around', margin: '2rem', width: '50%' }}>
				<Button
					sx={{ display: displayedQuestionNumber - 1 === 0 ? 'none' : 'block' }}
					variant='outlined'
					onClick={() => {
						if (!(displayedQuestionNumber - 1 === 0)) {
							setDisplayedQuestionNumber((prev) => prev - 1);
						}
					}}
					disabled={displayedQuestionNumber - 1 === 0}>
					Previous
				</Button>

				<Button
					sx={{ display: displayedQuestionNumber + 1 > numberOfQuestions ? 'none' : 'block' }}
					variant='outlined'
					onClick={() => {
						if (!(displayedQuestionNumber + 1 > numberOfQuestions)) {
							setDisplayedQuestionNumber((prev) => prev + 1);
						}
					}}
					disabled={!isAnswerCorrect}>
					Next
				</Button>
			</Box>
		</Box>
	);
};

export default Question;
