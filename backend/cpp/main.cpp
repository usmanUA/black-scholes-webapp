
#include "greeks.h"
#include "logarithmic_grid.h"
#include <cstdlib>
#include <fstream>
#include <ios>
#include <ostream>
#include <string>
#include <vector>


void calculate_write_derivatives(
    double S, double K, double r,
    double q, double sigma, double T,
    double h_rel, std::ostream& csv) {

    const double h = h_rel * S;


    const double delta_analytic = calculate_delta_analytic(S, K, r, q, sigma, T);
    const double delta_fd       = calculate_delta_fwd(S, K, r, q, sigma, T, h);
    const double delta_cs       = calculate_delta_cs(S, K, r, q, sigma, T, h);

    const double gamma_analytic = calculate_gamma_analytic(S, K, r, q, sigma, T);
    const double gamma_fd       = calculate_gamma_fwd(S, K, r, q, sigma, T, h);
    const double gamma_cs_real  = calculate_gamma_cs_real(S, K, r, q, sigma, T, h);
    const double gamma_cs_45    = calculate_gamma_cs_45(S, K, r, q, sigma, T, h);

    double err_D_fd      = std::abs(delta_fd - delta_analytic);
    double err_D_cs      = std::abs(delta_cs - delta_analytic);
    double err_G_fd      = std::abs(gamma_fd - gamma_analytic);
    double err_G_cs_real = std::abs(gamma_cs_real - gamma_analytic);
    double err_G_cs_45   = std::abs(gamma_cs_45 - gamma_analytic);

    csv << h_rel << ',' << h << ','
	<< delta_analytic << ',' << delta_fd << ',' << delta_cs << ','
	<< err_D_fd << ',' << err_D_cs << ',' << gamma_analytic << ','
	<< gamma_fd << ',' << gamma_cs_real << ',' << gamma_cs_45 << ','
	<< err_G_fd << ',' << err_G_cs_real << ',' << err_G_cs_45 << '\n';

    csv.flush();

}

int main(int argc, char** argv) {

    std::vector<double> grid = log_grid(-16.0, -4.0, 24);
    double S, K, r, q, sigma, T;
    if (argc > 1) {
	std::string scenario = argv[1];
	if (scenario == "1") {
	    S = 100.0, K = 100.0, r = 0.0, q = 0.0, sigma = 0.20, T = 1.0;
	} else if (scenario == "2") {
	    double S = 100.0, K = 100.0, r = 0.0, q = 0.0, sigma = 0.01, T = 1.0 / 365.0;
	}

	const std::string header =  "h_rel,h,Delta_analytic,Delta_fd,Delta_cs,err_D_fd,err_D_cs,Gamma_analytic,Gamma_fd,Gamma_cs_real,Gamma_cs_45,err_G_fd,err_G_cs_real,err_G_cs_45\n";

	// NOTE: Open CSV files for both scenarios
	std::ofstream csv("/app/data/bs_fd_vs_complex.csv");
	csv << header;
	csv.precision(12);
	csv << std::scientific;

	for (double h_rel : grid) {
	    calculate_write_derivatives(S, K, r, q, sigma, T, h_rel, csv);
	}

	csv.close();
    }
    return 0;
};
