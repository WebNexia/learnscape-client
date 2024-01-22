import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Auth from './pages/Auth';
import HomePage from './pages/HomePage';
import { ThemeProvider } from '@mui/material/styles';
import theme from './themes';
import Dashboard from './pages/Dashboard';
import { QueryClient, QueryClientProvider } from 'react-query';
import Courses from './pages/Courses';
import Schedule from './pages/Schedule';
import Messages from './pages/Messages';
import Community from './pages/Community';
import Settings from './pages/Settings';

const queryClient = new QueryClient();

function App() {
	return (
		<QueryClientProvider client={queryClient}>
			<ThemeProvider theme={theme}>
				<Router>
					<Routes>
						<Route path='' element={<HomePage />} />
						<Route path='/auth' element={<Auth />} />
						<Route path='/dashboard/user/:id' element={<Dashboard />} />
						<Route path='/courses/user/:id' element={<Courses />} />
						<Route path='/schedule/user/:id' element={<Schedule />} />
						<Route path='/messages/user/:id' element={<Messages />} />
						<Route path='/community/user/:id' element={<Community />} />
						<Route path='/settings/user/:id' element={<Settings />} />
					</Routes>
				</Router>
			</ThemeProvider>
		</QueryClientProvider>
	);
}

export default App;
