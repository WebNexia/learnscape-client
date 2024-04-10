import { Button, ButtonOwnProps } from '@mui/material';
import { FormEvent, MouseEvent, ReactNode } from 'react';

interface CustomCancelButtonProps {
	children?: ReactNode;
	type?: 'submit' | 'button' | 'reset' | undefined;
	variant?: ButtonOwnProps['variant'];
	sx?: React.CSSProperties;
	onClick?: (event?: MouseEvent<HTMLButtonElement> | FormEvent<Element>) => void;
}

const CustomCancelButton = ({
	children = 'Cancel',
	type = 'reset',
	variant = 'outlined',
	sx,
	onClick,
}: CustomCancelButtonProps) => {
	return (
		<Button
			type={type}
			variant={variant}
			sx={{ ...sx, textTransform: 'capitalize', ml: '0.5rem' }}
			onClick={onClick}>
			{children}
		</Button>
	);
};

export default CustomCancelButton;
