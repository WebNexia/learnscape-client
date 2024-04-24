import { Box, Dialog, DialogActions, DialogTitle, Typography } from '@mui/material';
import DashboardPagesLayout from '../components/layouts/Dashboard Layout/DashboardPagesLayout';
import { FormEvent, useContext, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { CoursesContext } from '../contexts/CoursesContextProvider';
import { SingleCourse } from '../interfaces/course';
import CustomTextField from '../components/forms/Custom Fields/CustomTextField';
import AdminCourseEditChapter from '../components/Admin Single Course/AdminCourseEditChapter';
import { BaseChapter } from '../interfaces/chapter';
import { Reorder, useMotionValue } from 'framer-motion';
import { useRaisedShadow } from '../hooks/use-raised-shadow';
import CustomSubmitButton from '../components/forms/Custom Buttons/CustomSubmitButton';
import CustomCancelButton from '../components/forms/Custom Buttons/CustomCancelButton';
import CoursePaper from '../components/Admin Single Course/Paper';
import CourseEditorBox from '../components/Admin Single Course/CourseEditorBox';
import CourseDetailsNonEditBox from '../components/Admin Single Course/CourseDetailsNonEditBox';
import CourseDetailsEditBox from '../components/Admin Single Course/CourseDetailsEditBox';

export interface ChapterUpdateTrack {
	chapterId: string;
	isUpdated: boolean;
}

const AdminCourseEditPage = () => {
	const { userId, courseId } = useParams();
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;

	const { updateCoursePublishing, updateCourse } = useContext(CoursesContext);
	const [isEditMode, setIsEditMode] = useState<boolean>(false);
	const [singleCourse, setSingleCourse] = useState<SingleCourse>();
	const [chapters, setChapters] = useState<BaseChapter[]>([]);
	const [allChaptersBeforeSave, setAllChaptersBeforeSave] = useState<BaseChapter[]>([]);
	const [newChaptersToCreate, setNewChaptersToCreate] = useState<BaseChapter[]>([]);
	const [isActive, setIsActive] = useState<boolean>();
	const [isFree, setIsFree] = useState<boolean>(false);
	const [isMissingField, setIsMissingField] = useState<boolean>(false);
	const [isMissingFieldMsgOpen, setIsMissingFieldMsgOpen] = useState<boolean>(false);
	const [isNoChapterMsgOpen, setIsNoChapterMsgOpen] = useState<boolean>(false);
	const [isChapterUpdated, setIsChapterUpdated] = useState<ChapterUpdateTrack[]>([]);
	const [resetChanges, setResetChanges] = useState<boolean>(false);
	const [deletedChapterIds, setDeletedChapterIds] = useState<string[]>([]);
	const [notSavedChapterIds, setNotSavedChapterIds] = useState<string[]>([]);
	const [newChapterTitle, setNewChapterTitle] = useState<string>('');
	const [isChapterCreateModalOpen, setIsChapterCreateModalOpen] = useState<boolean>(false);

	const generateUniqueId = (): string => {
		// Generate a random string of characters
		const randomString = Math.random().toString(36).substr(2, 9);

		// Generate a timestamp to ensure uniqueness
		const timestamp = Date.now().toString(36);

		// Concatenate random string and timestamp to create a unique ID
		const uniqueId = randomString + timestamp;

		return uniqueId;
	};

	const createChapter = async (): Promise<void> => {
		try {
			const newChapterBeforeSave: BaseChapter = {
				_id: generateUniqueId(),
				title: newChapterTitle,
				isActive: true,
				lessonIds: [],
				lessons: [],
				createdAt: '',
				updatedAt: '',
			};

			setAllChaptersBeforeSave((prevData) => {
				return [newChapterBeforeSave, ...prevData];
			});

			setNotSavedChapterIds((prevData) => {
				return [newChapterBeforeSave._id, ...prevData];
			});

			setNewChaptersToCreate((prevData) => {
				return [newChapterBeforeSave, ...prevData];
			});
		} catch (error) {
			console.log(error);
		}
	};

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

					if (courseResponse.chapters[0].title) {
						setChapters(courseResponse.chapters);
						setAllChaptersBeforeSave(courseResponse.chapters);
					}

					const chapterUpdateData: ChapterUpdateTrack[] = courseResponse?.chapters?.reduce((acc: ChapterUpdateTrack[], value: BaseChapter) => {
						acc.push({ chapterId: value._id, isUpdated: false });
						return acc;
					}, []);
					setIsChapterUpdated(chapterUpdateData);
				} catch (error) {
					console.log(error);
				}
			};
			fetchSingleCourseData(courseId);
		}
	}, [courseId, isActive, resetChanges]);

	const handlePublishing = async (): Promise<void> => {
		if (singleCourse?.chapterIds.length === 0 && !singleCourse?.isActive) {
			setIsNoChapterMsgOpen(true);
		} else if (courseId !== undefined) {
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

	const handleCourseUpdate = async (e: FormEvent): Promise<void> => {
		e.preventDefault();

		const newChaptersIds = newChaptersToCreate.map((chapter) => chapter._id);
		let updatedChapters: BaseChapter[] = [];
		try {
			if (allChaptersBeforeSave) {
				updatedChapters = [...allChaptersBeforeSave];
			}

			if (newChaptersToCreate.length !== 0) {
				updatedChapters = await Promise.all(
					allChaptersBeforeSave?.map(async (chapter) => {
						if (newChaptersIds.includes(chapter._id)) {
							const response = await axios.post(`${base_url}/chapters`, {
								title: chapter.title,
							});
							chapter._id = response.data._id;
							chapter.createdAt = response.data.createdAt;
							chapter.updatedAt = response.data.updatedAt;
							chapter.isActive = response.data.isActive;
							chapter.lessonIds = response.data.lessonIds;
							chapter.lessons = response.data.lessons;
							return chapter;
						}
						return chapter;
					})
				);
			}

			setChapters(updatedChapters);

			setSingleCourse((prevCourse) => {
				if (prevCourse) {
					// Combine existing chapters with newly created chapters
					return {
						...prevCourse,
						chapters: updatedChapters,
						chapterIds: updatedChapters.map((chapter) => chapter._id),
					};
				}
				return prevCourse; // Return unchanged if prevCourse is undefined
			});
			setNewChaptersToCreate([]);

			if (singleCourse !== undefined) {
				await axios.patch(`${base_url}/courses/${courseId}`, {
					...singleCourse,
					chapters: updatedChapters,
					chapterIds: updatedChapters.map((chapter) => chapter._id),
				});
				updateCourse(singleCourse);

				await Promise.all(
					updatedChapters?.map(async (chapter, index) => {
						if (isChapterUpdated[index]?.isUpdated) {
							await axios.patch(`${base_url}/chapters/${chapter._id}`, chapter);
						}
					})
				);
			}

			if (deletedChapterIds.length !== 0) {
				await Promise.all(
					deletedChapterIds?.map(async (chapterId) => {
						await axios.delete(`${base_url}/chapters/${chapterId}`);
					})
				);
			}

			setIsChapterUpdated((prevData) => {
				return prevData.map((data) => ({ ...data, isUpdated: false }));
			});
			setDeletedChapterIds([]);
		} catch (error) {
			console.log(error);
		}
	};

	const y = useMotionValue(0);
	const boxShadow = useRaisedShadow(y);

	return (
		<DashboardPagesLayout pageName='Edit Course' customSettings={{ justifyContent: 'flex-start' }}>
			<Box sx={{ width: '90%' }}>
				<CoursePaper userId={userId} singleCourse={singleCourse} isActive={isActive} />
				<CourseEditorBox
					singleCourse={singleCourse}
					chapters={chapters}
					isEditMode={isEditMode}
					isActive={isActive}
					isMissingFieldMsgOpen={isMissingFieldMsgOpen}
					isNoChapterMsgOpen={isNoChapterMsgOpen}
					resetChanges={resetChanges}
					isFree={isFree}
					notSavedChapterIds={notSavedChapterIds}
					setNotSavedChapterIds={setNotSavedChapterIds}
					setIsEditMode={setIsEditMode}
					setIsMissingFieldMsgOpen={setIsMissingFieldMsgOpen}
					setIsNoChapterMsgOpen={setIsNoChapterMsgOpen}
					setIsMissingField={setIsMissingField}
					handlePublishing={handlePublishing}
					setResetChanges={setResetChanges}
					setIsChapterUpdated={setIsChapterUpdated}
					handleCourseUpdate={handleCourseUpdate}
					setChapters={setChapters}
					setAllChaptersBeforeSave={setAllChaptersBeforeSave}
					setNewChaptersToCreate={setNewChaptersToCreate}
					setDeletedChapterIds={setDeletedChapterIds}
				/>
			</Box>

			{!isEditMode && <CourseDetailsNonEditBox singleCourse={singleCourse} chapters={chapters} />}

			{isEditMode && (
				<Box
					sx={{
						display: 'flex',
						flexDirection: 'column',
						justifyContent: 'flex-start',
						width: '90%',
					}}>
					<form>
						<CourseDetailsEditBox
							singleCourse={singleCourse}
							isFree={isFree}
							isMissingField={isMissingField}
							setIsFree={setIsFree}
							setIsMissingField={setIsMissingField}
							setSingleCourse={setSingleCourse}
						/>
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
									type='button'
									sx={{ marginBottom: '1rem' }}
									onClick={() => {
										setIsChapterCreateModalOpen(true);
										setNewChapterTitle('');
									}}>
									New Chapter
								</CustomSubmitButton>
							</Box>

							<Dialog open={isChapterCreateModalOpen} onClose={() => setIsChapterCreateModalOpen(false)} fullWidth maxWidth='md'>
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
											}}
											onClick={() => setIsChapterCreateModalOpen(false)}>
											Create
										</CustomSubmitButton>
									</DialogActions>
								</form>
							</Dialog>

							{allChaptersBeforeSave.length === 0 ? (
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
								<Reorder.Group
									axis='y'
									values={allChaptersBeforeSave}
									onReorder={(newChapters): void => {
										setAllChaptersBeforeSave(newChapters);
										setSingleCourse((prevCourse) => {
											if (prevCourse) {
												return {
													...prevCourse,
													chapters: newChapters,
													chapterIds: newChapters.map((newChapter) => newChapter._id),
												};
											}
											return prevCourse; // Return unchanged if prevCourse is undefined
										});
									}}>
									{allChaptersBeforeSave &&
										allChaptersBeforeSave.length !== 0 &&
										allChaptersBeforeSave?.map((chapter) => {
											if (chapter.title) {
												return (
													<Reorder.Item key={chapter._id} value={chapter} style={{ listStyle: 'none', boxShadow }}>
														<AdminCourseEditChapter
															key={chapter._id}
															chapter={chapter}
															newChaptersToCreate={newChaptersToCreate}
															setSingleCourse={setSingleCourse}
															setChapters={setAllChaptersBeforeSave}
															setIsChapterUpdated={setIsChapterUpdated}
															setIsMissingField={setIsMissingField}
															isMissingField={isMissingField}
															setDeletedChapterIds={setDeletedChapterIds}
															setNewChaptersToCreate={setNewChaptersToCreate}
														/>
													</Reorder.Item>
												);
											}
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
