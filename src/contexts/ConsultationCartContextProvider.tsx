import { createContext, ReactNode, useContext, useState, useCallback } from 'react';

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
	guestName: string;
	guestEmail: string;
	guestPhone: string;
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
	addItem: () => {},
	removeItem: () => {},
	clearCart: () => {},
	count: 0,
});

export function ConsultationCartProvider({ children }: { children: ReactNode }) {
	const [items, setItems] = useState<ConsultationCartItem[]>([]);

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
			addItem: () => {},
			removeItem: () => {},
			clearCart: () => {},
			count: 0,
		};
	}
	return ctx;
}
