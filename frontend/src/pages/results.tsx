import { useLocation, useNavigate } from "react-router-dom"


const Results = () => {
	const navigate = useNavigate();
	const location = useLocation();
	const { plots, scenario } = location.state;

	return (
		<div className="mix-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex flex-col items-center py-10">
			<h2 className="text-3xl font-bold text-gray-800 mb-8">Scenario {scenario} Results</h2>
			<div className="flex flex-col md:flex-row justify-center space-y-8 md:space-y-0 md:space-x-12">
				<div className='text-center'>
					<img
						src={`data:image/png;base64,${plots.delta}`}
						alt="Delta"
						className="w-[350px] mx-auto rounded-lg shadow-md border border-gray-200" />
					<p
						className="mt-3 text-gray-600 italic">
						Delta — measures how much the option price changes per 1-unit change in the underlying price
					</p>
				</div>
				<div className="text-center">
					<img src={`data:image /png;base64, ${plots.gamma}`} alt='Gamma' className="w-[400px]" />
					<p
						className="mt-3 text-gray-600 italic">
						Gamma - Second order curvature of price vs spot
					</p>
				</div>
			</div>
			<button
				onClick={() => navigate("/")}
				className='mt-10 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold shadow-md'
			>
				Back to Home
			</button>
		</div>
	);
}

export default Results;
