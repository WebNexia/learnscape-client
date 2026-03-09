import { createContext, ReactNode, useContext, useState, useCallback, useEffect } from 'react';

const CONSULTATION_CART_STORAGE_KEY = 'learnscape_consultation_cart';

function loadConsultationCartFromStorage(): ConsultationCartItem[] {
	try {
		const raw = localStorage.getItem(CONSULTATION_CART_STORAGE_KEY);
		if (!raw) return [];
		const parsed = JSON.parse(raw);
		const arr = Array.isArray(parsed) ? parsed : [];
		// Strip any user/client details (guestName, guestEmail, guestPhone) - never persist PII
		return arr.map((item: Record<string, unknown>) => {
			const { guestName, guestEmail, guestPhone, ...rest } = item;
			return rest as unknown as ConsultationCartItem;
		});
	} catch {
		return [];
	}
}

function saveConsultationCartToStorage(items: ConsultationCartItem[]) {
	try {
		localStorage.setItem(CONSULTATION_CART_STORAGE_KEY, JSON.stringify(items));
	} catch (e) {
		console.warn('Failed to persist consultation cart', e);
	}
}

export interface ConsultationCartItem {
	id: string;
	consultationId: string;
	consultationTitle: string;
	consultationDuration: number;
	coverImageUrl?: string;
	slotId: string;
	slotStart: string;
	slotDuration: number;
	consultantId: string;
	consultantName: string;
	price: { currency: string; amount: string };
	formSubmissionId?: string;
}

interface ConsultationCartContextTypes {
	items: ConsultationCartItem[];
	addItem: (item: Omit<ConsultationCartItem, 'id'>) => void;
	removeItem: (id: string) => void;
	clearCart: () => void;
	count: number;
}

const ConsultationCartContext = createContext<ConsultationCartContextTypes>({
	items: [],
	addItem: () => { },
	removeItem: () => { },
	clearCart: () => { },
	count: 0,
});

export function ConsultationCartProvider({ children }: { children: ReactNode }) {
	const [items, setItems] = useState<ConsultationCartItem[]>(loadConsultationCartFromStorage);

	useEffect(() => {
		saveConsultationCartToStorage(items);
	}, [items]);

	const addItem = useCallback((item: Omit<ConsultationCartItem, 'id'>) => {
		setItems((prev) => {
			// Prevent duplicate: same consultation + same slot
			if (prev.some((i) => i.consultationId === item.consultationId && i.slotId === item.slotId)) {
				return prev;
			}
			const id = `consult-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
			return [...prev, { ...item, id }];
		});
	}, []);

	const removeItem = useCallback((id: string) => {
		setItems((prev) => prev.filter((i) => i.id !== id));
	}, []);

	const clearCart = useCallback(() => setItems([]), []);

	return (
		<ConsultationCartContext.Provider
			value={{
				items,
				addItem,
				removeItem,
				clearCart,
				count: items.length,
			}}>
			{children}
		</ConsultationCartContext.Provider>
	);
}

export function useConsultationCart() {
	const ctx = useContext(ConsultationCartContext);
	if (!ctx) {
		return {
			items: [],
			addItem: () => { },
			removeItem: () => { },
			clearCart: () => { },
			count: 0,
		};
	}
	return ctx;
}
