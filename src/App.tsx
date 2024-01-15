import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Auth from './pages/Auth';
import HomePage from './pages/HomePage';

function App() {
	return (
		<>
			<Router>
				<Routes>
					<Route path='' element={<HomePage />} />
					<Route path='/auth' element={<Auth />} />
				</Routes>
			</Router>
		</>
	);
}

export default App;
