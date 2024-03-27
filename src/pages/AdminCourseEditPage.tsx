import { Box, Button, IconButton, Paper, Tooltip, Typography } from '@mui/material';
import DashboardPagesLayout from '../components/layouts/DashboardLayout/DashboardPagesLayout';
import { useContext, useEffect, useState } from 'react';
import { UserCourseLessonDataContext } from '../contexts/UserCourseLessonDataContextProvider';
import { useNavigate, useParams } from 'react-router-dom';
import theme from '../themes';
import { Delete, Edit, KeyboardBackspaceOutlined } from '@mui/icons-material';
import axios from 'axios';
import { CoursesContext } from '../contexts/CoursesContextProvider';

const AdminCourseEditPage = () => {
	const { userId, courseId } = useParams();
	const navigate = useNavigate();
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;

	const { singleCourse, fetchSingleCourseData } = useContext(UserCourseLessonDataContext);

	const { updateCoursePublishing } = useContext(CoursesContext);
	const [isPublished, setIsPublished] = useState<boolean>(singleCourse?.isActive || false);

	const handlePublishing = async (): Promise<void> => {
		if (courseId !== undefined) {
			try {
				await axios.patch(`${base_url}/courses/${courseId}`, {
					isActive: !singleCourse?.isActive,
				});
				setIsPublished(!singleCourse?.isActive);
				updateCoursePublishing(courseId);
			} catch (error) {
				console.log(error);
			}
		}
	};

	const [isEditMode, setIsEditMode] = useState<boolean>(false);

	useEffect(() => {
		if (courseId) {
			fetchSingleCourseData(courseId);
		}
	}, [isPublished]);

	let startDate: string = '';
	const options: Intl.DateTimeFormatOptions = {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
	};

	if (singleCourse?.startingDate !== undefined) {
		const date: Date = new Date(singleCourse?.startingDate);
		startDate = date.toLocaleString('en-US', options);
	}

	return (
		<DashboardPagesLayout
			pageName='Course Edit'
			customSettings={{ justifyContent: 'flex-start' }}>
			<Paper
				elevation={10}
				sx={{
					width: '90%',
					height: '7rem',
					margin: '2.25rem 0',
					backgroundColor: theme.palette.primary.main,
				}}>
				<Box
					sx={{
						display: 'flex',
						justifyContent: 'space-between',
						height: '100%',
						width: '100%',
					}}>
					<Box sx={{ flex: 2, padding: '0.5rem' }}>
						<Button
							variant='text'
							startIcon={<KeyboardBackspaceOutlined />}
							sx={{
								color: theme.textColor?.common.main,
								textTransform: 'inherit',
								fontFamily: theme.fontFamily?.main,
								':hover': {
									backgroundColor: 'transparent',
									textDecoration: 'underline',
								},
							}}
							onClick={() => {
								navigate(`/admin/dashboard/user/${userId}`);
								window.scrollTo({ top: 0, behavior: 'smooth' });
							}}>
							Back to courses
						</Button>
					</Box>
					<Box
						sx={{
							display: 'flex',
							justifyContent: 'flex-end',
							alignItems: 'center',
							flex: 1,
							mr: '3rem',
						}}>
						<Typography variant='h3' sx={{ color: theme.textColor?.common.main }}>
							{singleCourse?.title}
						</Typography>
					</Box>
				</Box>
			</Paper>
			<Box sx={{ display: 'flex', justifyContent: 'flex-end', width: '90%' }}>
				<Box>
					<Button
						variant='contained'
						sx={{
							backgroundColor: theme.bgColor?.greenPrimary,
							':hover': {
								backgroundColor: theme.bgColor?.common,
								color: theme.textColor?.greenPrimary.main,
							},
						}}
						onClick={() => handlePublishing()}>
						{singleCourse?.isActive ? 'Unpublish' : 'Publish'}
					</Button>
				</Box>
				<Box sx={{ ml: '1rem' }}>
					{isEditMode ? (
						<Button
							variant='contained'
							sx={{
								backgroundColor: theme.bgColor?.greenPrimary,
								':hover': {
									backgroundColor: theme.bgColor?.common,
									color: theme.textColor?.greenPrimary.main,
								},
							}}
							onClick={() => {
								setIsEditMode(false);
							}}>
							Save
						</Button>
					) : (
						<Tooltip title='Edit Course' placement='top'>
							<IconButton
								onClick={() => {
									setIsEditMode(true);
								}}>
								<Edit />
							</IconButton>
						</Tooltip>
					)}
				</Box>
			</Box>
			{!isEditMode && (
				<Box
					sx={{
						display: 'flex',
						flexDirection: 'column',
						justifyContent: 'flex-start',
						width: '90%',
					}}>
					<Box sx={{ mt: '2rem' }}>
						<Typography variant='h3'>Title</Typography>
						<Typography variant='body2' sx={{ margin: '0.5rem 0 0 0.5rem' }}>
							{singleCourse?.title}
						</Typography>
					</Box>
					<Box sx={{ mt: '2rem' }}>
						<Typography variant='h3'>Description</Typography>
						<Typography variant='body2' sx={{ margin: '0.5rem 0 0 0.5rem' }}>
							{singleCourse?.description}
						</Typography>
					</Box>
					<Box sx={{ mt: '2rem' }}>
						<Typography variant='h3'>Price</Typography>
						<Typography variant='body2' sx={{ margin: '0.5rem 0 0 0.5rem' }}>
							{singleCourse?.priceCurrency}
							{singleCourse?.price}
						</Typography>
					</Box>
					<Box sx={{ mt: '2rem' }}>
						<Typography variant='h3'>Image URL</Typography>
						<Typography variant='body2' sx={{ margin: '0.5rem 0 0 0.5rem' }}>
							{singleCourse?.imageUrl}
						</Typography>
					</Box>
					<Box sx={{ mt: '2rem' }}>
						<Typography variant='h3'>Status</Typography>
						<Typography variant='body2' sx={{ margin: '0.5rem 0 0 0.5rem' }}>
							{isPublished ? 'Published' : 'Unpublished'}
						</Typography>
					</Box>
					<Box sx={{ mt: '2rem' }}>
						<Typography variant='h3'>Starting Date</Typography>
						<Typography variant='body2' sx={{ margin: '0.5rem 0 0 0.5rem' }}>
							{startDate}
						</Typography>
					</Box>
					<Box sx={{ mt: '2rem' }}>
						<Typography variant='h3'>Duration in Weeks</Typography>
						<Typography variant='body2' sx={{ margin: '0.5rem 0 0 0.5rem' }}>
							{singleCourse?.durationWeeks}
						</Typography>
					</Box>
					<Box sx={{ mt: '2rem' }}>
						<Typography variant='h3'>Duration in Hours</Typography>
						<Typography variant='body2' sx={{ margin: '0.5rem 0 0 0.5rem' }}>
							{singleCourse?.durationHours}
						</Typography>
					</Box>
					<Box sx={{ mt: '2rem' }}>
						<Typography variant='h3'>Chapters</Typography>
						{singleCourse &&
							singleCourse.chapters
								.sort((a, b) => a.order - b.order)
								.map((chapter) => {
									return (
										<Box>
											<Box display='flex'>
												<Typography variant='h6'>
													{chapter.title}
												</Typography>
												<Button>Add Lesson</Button>
											</Box>
											{chapter.lessons
												.sort((a, b) => a.order - b.order)
												.map((lesson) => {
													return (
														<Box>
															<Box
																sx={{
																	display: 'flex',
																	alignItems: 'center',
																}}>
																<Typography variant='body1'>
																	{lesson.title}
																</Typography>
																<IconButton>
																	<Delete />
																</IconButton>
															</Box>
														</Box>
													);
												})}
										</Box>
									);
								})}
					</Box>
				</Box>
			)}
		</DashboardPagesLayout>
	);
};

export default AdminCourseEditPage;
