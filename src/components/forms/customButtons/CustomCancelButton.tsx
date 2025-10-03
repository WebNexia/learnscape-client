import { Button, ButtonOwnProps } from '@mui/material';
import { MediaQueryContext } from '../../../contexts/MediaQueryContextProvider';
import { FormEvent, MouseEvent, ReactNode, useContext } from 'react';

interface CustomCancelButtonProps {
	children?: ReactNode;
	type?: 'submit' | 'button' | 'reset' | undefined;
	variant?: ButtonOwnProps['variant'];
	sx?: React.CSSProperties;
	onClick?: (event?: MouseEvent<HTMLButtonElement> | FormEvent<Element>) => void;
	size?: 'small' | 'medium' | 'large';
	disabled?: boolean;
}

const CustomCancelButton = ({
	children = 'Cancel',
	type = 'reset',
	variant = 'outlined',
	sx,
	onClick,
	size = 'small',
	disabled,
}: CustomCancelButtonProps) => {
	const { isSmallScreen, isRotatedMedium } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;
	return (
		<Button
			type={type}
			variant={variant}
			sx={{
				...sx,
				textTransform: 'capitalize',
				ml: '0.5rem',
				height: isMobileSize ? '1.5rem' : '1.75rem',
				mt: '0.2rem',
				fontSize: isMobileSize ? '0.7rem' : '0.85rem',
			}}
			onClick={onClick}
			size={size}
			disabled={disabled}>
			{children}
		</Button>
	);
};

export default CustomCancelButton;
