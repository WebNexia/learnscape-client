import axios from '@utils/axiosInstance';
import { ReactNode, createContext, useContext, useState } from 'react';
import { useQuery } from 'react-query';
import { useLocation } from 'react-router-dom';

import Loading from '../components/layouts/loading/Loading';
import LoadingError from '../components/layouts/loading/LoadingError';
import { OrganisationContext } from './OrganisationContextProvider';
import { PromoCode } from '../interfaces/promoCode';
import { useAuth } from '../hooks/useAuth';

interface PromoCodesContextTypes {
	promoCodes: PromoCode[];
	sortPromoCodesData: (property: keyof PromoCode, order: 'asc' | 'desc') => void;
	addNewPromoCode: (newPromoCode: any) => void;
	removePromoCode: (id: string) => void;
	updatePromoCode: (singlePromoCode: PromoCode) => void;
	totalItems: number;
	loadedPages: number[];
	promoCodesPageNumber: number;
	setPromoCodesPageNumber: React.Dispatch<React.SetStateAction<number>>;
	fetchPromoCodes: (page: number) => void;
	fetchMorePromoCodes: (startBatch: number, endBatch: number) => void;
}

interface PromoCodesContextProviderProps {
	children: ReactNode;
}

export const PromoCodesContext = createContext<PromoCodesContextTypes>({
	promoCodes: [],
	sortPromoCodesData: () => {},
	addNewPromoCode: () => {},
	removePromoCode: () => {},
	updatePromoCode: () => {},
	totalItems: 0,
	loadedPages: [],
	promoCodesPageNumber: 1,
	setPromoCodesPageNumber: () => {},
	fetchPromoCodes: () => {},
	fetchMorePromoCodes: () => {},
});

const PromoCodesContextProvider = (props: PromoCodesContextProviderProps) => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const { orgId } = useContext(OrganisationContext);
	const { isAuthenticated, isAdmin } = useAuth();
	const location = useLocation();
	const isLandingPageRoute =
		location.pathname === '/' ||
		location.pathname === '/landing-page-courses' ||
		location.pathname === '/resources' ||
		location.pathname === '/contact-us' ||
		location.pathname === '/about-us' ||
		location.pathname === '/auth' ||
		// Only consider course preview pages as landing pages, not enrolled course pages
		(location.pathname.startsWith('/course/') && !location.pathname.includes('/userCourseId/'));

	const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
	const [totalItems, setTotalItems] = useState<number>(0);
	const [loadedPages, setLoadedPages] = useState<number[]>([]);
	const [promoCodesPageNumber, setPromoCodesPageNumber] = useState<number>(1);

	const [isLoaded, setIsLoaded] = useState<boolean>(false);

	const fetchPromoCodes = async (page: number = 1) => {
		if (!orgId) return;

		setIsLoaded(false);

		try {
			const response = await axios.get(`${base_url}/promoCodes/organisation/${orgId}?page=${page}&limit=150`);

			if (page === 1) {
				// First page - replace all data
				setPromoCodes(response.data.data);
				setLoadedPages([1]);
			} else {
				// Subsequent pages - append data
				setPromoCodes((prev) => [...prev, ...response.data.data]);
				setLoadedPages((prev) => [...prev, page]);
			}

			setTotalItems(response.data.totalItems || response.data.data.length);
			setIsLoaded(true);
			return response.data.data;
		} catch (error) {
			setIsLoaded(true);
			throw error;
		}
	};

	const fetchMorePromoCodes = async (startBatch: number, endBatch: number) => {
		if (!orgId) return;

		try {
			const promises = [];
			for (let page = startBatch; page <= endBatch; page++) {
				promises.push(axios.get(`${base_url}/promoCodes/organisation/${orgId}?page=${page}&limit=150`));
			}

			const responses = await Promise.all(promises);
			const allData = responses.flatMap((response) => response.data.data);

			setPromoCodes((prev) => [...prev, ...allData]);
			setLoadedPages((prev) => [...prev, ...Array.from({ length: endBatch - startBatch + 1 }, (_, i) => startBatch + i)]);
		} catch (error) {
			console.error('Error fetching more promoCodes:', error);
			throw error;
		}
	};

	const { isLoading, isError } = useQuery(['allPromoCodes', orgId, promoCodesPageNumber], () => fetchPromoCodes(promoCodesPageNumber), {
		enabled: !!orgId && isAuthenticated && isAdmin && !isLoaded && !isLandingPageRoute,
	});

	// Function to handle sorting
	const sortPromoCodesData = (property: keyof PromoCode, order: 'asc' | 'desc') => {
		const sortedDataCopy = [...promoCodes].sort((a: PromoCode, b: PromoCode) => {
			if (order === 'asc') {
				return a[property]! > b[property]! ? 1 : -1;
			} else {
				return a[property]! < b[property]! ? 1 : -1;
			}
		});
		setPromoCodes(sortedDataCopy);
	};
	// Function to update promoCodes with new promoCode data
	const addNewPromoCode = (newPromoCode: any) => {
		setPromoCodes((prevPromoCodes) => [newPromoCode, ...prevPromoCodes]);
	};

	const updatePromoCode = (singlePromoCode: PromoCode) => {
		const updatedPromoCodeList = promoCodes?.map((promoCode) => {
			if (singlePromoCode._id === promoCode._id) {
				return singlePromoCode;
			}
			return promoCode;
		});
		setPromoCodes(updatedPromoCodeList);
	};

	const removePromoCode = (id: string) => {
		setPromoCodes((prevPromoCodes) => prevPromoCodes?.filter((data) => data._id !== id));
	};

	if (isLoading) {
		return <Loading />;
	}

	if (isError) {
		return <LoadingError />;
	}

	return (
		<PromoCodesContext.Provider
			value={{
				promoCodes,
				sortPromoCodesData,
				addNewPromoCode,
				removePromoCode,
				updatePromoCode,
				totalItems,
				loadedPages,
				promoCodesPageNumber,
				setPromoCodesPageNumber,
				fetchPromoCodes,
				fetchMorePromoCodes,
			}}>
			{props.children}
		</PromoCodesContext.Provider>
	);
};

export default PromoCodesContextProvider;
