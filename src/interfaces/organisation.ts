import { PromoBanner } from '../utils/promoBanner';

export interface Organisation {
	_id: string;
	logoUrl: string;
	orgCode: string;
	orgName: string;
	showHomeTestimonials?: boolean;
	hasZoomConfigured?: boolean;
	/** Announcement modal on the public books list. */
	lpResourcesBanner?: PromoBanner;
}
