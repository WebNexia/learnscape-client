import { InputLabelProps, InputProps, TextField, TextFieldProps } from '@mui/material';
import React, { ChangeEvent } from 'react';
import theme from '../../../themes';

interface CustomTextFieldProps {
	label?: string;
	value?: string | number;
	type?: string;
	onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
	variant?: TextFieldProps['variant']; //there are defined variant values in mui
	size?: TextFieldProps['size']; //there are defined size (small | medium) values in mui
	fullWidth?: boolean;
	required?: boolean;
	multiline?: boolean;
	sx?: React.CSSProperties;
	InputLabelProps?: Partial<InputLabelProps>;
	InputProps?: InputProps & { inputProps?: { maxLength?: number } };
	maxRows?: number;
	rows?: number;
	disabled?: boolean;
	error?: boolean;
	helperText?: string;
	placeholder?: string;
	resizable?: boolean;
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
	InputProps,
	maxRows,
	rows = 3,
	disabled,
	error,
	helperText,
	placeholder,
	resizable = false,
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
			sx={{
				...sx,
				marginBottom: '0.85rem',
				backgroundColor: theme.bgColor?.common,
				'& .MuiInputBase-root': {
					resize: resizable ? 'both' : 'none', // Allow resizing of the container
				},
				'& .MuiInputBase-inputMultiline': {
					resize: resizable ? 'both' : 'none', // Allow resizing of the textarea
					overflow: 'auto', // Ensure overflow is handled
				},
			}}
			fullWidth={fullWidth}
			required={required}
			multiline={multiline}
			InputLabelProps={InputLabelProps}
			InputProps={{
				...InputProps,
				inputProps: {
					...InputProps?.inputProps,
					maxLength: InputProps?.inputProps?.maxLength,
				},
			}}
			maxRows={maxRows}
			rows={rows}
			disabled={disabled}
			error={error}
			helperText={helperText}
			placeholder={placeholder}
			{...rest}
		/>
	);
};

export default CustomTextField;
