import { Box, Typography } from '@mui/material';
import theme from '../../../themes';

interface FlipCardBackFaceProps {
	backText: string;
	setBackText: React.Dispatch<React.SetStateAction<string>>;
	setCorrectAnswer: React.Dispatch<React.SetStateAction<string>>;
	setCorrectAnswerAdminQuestions: React.Dispatch<React.SetStateAction<string>> | undefined;
	setIsCorrectAnswerMissing: React.Dispatch<React.SetStateAction<boolean>>;
	fromLessonEditPage: boolean | undefined;
}

const FlipCardBackFace = ({
	backText,
	setBackText,
	setCorrectAnswer,
	setCorrectAnswerAdminQuestions,
	fromLessonEditPage,
	setIsCorrectAnswerMissing,
}: FlipCardBackFaceProps) => {
	return (
		<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', width: '100%', ml: '3rem' }}>
			<Typography variant='body1' sx={{ width: '40vh' }}>
				Back
			</Typography>
			<textarea
				value={backText}
				onChange={(e) => {
					setBackText(e.target.value);
					setCorrectAnswer(e.target.value);
					if (!fromLessonEditPage && setCorrectAnswerAdminQuestions) {
						setCorrectAnswerAdminQuestions(e.target.value);
					}
					setIsCorrectAnswerMissing(false);
				}}
				style={{
					backgroundColor: 'coral',
					width: '50vh',
					height: '40vh',
					color: 'white',
					padding: '4rem 3rem',
					fontFamily: theme.fontFamily?.main,
					fontSize: '1rem',
					textAlign: 'center',
					lineHeight: '1.5rem',
					border: 'none',
					resize: 'none',
					borderRadius: '0.5rem',
				}}
				rows={7}
				placeholder='Enter Back Face Text'
			/>
		</Box>
	);
};

export default FlipCardBackFace;
