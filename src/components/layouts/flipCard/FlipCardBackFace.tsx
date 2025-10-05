import { Box, Typography } from '@mui/material';
import theme from '../../../themes';
import { useContext } from 'react';
import { MediaQueryContext } from '../../../contexts/MediaQueryContextProvider';
import styled from 'styled-components';

const StyledTextarea = styled('textarea')<{ isMobile: boolean }>(({ theme, isMobile }) => ({
	'&::placeholder': {
		fontSize: isMobile ? '0.7rem' : '0.9rem',
		color: 'rgba(255, 255, 255, 0.7)',
		fontStyle: 'italic',
		opacity: 0.8,
	},
	'&::-webkit-input-placeholder': {
		fontSize: isMobile ? '0.7rem' : '0.9rem',
		color: 'rgba(255, 255, 255, 0.7)',
		fontStyle: 'italic',
		opacity: 0.8,
	},
	'&::-moz-placeholder': {
		fontSize: isMobile ? '0.7rem' : '0.9rem',
		color: 'rgba(255, 255, 255, 0.7)',
		fontStyle: 'italic',
		opacity: 0.8,
	},
	'&:-ms-input-placeholder': {
		fontSize: isMobile ? '0.7rem' : '0.9rem',
		color: 'rgba(255, 255, 255, 0.7)',
		fontStyle: 'italic',
		opacity: 0.8,
	},
}));

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
				alignItems: 'center',
				ml: isMobileSize ? '0rem' : '3rem',
				mt: isMobileSize ? '2rem' : undefined,
			}}>
			<Typography variant={isMobileSize ? 'body2' : 'body1'} sx={{ textAlign: 'center' }}>
				Back
			</Typography>
			<StyledTextarea
				isMobile={isMobileSize}
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
					width: isMobileSize ? '15rem' : '25rem',
					height: isMobileSize ? '15rem' : '40vh',
					color: 'white',
					padding: '4rem 3rem',
					fontFamily: theme.fontFamily?.main,
					fontSize: isMobileSize ? '0.8rem' : '1rem',
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
