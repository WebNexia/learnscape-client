import { SingleCourse } from '../interfaces/course';

type CourseAccessFields = Pick<SingleCourse, 'courseAccessTiming' | 'startingDate'> & {
	cohortOfCourseId?: string;
};

export type CheckoutCopyLocale = 'tr' | 'en';

export function isCohortCourse(course: CourseAccessFields | null | undefined): boolean {
	if (!course) return false;
	if (course.courseAccessTiming === 'cohort') return true;
	if (course.courseAccessTiming === 'evergreen') return false;
	return Boolean(course.cohortOfCourseId);
}

export function parseCourseStartDate(startingDate: Date | string | null | undefined): Date | null {
	if (!startingDate) return null;
	const parsed = new Date(startingDate);
	return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function isCohortBeforeStart(course: CourseAccessFields | null | undefined, now = new Date()): boolean {
	if (!isCohortCourse(course)) return false;
	const start = parseCourseStartDate(course?.startingDate);
	if (!start) return false;
	return now.getTime() < start.getTime();
}

/** Evergreen and cohort courses that have already started require immediate-access / withdrawal waiver. */
export function requiresImmediateAccessWaiver(course: CourseAccessFields | null | undefined): boolean {
	return !isCohortBeforeStart(course);
}

export function formatCourseStartDate(
	startingDate: Date | string | null | undefined,
	locale: CheckoutCopyLocale
): string {
	const start = parseCourseStartDate(startingDate);
	if (!start) return '';
	return start.toLocaleDateString(locale === 'tr' ? 'tr-TR' : 'en-GB', {
		day: 'numeric',
		month: 'long',
		year: 'numeric',
	});
}

export interface CourseAccessCheckoutCopy {
	needsWithdrawalWaiver: boolean;
	showCohortNotice: boolean;
	withdrawalWaiverLabel: string;
	cohortNotice: string;
	waiverRequiredError: string;
}

export function getCourseAccessCheckoutCopy(
	course: CourseAccessFields | null | undefined,
	locale: CheckoutCopyLocale = 'tr'
): CourseAccessCheckoutCopy {
	const cohortBeforeStart = isCohortBeforeStart(course);
	const needsWaiver = requiresImmediateAccessWaiver(course);
	const formattedStart = formatCourseStartDate(course?.startingDate ?? null, locale);

	if (locale === 'tr') {
		return {
			needsWithdrawalWaiver: needsWaiver,
			showCohortNotice: cohortBeforeStart,
			withdrawalWaiverLabel:
				'Dijital içeriğe satın alma sonrası hemen erişim istiyorum. Hizmetin derhal başlayacağını biliyor ve 14 günlük cayma hakkımdan feragat ettiğimi kabul ediyorum.',
			cohortNotice: formattedStart
				? `Bu kurs ${formattedStart} tarihinde başlayacaktır. Sözleşmeden itibaren 14 gün içinde ve kurs başlamadan önce iptal hakkınız olduğunu biliyorum.`
				: 'Bu planlı bir kurstur. Sözleşmeden itibaren 14 gün içinde ve kurs başlamadan önce iptal hakkınız olduğunu biliyorum.',
			waiverRequiredError: 'Lütfen dijital içeriğe hemen erişim ve cayma hakkından feragat onayını işaretleyin.',
		};
	}

	return {
		needsWithdrawalWaiver: needsWaiver,
		showCohortNotice: cohortBeforeStart,
		withdrawalWaiverLabel:
			'I request immediate access to the digital content after purchase. I understand that the service will begin straight away and I waive my 14-day right of withdrawal.',
		cohortNotice: formattedStart
			? `This course starts on ${formattedStart}. I understand that I may cancel within 14 days of concluding the contract and before the course start date.`
			: 'This is a scheduled (cohort) course. I understand that I may cancel within 14 days of concluding the contract and before the course start date.',
		waiverRequiredError: 'Please confirm immediate access and waiver of your right of withdrawal.',
	};
}
