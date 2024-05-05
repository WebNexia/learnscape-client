import React from 'react';
import { Tooltip, IconButton } from '@mui/material';
import theme from '../../../themes';

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
}

const CustomActionBtn = ({ title, onClick, icon, placement = 'top' }: CustomActionBtnProps) => {
	return (
		<Tooltip title={title} placement={placement}>
			<IconButton sx={{ color: theme.textColor?.secondary.main }} onClick={onClick}>
				{icon}
			</IconButton>
		</Tooltip>
	);
};

export default CustomActionBtn;
