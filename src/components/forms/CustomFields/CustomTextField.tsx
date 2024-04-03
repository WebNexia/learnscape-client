import { InputLabelProps, TextField, TextFieldProps } from '@mui/material';
import React, { ChangeEvent } from 'react';

interface CustomTextFieldProps {
	label?: string;
	value?: string | number;
	type?: string;
	onChange: (e: ChangeEvent<HTMLInputElement>) => void;
	variant?: TextFieldProps['variant']; //there are defined variant values in mui
	size?: TextFieldProps['size']; //there are defined size (small | medium) values in mui
	fullWidth?: boolean;
	required?: boolean;
	multiline?: boolean;
	sx?: React.CSSProperties;
	InputLabelProps?: Partial<InputLabelProps>;
	maxRows?: number;
	disabled?: boolean;
	error?: boolean;
	helperText?: string;
	helperTextColor?: string; // Default value for helper text color
	helperBackgroundColor?: string | undefined; // Default value for helper text background color
	placeholder?: string;
}

const CustomTextField = ({
	variant = 'outlined',
	label,
	type,
	value,
	onChange,
	fullWidth = true,
	size = 'small',
	required = true,
	multiline,
	sx,
	InputLabelProps,
	maxRows,
	disabled,
	error,
	helperText,
	helperTextColor,
	helperBackgroundColor = 'transparent',
	placeholder,

	...rest
}: CustomTextFieldProps) => {
	return (
		<TextField
			variant={variant}
			label={label}
			type={type}
			value={value}
			onChange={onChange}
			size={size}
			sx={{ ...sx, marginBottom: '0.85rem' }}
			fullWidth={fullWidth}
			required={required}
			multiline={multiline}
			InputLabelProps={InputLabelProps}
			maxRows={maxRows}
			disabled={disabled}
			error={error}
			helperText={helperText}
			placeholder={placeholder}
			InputProps={{ style: { backgroundColor: helperBackgroundColor } }}
			{...rest}
		/>
	);
};

export default CustomTextField;
