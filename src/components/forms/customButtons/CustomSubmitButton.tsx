import { Button, ButtonOwnProps } from '@mui/material';
import { FormEvent, MouseEvent, ReactNode } from 'react';
import theme from '../../../themes';

interface CustomSubmitButtonProps {
	children: ReactNode;
	type?: 'submit' | 'button' | 'reset' | undefined;
	variant?: ButtonOwnProps['variant'];
	sx?: React.CSSProperties;
	onClick?: (event?: MouseEvent<HTMLButtonElement> | FormEvent<Element>) => void;
	disabled?: boolean;
}

const CustomSubmitButton = ({ children, type = 'submit', variant = 'contained', sx, onClick, disabled }: CustomSubmitButtonProps) => {
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
			sx={{
				...sx,
				textTransform: 'capitalize',
				backgroundColor: theme.bgColor?.greenPrimary,
				':hover': {
					backgroundColor: theme.bgColor?.common,
					color: theme.textColor?.greenPrimary.main,
				},
			}}
			onClick={handleClick}>
			{children}
		</Button>
	);
};

export default CustomSubmitButton;
