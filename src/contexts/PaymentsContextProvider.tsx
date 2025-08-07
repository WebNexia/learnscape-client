import axios from '@utils/axiosInstance';
import { ReactNode, createContext, useContext, useState } from 'react';
import { useQuery } from 'react-query';
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
	fetchPayments: (page: number) => void;
	fetchMorePayments: (startBatch: number, endBatch: number) => void;
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
	fetchPayments: () => {},
	fetchMorePayments: () => {},
	totalPaymentAmountGBP: 0,
	totalNumberOfPayments: 0,
});

const PaymentsContextProvider = (props: PaymentsContextProviderProps) => {
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

	const [payments, setPayments] = useState<Payment[]>([]);
	const [totalItems, setTotalItems] = useState<number>(0);
	const [loadedPages, setLoadedPages] = useState<number[]>([]);
	const [paymentsPageNumber, setPaymentsPageNumber] = useState<number>(1);
	const [totalPaymentAmountGBP, setTotalPaymentAmountGBP] = useState<number>(0);
	const [totalNumberOfPayments, setTotalNumberOfPayments] = useState<number>(0);

	const [isLoaded, setIsLoaded] = useState<boolean>(false);

	const fetchPayments = async (page: number = 1) => {
		if (!orgId) return;

		setIsLoaded(false);

		try {
			const response = await axios.get(`${base_url}/payments/organisation/${orgId}?page=${page}&limit=200`);

			if (page === 1) {
				// First page - replace all data
				setPayments(response.data.data);
				setLoadedPages([1]);
			} else {
				// Subsequent pages - append data
				setPayments((prev) => [...prev, ...response.data.data]);
				setLoadedPages((prev) => [...prev, page]);
			}

			setTotalItems(response.data.totalItems || response.data.data.length);
			setTotalPaymentAmountGBP(response.data.totalAmountReceivedInGbp);
			setTotalNumberOfPayments(response.data.totalCount);
			setIsLoaded(true);
			return response.data.data;
		} catch (error) {
			setIsLoaded(true);
			throw error;
		}
	};

	const fetchMorePayments = async (startBatch: number, endBatch: number) => {
		if (!orgId) return;

		try {
			const promises = [];
			for (let page = startBatch; page <= endBatch; page++) {
				promises.push(axios.get(`${base_url}/payments/organisation/${orgId}?page=${page}&limit=200`));
			}

			const responses = await Promise.all(promises);
			const allData = responses.flatMap((response) => response.data.data);

			setPayments((prev) => [...prev, ...allData]);
			setLoadedPages((prev) => [...prev, ...Array.from({ length: endBatch - startBatch + 1 }, (_, i) => startBatch + i)]);
		} catch (error) {
			console.error('Error fetching more payments:', error);
			throw error;
		}
	};

	const { isLoading, isError } = useQuery(['allPayments', orgId, paymentsPageNumber], () => fetchPayments(paymentsPageNumber), {
		enabled: !!orgId && isAuthenticated && isAdmin && !isLoaded && !isLandingPageRoute,
	});

	// Function to handle sorting
	const sortPaymentsData = (property: keyof Payment, order: 'asc' | 'desc') => {
		const sortedPaymentsDataCopy = [...payments].sort((a: Payment, b: Payment) => {
			if (order === 'asc') {
				return a[property]! > b[property]! ? 1 : -1;
			} else {
				return a[property]! < b[property]! ? 1 : -1;
			}
		});
		setPayments(sortedPaymentsDataCopy);
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
				payments,
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
