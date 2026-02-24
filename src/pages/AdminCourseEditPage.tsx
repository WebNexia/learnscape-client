import { Box, DialogContent, Typography, Link, Button } from '@mui/material';
import { CloudUpload } from '@mui/icons-material';
import DashboardPagesLayout from '../components/layouts/dashboardLayout/DashboardPagesLayout';
import { FormEvent, useContext, useEffect, useState } from 'react';
import { useParams, useBlocker, useNavigate } from 'react-router-dom';
import axios from '@utils/axiosInstance';
import { CoursesContext } from '../contexts/CoursesContextProvider';
import { Price, SingleCourse } from '../interfaces/course';
import CustomTextField from '../components/forms/customFields/CustomTextField';
import CustomErrorMessage from '../components/forms/customFields/CustomErrorMessage';
import AdminCourseEditChapter from '../components/adminSingleCourse/AdminCourseEditChapter';
import { BaseChapter, ChecklistGroup } from '../interfaces/chapter';
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
import { validateImageUrl, validateDocumentUrl } from '../utils/urlValidation';
import { Snackbar, Alert } from '@mui/material';
import { UserAuthContext } from '../contexts/UserAuthContextProvider';
import { MediaQueryContext } from '../contexts/MediaQueryContextProvider';
import { useStickyPaper } from '../hooks/useStickyPaper';
import { useAuth } from '../hooks/useAuth';
import { LessonType } from '../interfaces/enums';
import { calculateQuizTotalScoreFromScores } from '../utils/calculateQuizTotalScoreFromScores';

export interface ChapterUpdateTrack {
	chapterId: string;
	isUpdated: boolean;
}

export interface ChapterLessonData {
	chapterId: string;
	title: string;
	lessons: Lesson[];
	lessonIds: string[];
	evaluationChecklistItems?: ChecklistGroup[];
	askForFeedback?: boolean;
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
		this._lessonIds = lessons?.map((lesson) => lesson._id) || [];
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
	const { courseId } = useParams();
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const navigate = useNavigate();

	const { user } = useContext(UserAuthContext);
	const { isInstructor } = useAuth();

	const { orgId } = useContext(OrganisationContext);
	const { addNewLesson, updateLesson, enableLessonsFetch } = useContext(LessonsContext);
	const { addNewDocument, updateDocument, enableDocumentsFetch } = useContext(DocumentsContext);
	const { updateCoursePublishing, updateCourse } = useContext(CoursesContext);

	const { isSmallScreen, isRotatedMedium } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;

	const { isSticky } = useStickyPaper(isMobileSize);

	const [isEditMode, setIsEditMode] = useState<boolean>(true);
	const [singleCourse, setSingleCourse] = useState<SingleCourse>();
	const [singleCourseBeforeSave, setSingleCourseBeforeSave] = useState<SingleCourse>();
	const [isFree, setIsFree] = useState<boolean>(false);
	const [isMissingField, setIsMissingField] = useState<boolean>(false);
	const [isMissingFieldMsgOpen, setIsMissingFieldMsgOpen] = useState<boolean>(false);
	const [isNoChapterMsgOpen, setIsNoChapterMsgOpen] = useState<boolean>(false);

	const [deletedChapterIds, setDeletedChapterIds] = useState<string[]>([]);
	const [newChapterTitle, setNewChapterTitle] = useState<string>('');
	const [isChapterCreateModalOpen, setIsChapterCreateModalOpen] = useState<boolean>(false);
	const [chapterLessonData, setChapterLessonData] = useState<ChapterLessonData[]>([]);
	const [chapterLessonDataBeforeSave, setChapterLessonDataBeforeSave] = useState<ChapterLessonData[]>([]);

	const [enterDocUrl, setEnterDocUrl] = useState<boolean>(true);
	const [isDocRenameModalOpen, setIsDocRenameModalOpen] = useState<Array<boolean>>([]);
	const [originalDocumentNames, setOriginalDocumentNames] = useState<Record<string, string>>({});
	const [addNewDocumentModalOpen, setAddNewDocumentModalOpen] = useState<boolean>(false);

	// Video URL management state
	const [videoFormData, setVideoFormData] = useState<{ url: string; title: string }>({
		url: '',
		title: '',
	});
	const [videoUrlError, setVideoUrlError] = useState<string>('');
	const [videoTitleError, setVideoTitleError] = useState<string>('');
	const [isVideoRenameModalOpen, setIsVideoRenameModalOpen] = useState<Array<boolean>>([]);
	const [originalVideoTitles, setOriginalVideoTitles] = useState<Record<number, string>>({});

	const [isChapterUpdated, setIsChapterUpdated] = useState<ChapterUpdateTrack[]>([]);
	const [isDocumentUpdated, setIsDocumentUpdated] = useState<DocumentUpdateTrack[]>([]);
	const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);

	const [isExpiredDialogOpen, setIsExpiredDialogOpen] = useState(false);
	const [pendingCourseUpdate, setPendingCourseUpdate] = useState<null | (() => void)>(null);
	const [pendingTx, setPendingTx] = useState<any>(null);
	const [allowNavigation, setAllowNavigation] = useState(false);
	const [nextLocation, setNextLocation] = useState<string | null>(null);

	const [isPopStateNavigation, setIsPopStateNavigation] = useState(false);
	const [isUrlErrorOpen, setIsUrlErrorOpen] = useState<boolean>(false);
	const [urlErrorMessage, setUrlErrorMessage] = useState<string>('');
	const [isSaving, setIsSaving] = useState<boolean>(false);

	useEffect(() => {
		const handlePopState = () => {
			setIsPopStateNavigation(true);
		};
		window.addEventListener('popstate', handlePopState);

		return () => {
			window.removeEventListener('popstate', handlePopState);
		};
	}, []);

	// Warn on browser/tab close or refresh
	useEffect(() => {
		const handleBeforeUnload = (e: BeforeUnloadEvent) => {
			if (hasUnsavedChanges) {
				e.preventDefault();
				e.returnValue = '';
			}
		};
		window.addEventListener('beforeunload', handleBeforeUnload);
		return () => window.removeEventListener('beforeunload', handleBeforeUnload);
	}, [hasUnsavedChanges]);

	// Warn on in-app navigation (Data Router only) with custom dialog
	useBlocker((tx) => {
		if (allowNavigation || isPopStateNavigation) {
			return false; // Allow navigation
		}
		if (hasUnsavedChanges) {
			setPendingTx(tx);
			setNextLocation(tx.nextLocation.pathname);
			return true; // Block navigation
		}
		return false;
	});

	useEffect(() => {
		if (allowNavigation && nextLocation) {
			navigate(nextLocation);
			setAllowNavigation(false);
			setNextLocation(null);
		}
		// Reset popstate flag after transition completes
		if (isPopStateNavigation) {
			setIsPopStateNavigation(false);
		}
	}, [allowNavigation, nextLocation, navigate, isPopStateNavigation]);

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

		setSingleCourseBeforeSave((prevData) => {
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

	// Video URL rename functions
	const toggleVideoRenameModal = (index: number, videoURL: { url: string; title: string }) => {
		const newRenameModalOpen = [...isVideoRenameModalOpen];
		if (newRenameModalOpen.length <= index) {
			// Extend array if needed
			while (newRenameModalOpen.length <= index) {
				newRenameModalOpen.push(false);
			}
		}

		if (!newRenameModalOpen[index]) {
			setOriginalVideoTitles((prevTitles) => ({
				...prevTitles,
				[index]: videoURL.title,
			}));
		}

		newRenameModalOpen[index] = !newRenameModalOpen[index];
		setIsVideoRenameModalOpen(newRenameModalOpen);
	};

	const closeVideoRenameModal = (index: number) => {
		const newRenameModalOpen = [...isVideoRenameModalOpen];
		newRenameModalOpen[index] = false;

		setSingleCourseBeforeSave((prevData) => {
			if (prevData) {
				const updatedVideoURLs = prevData?.videoURLs?.map((video, idx) => {
					if (idx === index) {
						return { ...video, title: originalVideoTitles[index] || video.title }; // Revert to original title
					}
					return video;
				});
				return { ...prevData, videoURLs: updatedVideoURLs || [] };
			}
			return prevData;
		});

		setIsVideoRenameModalOpen(newRenameModalOpen);
	};

	const saveVideoRename = (index: number) => {
		const newRenameModalOpen = [...isVideoRenameModalOpen];
		newRenameModalOpen[index] = false;

		// Validate title length
		const videoURLs = singleCourseBeforeSave?.videoURLs || [];
		const currentVideo = videoURLs[index];
		if (currentVideo && currentVideo.title.trim().length > 100) {
			setVideoTitleError('Title must not exceed 100 characters');
			return;
		}

		setIsVideoRenameModalOpen(newRenameModalOpen);
		setHasUnsavedChanges(true);
	};

	// Total possible score for the whole course (sum of all graded quizzes) - EDIT view
	const totalPossibleScoreForCourseEdit = chapterLessonDataBeforeSave.reduce((courseTotal, chapter) => {
		if (!chapter?.lessons) return courseTotal;

		const chapterTotal = chapter.lessons
			.filter((lesson) => lesson !== null)
			.reduce((sum, lesson) => {
				const isGradedQuiz = lesson.isGraded && lesson.type === LessonType.QUIZ;
				if (!isGradedQuiz) return sum;
				return sum + calculateQuizTotalScoreFromScores(lesson);
			}, 0);

		return courseTotal + chapterTotal;
	}, 0);

	const createChapterTemplate = () => {
		try {
			const newChapterBeforeSave: ChapterLessonData = {
				chapterId: generateUniqueId('temp_chapter_id_'),
				title: newChapterTitle,
				lessonIds: [],
				lessons: [],
				evaluationChecklistItems: [],
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
		enableLessonsFetch(); // 👈 Enable lessons fetching when component mounts
		enableDocumentsFetch(); // 👈 Enable documents fetching when component mounts
	}, []);

	useEffect(() => {
		if (courseId) {
			const fetchSingleCourseData = async (courseId: string): Promise<void> => {
				try {
					const response = await axios.get(`${base_url}/courses/${courseId}`);

					const courseResponse = response?.data?.data;
					setSingleCourse(courseResponse);
					setSingleCourseBeforeSave(courseResponse);
					if (courseResponse?.prices?.some((price: Price) => price.amount === 'Free' || price.amount === '' || price.amount === '0')) {
						setIsFree(true);
					}

					if (courseResponse?.chapters[0]?.title) {
						// Initialize chapter lesson data
						const initialChapterLessonData: ChapterLessonData[] = courseResponse?.chapters
							?.filter((chapter: BaseChapter) => chapter !== null)
							?.map((chapter: BaseChapter) => {
								return {
									chapterId: chapter._id,
									title: chapter.title,
									lessons: chapter?.lessons,
									lessonIds: chapter.lessons?.filter((lesson) => lesson !== null)?.map((lesson: Lesson) => lesson?._id) || [],
									evaluationChecklistItems: chapter.evaluationChecklistItems || [],
									askForFeedback: chapter.askForFeedback || false,
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
	}, [courseId]);

	const actuallyUpdateCourse = async () => {
		let updatedChapters: ChapterLessonData[] = [];
		let updatedDocuments: Document[] = [];

		// Validate capacity constraints before attempting to save
		const cap = singleCourseBeforeSave?.capacity !== undefined && singleCourseBeforeSave?.capacity !== null ? Number(singleCourseBeforeSave.capacity) : null;
		const totalGroupCap = (singleCourseBeforeSave?.groups || []).reduce((sum, g) => {
			const c = g?.capacity !== undefined && g?.capacity !== null ? Number(g.capacity) : 0;
			return sum + (Number.isFinite(c) ? c : 0);
		}, 0);
		if (cap !== null && totalGroupCap > cap) {
			setUrlErrorMessage(`Course capacity (${cap}) cannot be less than total group capacity (${totalGroupCap}).`);
			setIsUrlErrorOpen(true);
			return;
		}

		// If course is external, skip all chapter/lesson/document creation/updating
		if (singleCourseBeforeSave?.courseManagement?.isExternal) {
			const extStartingDate = new Date(singleCourseBeforeSave?.startingDate || '');
			const extDurationWeeks = singleCourseBeforeSave?.durationWeeks || 0;
			const extValidUntil =
				!isNaN(extStartingDate.getTime()) && extDurationWeeks > 0
					? new Date(extStartingDate.getTime() + extDurationWeeks * 7 * 24 * 60 * 60 * 1000)
					: null;

			const updatedCourse = {
				...singleCourseBeforeSave,
				chapters: [],
				chapterIds: [],
				documents: [],
				documentIds: [],
				isExpired: extValidUntil ? extValidUntil < new Date() : false,
				groups: singleCourseBeforeSave.groups || [], // Explicitly include groups
				videoURLs: singleCourseBeforeSave.videoURLs || [], // Explicitly include videoURLs
			};

			try {
				const response = await axios.patch(`${base_url}${isInstructor ? '/courses/instructor' : '/courses'}/${courseId}`, {
					...updatedCourse,
				});

				const responseUpdatedData = response.data.data;

				setSingleCourseBeforeSave({
					...updatedCourse,
					updatedAt: responseUpdatedData.updatedAt,
					updatedByName: responseUpdatedData.updatedByName,
					updatedByImageUrl: responseUpdatedData.updatedByImageUrl,
					updatedByRole: responseUpdatedData.updatedByRole,
				});

				setSingleCourse({
					...updatedCourse,
					updatedAt: responseUpdatedData.updatedAt,
					updatedByName: responseUpdatedData.updatedByName,
					updatedByImageUrl: responseUpdatedData.updatedByImageUrl,
					updatedByRole: responseUpdatedData.updatedByRole,
				});

				updateCourse({
					...updatedCourse,
					updatedAt: responseUpdatedData.updatedAt,
					updatedByName: responseUpdatedData.updatedByName,
					updatedByImageUrl: responseUpdatedData.updatedByImageUrl,
					updatedByRole: responseUpdatedData.updatedByRole,
				});

				setHasUnsavedChanges(false);
				setIsEditMode(false);
				window.scrollTo({ top: 0, behavior: 'smooth' });
			} catch (error) {
				console.error('Error updating external course:', error);
			}
			return; // Stop further processing
		}

		// Calculate validUntil here
		const startingDate = new Date(singleCourseBeforeSave?.startingDate || '');
		const durationWeeks = singleCourseBeforeSave?.durationWeeks || 0;
		const validUntil =
			!isNaN(startingDate.getTime()) && durationWeeks > 0 ? new Date(startingDate.getTime() + durationWeeks * 7 * 24 * 60 * 60 * 1000) : null;

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
							?.map(async (lesson: Lesson) => {
								if (lesson._id.includes('temp_lesson_id')) {
									try {
										const lessonResponse = await axios.post(`${base_url}/lessons${isInstructor ? '/instructor' : ''}`, {
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

					chapter.lessonIds = chapter?.lessons?.filter((lesson) => lesson !== null)?.map((lesson) => lesson._id);

					if (chapter.chapterId.includes('temp_chapter_id')) {
						try {
							const response = await axios.post(`${base_url}/chapters${isInstructor ? '/instructor' : ''}`, {
								title: chapter.title.trim(),
								lessonIds: chapter.lessonIds,
								orgId,
								courseId,
								evaluationChecklistItems: chapter.evaluationChecklistItems || [],
								askForFeedback: chapter.askForFeedback || false,
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

			if (singleCourseBeforeSave?.documents) {
				const updatedDocumentsPromises = (singleCourseBeforeSave?.documents as (Document | null)[]) // Assert as array of Document or null
					?.filter((doc): doc is Document => doc !== null) // Type guard to filter out nulls
					?.map(async (document) => {
						if (document?._id?.includes('temp_doc_id')) {
							try {
								const response = await axios.post(`${base_url}/documents${isInstructor ? '/instructor' : ''}`, {
									name: document?.name?.trim(),
									orgId,
									userId: user?._id,
									documentUrl: document?.documentUrl?.trim(),
								});

								const newDocumentResponseData = response.data;

								const newDocument: Document = {
									...document,
									_id: newDocumentResponseData._id,
									createdAt: newDocumentResponseData.createdAt,
									updatedAt: newDocumentResponseData.updatedAt,
									usedInCourses: courseId ? [courseId] : [],
									usedInLessons: document?.usedInLessons || [],
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
					const trackData = isDocumentUpdated?.find((data) => data.documentId === doc?._id);
					if (trackData?.isUpdated) {
						try {
							const response = await axios.patch(`${base_url}/documents${isInstructor ? '/instructor' : ''}/${doc._id}`, {
								name: doc?.name?.trim(),
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
							updateDocument(updatedDocument);
						} catch (error) {
							console.error('Error updating question:', error);
						}
					}
				})
			);

			const updatedDocumentIds = updatedDocuments?.map((doc) => doc?._id);

			if (singleCourseBeforeSave) {
				const updatedCourse = {
					...singleCourseBeforeSave,
					chapters: updatedChapters,
					chapterIds: updatedChapters?.map((chapter) => chapter?.chapterId),
					documentIds: updatedDocumentIds,
					documents: updatedDocuments,
					isExpired: validUntil ? validUntil < new Date() : false,
					groups: singleCourseBeforeSave.groups || [], // Explicitly include groups
					videoURLs: singleCourseBeforeSave.videoURLs || [], // Explicitly include videoURLs
				};

				// Minimal payload: send only IDs for chapters/documents to avoid PayloadTooLargeError
				const { chapters: _ch, documents: _d, ...courseFields } = singleCourseBeforeSave as unknown as Record<string, unknown>;
				const patchPayload = {
					...courseFields,
					chapterIds: updatedChapters?.map((chapter) => chapter?.chapterId),
					documentIds: updatedDocumentIds,
					// BE needs chapters with lessonIds for usedInCourses sync - send minimal structure only
					chapters: updatedChapters?.map((ch) => ({
						chapterId: ch?.chapterId,
						lessonIds: ch?.lessonIds,
					})),
					isExpired: validUntil ? validUntil < new Date() : false,
					groups: singleCourseBeforeSave.groups || [],
					videoURLs: singleCourseBeforeSave.videoURLs || [],
				};

				try {
					const response = await axios.patch(`${base_url}${isInstructor ? '/courses/instructor' : '/courses'}/${courseId}`, patchPayload);

					const responseUpdatedData = response.data.data;

					setSingleCourseBeforeSave({
						...updatedCourse,
						updatedAt: responseUpdatedData.updatedAt,
						updatedByName: responseUpdatedData.updatedByName,
						updatedByImageUrl: responseUpdatedData.updatedByImageUrl,
						updatedByRole: responseUpdatedData.updatedByRole,
					});

					updateCourse({
						...updatedCourse,
						updatedAt: responseUpdatedData.updatedAt,
						updatedByName: responseUpdatedData.updatedByName,
						updatedByImageUrl: responseUpdatedData.updatedByImageUrl,
						updatedByRole: responseUpdatedData.updatedByRole,
					});

					// Update lesson contexts with current usedInCourses data
					updatedChapters?.forEach((chapter) => {
						chapter.lessons?.forEach((lesson) => {
							updateLesson({
								...lesson,
								usedInCourses: lesson?.usedInCourses || [],
							});
						});
					});

					// Update document contexts with current usedInCourses data
					updatedDocuments?.forEach((document) => {
						updateDocument({
							...document,
							usedInCourses: document?.usedInCourses || [],
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
							const trackData = isChapterUpdated?.find((data) => data.chapterId === chapter?.chapterId);
							if (trackData?.isUpdated) {
								try {
									await axios.patch(`${base_url}/chapters${isInstructor ? '/instructor' : ''}/${chapter?.chapterId}`, {
										title: chapter.title,
										lessonIds: chapter.lessonIds,
										orgId,
										evaluationChecklistItems: chapter.evaluationChecklistItems || [],
										askForFeedback: chapter.askForFeedback || false,
									});
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

			if (deletedChapterIds && deletedChapterIds.length > 0) {
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
				chapterId: chapter?.chapterId,
				isUpdated: false,
			}));

			setIsChapterUpdated(chapterUpdateData);
			setDeletedChapterIds([]);
			setIsEditMode(false);
		} catch (error) {
			console.error('Error updating course:', error);
		}
	};

	const handlePublishing = async (): Promise<void> => {
		const isTryingToPublish = !singleCourseBeforeSave?.isActive;

		const hasPublishedLesson = chapterLessonDataBeforeSave.some((chapter) => chapter.lessons?.some((lesson) => lesson?.isActive));

		if (isTryingToPublish && !hasPublishedLesson && !singleCourseBeforeSave?.courseManagement.isExternal) {
			setIsNoChapterMsgOpen(true);
			return;
		} else if (courseId !== undefined) {
			try {
				await axios.patch(`${base_url}${isInstructor ? '/courses/instructor' : '/courses'}/${courseId}`, {
					isActive: !singleCourseBeforeSave?.isActive,
					// publishedAt will be handled by the backend when publishing
					// When unpublishing, we explicitly set it to null
					publishedAt: isTryingToPublish ? undefined : null,
				});
				setSingleCourse((prevData) => {
					if (prevData) {
						return {
							...prevData,
							isActive: !singleCourseBeforeSave?.isActive,
							publishedAt: isTryingToPublish ? new Date().toISOString() : null,
						};
					}
					return prevData;
				});
				setSingleCourseBeforeSave((prevData) => {
					if (prevData) {
						return {
							...prevData,
							isActive: !singleCourseBeforeSave?.isActive,
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

		// Check if there are unsaved changes
		if (!hasUnsavedChanges) {
			setIsEditMode(false);
			return;
		}

		// Validate for duplicate group names (case-insensitive)
		if (singleCourseBeforeSave?.groups && singleCourseBeforeSave.groups.length > 0) {
			const groupNames = singleCourseBeforeSave.groups.map((g) => g.name?.toLowerCase().trim()).filter(Boolean);
			const duplicateNames = groupNames.filter((name, index) => groupNames.indexOf(name) !== index);
			if (duplicateNames.length > 0) {
				setUrlErrorMessage('Duplicate group names are not allowed. Each group must have a unique name.');
				setIsUrlErrorOpen(true);
				return;
			}
		}

		// Validate image URL before proceeding
		if (singleCourseBeforeSave?.imageUrl?.trim()) {
			const imageValidation = await validateImageUrl(singleCourseBeforeSave.imageUrl.trim());
			if (!imageValidation.isValid) {
				setUrlErrorMessage('Invalid image URL format');
				setIsUrlErrorOpen(true);
				return;
			}
		}

		// Validate document URLs before proceeding
		if (singleCourseBeforeSave?.documents) {
			for (const document of singleCourseBeforeSave.documents) {
				if (document && document.documentUrl?.trim()) {
					const docValidation = await validateDocumentUrl(document.documentUrl.trim());
					if (!docValidation.isValid) {
						setUrlErrorMessage('Invalid document URL format');
						setIsUrlErrorOpen(true);
						return;
					}
				}
			}
		}

		// Validate video URLs before proceeding
		if (singleCourseBeforeSave?.videoURLs) {
			for (const videoURL of singleCourseBeforeSave.videoURLs) {
				if (videoURL && videoURL.url?.trim()) {
					try {
						const urlObj = new URL(videoURL.url.trim());
						if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
							setUrlErrorMessage('Invalid video URL format. URLs must use http or https protocol.');
							setIsUrlErrorOpen(true);
							return;
						}
					} catch {
						setUrlErrorMessage('Invalid video URL format');
						setIsUrlErrorOpen(true);
						return;
					}
				}
			}
		}

		let validUntil: Date | null = null;
		const startingDate = new Date(singleCourseBeforeSave?.startingDate || '');
		const durationWeeks = singleCourseBeforeSave?.durationWeeks || 0;

		if (!isNaN(startingDate.getTime()) && durationWeeks > 0) {
			validUntil = new Date(startingDate.getTime() + durationWeeks * 7 * 24 * 60 * 60 * 1000);
			if (validUntil < new Date()) {
				setIsExpiredDialogOpen(true);
				setPendingCourseUpdate(() => async () => {
					setIsSaving(true);
					try {
						await actuallyUpdateCourse();
					} finally {
						setIsSaving(false);
					}
				});
				return;
			}
		}

		// If not expired, proceed as normal
		setIsSaving(true);
		try {
			await actuallyUpdateCourse();
		} finally {
			setIsSaving(false);
		}
	};

	const y = useMotionValue(0);
	const boxShadow = useRaisedShadow(y);
	const sectionSx = {
		backgroundColor: theme.bgColor?.common,
		borderRadius: '0.75rem',
		padding: isMobileSize ? '1rem' : '1.25rem',
		border: `1px solid ${theme.palette.divider}`,
		boxShadow: '0 10px 30px rgba(15, 23, 42, 0.08)',
	};

	return (
		<DashboardPagesLayout pageName='Edit Course' customSettings={{ justifyContent: 'flex-start' }} showCopyRight={true}>
			<Box sx={{ width: '80%', position: 'fixed', top: '4rem', zIndex: 1000, backgroundColor: theme.bgColor?.secondary }}>
				<CoursePaper
					singleCourse={singleCourse}
					singleCourseBeforeSave={singleCourseBeforeSave}
					chapterLessonData={chapterLessonData}
					chapterLessonDataBeforeSave={chapterLessonDataBeforeSave}
					isEditMode={isEditMode}
					isMissingFieldMsgOpen={isMissingFieldMsgOpen}
					isNoChapterMsgOpen={isNoChapterMsgOpen}
					isFree={isFree}
					setIsEditMode={setIsEditMode}
					setIsMissingFieldMsgOpen={setIsMissingFieldMsgOpen}
					setIsNoChapterMsgOpen={setIsNoChapterMsgOpen}
					setIsMissingField={setIsMissingField}
					handlePublishing={handlePublishing}
					handleCourseUpdate={handleCourseUpdate}
					setChapterLessonDataBeforeSave={setChapterLessonDataBeforeSave}
					setDeletedChapterIds={setDeletedChapterIds}
					hasUnsavedChanges={hasUnsavedChanges}
					setHasUnsavedChanges={setHasUnsavedChanges}
					setSingleCourseBeforeSave={setSingleCourseBeforeSave}
					isSaving={isSaving}
				/>
			</Box>

			<Box sx={{ display: 'flex', width: '95%', justifyContent: 'center', marginTop: isSticky && isMobileSize ? '3.5rem' : '9rem' }}>
				{!isEditMode && (
					<CourseDetailsNonEditBox singleCourse={singleCourseBeforeSave} chapters={chapterLessonData} setSingleCourse={setSingleCourseBeforeSave} />
				)}

				{isEditMode && (
					<Box
						sx={{
							display: 'flex',
							flexDirection: 'column',
							justifyContent: 'flex-start',
							width: '95%',
						}}>
						<form>
							<CourseDetailsEditBox
								singleCourseBeforeSave={singleCourseBeforeSave}
								isFree={isFree}
								isMissingField={isMissingField}
								setIsFree={setIsFree}
								setIsMissingField={setIsMissingField}
								setSingleCourseBeforeSave={setSingleCourseBeforeSave}
								setHasUnsavedChanges={setHasUnsavedChanges}
							/>
							{!singleCourseBeforeSave?.courseManagement.isExternal && (
								<Box sx={{ mt: '2rem', minHeight: '30vh' }}>
									<Box
										sx={{
											display: 'flex',
											justifyContent: 'space-between',
											alignItems: 'center',
											width: '100%',
										}}>
										<Box sx={{ display: 'flex', flexDirection: isMobileSize ? 'column' : 'row', alignItems: 'center', flex: 2 }}>
											<Typography variant='h5'>CHAPTERS</Typography>
											{totalPossibleScoreForCourseEdit > 0 && (
												<Typography
													variant='body2'
													sx={{
														fontSize: isMobileSize ? '0.7rem' : '0.8rem',
														color: theme.textColor?.secondary?.main || 'text.secondary',
														ml: isMobileSize ? '0.25rem' : '0.5rem',
													}}>
													({isMobileSize ? '' : 'Total score: '}
													{totalPossibleScoreForCourseEdit} pts)
												</Typography>
											)}
										</Box>
										<CustomInfoMessageAlignedLeft
											message='Drag the lessons in each chapter and chapters to reorder'
											sx={{ justifyContent: 'center', alignItems: 'center', flex: 4, marginTop: '0.85rem' }}
										/>
										<Box sx={{ display: 'flex', justifyContent: 'flex-end', flex: 2, mb: '0.35rem' }}>
											<CustomSubmitButton
												type='button'
												onClick={() => {
													setIsChapterCreateModalOpen(true);
													setNewChapterTitle('');
												}}>
												{isMobileSize ? 'New' : 'New Chapter'}
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
												setHasUnsavedChanges(true);
											}}
											style={{ display: 'flex', flexDirection: 'column' }}>
											<CustomTextField
												fullWidth={false}
												label='Chapter Title'
												value={newChapterTitle}
												onChange={(e) => setNewChapterTitle(e.target.value)}
												sx={{ margin: isMobileSize ? '0.5rem 1rem' : '2rem 1rem' }}
												InputLabelProps={{
													sx: { fontSize: '0.8rem' },
												}}
												InputProps={{
													inputProps: {
														maxLength: 100,
													},
												}}
											/>

											<CustomDialogActions onCancel={closeCreateChapterModal} />
										</form>
									</CustomDialog>

									{chapterLessonDataBeforeSave && chapterLessonDataBeforeSave.length === 0 ? (
										<NoContentBoxAdmin content='No chapter for this course' />
									) : (
										<Reorder.Group
											axis='y'
											values={chapterLessonDataBeforeSave || []}
											onReorder={(newChapters): void => {
												setChapterLessonDataBeforeSave(newChapters);
												setHasUnsavedChanges(true);
											}}>
											{chapterLessonDataBeforeSave &&
												chapterLessonDataBeforeSave &&
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
																setHasUnsavedChanges={setHasUnsavedChanges}
															/>
														</Reorder.Item>
													);
												})}
										</Reorder.Group>
									)}
								</Box>
							)}

							{chapterLessonDataBeforeSave.length > 2 && (
								<Box sx={{ display: 'flex', width: '100%', justifyContent: 'flex-end', margin: '1rem 0 2rem 0' }}>
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

							{/* 5) Course Materials */}
							{!singleCourseBeforeSave?.courseManagement.isExternal && (
								<Box sx={{ ...sectionSx, mt: '2rem' }}>
									<HandleDocUploadURL
										label='Course Materials'
										onDocUploadLogic={(url, docName) => {
											setSingleCourseBeforeSave((prevData) => {
												if (prevData && user?._id && courseId) {
													const maxNumber = prevData?.documents
														?.filter((doc) => doc !== null)
														?.reduce((max, doc) => {
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
														userId: user?._id,
														imageUrl: '',
														prices: [
															{ currency: 'gbp', amount: '0' },
															{ currency: 'usd', amount: '0' },
															{ currency: 'eur', amount: '0' },
															{ currency: 'try', amount: '0' },
														],
														description: '',
														createdAt: '',
														updatedAt: '',
														clonedFromId: '',
														clonedFromTitle: '',
														usedInLessons: [],
														usedInCourses: courseId ? [courseId] : [],
														samplePageImageUrls: [],
														isOnLandingPage: false,
														isArchived: false,
														pageCount: 0,
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
											setHasUnsavedChanges(true);
										}}
										enterDocUrl={enterDocUrl}
										setEnterDocUrl={setEnterDocUrl}
										docFolderName='Course Materials'
										addNewDocumentModalOpen={addNewDocumentModalOpen}
										setAddNewDocumentModalOpen={setAddNewDocumentModalOpen}
										singleCourseBeforeSave={singleCourseBeforeSave}
										setSingleCourseBeforeSave={setSingleCourseBeforeSave}
										fromAdminCourses={true}
										setHasUnsavedChanges={setHasUnsavedChanges}
									/>
									<Box sx={{ mt: '1rem' }}>
										<DocumentsListEditBox
											documentsSource={singleCourseBeforeSave?.documents?.filter((doc) => doc && doc._id && doc.name && doc.name.trim() !== '')}
											toggleDocRenameModal={toggleDocRenameModal}
											closeDocRenameModal={closeDocRenameModal}
											isDocRenameModalOpen={isDocRenameModalOpen}
											saveDocRename={saveDocRename}
											setIsDocumentUpdated={setIsDocumentUpdated}
											setHasUnsavedChanges={setHasUnsavedChanges}
											removeDocOnClick={(document: Document) => {
												setSingleCourseBeforeSave((prevData) => {
													if (prevData) {
														const filteredDocuments = prevData?.documents?.filter((thisDoc) => thisDoc._id !== document._id);
														const filteredDocumentIds = filteredDocuments?.map((doc) => doc._id);

														// Update document's usedInCourses in the documents context
														const updatedDocument = {
															...document,
															usedInCourses: document.usedInCourses?.filter((id) => id !== courseId),
															createdByName: document.createdByName,
															createdByImageUrl: document.createdByImageUrl,
															createdByRole: document.createdByRole,
															updatedByName: document.updatedByName,
															updatedByImageUrl: document.updatedByImageUrl,
															updatedByRole: document.updatedByRole,
															createdAt: document.createdAt,
															updatedAt: new Date().toISOString(),
														};
														updateDocument(updatedDocument);
														setHasUnsavedChanges(true);
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
												setSingleCourseBeforeSave((prevData) => {
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
									</Box>
								</Box>
							)}

							{/* 5) Course Videos */}
							{!singleCourseBeforeSave?.courseManagement.isExternal && (
								<Box sx={{ ...sectionSx, mt: '2rem', mb: '4rem' }}>
									<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: '0.5rem' }}>
										<Typography variant={isMobileSize ? 'body2' : 'h6'} sx={{ fontSize: !isMobileSize ? '1rem' : '0.75rem' }}>
											Course Videos
										</Typography>
									</Box>
									<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
										<CustomTextField
											placeholder='Video Title'
											required={false}
											sx={{ width: '42.5%', marginTop: '0.5rem' }}
											value={videoFormData.title}
											onChange={(e) => {
												setVideoFormData({ ...videoFormData, title: e.target.value });
												if (videoTitleError) {
													setVideoTitleError('');
												}
												if (e.target.value.length > 100) {
													setVideoTitleError('Title must not exceed 100 characters');
												}
											}}
											InputProps={{
												inputProps: {
													maxLength: 100,
												},
											}}
											error={!!videoTitleError}
										/>
										<Box sx={{ display: 'flex', flexDirection: 'column', width: '55%' }}>
											<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
												<CustomTextField
													placeholder='Video URL'
													required={false}
													sx={{ width: '82.5%', marginTop: '0.5rem' }}
													value={videoFormData.url}
													onChange={(e) => {
														const value = e.target.value;
														setVideoFormData({ ...videoFormData, url: value });
														if (videoUrlError) {
															setVideoUrlError('');
														}
													}}
												/>
												<Button
													onClick={() => {
														const trimmedUrl = videoFormData.url.trim();
														const trimmedTitle = videoFormData.title.trim();

														if (!trimmedUrl || trimmedTitle.length === 0) {
															if (!trimmedUrl) setVideoUrlError('Video URL is required');
															if (trimmedTitle.length === 0) setVideoTitleError('Video title is required');
															return;
														}

														// Validate URL format
														try {
															const urlObj = new URL(trimmedUrl);
															if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
																setVideoUrlError('Please enter a valid URL (http or https)');
																return;
															}
														} catch {
															setVideoUrlError('Please enter a valid URL (http or https)');
															return;
														}

														// Check for duplicate URLs (case-insensitive)
														const videoURLs = singleCourseBeforeSave?.videoURLs || [];
														const urlLower = trimmedUrl.toLowerCase();
														const isDuplicate = videoURLs.some((video) => {
															return video.url?.toLowerCase() === urlLower;
														});
														if (isDuplicate) {
															setVideoUrlError('A video with this URL already exists. URLs must be unique.');
															return;
														}

														// Validate title length
														if (trimmedTitle.length > 100) {
															setVideoTitleError('Title must not exceed 100 characters');
															return;
														}

														// Clear errors if validation passes
														setVideoUrlError('');
														setVideoTitleError('');

														const newVideoURL = {
															url: trimmedUrl,
															title: trimmedTitle.substring(0, 100),
														};

														setSingleCourseBeforeSave((prevCourse) => {
															if (!prevCourse) return prevCourse;
															const videoURLs = prevCourse.videoURLs || [];
															return { ...prevCourse, videoURLs: [...videoURLs, newVideoURL] };
														});

														setHasUnsavedChanges(true);
														setVideoFormData({ url: '', title: '' });
														setVideoUrlError('');
														setVideoTitleError('');
													}}
													variant='outlined'
													sx={{ textTransform: 'capitalize', height: '2rem', width: '15%', ml: '0.5rem', mb: '0.25rem' }}
													disabled={!videoFormData.url.trim() || !videoFormData.title.trim()}
													size='small'>
													<CloudUpload />
												</Button>
											</Box>
											{videoUrlError && <CustomErrorMessage sx={{ mt: '0.25rem', fontSize: '0.7rem' }}>{videoUrlError}</CustomErrorMessage>}
											{videoTitleError && <CustomErrorMessage sx={{ mt: '0.25rem', fontSize: '0.7rem' }}>{videoTitleError}</CustomErrorMessage>}
										</Box>
									</Box>

									{/* Existing videos list */}
									<Box sx={{ mt: '1.5rem', mb: isMobileSize ? '1rem' : '1.5rem', }}>
										{singleCourseBeforeSave?.videoURLs &&
											singleCourseBeforeSave.videoURLs.length > 0 &&
											singleCourseBeforeSave.videoURLs
												?.filter((videoURL) => videoURL && videoURL.url && videoURL.url.trim() !== '' && videoURL.title && videoURL.title.trim() !== '')
												?.map((videoURL, index) => (
													<Box
														key={index}
														sx={{
															display: 'flex',
															flexDirection: 'column',
															justifyContent: 'space-between',
															alignItems: 'flex-start',
															mb: '1rem',
															width: '100%',
														}}>
														<Box sx={{ mb: '0.25rem' }}>
															<Link
																href={videoURL.url}
																target='_blank'
																rel='noopener noreferrer'
																variant='body2'
																sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
																{videoURL.title}
															</Link>
														</Box>
														<Box sx={{ display: 'flex', alignItems: 'center' }}>
															<Typography
																variant='body2'
																sx={{
																	'mr': '0.5rem',
																	':hover': {
																		textDecoration: 'underline',
																		cursor: 'pointer',
																	},
																	'fontSize': isMobileSize ? '0.7rem' : '0.85rem',
																}}
																onClick={() => {
																	setSingleCourseBeforeSave((prevData) => {
																		if (prevData) {
																			const filteredVideoURLs = prevData?.videoURLs?.filter((_, i) => i !== index);
																			return {
																				...prevData,
																				videoURLs: filteredVideoURLs || [],
																			};
																		}
																		return prevData;
																	});
																	setHasUnsavedChanges(true);
																}}>
																Remove
															</Typography>
															<Typography
																variant='body2'
																onClick={() => toggleVideoRenameModal(index, videoURL)}
																sx={{
																	':hover': {
																		textDecoration: 'underline',
																		cursor: 'pointer',
																	},
																	'fontSize': isMobileSize ? '0.7rem' : '0.85rem',
																}}>
																Rename
															</Typography>
															<CustomDialog
																openModal={isVideoRenameModalOpen[index] || false}
																closeModal={() => closeVideoRenameModal(index)}
																title='Rename Video Title'
																maxWidth='xs'>
																<form
																	style={{ display: 'flex', flexDirection: 'column', paddingTop: '1.5rem' }}
																	onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
																		e.preventDefault();
																	}}>
																	<CustomTextField
																		fullWidth={false}
																		required={true}
																		label='Video Title'
																		value={videoURL.title}
																		sx={{ margin: '1rem' }}
																		onChange={(e) => {
																			setSingleCourseBeforeSave((prevData) => {
																				if (prevData) {
																					const updatedVideoURLs = prevData?.videoURLs?.map((video, idx) => {
																						if (idx === index) {
																							return { ...video, title: e.target.value };
																						}
																						return video;
																					});
																					return { ...prevData, videoURLs: updatedVideoURLs || [] };
																				}
																				return prevData;
																			});
																		}}
																		InputProps={{
																			inputProps: {
																				maxLength: 100,
																			},
																		}}
																		error={videoURL.title.trim().length > 100}
																	/>
																	{videoURL.title.trim().length > 100 && (
																		<CustomErrorMessage sx={{ mx: '1rem', mt: '-0.5rem', mb: '0.5rem' }}>
																			Title must not exceed 100 characters
																		</CustomErrorMessage>
																	)}
																	<CustomDialogActions
																		onCancel={() => closeVideoRenameModal(index)}
																		submitBtnText='Save'
																		submitBtnType='button'
																		actionSx={{ mt: '0.5rem', mb: '0.5rem' }}
																		onSubmit={() => {
																			saveVideoRename(index);
																		}}
																		disableBtn={!videoURL.title || videoURL.title.trim() === '' || videoURL.title.trim().length > 100}
																	/>
																</form>
															</CustomDialog>
														</Box>
													</Box>
												))}
									</Box>
								</Box>
							)}
						</form>
					</Box>
				)}
			</Box>

			{/* CustomDialog for expired course confirmation */}
			<CustomDialog openModal={isExpiredDialogOpen} closeModal={() => setIsExpiredDialogOpen(false)} title='Course Expired' maxWidth='sm'>
				<DialogContent>
					<Typography variant='body2'>
						This course appears to be expired based on its starting date and duration.
						<br />
						<br />
						Once expired, it will no longer be editable — only cloning will be allowed.
						<br />
						<br />
						Do you still want to continue editing?
					</Typography>
				</DialogContent>
				<CustomDialogActions
					onCancel={() => setIsExpiredDialogOpen(false)}
					onSubmit={() => {
						if (pendingCourseUpdate) pendingCourseUpdate();
						setIsExpiredDialogOpen(false);
					}}
					submitBtnText='Continue Editing'
					cancelBtnText='Cancel'
				/>
			</CustomDialog>

			{/* CustomDialog for unsaved changes confirmation */}
			<CustomDialog openModal={!!pendingTx} closeModal={() => setPendingTx(null)} title='Unsaved Changes' maxWidth='sm'>
				<DialogContent>
					<Typography variant='body2'>You have unsaved changes. Are you sure you want to leave this page?</Typography>
					<Typography variant='body2' sx={{ mt: '0.75rem' }}>
						If you leave this page, you will lose your unsaved changes.
					</Typography>
				</DialogContent>
				<CustomDialogActions
					onCancel={() => setPendingTx(null)}
					onSubmit={() => {
						if (nextLocation) {
							setAllowNavigation(true);
							setPendingTx(null);
						}
					}}
					submitBtnText='Leave Page'
					cancelBtnText='Stay'
					actionSx={{ margin: '0 0.5rem 0.5rem 0' }}
				/>
			</CustomDialog>

			{/* URL validation error SnackBar */}
			<Snackbar
				open={isUrlErrorOpen}
				autoHideDuration={3500}
				anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
				onClose={() => setIsUrlErrorOpen(false)}>
				<Alert severity='error' variant='filled' sx={{ width: '100%' }}>
					{urlErrorMessage}
				</Alert>
			</Snackbar>

		</DashboardPagesLayout>
	);
};

export default AdminCourseEditPage;
