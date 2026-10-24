import { useCallback, useEffect, useState } from 'react';
import { PromoBanner, isPromoBannerActive, promoBannerVersion, promoDismissStorageKey } from '../utils/promoBanner';

export const usePromoBannerOpen = (scope: string, banner?: Partial<PromoBanner> | null) => {
	const version = promoBannerVersion(banner);
	const active = isPromoBannerActive(banner);
	const [open, setOpen] = useState(false);

	useEffect(() => {
		if (!active) {
			setOpen(false);
			return;
		}
		try {
			if (sessionStorage.getItem(promoDismissStorageKey(scope, version)) === '1') {
				setOpen(false);
				return;
			}
		} catch {
			// sessionStorage can be blocked; still show the announcement
		}
		setOpen(true);
	}, [active, scope, version]);

	const close = useCallback(() => {
		try {
			if (active) sessionStorage.setItem(promoDismissStorageKey(scope, version), '1');
		} catch {
			// ignore storage failures
		}
		setOpen(false);
	}, [active, scope, version]);

	return { open, close };
};
