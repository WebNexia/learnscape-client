import { Box, Grid, Typography, Avatar, DialogContent, DialogActions, CircularProgress } from '@mui/material';
import { FeedbackForm } from '../../interfaces/feedbackForm';
import { dateTimeFormatter } from '../../utils/dateFormatter';
import CustomCancelButton from '../forms/customButtons/CustomCancelButton';
import { useContext, useEffect, useState } from 'react';
import { MediaQueryContext } from '../../contexts/MediaQueryContextProvider';
import { feedbackFormsService } from '../../services/feedbackFormsService';

interface FormInfoModalProps {
	form: FeedbackForm;
	onClose: () => void;
}

const FormInfoModal = ({ form, onClose }: FormInfoModalProps) => {
	const { isSmallScreen, isRotatedMedium } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;
	const [detailForm, setDetailForm] = useState<FeedbackForm>(form);
	const [loading, setLoading] = useState<boolean>(!Array.isArray(form.fields));

	useEffect(() => {
		let cancelled = false;
		setDetailForm(form);

		if (Array.isArray(form.fields)) {
			setLoading(false);
			return;
		}

		const load = async () => {
			setLoading(true);
			try {
				const full = await feedbackFormsService.getFeedbackFormById(form._id);
				if (!cancelled) {
					setDetailForm(full);
				}
			} catch {
				if (!cancelled) {
					setDetailForm(form);
				}
			} finally {
				if (!cancelled) {
					setLoading(false);
				}
			}
		};

		load();
		return () => {
			cancelled = true;
		};
	}, [form]);

	const createdBy = detailForm.createdBy as any;
	const updatedBy = detailForm.updatedBy as any;
	const course = detailForm.courseId as any;

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
				{loading ? (
					<Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
						<CircularProgress size={28} />
					</Box>
				) : (
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
								{createdByName} ({createdByRole}) on {dateTimeFormatter(detailForm.createdAt)}
							</Typography>
						</Grid>

						{detailForm.updatedBy && (
							<>
								<Grid item xs={3}>
									<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
										Last Updated By:
									</Typography>
								</Grid>
								<Grid item xs={9} display='flex' alignItems='center'>
									<Avatar sx={{ width: 25, height: 25, mr: '0.5rem' }} src={updatedByImageUrl} />
									<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
										{updatedByName} ({updatedByRole}) on {dateTimeFormatter(detailForm.updatedAt)}
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
								{detailForm.isPublished ? 'Yes' : 'No'}
							</Typography>
						</Grid>

						{detailForm.isPublished && detailForm.publishedAt && (
							<>
								<Grid item xs={3}>
									<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
										Published At:
									</Typography>
								</Grid>
								<Grid item xs={9}>
									<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
										{dateTimeFormatter(detailForm.publishedAt)}
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
								{detailForm.fields?.length || 0} field(s)
							</Typography>
						</Grid>

						<Grid item xs={3}>
							<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
								Submissions:
							</Typography>
						</Grid>
						<Grid item xs={9}>
							<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
								{detailForm.submissionCount || 0}
							</Typography>
						</Grid>

						<Grid item xs={3}>
							<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
								Allow Anonymous:
							</Typography>
						</Grid>
						<Grid item xs={9}>
							<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
								{detailForm.allowAnonymous ? 'Yes' : 'No'}
							</Typography>
						</Grid>

						<Grid item xs={3}>
							<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
								Multiple Submissions:
							</Typography>
						</Grid>
						<Grid item xs={9}>
							<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
								{detailForm.allowMultipleSubmissions ? 'Yes' : 'No'}
							</Typography>
						</Grid>

						{detailForm.submissionDeadline && (
							<>
								<Grid item xs={3}>
									<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
										Deadline:
									</Typography>
								</Grid>
								<Grid item xs={9}>
									<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
										{dateTimeFormatter(detailForm.submissionDeadline)}
									</Typography>
								</Grid>
							</>
						)}

						{detailForm.isPublished && detailForm._id && (
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
										{window.location.origin}/form/{detailForm._id}
									</Typography>
								</Grid>
							</>
						)}
					</Grid>
				</Box>
				)}
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
