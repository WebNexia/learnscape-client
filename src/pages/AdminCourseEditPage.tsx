import { Box, DialogContent, Typography } from '@mui/material';
import DashboardPagesLayout from '../components/layouts/dashboardLayout/DashboardPagesLayout';
import { FormEvent, useContext, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from '@utils/axiosInstance';
import { CoursesContext } from '../contexts/CoursesContextProvider';
import { Price, SingleCourse } from '../interfaces/course';
import CustomTextField from '../components/forms/customFields/CustomTextField';
import AdminCourseEditChapter from '../components/adminSingleCourse/AdminCourseEditChapter';
import { BaseChapter } from '../interfaces/chapter';
import { Reorder, useMotionValue } from 'framer-motion';
import { useRaisedShadow } from '../hooks/useRaisedShadow';
import CustomSubmitButton from '../components/forms/customButtons/CustomSubmitButton';
import CoursePaper from '../components/adminSingleCourse/CoursePaper';
import CourseDetailsNonEditBox from '../components/adminSingleCourse/CourseDetailsNonEditBox';
import CourseDetailsEditBox from '../components/adminSingleCourse/CourseDetailsEditBox';
import { Lesson } from '../interfaces/lessons';
import CustomDialog from '../components/layouts/dialog/CustomDialog';
import CustomDialogActions from '../components/layouts/dialog/CustomDialogActions';
import { OrganisationContext } from '../contexts/OrganisationContextProvider';
import { generateUniqueId } from '../utils/uniqueIdGenerator';
import theme from '../themes';
import { LessonsContext } from '../contexts/LessonsContextProvider';
import HandleDocUploadURL from '../components/forms/uploadImageVideoDocument/HandleDocUploadURL';
import { Document } from '../interfaces/document';
import { DocumentUpdateTrack } from './AdminLessonEditPage';
import { DocumentsContext } from '../contexts/DocumentsContextProvider';
import DocumentsListEditBox from '../components/adminDocuments/DocumentsListEditBox';
import NoContentBoxAdmin from '../components/layouts/noContentBox/NoContentBoxAdmin';
import CustomInfoMessageAlignedLeft from '../components/layouts/infoMessage/CustomInfoMessageAlignedLeft';

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
		this._lessonIds = lessons?.map((lesson) => lesson._id);
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
	const { addNewLesson, updateLessons } = useContext(LessonsContext);
	const { addNewDocument, updateDocuments } = useContext(DocumentsContext);
	const { updateCoursePublishing, updateCourse } = useContext(CoursesContext);

	const [isEditMode, setIsEditMode] = useState<boolean>(false);
	const [singleCourse, setSingleCourse] = useState<SingleCourse>();
	const [isFree, setIsFree] = useState<boolean>(false);
	const [isMissingField, setIsMissingField] = useState<boolean>(false);
	const [isMissingFieldMsgOpen, setIsMissingFieldMsgOpen] = useState<boolean>(false);
	const [isNoChapterMsgOpen, setIsNoChapterMsgOpen] = useState<boolean>(false);

	const [resetChanges, setResetChanges] = useState<boolean>(false);
	const [deletedChapterIds, setDeletedChapterIds] = useState<string[]>([]);
	const [newChapterTitle, setNewChapterTitle] = useState<string>('');
	const [isChapterCreateModalOpen, setIsChapterCreateModalOpen] = useState<boolean>(false);
	const [chapterLessonData, setChapterLessonData] = useState<ChapterLessonData[]>([]);
	const [chapterLessonDataBeforeSave, setChapterLessonDataBeforeSave] = useState<ChapterLessonData[]>([]);

	const [enterDocUrl, setEnterDocUrl] = useState<boolean>(true);
	const [isDocRenameModalOpen, setIsDocRenameModalOpen] = useState<Array<boolean>>([]);
	const [originalDocumentNames, setOriginalDocumentNames] = useState<Record<string, string>>({});
	const [addNewDocumentModalOpen, setAddNewDocumentModalOpen] = useState<boolean>(false);

	const [isChapterUpdated, setIsChapterUpdated] = useState<ChapterUpdateTrack[]>([]);
	const [isDocumentUpdated, setIsDocumentUpdated] = useState<DocumentUpdateTrack[]>([]);

	const [isExpiredDialogOpen, setIsExpiredDialogOpen] = useState(false);
	const [pendingCourseUpdate, setPendingCourseUpdate] = useState<null | (() => void)>(null);

	const toggleDocRenameModal = (index: number, document: Document) => {
		const newRenameModalOpen = [...isDocRenameModalOpen];

		if (!newRenameModalOpen[index]) {
			setOriginalDocumentNames((prevNames) => ({
				...prevNames,
				[document._id]: document.name,
			})); // Set the original document name
		}
		newRenameModalOpen[index] = !newRenameModalOpen[index];
		setIsDocRenameModalOpen(newRenameModalOpen);
	};

	const closeDocRenameModal = (index: number, document: Document) => {
		const newRenameModalOpen = [...isDocRenameModalOpen];
		newRenameModalOpen[index] = false;

		setSingleCourse((prevData) => {
			if (prevData) {
				const updatedDocuments = prevData?.documents
					?.filter((document) => document !== null)
					?.map((thisDoc) => {
						if (thisDoc._id === document._id) {
							return { ...thisDoc, name: originalDocumentNames[document._id] || thisDoc.name }; // Revert to original name
						} else {
							return thisDoc;
						}
					});
				return { ...prevData, documents: updatedDocuments };
			}
			return prevData;
		});

		setIsDocRenameModalOpen(newRenameModalOpen);
	};

	const saveDocRename = (index: number) => {
		const newRenameModalOpen = [...isDocRenameModalOpen];
		newRenameModalOpen[index] = false;

		setIsDocRenameModalOpen(newRenameModalOpen);
	};

	const createChapterTemplate = () => {
		try {
			const newChapterBeforeSave: ChapterLessonData = {
				chapterId: generateUniqueId('temp_chapter_id_'),
				title: newChapterTitle,
				lessonIds: [],
				lessons: [],
			};

			setChapterLessonDataBeforeSave((prevData) => {
				return [...prevData, newChapterBeforeSave];
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

					const courseResponse = response?.data?.data;
					setSingleCourse(courseResponse);
					if (courseResponse?.prices.some((price: Price) => price.amount === 'Free' || price.amount === '' || price.amount === '0')) {
						setIsFree(true);
					}

					if (courseResponse?.chapters[0]?.title) {
						// Initialize chapter lesson data
						const initialChapterLessonData: ChapterLessonData[] = courseResponse?.chapters
							?.filter((chapter: BaseChapter) => chapter !== null)
							.map((chapter: BaseChapter) => {
								return {
									chapterId: chapter._id,
									title: chapter.title,
									lessons: chapter?.lessons,
									lessonIds: chapter.lessons?.filter((lesson) => lesson !== null).map((lesson: Lesson) => lesson?._id),
								};
							});
						setChapterLessonData(initialChapterLessonData);
						setChapterLessonDataBeforeSave(initialChapterLessonData);
					}

					const chapterUpdateData = courseResponse?.chapters?.map((chapter: BaseChapter) => ({
						chapterId: chapter._id,
						isUpdated: false,
					}));
					setIsChapterUpdated(chapterUpdateData);

					const documentUpdateData = courseResponse?.documents?.map((document: Document) => ({
						documentId: document._id,
						isUpdated: false,
					}));
					setIsDocumentUpdated(documentUpdateData);
				} catch (error) {
					console.log(error);
				}
			};
			fetchSingleCourseData(courseId);
		}
	}, [courseId, resetChanges]);

	const actuallyUpdateCourse = async () => {
		let updatedChapters: ChapterLessonData[] = [];
		let updatedDocuments: Document[] = [];

		// Calculate validUntil here
		const startingDate = new Date(singleCourse?.startingDate || '');
		const durationWeeks = singleCourse?.durationWeeks || 0;
		const validUntil =
			!isNaN(startingDate.getTime()) && durationWeeks > 0
				? new Date(startingDate.getTime() + durationWeeks * 7 * 24 * 60 * 60 * 1000)
				: null;

		try {
			if (!chapterLessonDataBeforeSave) {
				console.error('No chapter lesson data to save.');
				return;
			}
			updatedChapters = await Promise.all(
				chapterLessonDataBeforeSave?.map(async (chapter) => {
					chapter.lessons = await Promise.all(
						chapter?.lessons
							?.filter((lesson) => lesson !== null)
							.map(async (lesson: Lesson) => {
								if (lesson._id.includes('temp_lesson_id')) {
									try {
										const lessonResponse = await axios.post(`${base_url}/lessons`, {
											title: lesson.title.trim(),
											type: lesson.type,
											orgId,
										});
										const lessonResponseData = lessonResponse.data;

										addNewLesson({
											...lesson,
											_id: lessonResponseData._id,
											createdAt: lessonResponseData.createdAt,
											updatedAt: lessonResponseData.updatedAt,
											createdByName: lessonResponseData.createdByName,
											createdByImageUrl: lessonResponseData.createdByImageUrl,
											createdByRole: lessonResponseData.createdByRole,
											updatedByName: lessonResponseData.updatedByName,
											updatedByImageUrl: lessonResponseData.updatedByImageUrl,
											updatedByRole: lessonResponseData.updatedByRole,
											usedInCourses: courseId ? [courseId] : [],
										});

										return {
											...lesson,
											_id: lessonResponseData._id,
										};
									} catch (error) {
										console.error('Error creating lesson:', error);
										return lesson;
									}
								}
								return lesson;
							})
					);

					chapter.lessonIds = chapter?.lessons?.filter((lesson) => lesson !== null).map((lesson) => lesson._id);

					if (chapter.chapterId.includes('temp_chapter_id')) {
						try {
							const response = await axios.post(`${base_url}/chapters`, {
								title: chapter.title.trim(),
								lessonIds: chapter.lessonIds,
								orgId,
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

			if (singleCourse?.documents) {
				const updatedDocumentsPromises = (singleCourse?.documents as (Document | null)[]) // Assert as array of Document or null
					?.filter((doc): doc is Document => doc !== null) // Type guard to filter out nulls
					?.map(async (document) => {
						if (document._id.includes('temp_doc_id')) {
							try {
								const response = await axios.post(`${base_url}/documents`, {
									name: document.name.trim(),
									orgId,
									userId,
									documentUrl: document.documentUrl.trim(),
									usedInCourses: courseId ? [courseId] : [],
								});

								const newDocumentResponseData = response.data;

								const newDocument: Document = {
									...document,
									_id: newDocumentResponseData._id,
									createdAt: newDocumentResponseData.createdAt,
									updatedAt: newDocumentResponseData.updatedAt,
									usedInCourses: courseId ? [courseId] : [],
									usedInLessons: document.usedInLessons || [],
									createdByName: newDocumentResponseData.createdByName,
									createdByImageUrl: newDocumentResponseData.createdByImageUrl,
									createdByRole: newDocumentResponseData.createdByRole,
									updatedByName: newDocumentResponseData.updatedByName,
									updatedByImageUrl: newDocumentResponseData.updatedByImageUrl,
									updatedByRole: newDocumentResponseData.updatedByRole,
								};

								addNewDocument(newDocument);

								return newDocument;
							} catch (error) {
								console.error('Error creating document:', error);
								return null;
							}
						}
						return document;
					});

				const updatedQuestionsWithNulls = await Promise.all(updatedDocumentsPromises);
				updatedDocuments = updatedQuestionsWithNulls?.filter((doc): doc is Document => doc !== null); // Type guard to filter out remaining nulls
			}

			await Promise.all(
				updatedDocuments?.map(async (doc) => {
					const trackData = isDocumentUpdated.find((data) => data.documentId === doc._id);
					if (trackData?.isUpdated) {
						try {
							const response = await axios.patch(`${base_url}/documents/${doc._id}`, {
								name: doc.name.trim(),
							});
							const updatedDocumentResponseData = response.data.data;
							const updatedDocument: Document = {
								...doc,
								_id: updatedDocumentResponseData._id,
								createdAt: updatedDocumentResponseData.createdAt,
								updatedAt: updatedDocumentResponseData.updatedAt,
								updatedByName: updatedDocumentResponseData.updatedByName,
								updatedByImageUrl: updatedDocumentResponseData.updatedByImageUrl,
								updatedByRole: updatedDocumentResponseData.updatedByRole,
								createdByName: updatedDocumentResponseData.createdByName,
								createdByImageUrl: updatedDocumentResponseData.createdByImageUrl,
								createdByRole: updatedDocumentResponseData.createdByRole,
							};
							updateDocuments(updatedDocument);
						} catch (error) {
							console.error('Error updating question:', error);
						}
					}
				})
			);

			const updatedDocumentIds = updatedDocuments?.map((doc) => doc._id);

			if (singleCourse) {
				const updatedCourse = {
					...singleCourse,
					chapters: updatedChapters,
					chapterIds: updatedChapters?.map((chapter) => chapter.chapterId),
					documentIds: updatedDocumentIds,
					documents: updatedDocuments,
					isExpired: validUntil ? validUntil < new Date() : false,
				};

				try {
					const response = await axios.patch(`${base_url}/courses/${courseId}`, {
						...updatedCourse,
					});

					const responseUpdatedData = response.data.data;

					updateCourse({
						...updatedCourse,
						updatedAt: responseUpdatedData.updatedAt,
						updatedByName: responseUpdatedData.updatedByName,
						updatedByImageUrl: responseUpdatedData.updatedByImageUrl,
						updatedByRole: responseUpdatedData.updatedByRole,
					});

					updatedChapters?.forEach(chapter => {
						chapter.lessons?.forEach(lesson => {
							updateLessons({
								...lesson,
								usedInCourses: lesson.usedInCourses || [],
							});
						});
					});

					setSingleCourse({
						...updatedCourse,
						updatedAt: responseUpdatedData.updatedAt,
						updatedByName: responseUpdatedData.updatedByName,
						updatedByImageUrl: responseUpdatedData.updatedByImageUrl,
						updatedByRole: responseUpdatedData.updatedByRole,
					});

					await Promise.all(
						updatedChapters?.map(async (chapter) => {
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
						deletedChapterIds?.map(async (chapterId) => {
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

			const chapterUpdateData = updatedChapters?.map((chapter) => ({
				chapterId: chapter.chapterId,
				isUpdated: false,
			}));

			setIsChapterUpdated(chapterUpdateData);
			setDeletedChapterIds([]);
		} catch (error) {
			console.error('Error updating course:', error);
		}
	};

	const handlePublishing = async (): Promise<void> => {
		const isTryingToPublish = !singleCourse?.isActive;

		const hasPublishedLesson = chapterLessonDataBeforeSave.some((chapter) => chapter.lessons?.some((lesson) => lesson?.isActive));

		if (isTryingToPublish && !hasPublishedLesson) {
			setIsNoChapterMsgOpen(true);
			return;
		} else if (courseId !== undefined) {
			try {
				await axios.patch(`${base_url}/courses/${courseId}`, {
					isActive: !singleCourse?.isActive,
					// publishedAt will be handled by the backend when publishing
					// When unpublishing, we explicitly set it to null
					publishedAt: isTryingToPublish ? undefined : null,
				});
				setSingleCourse((prevData) => {
					if (prevData) {
						return {
							...prevData,
							isActive: !singleCourse?.isActive,
							publishedAt: isTryingToPublish ? new Date().toISOString() : null,
						};
					}
					return prevData;
				});
				updateCoursePublishing(courseId);
			} catch (error) {
				console.log(error);
			}
		}
	};

	const handleCourseUpdate = async (e: FormEvent): Promise<void> => {
		e.preventDefault();

		let validUntil: Date | null = null;
		const startingDate = new Date(singleCourse?.startingDate || '');
		const durationWeeks = singleCourse?.durationWeeks || 0;

		if (!isNaN(startingDate.getTime()) && durationWeeks > 0) {
			validUntil = new Date(startingDate.getTime() + durationWeeks * 7 * 24 * 60 * 60 * 1000);
			if (validUntil < new Date()) {
				setIsExpiredDialogOpen(true);
				setPendingCourseUpdate(() => () => {
					actuallyUpdateCourse();
				});
				return;
			}
		}

		// If not expired, proceed as normal
		await actuallyUpdateCourse();
	};

	const y = useMotionValue(0);
	const boxShadow = useRaisedShadow(y);

	return (
		<DashboardPagesLayout pageName='Edit Course' customSettings={{ justifyContent: 'flex-start' }} showCopyRight={true}>
			<Box sx={{ width: '80%', position: 'fixed', top: '4rem', zIndex: 1000, backgroundColor: theme.bgColor?.secondary }}>
				<CoursePaper
					userId={userId}
					singleCourse={singleCourse}
					chapterLessonData={chapterLessonData}
					chapterLessonDataBeforeSave={chapterLessonDataBeforeSave}
					isEditMode={isEditMode}
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

			<Box sx={{ display: 'flex', width: '95%', justifyContent: 'center', marginTop: '9rem' }}>
				{!isEditMode && <CourseDetailsNonEditBox singleCourse={singleCourse} chapters={chapterLessonData} setSingleCourse={setSingleCourse}/>}

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
							<Box sx={{ mt: '2rem', minHeight: '40vh' }}>
								<Box
									sx={{
										display: 'flex',
										justifyContent: 'space-between',
										alignItems: 'center',
										width: '100%',
									}}>
									<Typography variant='h5' sx={{ flex: 2 }}>
										CHAPTERS
									</Typography>
									<CustomInfoMessageAlignedLeft
										message='Drag the lessons in each chapter and chapters to reorder'
										sx={{ justifyContent: 'center', alignItems: 'center', flex: 4, marginTop: '0.85rem' }}
									/>
									<Box sx={{ display: 'flex', justifyContent: 'flex-end', flex: 2 }}>
										<CustomSubmitButton
											type='button'
											onClick={() => {
												setIsChapterCreateModalOpen(true);
												setNewChapterTitle('');
											}}>
											New Chapter
										</CustomSubmitButton>
									</Box>
								</Box>

								<CustomDialog openModal={isChapterCreateModalOpen} closeModal={closeCreateChapterModal} title='Create New Chapter' maxWidth='sm'>
									<form
										onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
											e.preventDefault();
											createChapterTemplate();
											closeCreateChapterModal();
											window.scrollTo({
												top: document.body.scrollHeight,
												behavior: 'smooth',
											});
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
									<NoContentBoxAdmin content='No chapter for this course' />
								) : (
									<Reorder.Group
										axis='y'
										values={chapterLessonDataBeforeSave || []}
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

							{chapterLessonDataBeforeSave.length > 2 && (
								<Box sx={{ display: 'flex', width: '100%', justifyContent: 'flex-end', margin: '-1rem 0 2rem 0' }}>
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
							)}

							<Box sx={{ margin: '3rem 0 1rem 0' }}>
								<HandleDocUploadURL
									label='Course Materials'
									onDocUploadLogic={(url, docName) => {
										setSingleCourse((prevData) => {
											if (prevData && userId && courseId) {
												const maxNumber = prevData?.documents
													.filter((doc) => doc !== null)
													.reduce((max, doc) => {
														const match = doc.name.match(/Untitled Document (\d+)/);
														const num = match ? parseInt(match[1], 10) : 0;
														return num > max ? num : max;
													}, 0);
												const newName = docName || `Untitled Document ${maxNumber + 1}`;
												const newDocument: Document = {
													_id: generateUniqueId('temp_doc_id_'),
													name: newName,
													documentUrl: url,
													orgId,
													userId,
													createdAt: '',
													updatedAt: '',
													clonedFromId: '',
													clonedFromTitle: '',
													usedInLessons: [],
													usedInCourses: courseId ? [courseId] : [],
													createdBy: '',
													updatedBy: '',
													createdByName: '',
													updatedByName: '',
													createdByImageUrl: '',
													updatedByImageUrl: '',
													createdByRole: '',
													updatedByRole: '',
												};

												return {
													...prevData,
													documents: [...prevData?.documents, newDocument],
												};
											}
											return prevData;
										});
									}}
									enterDocUrl={enterDocUrl}
									setEnterDocUrl={setEnterDocUrl}
									docFolderName='Course Materials'
									addNewDocumentModalOpen={addNewDocumentModalOpen}
									setAddNewDocumentModalOpen={setAddNewDocumentModalOpen}
									singleCourse={singleCourse}
									setSingleCourse={setSingleCourse}
									fromAdminCourses={true}
								/>
							</Box>

							<DocumentsListEditBox
								documentsSource={singleCourse?.documents}
								toggleDocRenameModal={toggleDocRenameModal}
								closeDocRenameModal={closeDocRenameModal}
								isDocRenameModalOpen={isDocRenameModalOpen}
								saveDocRename={saveDocRename}
								setIsDocumentUpdated={setIsDocumentUpdated}
								removeDocOnClick={(document: Document) => {
									setSingleCourse((prevData) => {
										if (prevData) {
											const filteredDocuments = prevData?.documents?.filter((thisDoc) => thisDoc._id !== document._id);
											const filteredDocumentIds = filteredDocuments?.map((doc) => doc._id);

											// Update document's usedInCourses in the documents context
											const updatedDocument = {
												...document,
												usedInCourses: document.usedInCourses.filter((id) => id !== courseId),
												createdByName: document.createdByName,
												createdByImageUrl: document.createdByImageUrl,
												createdByRole: document.createdByRole,
												updatedByName: document.updatedByName,
												updatedByImageUrl: document.updatedByImageUrl,
												updatedByRole: document.updatedByRole,
												createdAt: document.createdAt,
												updatedAt: new Date().toISOString(),
											};
											updateDocuments(updatedDocument);
											return {
												...prevData,
												documents: filteredDocuments,
												documentIds: filteredDocumentIds,
											};
										}
										return prevData;
									});
								}}
								renameDocOnChange={(e: React.ChangeEvent<HTMLInputElement>, document: Document) => {
									setSingleCourse((prevData) => {
										if (prevData) {
											const updatedDocuments = prevData?.documents
												?.filter((document) => document !== null)
												?.map((thisDoc) => {
													if (thisDoc._id === document._id) {
														return { ...thisDoc, name: e.target.value };
													} else {
														return thisDoc;
													}
												});
											return { ...prevData, documents: updatedDocuments };
										}
										return prevData;
									});
								}}
							/>
						</form>
					</Box>
				)}
			</Box>

			{/* CustomDialog for expired course confirmation */}
			<CustomDialog
				openModal={isExpiredDialogOpen}
				closeModal={() => setIsExpiredDialogOpen(false)}
				title="Course Expired"
				maxWidth="sm"
			>
				<DialogContent>
					<Typography variant='body2'>
					This course appears to be expired based on its starting date and duration.<br /><br />
					Once expired, it will no longer be editable — only cloning will be allowed.<br /><br />
					Do you still want to continue editing?
					</Typography>
				</DialogContent>
				<CustomDialogActions
					onCancel={() => setIsExpiredDialogOpen(false)}
					onSubmit={() => {
						if (pendingCourseUpdate) pendingCourseUpdate();
						setIsExpiredDialogOpen(false);
					}}
					submitBtnText="Continue Editing"
					cancelBtnText="Cancel"
				/>
			</CustomDialog>
		</DashboardPagesLayout>
	);
};

export default AdminCourseEditPage;
