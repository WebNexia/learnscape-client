import { Avatar, Box, DialogActions, DialogContent, Grid, Typography } from '@mui/material';
import CustomCancelButton from '../../forms/customButtons/CustomCancelButton';
import CustomDialog from '../dialog/CustomDialog';
import { dateTimeFormatter } from '../../../utils/dateFormatter';
import { SingleCourse } from '../../../interfaces/course';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { useContext } from 'react';
import { MediaQueryContext } from '../../../contexts/MediaQueryContextProvider';

interface CoursesInfoModalProps {
	singleCourse?: SingleCourse;
	isCourseInfoDialogOpen: boolean;
	setIsCourseInfoDialogOpen: (isCourseInfoDialogOpen: boolean) => void;
}

const CoursesInfoModal = ({ singleCourse, isCourseInfoDialogOpen, setIsCourseInfoDialogOpen }: CoursesInfoModalProps) => {
	const navigate = useNavigate();

	const { isInstructor } = useAuth();

	const { isSmallScreen, isRotatedMedium } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;

	return (
		<CustomDialog
			openModal={isCourseInfoDialogOpen}
			closeModal={() => setIsCourseInfoDialogOpen(false)}
			title={singleCourse?.title}
			maxWidth='sm'
			titleSx={{ marginBottom: isMobileSize ? '0.25rem' : '0rem' }}>
			<DialogContent>
				<Box display='flex' flexDirection='column' gap={1}>
					<Grid container spacing={2.25}>
						<Grid item xs={3}>
							<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
								Created By:
							</Typography>
						</Grid>
						<Grid item xs={9} display='flex' alignItems='center'>
							<Avatar sx={{ width: 25, height: 25, mr: '0.5rem' }} src={singleCourse?.createdByImageUrl} />
							<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
								{singleCourse?.createdByName} ({singleCourse?.createdByRole}) on {dateTimeFormatter(singleCourse?.createdAt)}
							</Typography>
						</Grid>

						<Grid item xs={3}>
							<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
								Last Updated By:
							</Typography>
						</Grid>
						<Grid item xs={9} display='flex' alignItems='center'>
							<Avatar sx={{ width: 25, height: 25, mr: '0.5rem' }} src={singleCourse?.updatedByImageUrl} />
							<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
								{singleCourse?.updatedByName} ({singleCourse?.updatedByRole}) on {dateTimeFormatter(singleCourse?.updatedAt)}
							</Typography>
						</Grid>

						<Grid item xs={3}>
							<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
								Cloned From:
							</Typography>
						</Grid>
						{singleCourse?.clonedFromTitle ? (
							<Grid item xs={9}>
								<Typography
									variant='body2'
									onClick={() => {
										setIsCourseInfoDialogOpen(false);
										if (isInstructor) {
											navigate(`/instructor/course-edit/course/${singleCourse?.clonedFromId}`);
										} else {
											navigate(`/admin/course-edit/course/${singleCourse?.clonedFromId}`);
										}
									}}
									sx={{
										'cursor': 'pointer',
										':hover': {
											textDecoration: 'underline',
										},
										'fontSize': isMobileSize ? '0.75rem' : '0.85rem',
									}}>
									📄 {singleCourse?.clonedFromTitle}
								</Typography>
							</Grid>
						) : (
							<Grid item xs={9}>
								<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
									{' N/A '}
								</Typography>
							</Grid>
						)}

						{singleCourse?.versionNote && (
							<>
								<Grid item xs={3}>
									<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
										Version Note:
									</Typography>
								</Grid>
								<Grid item xs={9}>
									<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
										"{singleCourse.versionNote}"
									</Typography>
								</Grid>
							</>
						)}

						<Grid item xs={3}>
							<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
								Published At:
							</Typography>
						</Grid>
						{singleCourse?.publishedAt ? (
							<Grid item xs={9}>
								<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
									🗓️ {dateTimeFormatter(singleCourse.publishedAt)}
								</Typography>
							</Grid>
						) : (
							<Grid item xs={9}>
								<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
									{'N/A'}
								</Typography>
							</Grid>
						)}

						<Grid item xs={3}>
							<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
								Type:
							</Typography>
						</Grid>

						<Grid item xs={9}>
							<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
								{singleCourse?.courseManagement?.isExternal ? 'Partner' : 'Platform'}
							</Typography>
						</Grid>
						<>
							<Grid item xs={3}>
								<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
									Status:
								</Typography>
							</Grid>

							<Grid item xs={9}>
								<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
									{singleCourse?.isActive ? 'Published' : 'Unpublished'} - {singleCourse?.isExpired ? 'Closed' : 'Open'}
								</Typography>
							</Grid>
						</>
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
