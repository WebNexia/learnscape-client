import { InputLabelProps, InputProps, SxProps, TextField, TextFieldProps } from '@mui/material';
import { ChangeEvent, forwardRef } from 'react';
import theme from '../../../themes';

interface CustomTextFieldProps {
	label?: string;
	value?: string | number;
	type?: string;
	onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
	variant?: TextFieldProps['variant'];
	size?: TextFieldProps['size'];
	fullWidth?: boolean;
	required?: boolean;
	multiline?: boolean;
	sx?: SxProps;
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

const CustomTextField = forwardRef<HTMLDivElement, CustomTextFieldProps>(
	(
		{
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
			InputLabelProps = {}, // Initialize with an empty object to merge defaults
			InputProps,
			maxRows,
			rows = 3,
			disabled,
			error,
			helperText,
			placeholder,
			resizable = false,
			...rest
		},
		ref
	) => {
		return (
			<TextField
				variant={variant}
				label={label}
				type={type}
				value={value}
				onChange={onChange}
				size={size}
				sx={{
					marginBottom: '0.85rem',
					backgroundColor: theme.bgColor?.common,
					'& .MuiInputBase-root': {
						resize: resizable ? 'both' : 'none',
					},
					'& .MuiInputBase-inputMultiline': {
						resize: resizable ? 'both' : 'none',
						overflow: 'auto',
						fontSize: '0.85rem',
					},
					...sx,
				}}
				fullWidth={fullWidth}
				required={required}
				multiline={multiline}
				InputLabelProps={{
					...InputLabelProps,
					sx: { fontSize: '0.85rem', ...InputLabelProps.sx }, // Set default font size and merge with additional styles
				}}
				InputProps={{
					...InputProps,
					sx: { '& input': { fontSize: '0.85rem' } },
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
				ref={ref} // Ensure the ref is passed down
				{...rest} // Spread any other props
			/>
		);
	}
);

export default CustomTextField;
