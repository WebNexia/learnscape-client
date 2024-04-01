import {
	Box,
	Button,
	Checkbox,
	FormControlLabel,
	IconButton,
	Paper,
	Tooltip,
	Typography,
} from '@mui/material';
import DashboardPagesLayout from '../components/layouts/DashboardLayout/DashboardPagesLayout';
import { FormEvent, useContext, useEffect, useState } from 'react';

import { useNavigate, useParams } from 'react-router-dom';
import theme from '../themes';
import { Delete, Edit, KeyboardBackspaceOutlined } from '@mui/icons-material';
import axios from 'axios';
import { CoursesContext } from '../contexts/CoursesContextProvider';
import { SingleCourse } from '../interfaces/course';
import CustomTextField from '../components/forms/CustomFields/CustomTextField';

const AdminCourseEditPage = () => {
	const { userId, courseId } = useParams();
	const navigate = useNavigate();
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;

	const { updateCoursePublishing, updateCourse } = useContext(CoursesContext);
	const [isEditMode, setIsEditMode] = useState<boolean>(false);
	const [singleCourse, setSingleCourse] = useState<SingleCourse>();
	const [isActive, setIsActive] = useState<boolean>();
	const [isFree, setIsFree] = useState<boolean>(false);

	useEffect(() => {
		if (courseId) {
			const fetchSingleCourseData = async (courseId: string): Promise<void> => {
				try {
					const response = await axios.get(`${base_url}/courses/${courseId}`);
					setSingleCourse(response.data.data[0]);
					if (response.data.data[0].price.toLowerCase() === 'free') {
						setIsFree(true);
					}
					setIsActive(response.data.data[0].isActive);
				} catch (error) {
					console.log(error);
				}
			};
			fetchSingleCourseData(courseId);
		}
	}, [courseId, isActive]);

	const handlePublishing = async (): Promise<void> => {
		if (courseId !== undefined) {
			try {
				await axios.patch(`${base_url}/courses/${courseId}`, {
					isActive: !singleCourse?.isActive,
				});
				setIsActive(!singleCourse?.isActive);
				updateCoursePublishing(courseId);
			} catch (error) {
				console.log(error);
			}
		}
	};

	let startDate: string = '';
	const options: Intl.DateTimeFormatOptions = {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
	};

	if (singleCourse?.startingDate !== undefined) {
		const date: Date = new Date(singleCourse?.startingDate);
		startDate = date.toLocaleString('en-US', options);
	}

	const handleCourseUpdate = async (event: FormEvent): Promise<void> => {
		event.preventDefault();
		if (singleCourse !== undefined) {
			try {
				const response = await axios.patch(`${base_url}/courses/${courseId}`, singleCourse);
				console.log(response.data);
				updateCourse(singleCourse);
			} catch (error) {
				console.log(error);
			}
		}
	};

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
							visibility: isEditMode ? 'hidden' : 'visible',
							backgroundColor: theme.bgColor?.greenPrimary,
							':hover': {
								backgroundColor: theme.bgColor?.common,
								color: theme.textColor?.greenPrimary.main,
							},
						}}
						onClick={() => handlePublishing()}>
						{isActive ? 'Unpublish' : 'Publish'}
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
							onClick={(e) => {
								setIsEditMode(false);
								handleCourseUpdate(e);
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
							{isActive ? 'Published' : 'Unpublished'}
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
										<Box key={chapter._id}>
											<Box display='flex'>
												<Typography variant='h6'>
													{chapter.title}
												</Typography>
												{isEditMode && <Button>Add Lesson</Button>}
											</Box>
											{chapter.lessons
												.sort((a, b) => a.order - b.order)
												.map((lesson) => {
													return (
														<Box key={lesson._id}>
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
			{isEditMode && (
				<form
					style={{
						display: 'flex',
						flexDirection: 'column',
						justifyContent: 'flex-start',
						width: '90%',
					}}
					onSubmit={handleCourseUpdate}>
					<Box sx={{ mt: '2rem' }}>
						<Typography variant='h3'>Title</Typography>
						<CustomTextField
							sx={{ margin: '0.5rem 0 0 0.5rem' }}
							value={singleCourse?.title}
							onChange={(e) => {
								setSingleCourse(() => {
									if (singleCourse?.title !== undefined) {
										return { ...singleCourse, title: e.target.value };
									}
								});
							}}
						/>
					</Box>
					<Box sx={{ mt: '2rem' }}>
						<Typography variant='h3'>Description</Typography>

						<CustomTextField
							sx={{ margin: '0.5rem 0 0 0.5rem' }}
							value={singleCourse?.description}
							onChange={(e) => {
								setSingleCourse(() => {
									if (singleCourse?.description !== undefined) {
										return { ...singleCourse, description: e.target.value };
									}
								});
							}}
							multiline
						/>
					</Box>
					<Box sx={{ mt: '2rem' }}>
						<Typography variant='h3'>Price</Typography>
						<Box sx={{ display: 'flex' }}>
							<CustomTextField
								sx={{ margin: '0.5rem 0 0 0.5rem' }}
								value={isFree ? '' : singleCourse?.priceCurrency}
								onChange={(e) => {
									if (singleCourse?.priceCurrency !== undefined) {
										setSingleCourse({
											...singleCourse,
											priceCurrency: isFree ? '' : e.target.value,
										});
									}
								}}
								disabled={isFree}
							/>
							<CustomTextField
								sx={{ margin: '0.5rem 0 0 0.5rem' }}
								value={isFree ? '' : singleCourse?.price}
								onChange={(e) => {
									if (singleCourse?.price !== undefined) {
										setSingleCourse({
											...singleCourse,
											price: isFree ? 'Free' : e.target.value,
										});
									}
								}}
								type='number'
								disabled={isFree}
							/>
						</Box>
						<Box sx={{ margin: '2rem' }}>
							<FormControlLabel
								control={
									<Checkbox
										checked={isFree}
										onChange={(e) => {
											setIsFree(e.target.checked);
											if (
												e.target.checked &&
												singleCourse?.price !== undefined &&
												singleCourse?.priceCurrency !== undefined
											) {
												setSingleCourse({
													...singleCourse,
													priceCurrency: '',
													price: 'Free',
												});
											}
										}}
									/>
								}
								label='Free Course'
							/>
						</Box>
					</Box>
					<Box sx={{ mt: '2rem' }}>
						<Typography variant='h3'>Image URL</Typography>
						<CustomTextField
							sx={{ margin: '0.5rem 0 0 0.5rem' }}
							value={singleCourse?.imageUrl}
							onChange={(e) => {
								if (singleCourse?.imageUrl !== undefined) {
									setSingleCourse({
										...singleCourse,
										imageUrl: e.target.value,
									});
								}
							}}
						/>
					</Box>
					<Box sx={{ mt: '2rem' }}>
						<Typography variant='h3'>Starting Date</Typography>
						<CustomTextField
							sx={{ margin: '0.5rem 0 0 0.5rem' }}
							value={
								singleCourse?.startingDate instanceof Date
									? singleCourse?.startingDate.toISOString().split('T')[0]
									: ''
							}
							onChange={(e) => {
								const selectedDate = new Date(e.target.value);
								if (singleCourse?.startingDate !== undefined) {
									setSingleCourse({
										...singleCourse,
										startingDate: selectedDate,
									});
								}
							}}
							type='date'
						/>
					</Box>
					<Box sx={{ mt: '2rem' }}>
						<Typography variant='h3'>Duration in Weeks</Typography>
						<CustomTextField
							sx={{ margin: '0.5rem 0 0 0.5rem' }}
							value={singleCourse?.durationWeeks}
							onChange={(e) => {
								if (singleCourse?.durationWeeks !== undefined) {
									setSingleCourse({
										...singleCourse,
										durationWeeks: +e.target.value,
									});
								}
							}}
							type='number'
						/>
					</Box>
					<Box sx={{ mt: '2rem' }}>
						<Typography variant='h3'>Duration in Hours</Typography>
						<CustomTextField
							sx={{ margin: '0.5rem 0 0 0.5rem' }}
							value={singleCourse?.durationHours}
							onChange={(e) => {
								if (singleCourse?.durationHours !== undefined) {
									setSingleCourse({
										...singleCourse,
										durationHours: +e.target.value,
									});
								}
							}}
							type='number'
						/>
					</Box>
					<Box sx={{ mt: '2rem' }}>
						<Typography variant='h3'>Chapters</Typography>
						{singleCourse &&
							singleCourse.chapters
								.sort((a, b) => a.order - b.order)
								.map((chapter) => {
									return (
										<Box key={chapter._id}>
											<Box display='flex'>
												<Typography variant='h6'>
													{chapter.title}
												</Typography>
												{isEditMode && <Button>Add Lesson</Button>}
											</Box>
											{chapter.lessons
												.sort((a, b) => a.order - b.order)
												.map((lesson) => {
													return (
														<Box key={lesson._id}>
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
				</form>
			)}
		</DashboardPagesLayout>
	);
};

export default AdminCourseEditPage;
