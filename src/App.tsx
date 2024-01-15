import './App.css';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Auth from './pages/Auth';
import { Box } from '@mui/material';

function App() {
	return (
		<>
			<Router>
				<Routes>
				    <Route path='/' element={<Box><Link to='/auth'>Signin</Link></Box>} />
					<Route path='/auth' element={<Auth />} />
				</Routes>
			</Router>
		</>
	);
}

export default App;
