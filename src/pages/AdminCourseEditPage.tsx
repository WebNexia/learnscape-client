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
import CustomErrorMessage from '../components/forms/CustomFields/CustomErrorMessage';

const AdminCourseEditPage = () => {
	const { userId, courseId } = useParams();
	const navigate = useNavigate();
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;

	const { updateCoursePublishing, updateCourse } = useContext(CoursesContext);
	const [isEditMode, setIsEditMode] = useState<boolean>(false);
	const [singleCourse, setSingleCourse] = useState<SingleCourse>();
	const [isActive, setIsActive] = useState<boolean>();
	const [isFree, setIsFree] = useState<boolean>(false);
	const [isMissingField, setIsMissingField] = useState<boolean>(false);

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

	const handleCourseUpdate = async (e: FormEvent): Promise<void> => {
		e.preventDefault();
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
					position: 'sticky',
					top: 0,
					zIndex: 1000,
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
			<Box
				sx={{
					display: 'flex',
					justifyContent: 'flex-end',
					width: '90%',
					position: 'sticky',
					top: '7rem',
					zIndex: 1000,
				}}>
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
				{isEditMode ? (
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
							onClick={(e) => {
								if (
									singleCourse?.title.trim() !== '' &&
									singleCourse?.description.trim() !== '' &&
									(isFree ||
										(singleCourse?.priceCurrency !== '' &&
											singleCourse?.price !== ''))
								) {
									setIsEditMode(false);
									handleCourseUpdate(e);
								} else {
									setIsMissingField(true);
								}
							}}>
							Save
						</Button>
					</Box>
				) : (
					<Box sx={{ ml: '1rem' }}>
						<Tooltip title='Edit Course' placement='top'>
							<IconButton
								onClick={() => {
									setIsEditMode(true);
								}}>
								<Edit />
							</IconButton>
						</Tooltip>
					</Box>
				)}
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
										<Box key={chapter._id} sx={{ margin: '1rem 0 3rem 0' }}>
											<Box display='flex'>
												<Typography variant='h6' sx={{ mb: '1rem' }}>
													{chapter.title}
												</Typography>
											</Box>
											{chapter.lessons
												.sort((a, b) => a.order - b.order)
												.map((lesson) => {
													return (
														<Box
															key={lesson._id}
															sx={{
																display: 'flex',
																alignItems: 'center',
																height: '5rem',
																width: '90%',
																backgroundColor:
																	theme.bgColor?.common,
																margin: '1.25rem 0',
																borderRadius: '0.25rem',
																boxShadow:
																	'0.1rem 0 0.3rem 0.2rem rgba(0, 0, 0, 0.2)',
															}}>
															<Box
																sx={{
																	height: '5rem',
																	width: '6rem',
																}}>
																<img
																	src={lesson.imageUrl}
																	alt='lesson_img'
																	height='100%'
																	width='100%'
																	style={{
																		borderRadius:
																			'0.25rem 0 0 0.25rem',
																	}}
																/>
															</Box>
															<Box
																sx={{
																	ml: '1rem',
																}}>
																<Typography variant='body1'>
																	{lesson.title}
																</Typography>
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
				<Box
					sx={{
						display: 'flex',
						flexDirection: 'column',
						justifyContent: 'flex-start',
						width: '90%',
					}}>
					<form onSubmit={handleCourseUpdate}>
						<Box sx={{ mt: '2rem' }}>
							<Typography variant='h3'>Title*</Typography>
							<CustomTextField
								sx={{
									marginTop: '0.5rem',
									backgroundColor: theme.bgColor?.common,
								}}
								value={singleCourse?.title}
								onChange={(e) => {
									setSingleCourse(() => {
										if (singleCourse?.title !== undefined) {
											return { ...singleCourse, title: e.target.value };
										}
									});
									setIsMissingField(false);
								}}
								error={isMissingField && singleCourse?.title === ''}
							/>
							{isMissingField && singleCourse?.title === '' && (
								<CustomErrorMessage>Please enter a title</CustomErrorMessage>
							)}
						</Box>
						<Box sx={{ mt: '2rem' }}>
							<Typography variant='h3'>Description*</Typography>

							<CustomTextField
								sx={{ marginTop: '0.5rem', backgroundColor: theme.bgColor?.common }}
								value={singleCourse?.description}
								onChange={(e) => {
									setSingleCourse(() => {
										if (singleCourse?.description !== undefined) {
											return { ...singleCourse, description: e.target.value };
										}
									});
									setIsMissingField(false);
								}}
								multiline
								error={isMissingField && singleCourse?.description === ''}
							/>
							{isMissingField && singleCourse?.description === '' && (
								<CustomErrorMessage>Please enter a description</CustomErrorMessage>
							)}
						</Box>
						<Box sx={{ mt: '2rem' }}>
							<Typography variant='h3'>Price*</Typography>
							<Box sx={{ display: 'flex' }}>
								<Box sx={{ flex: 2 }}>
									<CustomTextField
										sx={{
											marginTop: '0.5rem',
											backgroundColor: !isFree
												? theme.bgColor?.common
												: 'inherit',
										}}
										value={isFree ? '' : singleCourse?.priceCurrency}
										onChange={(e) => {
											if (singleCourse?.priceCurrency !== undefined) {
												setSingleCourse({
													...singleCourse,
													priceCurrency: isFree ? '' : e.target.value,
												});
											}
											setIsMissingField(false);
										}}
										disabled={isFree}
										error={isMissingField && singleCourse?.priceCurrency === ''}
										placeholder={isFree ? '' : 'Enter currency symbol'}
									/>
									{isMissingField &&
										singleCourse?.priceCurrency === '' &&
										!isFree && (
											<CustomErrorMessage>
												Please enter a currency
											</CustomErrorMessage>
										)}
								</Box>
								<Box
									sx={{
										display: 'flex',
										flexDirection: 'column',
										justifyContent: 'flex-start',
										flex: 3,
									}}>
									<CustomTextField
										sx={{
											margin: '0.5rem 0 0 1rem',
											backgroundColor: !isFree
												? theme.bgColor?.common
												: 'inherit',
										}}
										value={isFree ? '' : singleCourse?.price}
										onChange={(e) => {
											if (singleCourse?.price !== undefined) {
												setSingleCourse({
													...singleCourse,
													price: isFree ? 'Free' : e.target.value,
												});
											}
											setIsMissingField(false);
										}}
										type='number'
										disabled={isFree}
										error={isMissingField && singleCourse?.price === ''}
										placeholder={isFree ? '' : 'Enter price value'}
									/>
									{isMissingField && singleCourse?.price === '' && (
										<CustomErrorMessage>
											Please enter a price value
										</CustomErrorMessage>
									)}
								</Box>
							</Box>
							<Box sx={{ margin: '2rem' }}>
								<FormControlLabel
									control={
										<Checkbox
											checked={isFree}
											onChange={(e) => {
												setIsFree(e.target.checked);
												if (
													singleCourse?.price !== undefined &&
													singleCourse?.priceCurrency !== undefined
												) {
													setSingleCourse({
														...singleCourse!,
														priceCurrency: '',
														price: e.target.checked ? 'Free' : '',
													});
												}
												if (e.target.checked) {
													setIsMissingField(false);
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
								sx={{ marginTop: '0.5rem', backgroundColor: theme.bgColor?.common }}
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
								sx={{ marginTop: '0.5rem', backgroundColor: theme.bgColor?.common }}
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
								sx={{ marginTop: '0.5rem', backgroundColor: theme.bgColor?.common }}
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
								sx={{ marginTop: '0.5rem', backgroundColor: theme.bgColor?.common }}
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
						<Box sx={{ mt: '3rem' }}>
							<Typography variant='h3'>Chapters</Typography>
							{singleCourse &&
								singleCourse.chapters
									.sort((a, b) => a.order - b.order)
									.map((chapter) => {
										return (
											<Box
												key={chapter._id}
												sx={{ margin: '1.5rem 0 3rem 0', width: '90%' }}>
												<Box
													sx={{
														display: 'flex',
														justifyContent: 'space-between',
														alignItems: 'center',
														mb: '1rem',
													}}>
													<Box>
														<Typography variant='h6'>
															{chapter.title}
														</Typography>
													</Box>
													<Box>
														<Button
															variant='contained'
															sx={{
																backgroundColor:
																	theme.bgColor?.greenPrimary,
																':hover': {
																	backgroundColor:
																		theme.bgColor?.common,
																	color: theme.textColor
																		?.greenPrimary.main,
																},
															}}>
															Add Lesson
														</Button>
													</Box>
												</Box>
												{chapter.lessons
													.sort((a, b) => a.order - b.order)
													.map((lesson) => {
														return (
															<Box
																key={lesson._id}
																sx={{
																	display: 'flex',
																	alignItems: 'center',
																	height: '5rem',
																	width: '100%',
																	backgroundColor:
																		theme.bgColor?.common,
																	margin: '1.25rem 0',
																	borderRadius: '0.25rem',
																	boxShadow:
																		'0.1rem 0 0.3rem 0.2rem rgba(0, 0, 0, 0.2)',
																	transition: '0.4s',
																	':hover': {
																		boxShadow:
																			'0.1rem 0 0.5rem 0.3rem rgba(0, 0, 0, 0.3)',
																		cursor: 'pointer',
																	},
																}}>
																<Box
																	sx={{
																		height: '5rem',
																		width: '6rem',
																	}}>
																	<img
																		src={lesson.imageUrl}
																		alt='lesson_img'
																		height='100%'
																		width='100%'
																		style={{
																			borderRadius:
																				'0.25rem 0 0 0.25rem',
																		}}
																	/>
																</Box>
																<Box
																	sx={{
																		display: 'flex',
																		justifyContent:
																			'space-between',
																		alignItems: 'center',
																		margin: '0 1rem',
																		width: '100%',
																	}}>
																	<Box>
																		<Typography variant='body1'>
																			{lesson.title}
																		</Typography>
																	</Box>
																	<Box>
																		<IconButton>
																			<Delete />
																		</IconButton>
																	</Box>
																</Box>
															</Box>
														);
													})}
											</Box>
										);
									})}
						</Box>
					</form>
				</Box>
			)}
		</DashboardPagesLayout>
	);
};

export default AdminCourseEditPage;
