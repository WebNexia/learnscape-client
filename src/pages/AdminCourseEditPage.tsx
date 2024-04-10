import {
	Alert,
	Box,
	Button,
	Checkbox,
	Dialog,
	DialogActions,
	DialogTitle,
	FormControlLabel,
	IconButton,
	Paper,
	Snackbar,
	Tooltip,
	Typography,
} from '@mui/material';
import DashboardPagesLayout from '../components/layouts/DashboardLayout/DashboardPagesLayout';
import { FormEvent, useContext, useEffect, useState } from 'react';

import { useNavigate, useParams } from 'react-router-dom';
import theme from '../themes';
import { Edit, KeyboardBackspaceOutlined } from '@mui/icons-material';
import axios from 'axios';
import { CoursesContext } from '../contexts/CoursesContextProvider';
import { SingleCourse } from '../interfaces/course';
import CustomTextField from '../components/forms/Custom Fields/CustomTextField';
import CustomErrorMessage from '../components/forms/Custom Fields/CustomErrorMessage';
import AdminCourseEditChapter from '../components/AdminCourseEditChapter';
import { BaseChapter } from '../interfaces/chapter';
import { Reorder, useMotionValue } from 'framer-motion';
import { useRaisedShadow } from '../hooks/use-raised-shadow';
import CustomSubmitButton from '../components/forms/Custom Buttons/CustomSubmitButton';
import CustomCancelButton from '../components/forms/Custom Buttons/CustomCancelButton';

export interface ChapterUpdateTrack {
	chapterId: string;
	isUpdated: boolean;
}

const AdminCourseEditPage = () => {
	const { userId, courseId } = useParams();
	const navigate = useNavigate();
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;

	const { updateCoursePublishing, updateCourse } = useContext(CoursesContext);
	const [isEditMode, setIsEditMode] = useState<boolean>(false);
	const [singleCourse, setSingleCourse] = useState<SingleCourse>();
	const [chapters, setChapters] = useState<BaseChapter[]>([]);
	const [isActive, setIsActive] = useState<boolean>();
	const [isFree, setIsFree] = useState<boolean>(false);
	const [isMissingField, setIsMissingField] = useState<boolean>(false);
	const [isMissingFieldMsgOpen, setIsMissingFieldMsgOpen] = useState<boolean>(false);
	const [isChapterUpdated, setIsChapterUpdated] = useState<ChapterUpdateTrack[]>([]);
	const [resetChanges, setResetChanges] = useState<boolean>(false);
	const [deletedChapterIds, setDeletedChapterIds] = useState<string[]>([]);
	const [newChapterTitle, setNewChapterTitle] = useState<string>('');

	const [isChapterCreateModalOpen, setIsChapterCreateModalOpen] = useState<boolean>(false);

	const createChapter = async (): Promise<void> => {
		try {
			const createChapterResponse = await axios.post(`${base_url}/chapters`, {
				title: newChapterTitle,
			});
			console.log(createChapterResponse.data._id);

			setChapters((prevData) => {
				return [createChapterResponse.data, ...prevData];
			});

			setSingleCourse((prevCourse) => {
				if (prevCourse) {
					const updatedCourse = {
						...prevCourse,
						chapterIds: [createChapterResponse.data._id, ...prevCourse.chapterIds],
						chapters: [createChapterResponse.data, ...chapters],
					};
					return updatedCourse;
				}
				return prevCourse;
			});

			if (singleCourse) {
				await axios.patch(`${base_url}/courses/${courseId}`, {
					...singleCourse,
					chapterIds: [createChapterResponse.data._id, ...singleCourse.chapterIds],
					chapters: [createChapterResponse.data, ...singleCourse.chapters],
				});

				updateCourse({
					...singleCourse,
					chapterIds: [createChapterResponse.data._id, ...singleCourse.chapterIds],
					chapters: [createChapterResponse.data, ...singleCourse.chapters],
				});
			}
		} catch (error) {
			console.log(error);
		}
	};

	const vertical = 'top';
	const horizontal = 'center';

	useEffect(() => {
		if (courseId) {
			const fetchSingleCourseData = async (courseId: string): Promise<void> => {
				try {
					const response = await axios.get(`${base_url}/courses/${courseId}`);

					const courseResponse = response?.data?.data[0];

					setSingleCourse(courseResponse);
					if (courseResponse?.price?.toLowerCase() === 'free') {
						setIsFree(true);
					}
					setIsActive(courseResponse.isActive);
					setChapters(courseResponse.chapters);
					const chapterUpdateData: ChapterUpdateTrack[] =
						courseResponse?.chapters?.reduce(
							(acc: ChapterUpdateTrack[], value: BaseChapter) => {
								acc.push({ chapterId: value._id, isUpdated: false });
								return acc;
							},
							[]
						);
					setIsChapterUpdated(chapterUpdateData);
				} catch (error) {
					console.log(error);
				}
			};
			fetchSingleCourseData(courseId);
		}
	}, [courseId, isActive, resetChanges]);

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
				await axios.patch(`${base_url}/courses/${courseId}`, singleCourse);
				updateCourse(singleCourse);

				await Promise.all(
					chapters.map(async (chapter, index) => {
						if (isChapterUpdated[index]?.isUpdated) {
							await axios.patch(`${base_url}/chapters/${chapter._id}`, chapter);
						}
					})
				);
			} catch (error) {
				console.log(error);
			}
		}

		if (deletedChapterIds.length !== 0) {
			await Promise.all(
				deletedChapterIds.map(async (chapterId) => {
					await axios.delete(`${base_url}/chapters/${chapterId}`);
				})
			);
		}

		setIsChapterUpdated((prevData) => {
			prevData = prevData.map((data) => {
				return { ...data, isUpdated: false };
			});
			return prevData;
		});
	};

	const formatDate = (date: Date) => {
		if (!(date instanceof Date)) return ''; // Return empty string if date is not valid

		const day = String(date.getDate()).padStart(2, '0');
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const year = date.getFullYear();

		return `${year}-${month}-${day}`;
	};

	const parseDate = (dateString: string) => {
		const [year, month, day] = dateString.split('-');
		return new Date(`${year}-${month}-${day}`);
	};

	const y = useMotionValue(0);
	const boxShadow = useRaisedShadow(y);

	return (
		<DashboardPagesLayout
			pageName='Course Edit'
			customSettings={{ justifyContent: 'flex-start' }}>
			<Box sx={{ width: '90%', position: 'sticky', zIndex: 500, top: 0 }}>
				<Paper
					elevation={10}
					sx={{
						width: '100%',
						height: '7rem',
						m: '2.25rem 0',
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
								flexDirection: 'column',
								justifyContent: 'center',
								alignItems: 'flex-end',
								flex: 1,
								mr: '3rem',
							}}>
							<Typography variant='h3' sx={{ color: theme.textColor?.common.main }}>
								{singleCourse?.title}
							</Typography>
							<Typography
								variant='body2'
								sx={{ color: theme.textColor?.common.main, mt: '0.75rem' }}>
								{isActive ? '(Published)' : '(Unpublished)'}
							</Typography>
						</Box>
					</Box>
				</Paper>
				<Box
					sx={{
						display: 'flex',
						justifyContent: 'space-between',
						alignItems: 'center',
						width: '100%',
						top: '7rem',
						zIndex: 1000,
					}}>
					<Box sx={{ textAlign: 'center' }}>
						<img
							src={singleCourse?.imageUrl}
							alt='course_img'
							height='125rem'
							style={{
								borderRadius: '0.2rem',
								boxShadow: '0 0.1rem 0.4rem 0.2rem rgba(0,0,0,0.3)',
							}}
						/>
						<Typography variant='body2' sx={{ mt: '0.25rem' }}>
							Course Image
						</Typography>
					</Box>
					<Box sx={{ display: 'flex' }}>
						<Box>
							<CustomSubmitButton
								sx={{
									visibility: isEditMode ? 'hidden' : 'visible',
								}}
								onClick={handlePublishing}>
								{isActive ? 'Unpublish' : 'Publish'}
							</CustomSubmitButton>
						</Box>
						<Snackbar
							open={isMissingFieldMsgOpen}
							autoHideDuration={3000}
							anchorOrigin={{ vertical, horizontal }}
							sx={{ mt: '14rem' }}
							onClose={() => setIsMissingFieldMsgOpen(false)}>
							<Alert severity='error' variant='filled' sx={{ width: '100%' }}>
								Fill the required field(s)
							</Alert>
						</Snackbar>
						{isEditMode ? (
							<Box>
								<CustomSubmitButton
									onClick={(e) => {
										if (
											singleCourse?.title.trim() !== '' &&
											singleCourse?.description.trim() !== '' &&
											(isFree ||
												(singleCourse?.priceCurrency !== '' &&
													singleCourse?.price !== '')) &&
											!chapters.some((chapter) => chapter.title === '')
										) {
											setIsEditMode(false);
											handleCourseUpdate(e as FormEvent<Element>);
										} else {
											setIsMissingField(true);
											setIsMissingFieldMsgOpen(true);
										}
									}}>
									Save
								</CustomSubmitButton>
								<CustomCancelButton
									onClick={() => {
										setIsEditMode(false);
										setIsChapterUpdated((prevData) => {
											prevData = prevData.map((data) => {
												return { ...data, isUpdated: false };
											});
											return prevData;
										});
										setResetChanges(!resetChanges);
									}}>
									Cancel
								</CustomCancelButton>
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
					<Box
						sx={{
							mt: '3rem',
							padding: '2rem',
							boxShadow: '0 0 0.3rem 0 rgba(0,0,0,0.2)',
						}}>
						<Typography variant='h4'>Title</Typography>
						<Typography variant='body2' sx={{ mt: '0.5rem' }}>
							{singleCourse?.title}
						</Typography>
					</Box>
					<Box
						sx={{
							mt: '2rem',
							padding: '2rem',
							boxShadow: '0 0 0.3rem 0 rgba(0,0,0,0.2)',
						}}>
						<Typography variant='h4'>Description</Typography>
						<Typography variant='body2' sx={{ mt: '0.5rem' }}>
							{singleCourse?.description}
						</Typography>
					</Box>

					<Box
						sx={{
							display: 'flex',
							justifyContent: 'space-between',
							alignItems: 'center',
							mt: '2rem',
							padding: '2rem',
							boxShadow: '0 0 0.3rem 0 rgba(0,0,0,0.2)',
						}}>
						<Box sx={{ textAlign: 'center' }}>
							<Typography variant='h4'>Price</Typography>
							<Typography variant='body2' sx={{ mt: '0.5rem' }}>
								{singleCourse?.priceCurrency}
								{singleCourse?.price}
							</Typography>
						</Box>
						<Box sx={{ textAlign: 'center' }}>
							<Typography variant='h4'>Starting Date</Typography>
							<Typography variant='body2' sx={{ mt: '0.5rem' }}>
								{startDate}
							</Typography>
						</Box>
						<Box sx={{ textAlign: 'center' }}>
							<Typography variant='h4'>Weeks</Typography>
							<Typography variant='body2' sx={{ mt: '0.5rem' }}>
								{singleCourse?.durationWeeks}
							</Typography>
						</Box>
						<Box sx={{ textAlign: 'center' }}>
							<Typography variant='h4'>Hours</Typography>
							<Typography variant='body2' sx={{ mt: '0.5rem' }}>
								{singleCourse?.durationHours}
							</Typography>
						</Box>
					</Box>
					<Box sx={{ mt: '6rem', minHeight: '40vh' }}>
						<Typography variant='h4'>Chapters</Typography>
						{singleCourse?.chapterIds?.length === 0 ? (
							<Box
								sx={{
									display: 'flex',
									justifyContent: 'center',
									alignItems: 'center',
									height: '30vh',
								}}>
								<Typography variant='body1'>No chapters for this course</Typography>
							</Box>
						) : (
							<>
								{singleCourse &&
									singleCourse.chapters.map((chapter) => {
										return (
											<Box key={chapter._id} sx={{ margin: '1rem 0 4rem 0' }}>
												<Box display='flex'>
													<Typography variant='h6' sx={{ mb: '1rem' }}>
														{chapter.title}
													</Typography>
												</Box>
												{chapter.lessons &&
													chapter.lessons.length !== 0 &&
													chapter.lessons.map((lesson) => {
														return (
															<Box
																key={lesson._id}
																sx={{
																	display: 'flex',
																	alignItems: 'center',
																	height: '5rem',
																	width: '60%',
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
																		src={lesson?.imageUrl}
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
							</>
						)}
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
							<Typography variant='h4'>Title*</Typography>
							<CustomTextField
								sx={{
									marginTop: '0.5rem',
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
							<Typography variant='h4'>Description*</Typography>

							<CustomTextField
								sx={{ marginTop: '0.5rem' }}
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

						<Box
							sx={{
								display: 'flex',
								justifyContent: 'space-between',
								alignItems: 'flex-start',
							}}>
							<Box sx={{ mt: '2rem', flex: 6 }}>
								<Typography variant='h4'>Price*</Typography>
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
											error={
												isMissingField && singleCourse?.priceCurrency === ''
											}
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
												margin: '0.5rem 0 0 0.5rem',
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
								<Box sx={{ margin: '1rem' }}>
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
							<Box sx={{ margin: '2rem 0 0 6rem', flex: 10 }}>
								<Typography variant='h4'>Image URL</Typography>
								<CustomTextField
									required={false}
									sx={{ marginTop: '0.5rem' }}
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
						</Box>

						<Box
							sx={{
								display: 'flex',
								justifyContent: 'space-between',
								alignItems: 'flex-start',
							}}>
							<Box sx={{ display: 'flex', mt: '2rem', flex: 6 }}>
								<Box sx={{ flex: 2 }}>
									<Typography variant='h4'>Weeks</Typography>
									<CustomTextField
										required={false}
										sx={{ marginTop: '0.5rem' }}
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
										placeholder='Number of weeks'
									/>
								</Box>
								<Box sx={{ ml: '0.5rem', flex: 3 }}>
									<Typography variant='h4'>Hours</Typography>
									<CustomTextField
										required={false}
										sx={{ marginTop: '0.5rem' }}
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
										placeholder='Number of hours'
									/>
								</Box>
							</Box>
							<Box sx={{ margin: '2rem 0 0 6rem', flex: 10 }}>
								<Typography variant='h4'>Starting Date</Typography>
								<CustomTextField
									required={false}
									sx={{ marginTop: '0.5rem' }}
									value={
										singleCourse && singleCourse.startingDate
											? formatDate(new Date(singleCourse.startingDate)) // Format the starting date
											: ''
									}
									onChange={(e) => {
										const selectedDate = parseDate(e.target.value); // Parse the input date
										if (
											singleCourse &&
											singleCourse.startingDate !== undefined
										) {
											setSingleCourse({
												...singleCourse,
												startingDate: selectedDate, // Assign parsed date object here
											});
										}
									}}
									type='date'
								/>
							</Box>
						</Box>
						<Box sx={{ mt: '4rem', minHeight: '40vh' }}>
							<Box
								sx={{
									display: 'flex',
									justifyContent: 'space-between',
									alignItems: 'center',
									width: '90%',
								}}>
								<Typography variant='h4' sx={{ mb: '1rem' }}>
									Chapters
								</Typography>
								<CustomSubmitButton
									sx={{ marginBottom: '1rem' }}
									onClick={() => {
										setIsChapterCreateModalOpen(true);
										setNewChapterTitle('');
									}}>
									New Chapter
								</CustomSubmitButton>
							</Box>

							<Dialog
								open={isChapterCreateModalOpen}
								onClose={() => setIsChapterCreateModalOpen(false)}
								fullWidth
								maxWidth='md'>
								<DialogTitle variant='h3' sx={{ paddingTop: '2rem' }}>
									Create New Chapter
								</DialogTitle>
								<form
									onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
										e.preventDefault();
										createChapter();
										setIsChapterCreateModalOpen(false);
									}}
									style={{ display: 'flex', flexDirection: 'column' }}>
									<CustomTextField
										fullWidth={false}
										label='Chapter Title'
										value={newChapterTitle}
										onChange={(e) => setNewChapterTitle(e.target.value)}
										sx={{ margin: '2rem 1rem' }}
										InputLabelProps={{
											sx: { fontSize: '0.8rem' },
										}}
									/>

									<DialogActions
										sx={{
											marginBottom: '2rem',
										}}>
										<CustomCancelButton
											onClick={() => setIsChapterCreateModalOpen(false)}
											sx={{
												margin: '0 0.5rem 1rem 0',
											}}>
											Cancel
										</CustomCancelButton>
										<CustomSubmitButton
											sx={{
												margin: '0 0.5rem 1rem 0',
											}}>
											Create
										</CustomSubmitButton>
									</DialogActions>
								</form>
							</Dialog>

							{singleCourse?.chapterIds.length === 0 ? (
								<Box
									sx={{
										display: 'flex',
										justifyContent: 'center',
										alignItems: 'center',
										height: '30vh',
									}}>
									<Typography variant='body1'>
										No chapters for this course
									</Typography>
								</Box>
							) : (
								<Reorder.Group
									axis='y'
									values={chapters}
									onReorder={(newChapters): void => {
										setChapters(newChapters);
										setSingleCourse((prevCourse) => {
											if (prevCourse) {
												return {
													...prevCourse,
													chapters: newChapters,
													chapterIds: newChapters.map(
														(newChapter) => newChapter._id
													),
												};
											}
											return prevCourse; // Return unchanged if prevCourse is undefined
										});
									}}>
									{singleCourse &&
										singleCourse.chapterIds.length !== 0 &&
										chapters.map((chapter) => {
											return (
												<Reorder.Item
													key={chapter._id}
													value={chapter}
													style={{ listStyle: 'none', boxShadow }}>
													<AdminCourseEditChapter
														key={chapter._id}
														chapter={chapter}
														setSingleCourse={setSingleCourse}
														setChapters={setChapters}
														setIsChapterUpdated={setIsChapterUpdated}
														setIsMissingField={setIsMissingField}
														isMissingField={isMissingField}
														setDeletedChapterIds={setDeletedChapterIds}
													/>
												</Reorder.Item>
											);
										})}
								</Reorder.Group>
							)}
						</Box>
					</form>
				</Box>
			)}
		</DashboardPagesLayout>
	);
};

export default AdminCourseEditPage;
