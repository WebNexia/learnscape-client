import { InputLabelProps, InputProps, SxProps, TextField, TextFieldProps } from '@mui/material';
import { ChangeEvent, forwardRef, useContext, useCallback } from 'react';
import theme from '../../../themes';
import { MediaQueryContext } from '../../../contexts/MediaQueryContextProvider';
import { sanitizeTextInput, sanitizeEmailInput, validateInputLength } from '../../../utils/sanitizeHtml';

interface CustomTextFieldProps {
	label?: string;
	value?: string | number;
	type?: string;
	onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
	onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
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
	disableSanitization?: boolean; // Allow disabling sanitization for specific cases
}

// Valid input types that should be sanitized
const SANITIZED_INPUT_TYPES = ['text', 'email', 'search', 'url', 'tel', 'password'];

const CustomTextField = forwardRef<HTMLDivElement, CustomTextFieldProps>(
	(
		{
			variant = 'outlined',
			label,
			type = 'text',
			value,
			onChange,
			onKeyDown,
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
			disableSanitization = false,
			...rest
		},
		ref
	) => {
		const { isRotatedMedium, isSmallScreen } = useContext(MediaQueryContext);

		const isMobileSize: boolean = isSmallScreen || isRotatedMedium;

		// Validate input type
		const validatedType = typeof type === 'string' ? type.toLowerCase() : 'text';

		// Determine if input should be sanitized
		// Don't sanitize multiline fields to preserve newlines
		const shouldSanitize = !disableSanitization && !multiline && SANITIZED_INPUT_TYPES?.includes(validatedType);

		// Sanitize input on change with enhanced security
		const handleChange = useCallback(
			(e: ChangeEvent<HTMLInputElement>) => {
				if (!onChange) return;

				// Validate event object
				if (!e || !e.target || typeof e.target.value !== 'string') {
					console.warn('Invalid input event detected');
					return;
				}

				if (shouldSanitize) {
					let sanitizedValue: string;

					// Apply type-specific sanitization
					switch (validatedType) {
						case 'email':
							sanitizedValue = sanitizeEmailInput(e.target.value);
							break;
						case 'password':
							// For passwords, only remove HTML tags but preserve special characters
							sanitizedValue = sanitizeTextInput(e.target.value);
							break;
						default:
							sanitizedValue = sanitizeTextInput(e.target.value);
							break;
					}

					// Apply length validation if maxLength is specified
					const maxLength = InputProps?.inputProps?.maxLength;
					if (maxLength && typeof maxLength === 'number') {
						sanitizedValue = validateInputLength(sanitizedValue, maxLength);
					}

					// Create sanitized event
					const sanitizedEvent = {
						...e,
						target: {
							...e.target,
							value: sanitizedValue,
						},
					} as ChangeEvent<HTMLInputElement>;

					onChange(sanitizedEvent);
				} else {
					// For non-sanitized inputs (like number, tel), still validate the event
					if (validatedType === 'number') {
						const numValue = e.target.value;
						// Allow empty string, valid numbers, decimal points, negative signs, and scientific notation
						// This regex allows: 123, 123.45, -123, +123, 123e10, 123E10, 123.45e-10, etc.
						const numberRegex = /^[+-]?(\d*\.?\d*)([eE][+-]?\d*)?$/;
						if (numValue === '' || numberRegex.test(numValue)) {
							onChange(e);
						}
					} else {
						onChange(e);
					}
				}
			},
			[onChange, shouldSanitize, validatedType, InputProps?.inputProps?.maxLength, multiline]
		);

		return (
			<TextField
				variant={variant}
				label={label}
				type={validatedType}
				value={value}
				onChange={handleChange}
				onKeyDown={onKeyDown}
				size={size}
				sx={{
					'marginBottom': '0.85rem',
					'backgroundColor': theme.bgColor?.common,
					'& .MuiInputBase-root': {
						resize: resizable ? 'both' : 'none',
					},
					'& .MuiInputBase-inputMultiline': {
						resize: resizable ? 'both' : 'none',
						overflow: 'auto',
						fontSize: isMobileSize ? '0.7rem' : '0.8rem',
						lineHeight: isMobileSize ? 1.4 : 1.5,
					},
					...sx,
				}}
				fullWidth={fullWidth}
				required={required}
				multiline={multiline}
				InputLabelProps={{
					...InputLabelProps,
					sx: { fontSize: isMobileSize ? '0.7rem' : '0.85rem', ...InputLabelProps.sx }, // Set default font size and merge with additional styles
				}}
				InputProps={{
					...InputProps,
					sx: {
						'& input': {
							fontSize: isMobileSize ? '0.7rem' : '0.8rem',
						},
						...(InputProps?.sx || {}),
					},
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
