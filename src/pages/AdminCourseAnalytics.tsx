import {
	Avatar,
	Box,
	CircularProgress,
	IconButton,
	Paper,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableRow,
	Typography,
	Alert,
	Button,
	Tooltip,
} from '@mui/material';
import DashboardPagesLayout from '../components/layouts/dashboardLayout/DashboardPagesLayout';
import AdminPageErrorBoundary from '../components/error/AdminPageErrorBoundary';
import { useNavigate, useParams } from 'react-router-dom';
import { useCourseStudentsAnalytics } from '../hooks/useCourseStudentsAnalytics';
import theme from '../themes';
import { KeyboardBackspaceOutlined } from '@mui/icons-material';
import DownloadIcon from '@mui/icons-material/Download';
import { useAuth } from '../hooks/useAuth';
import { useContext, useState } from 'react';
import { MediaQueryContext } from '../contexts/MediaQueryContextProvider';
import axiosInstance from '../utils/axiosInstance';

const AdminCourseAnalytics = () => {
	const { courseId } = useParams<{ courseId: string }>();
	const navigate = useNavigate();
	const { hasAdminAccess } = useAuth();
	const { data, isLoading, error } = useCourseStudentsAnalytics(courseId);
	const { isSmallScreen, isRotatedMedium } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;
	const [isDownloading, setIsDownloading] = useState(false);

	const base_url = import.meta.env.VITE_SERVER_BASE_URL;

	const handleDownloadEnrolledStudents = async () => {
		if (!courseId || !data?.students?.length) return;

		try {
			setIsDownloading(true);
			const response = await axiosInstance.get(`${base_url}/courses/${courseId}/analytics/students/export-excel`, {
				responseType: 'blob',
			});

			const blob = new Blob([response.data], {
				type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
			});
			const url = window.URL.createObjectURL(blob);
			const link = document.createElement('a');
			const titleSlug = (data.title || 'Course').replace(/[^a-z0-9]+/gi, '_') || 'Course';
			const today = new Date().toISOString().split('T')[0];
			link.href = url;
			link.setAttribute('download', `${titleSlug}_Enrolled_Students_${today}.xlsx`);
			document.body.appendChild(link);
			link.click();
			link.remove();
			window.URL.revokeObjectURL(url);
		} catch (err) {
			// eslint-disable-next-line no-console
			console.error('Failed to download enrolled students list:', err);
		} finally {
			setIsDownloading(false);
		}
	};

	return (
		<AdminPageErrorBoundary>
			<DashboardPagesLayout pageName='Course Analytics' customSettings={{ justifyContent: 'flex-start' }} showCopyRight={true}>
				<Box sx={{ width: '100%', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: 3 }}>
					<Box>
						<Button
							variant='text'
							startIcon={<KeyboardBackspaceOutlined fontSize='small' />}
							sx={{
								'color': theme.textColor?.primary.main,
								'textTransform': 'inherit',
								'fontFamily': theme.fontFamily?.main,
								':hover': {
									backgroundColor: 'transparent',
									textDecoration: 'underline',
								},
							}}
							onClick={() => {
								if (!courseId) return;
								const basePath = hasAdminAccess ? '/admin' : '/instructor';
								navigate(`${basePath}/course-edit/course/${courseId}`);
							}}>
							Back to course
						</Button>
					</Box>

					{isLoading && (
						<Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
							<CircularProgress />
						</Box>
					)}

					{!isLoading && error && <Alert severity='error'>{error.message || 'Failed to load course analytics. Please try again later.'}</Alert>}

					{!isLoading && !error && data && (
						<>
							<Box
								sx={{
									display: 'flex',
									flexDirection: isMobileSize ? 'column' : 'row',
									gap: 2,
									flexWrap: 'wrap',
								}}>
								<Paper
									elevation={3}
									sx={{
										p: isMobileSize ? '1.5rem 1.25rem' : '2rem 1rem',
										borderRadius: 2,
										backgroundColor: theme.bgColor?.secondary,
										flex: 1,
										display: 'flex',
										flexDirection: 'column',
										justifyContent: 'center',
										alignItems: 'center',
									}}>
									<Typography variant={isMobileSize ? 'body2' : 'body1'} sx={{ mb: 0.5 }}>
										Total Possible Score
									</Typography>
									<Typography variant='h4' sx={{ margin: '0.75rem 0' }}>
										{data.totalPossibleScore}
									</Typography>
									<Typography
										variant='body2'
										sx={{
											color: theme.textColor?.secondary?.main || 'text.secondary',
											fontSize: isMobileSize ? '0.7rem' : '0.75rem',
											textAlign: 'center',
										}}>
										Based on all graded quizzes in this course
									</Typography>
								</Paper>

								<Paper
									elevation={3}
									sx={{
										p: isMobileSize ? '1.5rem 1.25rem' : '2rem 1rem',
										borderRadius: 2,
										backgroundColor: theme.bgColor?.secondary,
										flex: 1,
										display: 'flex',
										flexDirection: 'column',
										justifyContent: 'center',
										alignItems: 'center',
									}}>
									<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5, gap: 2 }}>
										<Typography variant={isMobileSize ? 'body2' : 'body1'}>Enrolled Learners</Typography>
										<Tooltip title='Download list' placement='top' arrow>
											<IconButton
												size='small'
												onClick={handleDownloadEnrolledStudents}
												disabled={isDownloading || !data.students?.length}
												aria-label='Download enrolled learners list'>
												{isDownloading ? <CircularProgress size={16} /> : <DownloadIcon fontSize='small' />}
											</IconButton>
										</Tooltip>
									</Box>
									<Typography variant='h4' sx={{ margin: '0.75rem 0' }}>
										{data.students.length}
									</Typography>
									<Typography
										variant='body2'
										sx={{
											color: theme.textColor?.secondary?.main || 'text.secondary',
											fontSize: isMobileSize ? '0.7rem' : '0.75rem',
											textAlign: 'center',
										}}>
										Number of learners enrolled in this course
									</Typography>
								</Paper>

								<Paper
									elevation={3}
									sx={{
										p: isMobileSize ? '1.5rem 1.25rem' : '2rem 1rem',
										borderRadius: 2,
										backgroundColor: theme.bgColor?.secondary,
										flex: 1,
										display: 'flex',
										flexDirection: 'column',
										justifyContent: 'center',
										alignItems: 'center',
									}}>
									<Typography variant={isMobileSize ? 'body2' : 'body1'} sx={{ mb: 0.5 }}>
										Completed Learners
									</Typography>
									<Typography variant='h4' sx={{ margin: '0.75rem 0' }}>
										{data.completedStudentsCount}
									</Typography>
									<Typography
										variant='body2'
										sx={{
											color: theme.textColor?.secondary?.main || 'text.secondary',
											fontSize: isMobileSize ? '0.7rem' : '0.75rem',
											textAlign: 'center',
										}}>
										Learners who have completed this course
									</Typography>
								</Paper>

								<Paper
									elevation={3}
									sx={{
										p: isMobileSize ? '1.5rem 1.25rem' : '2rem 1rem',
										borderRadius: 2,
										backgroundColor: theme.bgColor?.secondary,
										flex: 1,
										display: 'flex',
										flexDirection: 'column',
										alignItems: 'center',
										gap: 1.5,
									}}>
									<Typography variant={isMobileSize ? 'body2' : 'body1'} sx={{ mb: 0.5 }}>
										Instructor
									</Typography>

									<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
										<Avatar
											src={data.instructor?.imageUrl || undefined}
											sx={{
												width: 40,
												height: 40,
												bgcolor: theme.bgColor?.primary,
											}}
										/>
										<Typography variant='body2' sx={{ textAlign: 'center', fontSize: isMobileSize ? '0.8rem' : '0.85rem' }}>
											{data.instructor?.name || 'Not assigned'}
										</Typography>
									</Box>
								</Paper>
							</Box>

							<Paper
								elevation={3}
								sx={{
									mt: 2,
									borderRadius: 2,
									overflow: 'hidden',
									mb: '3rem',
								}}>
								<Table>
									<TableHead sx={{ backgroundColor: theme.bgColor?.secondary }}>
										<TableRow>
											<TableCell sx={{ fontWeight: 600, textAlign: 'center' }}>Rank</TableCell>
											<TableCell sx={{ fontWeight: 600, textAlign: 'center' }}>Student</TableCell>
											<TableCell sx={{ fontWeight: 600, textAlign: 'center' }}>Email</TableCell>
											<TableCell sx={{ fontWeight: 600, textAlign: 'center' }}>{isMobileSize ? 'Score' : 'Total Score'}</TableCell>
											{!isMobileSize && <TableCell sx={{ fontWeight: 600, textAlign: 'center' }}>Percent</TableCell>}
										</TableRow>
									</TableHead>
									<TableBody sx={{ textAlign: 'center' }}>
										{data.students.map((student) => (
											<TableRow key={student.userId}>
												<TableCell sx={{ textAlign: 'center', fontSize: isMobileSize ? '0.7rem' : undefined }}>{student.rank}</TableCell>
												<TableCell sx={{ textAlign: 'center', fontSize: isMobileSize ? '0.7rem' : undefined }}>{student.name}</TableCell>
												<TableCell sx={{ textAlign: 'center', fontSize: isMobileSize ? '0.7rem' : undefined }}>{student.email || '-'}</TableCell>
												<TableCell sx={{ textAlign: 'center', fontSize: isMobileSize ? '0.7rem' : undefined }}>{student.totalEarnedScore}</TableCell>
												{!isMobileSize && (
													<TableCell sx={{ textAlign: 'center' }}>{student.percent !== null ? `${student.percent}%` : 'N/A'}</TableCell>
												)}
											</TableRow>
										))}
									</TableBody>
								</Table>
							</Paper>
						</>
					)}
				</Box>
			</DashboardPagesLayout>
		</AdminPageErrorBoundary>
	);
};

export default AdminCourseAnalytics;
