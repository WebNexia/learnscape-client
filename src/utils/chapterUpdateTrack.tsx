import { ChapterUpdateTrack } from '../pages/AdminCourseEditPage';

export const chapterUpdateTrack = (chapterId: string, setIsChapterUpdated: React.Dispatch<React.SetStateAction<ChapterUpdateTrack[]>>) => {
	setIsChapterUpdated((prevData: ChapterUpdateTrack[]) => {
		return prevData?.map((data) => {
			if (data.chapterId === chapterId) {
				return {
					...data,
					isUpdated: true,
				};
			}
			return data;
		});
	});
};
