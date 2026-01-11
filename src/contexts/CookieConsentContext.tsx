import { createContext, useContext, useState, ReactNode } from 'react';

interface CookieConsentContextType {
	openCookieConsent: () => void;
	closeCookieConsent: () => void;
	isOpen: boolean;
}

const CookieConsentContext = createContext<CookieConsentContextType | undefined>(undefined);

export const CookieConsentProvider = ({ children }: { children: ReactNode }) => {
	const [isOpen, setIsOpen] = useState<boolean>(false);

	const openCookieConsent = () => {
		setIsOpen(true);
	};

	const closeCookieConsent = () => {
		setIsOpen(false);
	};

	return <CookieConsentContext.Provider value={{ openCookieConsent, closeCookieConsent, isOpen }}>{children}</CookieConsentContext.Provider>;
};

export const useCookieConsent = () => {
	const context = useContext(CookieConsentContext);
	if (context === undefined) {
		throw new Error('useCookieConsent must be used within a CookieConsentProvider');
	}
	return context;
};
