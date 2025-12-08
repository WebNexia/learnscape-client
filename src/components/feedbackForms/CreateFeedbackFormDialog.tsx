import {
	Box,
	Typography,
	FormControlLabel,
	Checkbox,
	IconButton,
	Tooltip,
	Paper,
	MenuItem,
	Select,
	FormControl,
	InputLabel,
	Chip,
} from '@mui/material';
import CustomDialog from '../layouts/dialog/CustomDialog';
import CustomDialogActions from '../layouts/dialog/CustomDialogActions';
import CustomTextField from '../forms/customFields/CustomTextField';
import { FeedbackForm, FeedbackFormField } from '../../interfaces/feedbackForm';
import { FeedbackFormTemplate } from '../../interfaces/feedbackFormTemplate';
import { useContext, useState, useEffect, useRef } from 'react';
import { FeedbackFormsContext } from '../../contexts/FeedbackFormsContextProvider';
import { MediaQueryContext } from '../../contexts/MediaQueryContextProvider';
import CustomErrorMessage from '../forms/customFields/CustomErrorMessage';
import { Add, Edit, Delete, ArrowUpward, ArrowDownward, Close } from '@mui/icons-material';
import FieldEditorDialog from './FieldEditorDialog';
import { Reorder, useMotionValue } from 'framer-motion';
import { useRaisedShadow } from '../../hooks/useRaisedShadow';
import theme from '../../themes';
import EventCourseSearchSelect from '../EventCourseSearchSelect';
import { SearchCourse } from '../../interfaces/search';
import { generateUniqueId } from '../../utils/uniqueIdGenerator';

interface CreateFeedbackFormDialogProps {
	isOpen: boolean;
	onClose: () => void;
	courseId?: string;
	formToEdit?: FeedbackForm | null;
	onSuccess: () => void;
}

const CreateFeedbackFormDialog = ({ isOpen, onClose, courseId, formToEdit, onSuccess }: CreateFeedbackFormDialogProps) => {
	const { createForm, updateForm, templates, fetchTemplates, templatesLoading } = useContext(FeedbackFormsContext);
	const { isSmallScreen, isRotatedMedium } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;

	const [title, setTitle] = useState<string>('');
	const [description, setDescription] = useState<string>('');
	const [fields, setFields] = useState<FeedbackFormField[]>([]);
	const [allowAnonymous, setAllowAnonymous] = useState<boolean>(true);
	const [allowMultipleSubmissions, setAllowMultipleSubmissions] = useState<boolean>(false);
	const [submissionDeadline, setSubmissionDeadline] = useState<string>('');
	const [showResultsToSubmitters, setShowResultsToSubmitters] = useState<boolean>(false);

	// Template selection state
	const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
	const [selectedTemplate, setSelectedTemplate] = useState<FeedbackFormTemplate | null>(null);

	// Course selection state (only used when courseId is not provided, i.e., from AdminForms)
	const [selectedCourse, setSelectedCourse] = useState<SearchCourse | null>(null);
	const [searchCourseValue, setSearchCourseValue] = useState<string>('');
	const courseSearchRef = useRef<any>(null);

	// Helper function to convert ISO date string to datetime-local format (YYYY-MM-DDTHH:mm)
	const isoToDateTimeLocal = (isoString: string | undefined | null): string => {
		if (!isoString) return '';
		const date = new Date(isoString);
		// Get local date/time components
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const day = String(date.getDate()).padStart(2, '0');
		const hours = String(date.getHours()).padStart(2, '0');
		const minutes = String(date.getMinutes()).padStart(2, '0');
		return `${year}-${month}-${day}T${hours}:${minutes}`;
	};

	const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
	const [errorMessage, setErrorMessage] = useState<string>('');

	// Field management
	const [isFieldEditorOpen, setIsFieldEditorOpen] = useState<boolean>(false);
	const [fieldToEdit, setFieldToEdit] = useState<FeedbackFormField | null>(null);
	const [editingFieldIndex, setEditingFieldIndex] = useState<number>(-1);

	// Drag and drop shadow (single instance for all fields)
	const y = useMotionValue(0);
	const boxShadow = useRaisedShadow(y);

	// Fetch templates when dialog opens (only in create mode)
	useEffect(() => {
		if (isOpen && !formToEdit) {
			fetchTemplates();
		}
	}, [isOpen, formToEdit, fetchTemplates]);

	// Initialize form data when editing
	useEffect(() => {
		if (formToEdit) {
			setTitle(formToEdit.title || '');
			setDescription(formToEdit.description || '');
			setFields(formToEdit.fields || []);
			setAllowAnonymous(formToEdit.allowAnonymous ?? true);
			setAllowMultipleSubmissions(formToEdit.allowMultipleSubmissions ?? false);
			setSubmissionDeadline(isoToDateTimeLocal(formToEdit.submissionDeadline));
			setShowResultsToSubmitters(formToEdit.showResultsToSubmitters ?? false);
			// If editing and form has courseId, set selectedCourse (but it won't be shown if courseId prop is provided)
			// Handle both populated object and string ID
			if (formToEdit.courseId) {
				if (typeof formToEdit.courseId === 'object' && formToEdit.courseId !== null) {
					// Populated object
					setSelectedCourse({ _id: (formToEdit.courseId as any)?._id, title: (formToEdit.courseId as any)?.title || '', description: '' });
				} else if (typeof formToEdit.courseId === 'string') {
					// String ID - we can't show the title, but we'll keep it for submission
					// In this case, selectedCourse will be null and courseId prop should be used
					setSelectedCourse(null);
				} else {
					setSelectedCourse(null);
				}
			} else {
				setSelectedCourse(null);
			}
			// Reset template selection when editing
			setSelectedTemplateId('');
			setSelectedTemplate(null);
		} else {
			// Reset for create mode
			setTitle('');
			setDescription('');
			setFields([]);
			setAllowAnonymous(true);
			setAllowMultipleSubmissions(false);
			setSubmissionDeadline('');
			setShowResultsToSubmitters(false);
			setSelectedCourse(null);
			setSearchCourseValue('');
			setSelectedTemplateId('');
			setSelectedTemplate(null);
		}
		setErrorMessage('');
		if (courseSearchRef.current) {
			courseSearchRef.current.reset();
		}
	}, [formToEdit, isOpen]);

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setErrorMessage('');

		// Validation
		if (!title.trim()) {
			setErrorMessage('Form title is required');
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
			let courseIdValue: string | null | undefined;
			if (courseId) {
				courseIdValue = typeof courseId === 'object' && courseId !== null ? (courseId as any)?._id || (courseId as any)?.toString() : courseId;
			} else {
				courseIdValue = selectedCourse ? selectedCourse._id : formToEdit ? null : undefined;
			}

			const formData: Partial<FeedbackForm> = {
				...(courseIdValue !== undefined && { courseId: courseIdValue === null ? (null as any) : courseIdValue }),
				title: title.trim(),
				description: description.trim() || undefined,
				...(selectedTemplateId && { templateId: selectedTemplateId }),
				fields: fields.map((field, index) => ({
					...field,
					order: index,
				})),
				allowAnonymous,
				allowMultipleSubmissions,
				submissionDeadline: submissionDeadline || undefined,
				showResultsToSubmitters,
			};

			if (formToEdit) {
				await updateForm(formToEdit._id, formData);
			} else {
				await createForm(formData);
			}

			onSuccess();
		} catch (error: any) {
			setErrorMessage(error?.message || 'Failed to save form');
		} finally {
			setIsSubmitting(false);
		}
	};

	// Handle course selection from search
	const handleCourseSelect = (course: SearchCourse) => {
		setSelectedCourse(course);
		setSearchCourseValue('');
		if (courseSearchRef.current) {
			courseSearchRef.current.reset();
		}
	};

	// Handle removing selected course
	const handleRemoveCourse = () => {
		setSelectedCourse(null);
		setSearchCourseValue('');
		if (courseSearchRef.current) {
			courseSearchRef.current.reset();
		}
	};

	// Handle template selection
	const handleTemplateSelect = (templateId: string) => {
		if (!templateId) {
			// Clear template selection but keep user-entered data
			setSelectedTemplateId('');
			setSelectedTemplate(null);
			setFields([]);
			// Only clear title/description if they match the previously selected template
			if (selectedTemplate) {
				if (title === selectedTemplate.name) {
					setTitle('');
				}
				if (description === selectedTemplate.description) {
					setDescription('');
				}
			}
			return;
		}

		const template = templates.find((t) => t._id === templateId);
		if (template) {
			setSelectedTemplateId(templateId);
			setSelectedTemplate(template);

			// Pre-populate fields from template (create new fieldIds to avoid conflicts)
			const templateFields: FeedbackFormField[] = template.fields.map((field, index) => ({
				...field,
				fieldId: generateUniqueId('field-'), // Generate new fieldId
				order: index,
			}));
			setFields(templateFields);

			// Pre-fill title and description only if they're empty (user can still edit)
			if (!title.trim()) {
				setTitle(template.name);
			}
			if (!description.trim() && template.description) {
				setDescription(template.description);
			}
		}
	};

	// Show course selector only when courseId is not provided (i.e., creating from AdminForms)
	const showCourseSelector = !courseId;

	return (
		<CustomDialog openModal={isOpen} closeModal={onClose} title={formToEdit ? 'Edit Feedback Form' : 'Create Feedback Form'} maxWidth='sm'>
			<form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', padding: '0 1rem' }}>
				{/* Template Selection (only shown when creating, not editing) */}
				{!formToEdit && (
					<Box sx={{ margin: isMobileSize ? '0.75rem 0' : '0.75rem 1rem' }}>
						<Typography variant='body2' sx={{ marginBottom: '0.5rem', fontSize: isMobileSize ? '0.8rem' : '0.85rem', fontWeight: 500 }}>
							Start from Template (Optional)
						</Typography>
						<FormControl fullWidth size='small'>
							<Select
								value={selectedTemplateId}
								onChange={(e) => handleTemplateSelect(e.target.value)}
								sx={{ fontSize: '0.85rem' }}
								disabled={templatesLoading}>
								{templates && templates.length > 0 ? (
									templates.map((template) => (
										<MenuItem key={template._id} value={template._id} sx={{ fontSize: '0.85rem' }}>
											<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
												<Typography variant='body2' sx={{ flex: 1, fontSize: '0.85rem' }}>
													{template.name}
												</Typography>
												{template.category && (
													<Chip
														label={template.category.replace('-', ' ')}
														size='small'
														sx={{
															fontSize: '0.65rem',
															height: '1.1rem',
															textTransform: 'capitalize',
														}}
													/>
												)}
												{template.fields && (
													<Typography variant='body2' sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
														{template.fields.length} {template.fields.length === 1 ? 'field' : 'fields'}
													</Typography>
												)}
											</Box>
										</MenuItem>
									))
								) : (
									<MenuItem disabled sx={{ fontSize: '0.85rem' }}>
										{templatesLoading ? 'Loading templates...' : 'No templates available'}
									</MenuItem>
								)}
							</Select>
						</FormControl>
						{selectedTemplate && (
							<Typography variant='body2' sx={{ fontSize: '0.7rem', color: 'text.secondary', marginTop: '0.25rem', fontStyle: 'italic' }}>
								Template fields loaded. You can modify them below.
							</Typography>
						)}
					</Box>
				)}

				<Box sx={{ margin: isMobileSize ? '0.75rem 0' : '0.75rem 1rem' }}>
					<CustomTextField
						fullWidth
						label='Form Title'
						value={title}
						onChange={(e) => setTitle(e.target.value)}
						required
						InputProps={{ inputProps: { maxLength: 100 } }}
					/>
					<Typography sx={{ fontSize: '0.7rem', marginTop: '0.25rem', textAlign: 'right' }}>{title.length}/100 Characters</Typography>
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

				{/* Course Selection (only shown when creating from AdminForms, not from course-specific page) */}
				{showCourseSelector && (
					<Box sx={{ margin: isMobileSize ? '0.75rem 0' : '0.75rem 1rem' }}>
						<Typography variant='body2' sx={{ marginBottom: '0.5rem', fontSize: isMobileSize ? '0.8rem' : '0.85rem', fontWeight: 500 }}>
							Link to Course (Optional)
						</Typography>
						{selectedCourse ? (
							<Box
								sx={{
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'space-between',
									padding: '0.75rem',
									border: `1px solid ${theme.palette.divider}`,
									borderRadius: '0.25rem',
									backgroundColor: theme.bgColor?.secondary,
									marginBottom: '0.5rem',
								}}>
								<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.8rem' : '0.85rem', flex: 1 }}>
									{selectedCourse.title}
								</Typography>
								<IconButton size='small' onClick={handleRemoveCourse} sx={{ padding: '0 0.25rem' }}>
									<Close fontSize='small' sx={{ fontSize: isMobileSize ? '0.85rem' : undefined }} />
								</IconButton>
							</Box>
						) : (
							<EventCourseSearchSelect
								ref={courseSearchRef}
								value={searchCourseValue}
								onChange={setSearchCourseValue}
								onSelect={handleCourseSelect}
								placeholder='Search courses to link this form...'
								selectedCourseIds={[]}
							/>
						)}
					</Box>
				)}

				{/* Fields section */}
				<Box sx={{ margin: isMobileSize ? '0.75rem 0' : '0.75rem 1rem' }}>
					<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
						<Typography variant='h6' sx={{ fontSize: isMobileSize ? '0.8rem' : '1rem' }}>
							Form Fields
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

				{/* Form Settings */}
				<Box sx={{ margin: isMobileSize ? '0.75rem 0' : '0.75rem 1rem' }}>
					<Typography variant='h6' sx={{ marginBottom: '1rem', fontSize: isMobileSize ? '0.8rem' : '1rem' }}>
						Form Settings
					</Typography>

					<FormControlLabel
						control={<Checkbox checked={allowAnonymous} onChange={(e) => setAllowAnonymous(e.target.checked)} size='small' />}
						label='Allow Anonymous Submissions'
						sx={{ 'marginBottom': '0.5rem', '& .MuiFormControlLabel-label': { fontSize: isMobileSize ? '0.7rem' : '0.8rem' } }}
					/>

					<FormControlLabel
						control={<Checkbox checked={allowMultipleSubmissions} onChange={(e) => setAllowMultipleSubmissions(e.target.checked)} size='small' />}
						label='Allow Multiple Submissions'
						sx={{ 'marginBottom': '0.5rem', '& .MuiFormControlLabel-label': { fontSize: isMobileSize ? '0.7rem' : '0.8rem' } }}
					/>

					<Box sx={{ marginTop: '1rem' }}>
						<CustomTextField
							sx={{ width: 'fit-content' }}
							label='Submission Deadline (Optional)'
							required={false}
							type='datetime-local'
							value={submissionDeadline}
							onChange={(e) => setSubmissionDeadline(e.target.value)}
							InputLabelProps={{
								shrink: true,
							}}
						/>
					</Box>
				</Box>

				{errorMessage && (
					<Box sx={{ margin: '0.75rem 1rem' }}>
						<CustomErrorMessage>{errorMessage}</CustomErrorMessage>
					</Box>
				)}

				<CustomDialogActions
					onCancel={onClose}
					submitBtnText={formToEdit ? 'Update' : 'Create'}
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

export default CreateFeedbackFormDialog;
