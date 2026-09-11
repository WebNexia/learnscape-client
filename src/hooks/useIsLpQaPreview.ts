import { useLocation } from 'react-router-dom';
import { isLpQaPreviewPath } from '../utils/lpQaPreview';

/** True when the current URL ends with `/qa-test` (manual LP visual preview). */
export const useIsLpQaPreview = (): boolean => {
	const location = useLocation();
	if (!location) return false;
	return isLpQaPreviewPath(location.pathname);
};
