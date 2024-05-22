import { Box, Typography } from '@mui/material';
import DashboardPagesLayout from '../components/layouts/dashboardLayout/DashboardPagesLayout';
import { FormEvent, useContext, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { CoursesContext } from '../contexts/CoursesContextProvider';
import { SingleCourse } from '../interfaces/course';
import CustomTextField from '../components/forms/customFields/CustomTextField';
import AdminCourseEditChapter from '../components/adminSingleCourse/AdminCourseEditChapter';
import { BaseChapter } from '../interfaces/chapter';
import { Reorder, useMotionValue } from 'framer-motion';
import { useRaisedShadow } from '../hooks/useRaisedShadow';
import CustomSubmitButton from '../components/forms/customButtons/CustomSubmitButton';
import CoursePaper from '../components/adminSingleCourse/Paper';
import CourseEditorBox from '../components/adminSingleCourse/CourseEditorBox';
import CourseDetailsNonEditBox from '../components/adminSingleCourse/CourseDetailsNonEditBox';
import CourseDetailsEditBox from '../components/adminSingleCourse/CourseDetailsEditBox';
import { Lesson } from '../interfaces/lessons';
import CustomDialog from '../components/layouts/dialog/CustomDialog';
import CustomDialogActions from '../components/layouts/dialog/CustomDialogActions';
import { OrganisationContext } from '../contexts/OrganisationContextProvider';
import { generateUniqueId } from '../utils/uniqueIdGenerator';

export interface ChapterUpdateTrack {
	chapterId: string;
	isUpdated: boolean;
}

export interface ChapterLessonData {
	chapterId: string;
	title: string;
	lessons: Lesson[];
	lessonIds: string[];
}

export class ChapterLessonDataImpl implements ChapterLessonData {
	chapterId: string;
	title: string;
	lessons: Lesson[];
	private _lessonIds: string[] = [];

	constructor(chapterId: string, title: string, lessons: Lesson[]) {
		this.chapterId = chapterId;
		this.title = title;
		this.lessons = lessons;
		this._lessonIds = lessons.map((lesson) => lesson._id);
	}

	// Implement the getter and setter for lessonIds
	get lessonIds(): string[] {
		return this._lessonIds;
	}

	set lessonIds(ids: string[]) {
		this._lessonIds = ids;
	}
}

const AdminCourseEditPage = () => {
	const { userId, courseId } = useParams();
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const { orgId } = useContext(OrganisationContext);

	const { updateCoursePublishing, updateCourse } = useContext(CoursesContext);
	const [isEditMode, setIsEditMode] = useState<boolean>(false);
	const [singleCourse, setSingleCourse] = useState<SingleCourse>();
	const [isActive, setIsActive] = useState<boolean>();
	const [isFree, setIsFree] = useState<boolean>(false);
	const [isMissingField, setIsMissingField] = useState<boolean>(false);
	const [isMissingFieldMsgOpen, setIsMissingFieldMsgOpen] = useState<boolean>(false);
	const [isNoChapterMsgOpen, setIsNoChapterMsgOpen] = useState<boolean>(false);
	const [isChapterUpdated, setIsChapterUpdated] = useState<ChapterUpdateTrack[]>([]);
	const [resetChanges, setResetChanges] = useState<boolean>(false);
	const [deletedChapterIds, setDeletedChapterIds] = useState<string[]>([]);
	const [newChapterTitle, setNewChapterTitle] = useState<string>('');
	const [isChapterCreateModalOpen, setIsChapterCreateModalOpen] = useState<boolean>(false);
	const [chapterLessonData, setChapterLessonData] = useState<ChapterLessonData[]>([]);
	const [chapterLessonDataBeforeSave, setChapterLessonDataBeforeSave] = useState<ChapterLessonData[]>([]);

	const createChapterTemplate = () => {
		try {
			const newChapterBeforeSave: ChapterLessonData = {
				chapterId: generateUniqueId('temp_chapter_id_'),
				title: newChapterTitle,
				lessonIds: [],
				lessons: [],
			};

			setChapterLessonDataBeforeSave((prevData) => {
				return [newChapterBeforeSave, ...prevData];
			});
		} catch (error) {
			console.log(error);
		}
	};

	const closeCreateChapterModal = () => setIsChapterCreateModalOpen(false);

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
						// Initialize chapter lesson data
						const initialChapterLessonData: ChapterLessonData[] = courseResponse.chapters.map((chapter: BaseChapter) => {
							return {
								chapterId: chapter._id,
								title: chapter.title,
								lessons: chapter.lessons,
								lessonIds: chapter.lessons.map((lesson: Lesson) => lesson._id),
							};
						});
						setChapterLessonData(initialChapterLessonData);
						setChapterLessonDataBeforeSave(initialChapterLessonData);
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

		try {
			if (!chapterLessonDataBeforeSave) {
				console.error('No chapter lesson data to save.');
				return;
			}

			let updatedChapters: ChapterLessonData[] = [...chapterLessonDataBeforeSave];

			updatedChapters = await Promise.all(
				updatedChapters.map(async (chapter) => {
					chapter.lessons = await Promise.all(
						chapter.lessons.map(async (lesson: Lesson) => {
							if (lesson._id.includes('temp_lesson_id')) {
								try {
									const lessonResponse = await axios.post(`${base_url}/lessons`, {
										title: lesson.title,
										type: lesson.type,
										orgId,
									});
									return {
										...lesson,
										_id: lessonResponse.data._id,
									};
								} catch (error) {
									console.error('Error creating lesson:', error);
									return lesson;
								}
							}
							return lesson;
						})
					);

					chapter.lessonIds = chapter.lessons.map((lesson) => lesson._id);

					if (chapter.chapterId.includes('temp_chapter_id')) {
						try {
							const response = await axios.post(`${base_url}/chapters`, {
								title: chapter.title,
								lessonIds: chapter.lessonIds,
							});
							chapter.chapterId = response.data._id;
						} catch (error) {
							console.error('Error creating chapter:', error);
						}
					}

					return chapter;
				})
			);

			setChapterLessonData(updatedChapters);

			if (singleCourse) {
				const updatedCourse = {
					...singleCourse,
					chapters: updatedChapters,
					chapterIds: updatedChapters.map((chapter) => chapter.chapterId),
				};

				try {
					await axios.patch(`${base_url}/courses/${courseId}`, {
						...updatedCourse,
						chapterIds: updatedChapters.map((chapter) => chapter.chapterId),
					});

					updateCourse(updatedCourse);
					setSingleCourse(updatedCourse);

					await Promise.all(
						updatedChapters.map(async (chapter) => {
							const trackData = isChapterUpdated.find((data) => data.chapterId === chapter.chapterId);
							if (trackData?.isUpdated) {
								try {
									await axios.patch(`${base_url}/chapters/${chapter.chapterId}`, chapter);
								} catch (error) {
									console.error('Error updating chapter:', error);
								}
							}
						})
					);
				} catch (error) {
					console.error('Error updating course:', error);
				}
			}

			if (deletedChapterIds.length > 0) {
				try {
					await Promise.all(
						deletedChapterIds.map(async (chapterId) => {
							try {
								await axios.delete(`${base_url}/chapters/${chapterId}`);
							} catch (error) {
								console.error('Error deleting chapter:', error);
							}
						})
					);
				} catch (error) {
					console.error('Error deleting chapters:', error);
				}
			}

			setIsChapterUpdated((prevData) => prevData.map((data) => ({ ...data, isUpdated: false })));
			setDeletedChapterIds([]);
		} catch (error) {
			console.error('Error updating course:', error);
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
					chapterLessonData={chapterLessonData}
					chapterLessonDataBeforeSave={chapterLessonDataBeforeSave}
					isEditMode={isEditMode}
					isActive={isActive}
					isMissingFieldMsgOpen={isMissingFieldMsgOpen}
					isNoChapterMsgOpen={isNoChapterMsgOpen}
					resetChanges={resetChanges}
					isFree={isFree}
					setIsEditMode={setIsEditMode}
					setIsMissingFieldMsgOpen={setIsMissingFieldMsgOpen}
					setIsNoChapterMsgOpen={setIsNoChapterMsgOpen}
					setIsMissingField={setIsMissingField}
					handlePublishing={handlePublishing}
					setResetChanges={setResetChanges}
					handleCourseUpdate={handleCourseUpdate}
					setChapterLessonDataBeforeSave={setChapterLessonDataBeforeSave}
					setDeletedChapterIds={setDeletedChapterIds}
				/>
			</Box>

			{!isEditMode && <CourseDetailsNonEditBox singleCourse={singleCourse} chapters={chapterLessonData} />}

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
									CHAPTERS
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

							<CustomDialog openModal={isChapterCreateModalOpen} closeModal={closeCreateChapterModal} title='Create New Chapter'>
								<form
									onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
										e.preventDefault();
										createChapterTemplate();
										closeCreateChapterModal();
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

									<CustomDialogActions onCancel={closeCreateChapterModal} />
								</form>
							</CustomDialog>

							{chapterLessonDataBeforeSave.length === 0 ? (
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
									values={chapterLessonDataBeforeSave}
									onReorder={(newChapters): void => {
										setChapterLessonDataBeforeSave(newChapters);
									}}>
									{chapterLessonDataBeforeSave &&
										chapterLessonDataBeforeSave.length !== 0 &&
										chapterLessonDataBeforeSave?.map((chapter) => {
											return (
												<Reorder.Item key={chapter.chapterId} value={chapter} style={{ listStyle: 'none', boxShadow }}>
													<AdminCourseEditChapter
														key={chapter.chapterId}
														chapter={chapter}
														setChapterLessonDataBeforeSave={setChapterLessonDataBeforeSave}
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
