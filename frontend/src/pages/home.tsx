import { useState } from 'react'
import { useNavigate } from 'react-router-dom';

const API = import.meta.env.VITE_API_URL || "http://localhost:8080";

const Home = () => {
	const [loading, setLoading] = useState(false);
	const navigate = useNavigate();

	async function runScenario(scenario: string) {
		try {
			console.log("THE API: ", API);
			setLoading(true);
			const response = await fetch(`${API}/api/run?scenario=${scenario}`);
			if (!response.ok) throw new Error("Failed to run the computation");
			const data = await response.json();
			setLoading(false);
			navigate("/results", { state: { plots: data, scenario } });
		} catch (error) {
			setLoading(false);
			alert("Something went wrong, please try again");
		}
	};

	return (
		<div className='min-h-screen bg-gradient-to-b from-red-50 to-blue-100 flex flex-col items-center py-12 px-6 text-gray-800'>
			<h1 className="text-4xl font-extrabold text-orange-700 mb-8 drop-shadow-sm">Black-Scholes Greeks Visualizer
			</h1>
			<div className='max-2-3xl text-center leading-relaxed text-lg mb-10'>
				<p className='mb-4'>
					The <span className='font-semibold text-gray-700'>Black-Scholes model</span> is a cornerstone of modern option pricing. It expresses the theoretical price of European options as a function of several key parameters.
				</p>
				<p className="mb-4">
					In this app, we validate three methods of computing sensitivities (Greeks) of the call price:
				</p>
				<ul className="text-left mx-auto mb-6 list-disc list-inside">
					<li><strong>Analytic:</strong> Closed-form sulution using model equations</li>
					<li><strong>Finite Difference (FD):</strong> Numerical derivative through small perturbation</li>
					<li><strong>Complex Step (CS):</strong> Highly accurate derivative using complex arithmetic.</li>
				</ul>

				<h2 className='text-xl font-semibold mt-8 mb-2 text-orange-700'>Validation Scenarios</h2>
				<div className='text-left bg-white p-6 rounded-xl shadow-lg'>
					<p className='font-semibold'>Scenario 1 - ATM Reference:</p>
					<p className='text-gray-700'>S = 100, K = 100, r = q = 0, σ = 0.20, T = 1</p>

					<p className='mt-4 font-semibold'>Scenario 2 - Near-expiry, Low-volume, ATM:</p>
					<p className='text-gray-700'>S = 100, K = 100, r = q = 0, σ = 0.01, T = 1/365</p>
				</div>
				<p className='mt-8 text-gray-700 font-medium'>
					You can run the two scenarios with the buttons below:
				</p>
			</div>
			<div className='space-x-6 mt-4'>
				<button onClick={() => runScenario("1")} className='bg-blue-600 hover:bg-blue-700 transition text-white px-6 py-3 rounded-lg font-semibold shadow-md'>
					Run Scenario 1
				</button>
				<button onClick={() => runScenario("2")} className='bg-green-600 hover:bg-green-700 transition text-white px-6 py-3 rounded-lg font-semibold shadow-md'>
					Run Scenario 2
				</button>
			</div>
			{loading && <p className='mt-6 text-gray-500'> Running simulation...</p>}
		</div >
	);
};

export default Home;
