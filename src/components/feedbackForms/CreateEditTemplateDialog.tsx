import { Box, Typography, FormControlLabel, Checkbox, IconButton, Tooltip, Paper, MenuItem, Select, FormControl, InputLabel } from '@mui/material';
import CustomDialog from '../layouts/dialog/CustomDialog';
import CustomDialogActions from '../layouts/dialog/CustomDialogActions';
import CustomTextField from '../forms/customFields/CustomTextField';
import { FeedbackFormTemplate } from '../../interfaces/feedbackFormTemplate';
import { FeedbackFormField } from '../../interfaces/feedbackForm';
import { useContext, useState, useEffect, useRef } from 'react';
import { FeedbackFormsContext } from '../../contexts/FeedbackFormsContextProvider';
import { MediaQueryContext } from '../../contexts/MediaQueryContextProvider';
import CustomErrorMessage from '../forms/customFields/CustomErrorMessage';
import { Add, Edit, Delete, ArrowUpward, ArrowDownward } from '@mui/icons-material';
import FieldEditorDialog from './FieldEditorDialog';
import { Reorder, useMotionValue } from 'framer-motion';
import { useRaisedShadow } from '../../hooks/useRaisedShadow';
import theme from '../../themes';
import { useAuth } from '../../hooks/useAuth';

interface CreateEditTemplateDialogProps {
	isOpen: boolean;
	onClose: () => void;
	templateToEdit?: FeedbackFormTemplate | null;
	onSuccess: () => void;
}

const CreateEditTemplateDialog = ({ isOpen, onClose, templateToEdit, onSuccess }: CreateEditTemplateDialogProps) => {
	const { createTemplate, updateTemplate } = useContext(FeedbackFormsContext);
	const { isSmallScreen, isRotatedMedium } = useContext(MediaQueryContext);
	const { hasAdminAccess } = useAuth();
	const isMobileSize = isSmallScreen || isRotatedMedium;

	const [name, setName] = useState<string>('');
	const [description, setDescription] = useState<string>('');
	const [category, setCategory] = useState<string>('session-feedback');
	const [fields, setFields] = useState<FeedbackFormField[]>([]);
	const [isPublic, setIsPublic] = useState<boolean>(false);

	const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
	const [errorMessage, setErrorMessage] = useState<string>('');

	// Field management
	const [isFieldEditorOpen, setIsFieldEditorOpen] = useState<boolean>(false);
	const [fieldToEdit, setFieldToEdit] = useState<FeedbackFormField | null>(null);
	const [editingFieldIndex, setEditingFieldIndex] = useState<number>(-1);

	// Drag and drop shadow (single instance for all fields)
	const y = useMotionValue(0);
	const boxShadow = useRaisedShadow(y);

	// Initialize form data when editing
	useEffect(() => {
		if (templateToEdit) {
			setName(templateToEdit.name || '');
			setDescription(templateToEdit.description || '');
			setCategory(templateToEdit.category || 'session-feedback');
			setFields(templateToEdit.fields || []);
			setIsPublic(templateToEdit.isPublic ?? false);
		} else {
			// Reset for create mode
			setName('');
			setDescription('');
			setCategory('session-feedback');
			setFields([]);
			setIsPublic(false);
		}
		setErrorMessage('');
	}, [templateToEdit, isOpen]);

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setErrorMessage('');

		// Validation
		if (!name.trim()) {
			setErrorMessage('Template name is required');
			return;
		}

		if (name.trim().length > 100) {
			setErrorMessage('Template name must be 100 characters or less');
			return;
		}

		if (description && description.trim().length > 500) {
			setErrorMessage('Description must be 500 characters or less');
			return;
		}

		if (fields.length === 0) {
			setErrorMessage('At least one field is required');
			return;
		}

		// Validate fields
		for (const field of fields) {
			if (!field.label.trim()) {
				setErrorMessage('All fields must have a label');
				return;
			}
			if ((field.type === 'multiple-choice' || field.type === 'checkbox') && (!field.options || field.options.length === 0)) {
				setErrorMessage(`${field.type} fields must have at least one option`);
				return;
			}
		}

		setIsSubmitting(true);
		try {
			const templateData: Partial<FeedbackFormTemplate> = {
				name: name.trim(),
				description: description.trim() || undefined,
				category: category || undefined,
				fields: fields.map((field, index) => ({
					...field,
					order: index,
				})),
				isPublic: hasAdminAccess ? isPublic : false, // Only admins can set isPublic
			};

			if (templateToEdit) {
				await updateTemplate(templateToEdit._id, templateData);
			} else {
				await createTemplate(templateData);
			}

			onSuccess();
		} catch (error: any) {
			setErrorMessage(error?.message || 'Failed to save template');
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<CustomDialog openModal={isOpen} closeModal={onClose} title={templateToEdit ? 'Edit Template' : 'Create Template'} maxWidth='sm'>
			<form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', padding: '0 1rem' }}>
				<Box sx={{ margin: isMobileSize ? '0.75rem 0' : '0.75rem 1rem' }}>
					<CustomTextField
						fullWidth
						label='Template Name'
						value={name}
						onChange={(e) => setName(e.target.value)}
						required
						InputProps={{ inputProps: { maxLength: 100 } }}
					/>
					<Typography sx={{ fontSize: '0.7rem', marginTop: '0.25rem', textAlign: 'right' }}>{name.length}/100 Characters</Typography>
				</Box>

				<Box sx={{ margin: isMobileSize ? '0.75rem 0' : '0.75rem 1rem' }}>
					<CustomTextField
						fullWidth
						label='Description (Optional)'
						required={false}
						value={description}
						onChange={(e) => setDescription(e.target.value)}
						multiline
						rows={3}
						InputProps={{ inputProps: { maxLength: 500 } }}
					/>
					<Typography sx={{ fontSize: '0.7rem', marginTop: '0.25rem', textAlign: 'right' }}>{description.length}/500 Characters</Typography>
				</Box>

				<Box sx={{ margin: isMobileSize ? '0.75rem 0' : '0.75rem 1rem' }}>
					<FormControl fullWidth>
						<InputLabel sx={{ fontSize: '0.85rem' }}>Category</InputLabel>
						<Select value={category} onChange={(e) => setCategory(e.target.value)} label='Category' size='small' sx={{ fontSize: '0.85rem' }}>
							<MenuItem value='session-feedback' sx={{ fontSize: '0.85rem' }}>
								Session Feedback
							</MenuItem>
							<MenuItem value='course-evaluation' sx={{ fontSize: '0.85rem' }}>
								Course Evaluation
							</MenuItem>
							<MenuItem value='custom' sx={{ fontSize: '0.85rem' }}>
								Custom
							</MenuItem>
						</Select>
					</FormControl>
				</Box>

				{/* Fields section */}
				<Box sx={{ margin: isMobileSize ? '0.75rem 0' : '0.75rem 1rem' }}>
					<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
						<Typography variant='h6' sx={{ fontSize: isMobileSize ? '0.8rem' : '1rem' }}>
							Template Fields
						</Typography>
						<Tooltip title='Add Field' placement='top' arrow>
							<IconButton
								onClick={() => {
									setFieldToEdit(null);
									setEditingFieldIndex(-1);
									setIsFieldEditorOpen(true);
								}}
								size='small'
								sx={{ color: theme.palette.primary.main }}>
								<Add sx={{ fontSize: isMobileSize ? '0.85rem' : undefined }} />
							</IconButton>
						</Tooltip>
					</Box>

					{fields.length === 0 ? (
						<Typography
							variant='body2'
							sx={{ color: 'text.secondary', fontStyle: 'italic', marginTop: '1rem', fontSize: isMobileSize ? '0.7rem' : '0.8rem' }}>
							No fields added yet. Click the "+" button to add a field.
						</Typography>
					) : (
						<Reorder.Group axis='y' values={fields} onReorder={setFields}>
							{fields.map((field, index) => (
								<Reorder.Item key={field.fieldId} value={field} style={{ boxShadow, listStyle: 'none', marginBottom: '0.5rem' }} dragListener={true}>
									<Paper
										elevation={2}
										sx={{
											padding: '1rem',
											display: 'flex',
											justifyContent: 'space-between',
											alignItems: 'center',
											backgroundColor: theme.bgColor?.secondary,
										}}>
										<Box sx={{ flex: 1 }}>
											<Typography variant='body2' sx={{ marginBottom: '0.25rem', fontSize: isMobileSize ? '0.8rem' : '0.85rem' }}>
												{field.label}
												{field.required && <span style={{ color: 'red', marginLeft: '0.25rem' }}>*</span>}
											</Typography>
											<Typography
												variant='body2'
												sx={{ color: 'text.secondary', textTransform: 'capitalize', fontSize: isMobileSize ? '0.7rem' : '0.8rem' }}>
												{field.type.replace('-', ' ')}
												{field.type === 'rating' && ` (${field.minRating || 1}-${field.maxRating || 5})`}
												{(field.type === 'multiple-choice' || field.type === 'checkbox') && ` (${field.options?.length || 0} options)`}
											</Typography>
										</Box>
										<Box sx={{ display: 'flex', gap: 0.5 }}>
											{index > 0 && (
												<Tooltip title='Move Up'>
													<IconButton
														size='small'
														onClick={() => {
															const newFields = [...fields];
															[newFields[index - 1], newFields[index]] = [newFields[index], newFields[index - 1]];
															setFields(newFields);
														}}>
														<ArrowUpward fontSize='small' sx={{ fontSize: isMobileSize ? '0.85rem' : undefined }} />
													</IconButton>
												</Tooltip>
											)}
											{index < fields.length - 1 && (
												<Tooltip title='Move Down'>
													<IconButton
														size='small'
														onClick={() => {
															const newFields = [...fields];
															[newFields[index], newFields[index + 1]] = [newFields[index + 1], newFields[index]];
															setFields(newFields);
														}}>
														<ArrowDownward fontSize='small' sx={{ fontSize: isMobileSize ? '0.85rem' : undefined }} />
													</IconButton>
												</Tooltip>
											)}
											<Tooltip title='Edit Field'>
												<IconButton
													size='small'
													onClick={() => {
														setFieldToEdit(field);
														setEditingFieldIndex(index);
														setIsFieldEditorOpen(true);
													}}>
													<Edit fontSize='small' sx={{ fontSize: isMobileSize ? '0.85rem' : undefined }} />
												</IconButton>
											</Tooltip>
											<Tooltip title='Delete Field'>
												<IconButton
													size='small'
													onClick={() => {
														setFields(fields.filter((_, i) => i !== index));
													}}>
													<Delete fontSize='small' sx={{ fontSize: isMobileSize ? '0.85rem' : undefined }} />
												</IconButton>
											</Tooltip>
										</Box>
									</Paper>
								</Reorder.Item>
							))}
						</Reorder.Group>
					)}
				</Box>

				{/* Template Settings */}
				{hasAdminAccess && (
					<Box sx={{ margin: isMobileSize ? '0.75rem 0' : '0.75rem 1rem' }}>
						<Typography variant='h6' sx={{ marginBottom: '1rem', fontSize: isMobileSize ? '0.8rem' : '1rem' }}>
							Template Settings
						</Typography>

						<FormControlLabel
							control={<Checkbox checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} size='small' />}
							label='Make Template Public (Available to all organization users)'
							sx={{ 'marginBottom': '0.5rem', '& .MuiFormControlLabel-label': { fontSize: isMobileSize ? '0.7rem' : '0.8rem' } }}
						/>
					</Box>
				)}

				{errorMessage && (
					<Box sx={{ margin: '0.75rem 1rem' }}>
						<CustomErrorMessage>{errorMessage}</CustomErrorMessage>
					</Box>
				)}

				<CustomDialogActions
					onCancel={onClose}
					submitBtnText={templateToEdit ? 'Update' : 'Create'}
					submitBtnType='submit'
					disableBtn={isSubmitting}
					isSubmitting={isSubmitting}
					actionSx={{ mb: '0.5rem' }}
				/>
			</form>

			{/* Field Editor Dialog */}
			<FieldEditorDialog
				isOpen={isFieldEditorOpen}
				onClose={() => {
					setIsFieldEditorOpen(false);
					setFieldToEdit(null);
					setEditingFieldIndex(-1);
				}}
				fieldToEdit={fieldToEdit}
				onSave={(field) => {
					if (editingFieldIndex >= 0) {
						// Update existing field
						const newFields = [...fields];
						newFields[editingFieldIndex] = field;
						setFields(newFields);
					} else {
						// Add new field
						setFields([...fields, field]);
					}
					setIsFieldEditorOpen(false);
					setFieldToEdit(null);
					setEditingFieldIndex(-1);
				}}
			/>
		</CustomDialog>
	);
};

export default CreateEditTemplateDialog;
