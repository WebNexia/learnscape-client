import './App.css';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Auth from './pages/Auth';

function App() {
	return (
		<>
			<Router>
				<Link to='/auth'>Signin</Link>
				<Routes>
					<Route path='/auth' element={<Auth />} />
				</Routes>
			</Router>
		</>
	);
}

export default App;
