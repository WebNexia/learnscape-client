import { Avatar, Box, DialogActions, DialogContent, Grid, Typography } from '@mui/material';
import CustomCancelButton from '../../forms/customButtons/CustomCancelButton';
import CustomDialog from '../dialog/CustomDialog';
import { dateTimeFormatter } from '../../../utils/dateFormatter';
import { SingleCourse } from '../../../interfaces/course';
import { useNavigate } from 'react-router-dom';

interface CoursesInfoModalProps {
	singleCourse?: SingleCourse;
	isCourseInfoDialogOpen: boolean;
	setIsCourseInfoDialogOpen: (isCourseInfoDialogOpen: boolean) => void;
}

const CoursesInfoModal = ({ singleCourse, isCourseInfoDialogOpen, setIsCourseInfoDialogOpen }: CoursesInfoModalProps) => {
	const navigate = useNavigate();

	console.log(singleCourse);

	return (
		<CustomDialog openModal={isCourseInfoDialogOpen} closeModal={() => setIsCourseInfoDialogOpen(false)} title={singleCourse?.title} maxWidth='sm'>
			<DialogContent>
				<Box display='flex' flexDirection='column' gap={1}>
					<Grid container spacing={2.25}>
						<Grid item xs={3}>
							<Typography variant='body2'>Created By:</Typography>
						</Grid>
						<Grid item xs={9} display='flex' alignItems='center'>
							<Avatar sx={{ width: 25, height: 25, mr: '0.5rem' }} src={singleCourse?.createdByImageUrl} />
							<Typography variant='body2'>
								{singleCourse?.createdByName} ({singleCourse?.createdByRole}) on {dateTimeFormatter(singleCourse?.createdAt)}
							</Typography>
						</Grid>

						<Grid item xs={3}>
							<Typography variant='body2'>Last Updated By:</Typography>
						</Grid>
						<Grid item xs={9} display='flex' alignItems='center'>
							<Avatar sx={{ width: 25, height: 25, mr: '0.5rem' }} src={singleCourse?.updatedByImageUrl} />
							<Typography variant='body2'>
								{singleCourse?.updatedByName} ({singleCourse?.updatedByRole}) on {dateTimeFormatter(singleCourse?.updatedAt)}
							</Typography>
						</Grid>

						<Grid item xs={3}>
							<Typography variant='body2'>Cloned From:</Typography>
						</Grid>
						{singleCourse?.clonedFromTitle ? (
							<Grid item xs={9}>
								<Typography
									variant='body2'
									onClick={() => {
										setIsCourseInfoDialogOpen(false);
										navigate(`/admin/course-edit/course/${singleCourse?.clonedFromId}`);
									}}
									sx={{
										'cursor': 'pointer',
										':hover': {
											textDecoration: 'underline',
										},
									}}>
									📄 {singleCourse?.clonedFromTitle}
								</Typography>
							</Grid>
						) : (
							<Grid item xs={9}>
								<Typography variant='body2'>{' N/A '}</Typography>
							</Grid>
						)}

						{singleCourse?.versionNote && (
							<>
								<Grid item xs={3}>
									<Typography variant='body2'>Version Note:</Typography>
								</Grid>
								<Grid item xs={9}>
									<Typography variant='body2'>"{singleCourse.versionNote}"</Typography>
								</Grid>
							</>
						)}

						<Grid item xs={3}>
							<Typography variant='body2'>Published At:</Typography>
						</Grid>
						{singleCourse?.publishedAt ? (
							<Grid item xs={9}>
								<Typography variant='body2'>🗓️ {dateTimeFormatter(singleCourse.publishedAt)}</Typography>
							</Grid>
						) : (
							<Grid item xs={9}>
								<Typography variant='body2'>{'N/A'}</Typography>
							</Grid>
						)}

						<Grid item xs={3}>
							<Typography variant='body2'>Type:</Typography>
						</Grid>

						<Grid item xs={9}>
							<Typography variant='body2'>{singleCourse?.courseManagement?.isExternal ? 'Partner' : 'Platform'}</Typography>
						</Grid>
					</Grid>
				</Box>
			</DialogContent>

			<DialogActions>
				<CustomCancelButton
					onClick={() => setIsCourseInfoDialogOpen(false)}
					sx={{
						margin: '0 1.5rem 0.75rem 0',
					}}>
					Cancel
				</CustomCancelButton>
			</DialogActions>
		</CustomDialog>
	);
};

export default CoursesInfoModal;
