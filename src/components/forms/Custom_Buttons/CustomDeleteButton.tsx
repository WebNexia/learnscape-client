import { Button, ButtonOwnProps } from '@mui/material';
import { FormEvent, MouseEvent, ReactNode } from 'react';

interface CustomDeleteButtonProps {
	children?: ReactNode;
	type?: 'submit' | 'button' | 'reset' | undefined;
	variant?: ButtonOwnProps['variant'];
	sx?: React.CSSProperties;
	onClick?: (event?: MouseEvent<HTMLButtonElement> | FormEvent<Element>) => void;
}

const CustomDeleteButton = ({
	children = 'Delete',
	type = 'submit',
	variant = 'contained',
	onClick,
	sx,
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
			onClick={onClick}>
			{children}
		</Button>
	);
};

export default CustomDeleteButton;
