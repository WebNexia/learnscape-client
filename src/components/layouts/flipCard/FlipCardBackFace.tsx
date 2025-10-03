import { Box, Typography } from '@mui/material';
import theme from '../../../themes';
import { useContext } from 'react';
import { MediaQueryContext } from '../../../contexts/MediaQueryContextProvider';

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
	const { isSmallScreen, isRotatedMedium } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;
	return (
		<Box
			sx={{
				display: 'flex',
				flexDirection: 'column',
				alignItems: isMobileSize ? 'center' : 'flex-start',
				width: '100%',
				ml: isMobileSize ? '0rem' : '3rem',
				mt: isMobileSize ? '2rem' : undefined,
			}}>
			<Typography variant='body1' sx={{ width: isMobileSize ? '50vw' : '40vw' }}>
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
				maxLength={255}
				style={{
					backgroundColor: 'coral',
					width: '50vw',
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
