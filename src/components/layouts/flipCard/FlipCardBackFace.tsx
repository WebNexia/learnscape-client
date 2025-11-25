import { Box, Typography, Tooltip, IconButton } from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
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
	const { isSmallScreen, isRotatedMedium, isMobilePortrait, isMobileLandscape, isTabletPortrait } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;
	return (
		<Box
			sx={{
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				ml: isMobilePortrait ? '0rem' : isMobileLandscape ? '2rem' : isTabletPortrait ? '2rem' : '3rem',
				mt: isMobilePortrait ? '2rem' : undefined,
			}}>
			<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
				<Typography variant={isMobileSize ? 'body2' : 'body1'} sx={{ textAlign: 'center' }}>
					Back
				</Typography>
				<Tooltip
					title={
						<Box sx={{ p: 1 }}>
							<Typography variant='body2' sx={{ fontWeight: 'bold', mb: 0.5, color: 'white' }}>
								Text Formatting Help:
							</Typography>
							<Typography variant='body2' sx={{ mb: 0.5, color: 'white' }}>
								*text* ---&gt; <strong>text</strong>
							</Typography>
							<Typography variant='body2' sx={{ color: 'white' }}>
								_text_ ---&gt; <em>text</em>
							</Typography>
						</Box>
					}
					arrow
					placement='top'
					sx={{
						'& .MuiTooltip-tooltip': {
							backgroundColor: '#2c3e50',
							color: 'white',
							fontSize: '0.875rem',
							border: '1px solid #34495e',
						},
						'& .MuiTooltip-arrow': {
							color: '#2c3e50',
						},
					}}>
					<IconButton size='small' sx={{ p: 0.5 }}>
						<InfoIcon sx={{ fontSize: '1rem' }} />
					</IconButton>
				</Tooltip>
			</Box>
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
					background: 'linear-gradient(135deg, #c47a6a 0%, #d48a7a 100%)',
					width: isMobilePortrait ? '15rem' : isMobileLandscape ? '18rem' : isTabletPortrait ? '20rem' : '25rem',
					height: isMobilePortrait ? '15rem' : isMobileLandscape ? '18rem' : isTabletPortrait ? '20rem' : '20rem',
					color: 'white',
					padding: '3rem 2rem',
					fontFamily: theme.fontFamily?.main,
					fontSize: isMobilePortrait ? '1rem' : '1.5rem',
					textAlign: 'center',
					lineHeight: '1.5rem',
					border: 'none',
					resize: 'none',
					borderRadius: '0.5rem',
				}}
				rows={7}
				placeholder={`Enter Back Face Text`}
			/>
		</Box>
	);
};

export default FlipCardBackFace;
