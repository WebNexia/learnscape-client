import { Button, ButtonOwnProps, SxProps, Theme } from '@mui/material';
import { FormEvent, MouseEvent, ReactNode, useContext } from 'react';
import theme from '../../../themes';
import { MediaQueryContext } from '../../../contexts/MediaQueryContextProvider';

interface CustomSubmitButtonProps {
	children: ReactNode;
	fullWidth?: boolean;
	type?: 'submit' | 'button' | 'reset' | undefined;
	variant?: ButtonOwnProps['variant'];
	sx?: SxProps<Theme>;
	onClick?: (event?: MouseEvent<HTMLButtonElement> | FormEvent<Element>) => void;
	disabled?: boolean;
	startIcon?: ReactNode;
	endIcon?: ReactNode;
	capitalize?: boolean;
	size?: 'small' | 'medium' | 'large';
	unsaved?: boolean;
}

const CustomSubmitButton = ({
	children,
	fullWidth = false,
	type = 'submit',
	variant = 'contained',
	sx,
	onClick,
	disabled,
	startIcon,
	endIcon,
	capitalize = true,
	size = 'small',
	unsaved = false,
}: CustomSubmitButtonProps) => {
	const { isSmallScreen, isRotatedMedium } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;
	const handleClick = (event: MouseEvent<HTMLButtonElement> | FormEvent<Element>) => {
		if (onClick) {
			onClick(event);
		}
	};
	return (
		<Button
			type={type}
			variant={variant}
			disabled={disabled}
			fullWidth={fullWidth}
			sx={{
				...sx,
				'textTransform': capitalize ? 'capitalize' : 'none',
				'backgroundColor': unsaved ? '#ff9800' : theme.bgColor?.greenPrimary,
				':hover': {
					backgroundColor: theme.bgColor?.common,
					color: theme.bgColor?.adminSubmitBtn,
				},
				'height': isMobileSize ? '1.5rem' : '1.75rem',
				'fontSize': isMobileSize ? '0.7rem' : '0.85rem',
				'mt': '0.2rem',
			}}
			size={size}
			onClick={handleClick}
			startIcon={startIcon}
			endIcon={endIcon}>
			{children}
		</Button>
	);
};

export default CustomSubmitButton;
