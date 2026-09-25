import { CourseIntroModal } from '../interfaces/course';
import { extractVideoId } from './videoUrlUtils';

export type CourseIntroModalSource = {
	introVideoUrl?: string;
	introModal?: CourseIntroModal;
};

export type ResolvedCourseIntroModal = {
	showVideo: boolean;
	showContent: boolean;
	title: string;
	body: string;
	videoUrl: string;
	shouldOpen: boolean;
};

function htmlHasVisibleText(html: string): boolean {
	return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/gi, ' ').trim().length > 0;
}

export function defaultCourseIntroModal(_introVideoUrl?: string): CourseIntroModal {
	return {
		showVideo: true,
		showContent: false,
		title: '',
		body: '',
	};
}

/** LP + admin: missing `introModal` keeps today's video-only auto-open. */
/** iframe embed URL for common hosts; unsupported URLs should open in a new tab */
export function getIntroVideoEmbedSrc(raw: string): string | null {
	const url = raw.trim();
	if (!url) return null;

	if (url.includes('youtube.com') || url.includes('youtu.be')) {
		const id = extractVideoId(url);
		return id ? `https://www.youtube.com/embed/${id}?rel=0&controls=1&playsinline=1` : null;
	}
	if (url.includes('vimeo.com')) {
		const id = extractVideoId(url);
		return id ? `https://player.vimeo.com/video/${id}` : null;
	}
	if (url.includes('dailymotion.com')) {
		const id = extractVideoId(url);
		return id ? `https://www.dailymotion.com/embed/video/${id}` : null;
	}
	return null;
}

export function resolveCourseIntroModal(course: CourseIntroModalSource | null | undefined): ResolvedCourseIntroModal {
	const videoUrl = course?.introVideoUrl?.trim() ?? '';
	const saved = course?.introModal;
	const title = saved?.title?.trim() ?? '';
	const body = saved?.body ?? '';
	const hasContent = Boolean(title) || htmlHasVisibleText(body);

	const showVideo = saved ? Boolean(saved.showVideo) && Boolean(videoUrl) : Boolean(videoUrl);
	const showContent = saved ? Boolean(saved.showContent) && hasContent : false;

	return {
		showVideo,
		showContent,
		title,
		body,
		videoUrl,
		shouldOpen: showVideo || showContent,
	};
}
