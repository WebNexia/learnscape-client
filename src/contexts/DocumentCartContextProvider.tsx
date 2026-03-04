import { createContext, ReactNode, useContext, useState, useCallback, useEffect } from 'react';

const DOCUMENT_CART_STORAGE_KEY = 'learnscape_document_cart';

function loadDocumentCartFromStorage(): DocumentCartItem[] {
	try {
		const raw = localStorage.getItem(DOCUMENT_CART_STORAGE_KEY);
		if (!raw) return [];
		const parsed = JSON.parse(raw);
		return Array.isArray(parsed) ? parsed : [];
	} catch {
		return [];
	}
}

function saveDocumentCartToStorage(items: DocumentCartItem[]) {
	try {
		localStorage.setItem(DOCUMENT_CART_STORAGE_KEY, JSON.stringify(items));
	} catch (e) {
		console.warn('Failed to persist document cart', e);
	}
}

export interface DocumentCartItem {
	id: string;
	documentId: string;
	orgId: string;
	title: string;
	amount: string;
	currency: string;
	imageUrl?: string;
}

interface DocumentCartContextTypes {
	items: DocumentCartItem[];
	addItem: (item: Omit<DocumentCartItem, 'id'>) => void;
	removeItem: (id: string) => void;
	clearCart: () => void;
	count: number;
}

const DocumentCartContext = createContext<DocumentCartContextTypes>({
	items: [],
	addItem: () => {},
	removeItem: () => {},
	clearCart: () => {},
	count: 0,
});

export function DocumentCartProvider({ children }: { children: ReactNode }) {
	const [items, setItems] = useState<DocumentCartItem[]>(loadDocumentCartFromStorage);

	useEffect(() => {
		saveDocumentCartToStorage(items);
	}, [items]);

	const addItem = useCallback((item: Omit<DocumentCartItem, 'id'>) => {
		setItems((prev) => {
			if (prev.some((i) => i.documentId === item.documentId)) return prev;
			const id = `doc-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
			return [...prev, { ...item, id }];
		});
	}, []);

	const removeItem = useCallback((id: string) => {
		setItems((prev) => prev.filter((i) => i.id !== id));
	}, []);

	const clearCart = useCallback(() => setItems([]), []);

	return (
		<DocumentCartContext.Provider
			value={{
				items,
				addItem,
				removeItem,
				clearCart,
				count: items.length,
			}}>
			{children}
		</DocumentCartContext.Provider>
	);
}

export function useDocumentCart() {
	const ctx = useContext(DocumentCartContext);
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
