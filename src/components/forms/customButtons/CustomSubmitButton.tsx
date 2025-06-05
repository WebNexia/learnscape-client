import { Button, ButtonOwnProps } from '@mui/material';
import { FormEvent, MouseEvent, ReactNode } from 'react';
import theme from '../../../themes';

interface CustomSubmitButtonProps {
	children: ReactNode;
	fullWidth?: boolean;
	type?: 'submit' | 'button' | 'reset' | undefined;
	variant?: ButtonOwnProps['variant'];
	sx?: React.CSSProperties;
	onClick?: (event?: MouseEvent<HTMLButtonElement> | FormEvent<Element>) => void;
	disabled?: boolean;
	startIcon?: ReactNode;
	endIcon?: ReactNode;
	capitalize?: boolean;
	size?: 'small' | 'medium' | 'large';
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
}: CustomSubmitButtonProps) => {
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
				'backgroundColor': theme.bgColor?.greenPrimary,
				':hover': {
					backgroundColor: theme.bgColor?.common,
					color: theme.bgColor?.adminSubmitBtn,
				},
				'height': '1.75rem',
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
