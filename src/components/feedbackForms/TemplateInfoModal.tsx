import { Box, Typography, Chip, Divider, Paper } from '@mui/material';
import CustomDialog from '../layouts/dialog/CustomDialog';
import { FeedbackFormTemplate } from '../../interfaces/feedbackFormTemplate';
import { useContext } from 'react';
import { MediaQueryContext } from '../../contexts/MediaQueryContextProvider';
import theme from '../../themes';

interface TemplateInfoModalProps {
	isOpen: boolean;
	onClose: () => void;
	template: FeedbackFormTemplate | null;
}

const TemplateInfoModal = ({ isOpen, onClose, template }: TemplateInfoModalProps) => {
	const { isSmallScreen, isRotatedMedium } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;

	if (!template) return null;

	const createdBy = template.createdBy as any;
	const createdByName = createdBy?.firstName && createdBy?.lastName ? `${createdBy.firstName} ${createdBy.lastName}` : createdBy?.email || 'Unknown';

	return (
		<CustomDialog openModal={isOpen} closeModal={onClose} title='Template Information' maxWidth='sm'>
			<Box sx={{ padding: isMobileSize ? '0.5rem' : '1rem', maxHeight: '70vh', overflowY: 'auto' }}>
				{/* Template Name */}
				<Box sx={{ marginBottom: '1rem' }}>
					<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.7rem' : '0.75rem', color: 'text.secondary', marginBottom: '0.25rem' }}>
						Template Name
					</Typography>
					<Typography variant='body1' sx={{ fontSize: isMobileSize ? '0.85rem' : '1rem', fontWeight: 500 }}>
						{template.name}
					</Typography>
				</Box>

				{/* Description */}
				{template.description && (
					<Box sx={{ marginBottom: '1rem' }}>
						<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.7rem' : '0.75rem', color: 'text.secondary', marginBottom: '0.25rem' }}>
							Description
						</Typography>
						<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
							{template.description}
						</Typography>
					</Box>
				)}

				{/* Category */}
				{template.category && (
					<Box sx={{ marginBottom: '1rem' }}>
						<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.7rem' : '0.75rem', color: 'text.secondary', marginBottom: '0.25rem' }}>
							Category
						</Typography>
						<Chip
							label={template.category.replace('-', ' ')}
							size='small'
							sx={{
								fontSize: isMobileSize ? '0.7rem' : '0.75rem',
								height: isMobileSize ? '1.25rem' : '1.5rem',
								textTransform: 'capitalize',
							}}
						/>
					</Box>
				)}

				<Divider sx={{ marginY: '1rem' }} />

				{/* Fields */}
				<Box sx={{ marginBottom: '1rem' }}>
					<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.7rem' : '0.75rem', color: 'text.secondary', marginBottom: '0.5rem' }}>
						Fields ({template.fields?.length || 0})
					</Typography>
					{template.fields && template.fields.length > 0 ? (
						<Box sx={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
							{template.fields
								.sort((a, b) => (a.order || 0) - (b.order || 0))
								.map((field, index) => (
									<Paper
										key={field.fieldId || index}
										elevation={1}
										sx={{
											padding: '0.75rem',
											backgroundColor: theme.bgColor?.secondary,
										}}>
										<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.25rem' }}>
											<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem', fontWeight: 500 }}>
												{field.label}
												{field.required && <span style={{ color: 'red', marginLeft: '0.25rem' }}>*</span>}
											</Typography>
											<Chip
												label={field.type.replace('-', ' ')}
												size='small'
												sx={{
													fontSize: isMobileSize ? '0.65rem' : '0.7rem',
													height: isMobileSize ? '1.1rem' : '1.25rem',
													textTransform: 'capitalize',
												}}
											/>
										</Box>
										{field.placeholder && (
											<Typography
												variant='body2'
												sx={{ fontSize: isMobileSize ? '0.7rem' : '0.75rem', color: 'text.secondary', fontStyle: 'italic' }}>
												Placeholder: {field.placeholder}
											</Typography>
										)}
										{field.type === 'rating' && (
											<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.7rem' : '0.75rem', color: 'text.secondary' }}>
												Range: {field.minRating || 1} - {field.maxRating || 5}
											</Typography>
										)}
										{(field.type === 'multiple-choice' || field.type === 'checkbox') && field.options && field.options.length > 0 && (
											<Box sx={{ marginTop: '0.25rem' }}>
												<Typography
													variant='body2'
													sx={{ fontSize: isMobileSize ? '0.7rem' : '0.75rem', color: 'text.secondary', marginBottom: '0.25rem' }}>
													Options:
												</Typography>
												<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
													{field.options.map((option, optIndex) => (
														<Chip
															key={optIndex}
															label={option}
															size='small'
															variant='outlined'
															sx={{
																fontSize: isMobileSize ? '0.65rem' : '0.7rem',
																height: isMobileSize ? '1.1rem' : '1.25rem',
															}}
														/>
													))}
												</Box>
											</Box>
										)}
									</Paper>
								))}
						</Box>
					) : (
						<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.7rem' : '0.75rem', color: 'text.secondary', fontStyle: 'italic' }}>
							No fields defined
						</Typography>
					)}
				</Box>

				<Divider sx={{ marginY: '1rem' }} />

				{/* Metadata */}
				<Box sx={{ marginBottom: '1rem' }}>
					<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.7rem' : '0.75rem', color: 'text.secondary', marginBottom: '0.5rem' }}>
						Template Details
					</Typography>
					<Box sx={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
						<Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
							<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.7rem' : '0.75rem', color: 'text.secondary' }}>
								Created By:
							</Typography>
							<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.7rem' : '0.75rem' }}>
								{createdByName}
							</Typography>
						</Box>
						{template.usageCount !== undefined && (
							<Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
								<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.7rem' : '0.75rem', color: 'text.secondary' }}>
									Usage Count:
								</Typography>
								<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.7rem' : '0.75rem' }}>
									{template.usageCount}
								</Typography>
							</Box>
						)}
						{template.isPublic !== undefined && (
							<Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
								<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.7rem' : '0.75rem', color: 'text.secondary' }}>
									Public:
								</Typography>
								<Chip
									label={template.isPublic ? 'Yes' : 'No'}
									size='small'
									color={template.isPublic ? 'success' : 'default'}
									sx={{
										fontSize: isMobileSize ? '0.65rem' : '0.7rem',
										height: isMobileSize ? '1.1rem' : '1.25rem',
									}}
								/>
							</Box>
						)}
						{template.createdAt && (
							<Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
								<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.7rem' : '0.75rem', color: 'text.secondary' }}>
									Created:
								</Typography>
								<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.7rem' : '0.75rem' }}>
									{new Date(template.createdAt).toLocaleDateString()}
								</Typography>
							</Box>
						)}
						{template.updatedAt && (
							<Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
								<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.7rem' : '0.75rem', color: 'text.secondary' }}>
									Last Updated:
								</Typography>
								<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.7rem' : '0.75rem' }}>
									{new Date(template.updatedAt).toLocaleDateString()}
								</Typography>
							</Box>
						)}
					</Box>
				</Box>
			</Box>
		</CustomDialog>
	);
};

export default TemplateInfoModal;
