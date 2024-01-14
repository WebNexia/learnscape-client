import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Auth from './pages/Auth';

function App() {
	return (
		<>
			<Router>
				<Routes>
					<Route path='/auth' element={<Auth />} />
				</Routes>
			</Router>
		</>
	);
}

export default App;
