import axios from 'axios';
import { ReactNode, createContext, useContext, useState } from 'react';
import { useQuery } from 'react-query';
import Loading from '../components/layouts/loading/Loading';
import LoadingError from '../components/layouts/loading/LoadingError';
import { OrganisationContext } from './OrganisationContextProvider';
import { Payment } from '../interfaces/payment';

interface PaymentsContextTypes {
	sortedPaymentsData: Payment[];
	sortPaymentsData: (property: keyof Payment, order: 'asc' | 'desc') => void;
	numberOfPages: number;
	paymentsPageNumber: number;
	setPaymentsPageNumber: React.Dispatch<React.SetStateAction<number>>;
	fetchPayments: (page: number) => void;
}

interface PaymentsContextProviderProps {
	children: ReactNode;
}

export const PaymentsContext = createContext<PaymentsContextTypes>({
	sortedPaymentsData: [],
	sortPaymentsData: () => {},
	numberOfPages: 1,
	paymentsPageNumber: 1,
	setPaymentsPageNumber: () => {},
	fetchPayments: () => {},
});

const PaymentsContextProvider = (props: PaymentsContextProviderProps) => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const { orgId } = useContext(OrganisationContext);

	const [sortedPaymentsData, setSortedPaymentsData] = useState<Payment[]>([]);
	const [numberOfPages, setNumberOfPages] = useState<number>(1);
	const [paymentsPageNumber, setPaymentsPageNumber] = useState<number>(1);

	const [isLoaded, setIsLoaded] = useState<boolean>(false);

	const fetchPayments = async (page: number) => {
		if (!orgId) return;

		try {
			const response = await axios.get(`${base_url}/payments/organisation/${orgId}?page=${page}&limit=100`);

			// Initial sorting when fetching data
			const sortedPaymentsDataCopy = [...response.data.data].sort((a: Payment, b: Payment) => b.updatedAt.localeCompare(a.updatedAt));
			setSortedPaymentsData(sortedPaymentsDataCopy);
			setNumberOfPages(response.data.pages);
			setIsLoaded(true);
			return response.data.data;
		} catch (error) {
			setIsLoaded(true); // Set isLoading to false in case of an error
			throw error; // Rethrow the error to be handled by React Query
		}
	};

	const { data, isLoading, isError } = useQuery(['allPayments', orgId, paymentsPageNumber], () => fetchPayments(paymentsPageNumber), {
		enabled: !!orgId && !isLoaded,
	});

	// Function to handle sorting
	const sortPaymentsData = (property: keyof Payment, order: 'asc' | 'desc') => {
		const sortedPaymentsDataCopy = [...sortedPaymentsData].sort((a: Payment, b: Payment) => {
			if (order === 'asc') {
				return a[property]! > b[property]! ? 1 : -1;
			} else {
				return a[property]! < b[property]! ? 1 : -1;
			}
		});
		setSortedPaymentsData(sortedPaymentsDataCopy);
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
				sortedPaymentsData,
				sortPaymentsData,
				numberOfPages,
				paymentsPageNumber,
				setPaymentsPageNumber,
				fetchPayments,
			}}>
			{props.children}
		</PaymentsContext.Provider>
	);
};

export default PaymentsContextProvider;
