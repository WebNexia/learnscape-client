import React, { memo } from 'react';
import { Box, styled } from '@mui/material';

const Dot = styled('div')(({ theme }) => ({
	width: 8,
	height: 8,
	margin: 2,
	backgroundColor: theme.palette.primary.main,
	borderRadius: '50%',
	animation: 'typing 1.5s infinite ease-in-out',
	'&:nth-of-type(1)': {
		animationDelay: '0s',
	},
	'&:nth-of-type(2)': {
		animationDelay: '0.3s',
	},
	'&:nth-of-type(3)': {
		animationDelay: '0.6s',
	},
	'@keyframes typing': {
		'0%, 100%': {
			transform: 'translateY(0)',
			opacity: 0.3,
		},
		'50%': {
			transform: 'translateY(-10px)',
			opacity: 1,
		},
	},
}));

const TypingAnimation: React.FC = memo(() => {
	return (
		<Box display='flex' justifyContent='center' alignItems='center'>
			<Dot />
			<Dot />
			<Dot />
		</Box>
	);
});

TypingAnimation.displayName = 'TypingAnimation';

export default TypingAnimation;
