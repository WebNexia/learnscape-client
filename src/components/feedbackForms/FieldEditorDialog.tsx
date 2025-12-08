import { Box, Typography, FormControlLabel, Checkbox, MenuItem, Select, FormControl, InputLabel, IconButton, Tooltip } from '@mui/material';
import CustomDialog from '../layouts/dialog/CustomDialog';
import CustomDialogActions from '../layouts/dialog/CustomDialogActions';
import CustomTextField from '../forms/customFields/CustomTextField';
import { FeedbackFormField, FeedbackFormFieldType } from '../../interfaces/feedbackForm';
import { useContext, useState, useEffect } from 'react';
import { MediaQueryContext } from '../../contexts/MediaQueryContextProvider';
import CustomErrorMessage from '../forms/customFields/CustomErrorMessage';
import { AddCircle, RemoveCircle } from '@mui/icons-material';
import { generateUniqueId } from '../../utils/uniqueIdGenerator';

interface FieldEditorDialogProps {
	isOpen: boolean;
	onClose: () => void;
	fieldToEdit?: FeedbackFormField | null;
	onSave: (field: FeedbackFormField) => void;
}

const FieldEditorDialog = ({ isOpen, onClose, fieldToEdit, onSave }: FieldEditorDialogProps) => {
	const { isSmallScreen, isRotatedMedium } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;

	const [fieldType, setFieldType] = useState<FeedbackFormFieldType>('text');
	const [label, setLabel] = useState<string>('');
	const [placeholder, setPlaceholder] = useState<string>('');
	const [required, setRequired] = useState<boolean>(false);
	const [options, setOptions] = useState<string[]>(['']);
	const [minRating, setMinRating] = useState<number>(1);
	const [maxRating, setMaxRating] = useState<number>(5);

	const [errorMessage, setErrorMessage] = useState<string>('');

	// Initialize field data when editing
	useEffect(() => {
		if (fieldToEdit) {
			setFieldType(fieldToEdit.type);
			setLabel(fieldToEdit.label || '');
			setPlaceholder(fieldToEdit.placeholder || '');
			setRequired(fieldToEdit.required || false);
			setOptions(fieldToEdit.options && fieldToEdit.options.length > 0 ? fieldToEdit.options : ['']);
			setMinRating(fieldToEdit.minRating || 1);
			setMaxRating(fieldToEdit.maxRating || 5);
		} else {
			// Reset for create mode
			setFieldType('text');
			setLabel('');
			setPlaceholder('');
			setRequired(false);
			setOptions(['']);
			setMinRating(1);
			setMaxRating(5);
		}
		setErrorMessage('');
	}, [fieldToEdit, isOpen]);

	const handleAddOption = () => {
		setOptions([...options, '']);
	};

	const handleRemoveOption = (index: number) => {
		if (options.length > 1) {
			setOptions(options.filter((_, i) => i !== index));
		}
	};

	const handleOptionChange = (index: number, value: string) => {
		const newOptions = [...options];
		newOptions[index] = value;
		setOptions(newOptions);
	};

	const handleSave = () => {
		setErrorMessage('');

		// Validation
		if (!label.trim()) {
			setErrorMessage('Field label is required');
			return;
		}

		if ((fieldType === 'multiple-choice' || fieldType === 'checkbox') && options.some((opt) => !opt.trim())) {
			setErrorMessage('All options must have a value');
			return;
		}

		if ((fieldType === 'multiple-choice' || fieldType === 'checkbox') && options.length < 2) {
			setErrorMessage('At least 2 options are required');
			return;
		}

		if (fieldType === 'rating' && minRating >= maxRating) {
			setErrorMessage('Max rating must be greater than min rating');
			return;
		}

		const field: FeedbackFormField = {
			fieldId: fieldToEdit?.fieldId || generateUniqueId('field-'),
			type: fieldType,
			label: label.trim(),
			placeholder: placeholder.trim() || undefined,
			required,
			order: fieldToEdit?.order || 0,
			...(fieldType === 'multiple-choice' || fieldType === 'checkbox' ? { options: options.filter((opt) => opt.trim()) } : {}),
			...(fieldType === 'rating' ? { minRating, maxRating } : {}),
		};

		onSave(field);
		onClose();
	};

	return (
		<CustomDialog openModal={isOpen} closeModal={onClose} title={fieldToEdit ? 'Edit Field' : 'Add Field'} maxWidth='sm'>
			<Box sx={{ display: 'flex', flexDirection: 'column', padding: '0 1rem' }}>
				<Box sx={{ margin: isMobileSize ? '0.75rem 0' : '0.75rem 1rem' }}>
					<FormControl fullWidth sx={{ marginBottom: '1rem' }}>
						<InputLabel sx={{ fontSize: '0.85rem' }}>Field Type</InputLabel>
						<Select
							value={fieldType}
							onChange={(e) => setFieldType(e.target.value as FeedbackFormFieldType)}
							label='Field Type'
							size='small'
							sx={{ fontSize: '0.85rem' }}>
							<MenuItem value='text' sx={{ fontSize: '0.85rem' }}>
								Text
							</MenuItem>
							<MenuItem value='textarea' sx={{ fontSize: '0.85rem' }}>
								Textarea
							</MenuItem>
							<MenuItem value='rating' sx={{ fontSize: '0.85rem' }}>
								Rating
							</MenuItem>
							<MenuItem value='multiple-choice' sx={{ fontSize: '0.85rem' }}>
								Multiple Choice
							</MenuItem>
							<MenuItem value='checkbox' sx={{ fontSize: '0.85rem' }}>
								Checkbox
							</MenuItem>
							<MenuItem value='date' sx={{ fontSize: '0.85rem' }}>
								Date
							</MenuItem>
						</Select>
					</FormControl>
				</Box>

				<Box sx={{ margin: isMobileSize ? '0.75rem 0' : '0.75rem 1rem' }}>
					<CustomTextField
						fullWidth
						label='Field Label'
						value={label}
						onChange={(e) => setLabel(e.target.value)}
						required
						InputProps={{ inputProps: { maxLength: 100 } }}
					/>
					<Typography sx={{ fontSize: '0.7rem', marginTop: '0.25rem', textAlign: 'right' }}>{label.length}/100 Characters</Typography>
				</Box>

				{(fieldType === 'text' || fieldType === 'textarea') && (
					<Box sx={{ margin: isMobileSize ? '0.75rem 0' : '0.75rem 1rem' }}>
						<CustomTextField
							fullWidth
							required={false}
							label='Placeholder (Optional)'
							value={placeholder}
							onChange={(e) => setPlaceholder(e.target.value)}
							InputProps={{ inputProps: { maxLength: 100 } }}
						/>
					</Box>
				)}

				{(fieldType === 'multiple-choice' || fieldType === 'checkbox') && (
					<Box sx={{ margin: isMobileSize ? '0.75rem 0' : '0.75rem 1rem' }}>
						<Typography variant='body2' sx={{ marginBottom: '0.5rem', fontWeight: 'bold' }}>
							Options
						</Typography>
						{options.map((option, index) => (
							<Box key={index} sx={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem', gap: 1 }}>
								<CustomTextField
									fullWidth
									label={`Option ${index + 1}`}
									value={option}
									onChange={(e) => handleOptionChange(index, e.target.value)}
									required
									InputProps={{ inputProps: { maxLength: 200 } }}
								/>
								{options.length > 1 && (
									<Tooltip title='Remove Option'>
										<IconButton onClick={() => handleRemoveOption(index)} size='small'>
											<RemoveCircle fontSize='small' />
										</IconButton>
									</Tooltip>
								)}
							</Box>
						))}
						<Tooltip title='Add Option'>
							<IconButton onClick={handleAddOption} size='small' sx={{ marginTop: '0.5rem' }}>
								<AddCircle fontSize='small' />
							</IconButton>
						</Tooltip>
					</Box>
				)}

				{fieldType === 'rating' && (
					<Box sx={{ margin: isMobileSize ? '0.75rem 0' : '0.75rem 1rem', display: 'flex', gap: 2 }}>
						<CustomTextField
							label='Min Rating'
							type='number'
							value={minRating}
							onChange={(e) => setMinRating(parseInt(e.target.value) || 1)}
							InputProps={{ inputProps: { min: 1, max: 10 } }}
						/>
						<CustomTextField
							label='Max Rating'
							type='number'
							value={maxRating}
							onChange={(e) => setMaxRating(parseInt(e.target.value) || 5)}
							InputProps={{ inputProps: { min: 2, max: 10 } }}
						/>
					</Box>
				)}

				<Box sx={{ margin: isMobileSize ? '0.75rem 0' : '0.75rem 1rem' }}>
					<FormControlLabel
						control={
							<Checkbox
								checked={required}
								onChange={(e) => setRequired(e.target.checked)}
								size='small'
								sx={{ '& .MuiSvgIcon-root': { fontSize: isMobileSize ? '0.9rem' : '1rem' } }}
							/>
						}
						label='Required Field'
						sx={{ '& .MuiFormControlLabel-label': { fontSize: isMobileSize ? '0.7rem' : '0.85rem' } }}
					/>
				</Box>

				{errorMessage && (
					<Box sx={{ margin: '0.75rem 1rem' }}>
						<CustomErrorMessage>{errorMessage}</CustomErrorMessage>
					</Box>
				)}

				<CustomDialogActions onCancel={onClose} onSubmit={handleSave} submitBtnText='Save' submitBtnType='button' actionSx={{ mb: '0.5rem' }} />
			</Box>
		</CustomDialog>
	);
};

export default FieldEditorDialog;
