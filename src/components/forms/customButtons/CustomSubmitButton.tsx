import { Button, ButtonOwnProps } from '@mui/material';
import { FormEvent, MouseEvent, ReactNode, useContext } from 'react';
import theme from '../../../themes';
import { UserAuthContext } from '../../../contexts/UserAuthContextProvider';
import { Roles } from '../../../interfaces/enums';

interface CustomSubmitButtonProps {
	children: ReactNode;
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
	type = 'submit',
	variant = 'contained',
	sx,
	onClick,
	disabled,
	startIcon,
	endIcon,
	capitalize = true,
	size,
}: CustomSubmitButtonProps) => {
	const { user } = useContext(UserAuthContext);
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
				textTransform: capitalize ? 'capitalize' : 'none',
				backgroundColor: user?.role === Roles.ADMIN ? theme.bgColor?.greenPrimary : theme.bgColor?.greenPrimary,
				':hover': {
					backgroundColor: theme.bgColor?.common,
					color: theme.bgColor?.adminSubmitBtn,
				},
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
