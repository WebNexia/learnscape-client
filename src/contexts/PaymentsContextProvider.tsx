import axios from '@utils/axiosInstance';
import { ReactNode, createContext, useContext, useState, useEffect } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import Loading from '../components/layouts/loading/Loading';
import LoadingError from '../components/layouts/loading/LoadingError';
import { OrganisationContext } from './OrganisationContextProvider';
import { Payment } from '../interfaces/payment';
import { useAuth } from '../hooks/useAuth';
import { useLocation } from 'react-router-dom';

interface PaymentsContextTypes {
	payments: Payment[];
	sortPaymentsData: (property: keyof Payment, order: 'asc' | 'desc') => void;
	totalItems: number;
	loadedPages: number[];
	paymentsPageNumber: number;
	setPaymentsPageNumber: React.Dispatch<React.SetStateAction<number>>;
	fetchPayments: (page: number) => Promise<{ data: Payment[]; totalItems: number; totalAmountReceivedInGbp: number; totalCount: number }>;
	fetchMorePayments: (startBatch: number, endBatch: number) => Promise<void>;
	totalPaymentAmountGBP: number;
	totalNumberOfPayments: number;
}

interface PaymentsContextProviderProps {
	children: ReactNode;
}

export const PaymentsContext = createContext<PaymentsContextTypes>({
	payments: [],
	sortPaymentsData: () => {},
	totalItems: 0,
	loadedPages: [],
	paymentsPageNumber: 1,
	setPaymentsPageNumber: () => {},
	fetchPayments: () => Promise.resolve({ data: [], totalItems: 0, totalAmountReceivedInGbp: 0, totalCount: 0 }),
	fetchMorePayments: () => Promise.resolve(),
	totalPaymentAmountGBP: 0,
	totalNumberOfPayments: 0,
});

const PaymentsContextProvider = (props: PaymentsContextProviderProps) => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const { orgId } = useContext(OrganisationContext);
	const { isAuthenticated, isAdmin } = useAuth();
	const location = useLocation();
	const queryClient = useQueryClient();
	const isLandingPageRoute =
		location.pathname === '/' ||
		location.pathname === '/landing-page-courses' ||
		location.pathname === '/resources' ||
		location.pathname === '/contact-us' ||
		location.pathname === '/about-us' ||
		location.pathname === '/auth' ||
		// Only consider course preview pages as landing pages, not enrolled course pages
		(location.pathname.startsWith('/course/') && !location.pathname.includes('/userCourseId/'));

	const [paymentsPageNumber, setPaymentsPageNumber] = useState<number>(1);
	const [loadedPages, setLoadedPages] = useState<number[]>([]);
	const [totalItems, setTotalItems] = useState<number>(0);
	const [totalPaymentAmountGBP, setTotalPaymentAmountGBP] = useState<number>(0);
	const [totalNumberOfPayments, setTotalNumberOfPayments] = useState<number>(0);

	const fetchPayments = async (
		page: number = 1
	): Promise<{ data: Payment[]; totalItems: number; totalAmountReceivedInGbp: number; totalCount: number }> => {
		if (!orgId) return { data: [], totalItems: 0, totalAmountReceivedInGbp: 0, totalCount: 0 };

		try {
			const response = await axios.get(`${base_url}/payments/organisation/${orgId}?page=${page}&limit=200`);
			return {
				data: response.data.data,
				totalItems: response.data.totalItems || response.data.data.length,
				totalAmountReceivedInGbp: response.data.totalAmountReceivedInGbp || 0,
				totalCount: response.data.totalCount || response.data.data.length,
			};
		} catch (error) {
			console.error('Error fetching payments:', error);
			throw error;
		}
	};

	const fetchMorePayments = async (startBatch: number, endBatch: number): Promise<void> => {
		if (!orgId) return;

		try {
			const promises = [];
			for (let page = startBatch; page <= endBatch; page++) {
				promises.push(axios.get(`${base_url}/payments/organisation/${orgId}?page=${page}&limit=200`));
			}

			const responses = await Promise.all(promises);
			const allData = responses.flatMap((response) => response.data.data);

			// Update React Query cache with new data
			const currentData = (queryClient.getQueryData(['allPayments', orgId]) as Payment[]) || [];
			queryClient.setQueryData(['allPayments', orgId], [...currentData, ...allData]);

			// Update loadedPages to track which pages we've fetched
			const newLoadedPages = Array.from({ length: endBatch - startBatch + 1 }, (_, i) => startBatch + i);
			setLoadedPages((prev) => [...prev, ...newLoadedPages]);
		} catch (error) {
			console.error('Error fetching more payments:', error);
			throw error;
		}
	};

	const {
		data: paymentsResponse,
		isLoading,
		isError,
	} = useQuery(['allPayments', orgId], () => fetchPayments(1), {
		enabled: !!orgId && isAuthenticated && isAdmin && !isLandingPageRoute,
		staleTime: 5 * 60 * 1000, // 5 minutes - data stays fresh
		cacheTime: 30 * 60 * 1000, // 30 minutes - data stays in cache
		refetchOnWindowFocus: false, // No refetch on window focus
		refetchOnMount: false, // No refetch on component remount
	});

	// Extract payments data from response
	const paymentsData = paymentsResponse?.data || [];

	// Update state when data changes (same pattern as other contexts)
	useEffect(() => {
		if (paymentsResponse) {
			setTotalItems(paymentsResponse.totalItems);
			setTotalPaymentAmountGBP(paymentsResponse.totalAmountReceivedInGbp);
			setTotalNumberOfPayments(paymentsResponse.totalCount);
			setLoadedPages([1]); // First page is loaded
		}
	}, [paymentsResponse]);

	// Function to handle sorting
	const sortPaymentsData = (property: keyof Payment, order: 'asc' | 'desc') => {
		// React Query data'yı sort et, local state'e set etme
		const sortedPaymentsDataCopy = [...(paymentsData || [])].sort((a: Payment, b: Payment) => {
			if (order === 'asc') {
				return a[property]! > b[property]! ? 1 : -1;
			} else {
				return a[property]! < b[property]! ? 1 : -1;
			}
		});
		// Local state'e set etme, sadece sort edilmiş data'yı return et
		return sortedPaymentsDataCopy;
	};

	if (isLoading) {
		return <Loading />;
	}

	if (isError) {
		return <LoadingError />;
	}

	return (
		<PaymentsContext.Provider
			value={{
				payments: paymentsData || [],
				sortPaymentsData,
				totalItems,
				loadedPages,
				paymentsPageNumber,
				setPaymentsPageNumber,
				fetchPayments,
				fetchMorePayments,
				totalPaymentAmountGBP,
				totalNumberOfPayments,
			}}>
			{props.children}
		</PaymentsContext.Provider>
	);
};

export default PaymentsContextProvider;
