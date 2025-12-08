import { Box, Grid, Typography, Avatar, DialogContent, DialogActions } from '@mui/material';
import { FeedbackForm } from '../../interfaces/feedbackForm';
import { dateTimeFormatter } from '../../utils/dateFormatter';
import CustomCancelButton from '../forms/customButtons/CustomCancelButton';
import { useContext } from 'react';
import { MediaQueryContext } from '../../contexts/MediaQueryContextProvider';

interface FormInfoModalProps {
	form: FeedbackForm;
	onClose: () => void;
}

const FormInfoModal = ({ form, onClose }: FormInfoModalProps) => {
	const { isSmallScreen, isRotatedMedium } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;

	// Extract user info from populated fields
	const createdBy = form.createdBy as any;
	const updatedBy = form.updatedBy as any;
	const course = form.courseId as any;

	const createdByName = createdBy?.firstName && createdBy?.lastName ? `${createdBy.firstName} ${createdBy.lastName}` : createdBy?.email || 'Unknown';
	const createdByImageUrl = createdBy?.imageUrl;
	const createdByRole = createdBy?.role || 'Unknown';

	const updatedByName = updatedBy?.firstName && updatedBy?.lastName ? `${updatedBy.firstName} ${updatedBy.lastName}` : updatedBy?.email || 'N/A';
	const updatedByImageUrl = updatedBy?.imageUrl;
	const updatedByRole = updatedBy?.role || 'N/A';

	const courseTitle = course?.title || 'No Course';

	return (
		<>
			<DialogContent>
				<Box display='flex' flexDirection='column' gap={1}>
					<Grid container spacing={2.25} alignItems='center'>
						<Grid item xs={3}>
							<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
								Created By:
							</Typography>
						</Grid>
						<Grid item xs={9} display='flex' alignItems='center'>
							<Avatar sx={{ width: 25, height: 25, mr: '0.5rem' }} src={createdByImageUrl} />
							<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
								{createdByName} ({createdByRole}) on {dateTimeFormatter(form.createdAt)}
							</Typography>
						</Grid>

						{form.updatedBy && (
							<>
								<Grid item xs={3}>
									<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
										Last Updated By:
									</Typography>
								</Grid>
								<Grid item xs={9} display='flex' alignItems='center'>
									<Avatar sx={{ width: 25, height: 25, mr: '0.5rem' }} src={updatedByImageUrl} />
									<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
										{updatedByName} ({updatedByRole}) on {dateTimeFormatter(form.updatedAt)}
									</Typography>
								</Grid>
							</>
						)}

						<Grid item xs={3}>
							<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
								Course:
							</Typography>
						</Grid>
						<Grid item xs={9}>
							<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
								{courseTitle}
							</Typography>
						</Grid>

						<Grid item xs={3}>
							<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
								Published:
							</Typography>
						</Grid>
						<Grid item xs={9} display='flex' alignItems='center'>
							<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
								{form.isPublished ? 'Yes' : 'No'}
							</Typography>
						</Grid>

						{form.isPublished && form.publishedAt && (
							<>
								<Grid item xs={3}>
									<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
										Published At:
									</Typography>
								</Grid>
								<Grid item xs={9}>
									<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
										{dateTimeFormatter(form.publishedAt)}
									</Typography>
								</Grid>
							</>
						)}

						<Grid item xs={3}>
							<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
								Fields:
							</Typography>
						</Grid>
						<Grid item xs={9}>
							<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
								{form.fields?.length || 0} field(s)
							</Typography>
						</Grid>

						<Grid item xs={3}>
							<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
								Submissions:
							</Typography>
						</Grid>
						<Grid item xs={9}>
							<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
								{form.submissionCount || 0}
							</Typography>
						</Grid>

						<Grid item xs={3}>
							<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
								Allow Anonymous:
							</Typography>
						</Grid>
						<Grid item xs={9}>
							<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
								{form.allowAnonymous ? 'Yes' : 'No'}
							</Typography>
						</Grid>

						<Grid item xs={3}>
							<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
								Multiple Submissions:
							</Typography>
						</Grid>
						<Grid item xs={9}>
							<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
								{form.allowMultipleSubmissions ? 'Yes' : 'No'}
							</Typography>
						</Grid>

						{form.submissionDeadline && (
							<>
								<Grid item xs={3}>
									<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
										Deadline:
									</Typography>
								</Grid>
								<Grid item xs={9}>
									<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
										{dateTimeFormatter(form.submissionDeadline)}
									</Typography>
								</Grid>
							</>
						)}

						{form.publicLink && (
							<>
								<Grid item xs={3}>
									<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
										Public Link:
									</Typography>
								</Grid>
								<Grid item xs={9}>
									<Typography
										variant='body2'
										sx={{
											fontSize: isMobileSize ? '0.75rem' : '0.85rem',
											wordBreak: 'break-all',
										}}>
										{window.location.origin}/feedback-form/{form.publicLink}
									</Typography>
								</Grid>
							</>
						)}
					</Grid>
				</Box>
			</DialogContent>
			<DialogActions>
				<CustomCancelButton
					onClick={onClose}
					sx={{
						margin: '0 1.5rem 0.75rem 0',
					}}>
					Cancel
				</CustomCancelButton>
			</DialogActions>
		</>
	);
};

export default FormInfoModal;
