import React, { useContext } from 'react';
import { Tooltip, IconButton } from '@mui/material';
import theme from '../../../themes';
import { MediaQueryContext } from '../../../contexts/MediaQueryContextProvider';

interface CustomActionBtnProps {
	title: string;
	onClick: () => void;
	icon: React.ReactNode;
	placement?:
		| 'top'
		| 'bottom'
		| 'left'
		| 'right'
		| 'bottom-end'
		| 'bottom-start'
		| 'left-end'
		| 'left-start'
		| 'right-end'
		| 'right-start'
		| 'top-end'
		| 'top-start'
		| undefined;
	disabled?: boolean;
}

const CustomActionBtn = ({ title, onClick, icon, placement = 'top', disabled = false }: CustomActionBtnProps) => {
	const { isSmallScreen, isRotatedMedium } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;
	return (
		<Tooltip title={title} placement={placement} arrow>
			<IconButton
				sx={{
					'color': theme.textColor?.secondary.main,
					'padding': isMobileSize ? '0.1rem' : undefined,
					'&:hover': { backgroundColor: 'transparent' },
				}}
				onClick={onClick}
				disabled={disabled}>
				{icon}
			</IconButton>
		</Tooltip>
	);
};

export default CustomActionBtn;
