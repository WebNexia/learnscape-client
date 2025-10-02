import { Button, ButtonOwnProps } from '@mui/material';
import { MediaQueryContext } from '../../../contexts/MediaQueryContextProvider';
import { FormEvent, MouseEvent, ReactNode, useContext } from 'react';

interface CustomDeleteButtonProps {
	children?: ReactNode;
	type?: 'submit' | 'button' | 'reset' | undefined;
	variant?: ButtonOwnProps['variant'];
	sx?: React.CSSProperties;
	onClick?: (event?: MouseEvent<HTMLButtonElement> | FormEvent<Element>) => void;
	disabled?: boolean;
	size?: 'small' | 'medium' | 'large';
}

const CustomDeleteButton = ({
	children = 'Delete',
	type = 'submit',
	variant = 'contained',
	onClick,
	sx,
	disabled,
	size = 'small',
}: CustomDeleteButtonProps) => {
	const { isSmallScreen, isRotatedMedium } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;
	return (
		<Button
			type={type}
			variant={variant}
			sx={{
				...sx,
				'textTransform': 'capitalize',
				'backgroundColor': 'error.main',
				'ml': '0.75rem',
				':hover': {
					backgroundColor: 'error.light',
				},
				'height': isMobileSize ? '1.5rem' : '1.75rem',
				'fontSize': isMobileSize ? '0.7rem' : '0.85rem',
				'mt': '0.2rem',
			}}
			onClick={onClick}
			disabled={disabled}
			size={size}>
			{children}
		</Button>
	);
};

export default CustomDeleteButton;
