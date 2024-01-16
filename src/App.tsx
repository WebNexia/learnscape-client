import './App.css';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Auth from './pages/Auth';
import HomePage from './pages/HomePage';
import { ThemeProvider } from '@mui/material/styles';
import theme from './themes';
import Dashboard from './pages/Dashboard';
import { Box } from '@mui/material';

function App() {
	return (
		<ThemeProvider theme={theme}>
			<Router>
				<Routes>
					<Route path='' element={<HomePage />} />
					<Route path='/auth' element={<Auth />} />
					<Route path='user/:id' element={<Dashboard />} />
				</Routes>
			</Router>
		</ThemeProvider>
	);
}

export default App;
