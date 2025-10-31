
#include <iostream>

#include <vector>

inline std::vector<double> log_grid(double start, double end, int points) {
    std::vector<double> grid;
    grid.reserve(points);

    const double step_size = (end - start) / double(points - 1);

    for (int i = 0; i < points; ++i) {
	const double exponent = start + i * step_size;
	grid.push_back(pow(10.0, exponent));
    }
    return grid;
}
