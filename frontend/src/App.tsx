import { Routes, Route } from "react-router-dom";
import './App.css'
import Home from "./pages/home";
import Results from "./pages/results";

function App() {

	return (
		<Routes>
			<Route path="/" element={<Home />} />
			<Route path="/results" element={<Results />} />
		</Routes>
	);
}

export default App
