import { TextField, TextFieldProps } from '@mui/material';
import { ChangeEvent } from 'react';

interface TextFieldGeneratorProps {
	label: string;
	value: string;
	type: string;
	onChange: (e: ChangeEvent<HTMLInputElement>) => void;
	variant?: TextFieldProps['variant']; //there are defined variant values in mui
	size?: TextFieldProps['size']; //there are defined size (small | medium) values in mui
	fullWidth: boolean;
}

const TextFieldGenerator = ({
	variant,
	label,
	type,
	value,
	onChange,
	fullWidth,
	size,
	...rest
}: TextFieldGeneratorProps) => {
	return (
		<TextField
			variant={variant}
			label={label}
			type={type}
			value={value}
			onChange={onChange}
			size={size}
			sx={{ marginBottom: '0.85rem' }}
			fullWidth={fullWidth}
			{...rest}
		/>
	);
};

export default TextFieldGenerator;
