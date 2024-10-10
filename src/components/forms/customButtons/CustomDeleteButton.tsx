import { Button, ButtonOwnProps } from '@mui/material';
import { FormEvent, MouseEvent, ReactNode } from 'react';

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
	return (
		<Button
			type={type}
			variant={variant}
			sx={{
				...sx,
				textTransform: 'capitalize',
				backgroundColor: 'error.main',
				ml: '0.75rem',
				':hover': {
					backgroundColor: 'error.light',
				},
			}}
			onClick={onClick}
			disabled={disabled}
			size={size}>
			{children}
		</Button>
	);
};

export default CustomDeleteButton;
