
#include <cmath>
#include <complex>
#include <cstdlib>
#include "bs_call_price_t.h"

inline double calculate_delta_analytic(double S, double K, double r, double q, double sigma, double T) {
    const double sigmaT = sigma * std::sqrt(std::max(T, 0.0));
    const double F      = S * std::exp((r - q) * T);
    const double d1 = calculate_d1(F, K, sigma, T, sigmaT);
    return std::exp(-q * T) * Phi_real_t(d1);
}

inline double calculate_delta_fwd(
    double S, double K,
    double r, double q, 
    double sigma,
    double T, double h) {
    const double C_0 = bs_price_call_t<double>(S, K, r, q, sigma, T);
    const double C_1 = bs_price_call_t<double>(S + h, K, r, q, sigma, T);
    return (C_1 - C_0) / h;
}

inline double calculate_delta_cs(
   double S, double K,
   double r, double q, double sigma,
   double T, double h) {
    std::complex<double> S_c(S, h);
    std::complex<double> C = bs_price_call_t<std::complex<double>>(S_c, K, r, q, sigma, T);
    return C.imag() / h;
}

inline double calculate_gamma_analytic(double S, double K, double r, double q, double sigma, double T) {
    const double sigmaT = sigma * std::sqrt(std::max(T, 0.0));
    const double F      = S * std::exp((r - q) * T);
    const double d1 = calculate_d1<double>(F, K, sigma, T, sigmaT);
    return std::exp(-q * T) * (phi(d1) / (S * sigmaT));
}

inline double calculate_gamma_fwd(
    double S, double K,
    double r, double q, 
    double sigma,
    double T, double h) {
    const double C_0 = bs_price_call_t<double>(S, K, r, q, sigma, T);
    const double C_1 = bs_price_call_t<double>(S + h, K, r, q, sigma, T);
    const double C_2 = bs_price_call_t<double>(S + 2.0 * h, K, r, q, sigma, T);
    return (C_2 - 2.0 * C_1 + C_0) / (h * h);
}

inline double calculate_gamma_cs_real(
   double S, double K,
   double r, double q,
   double sigma,
   double T, double h) {
    std::complex<double> S_c(S, h);
    std::complex<double> C_c = bs_price_call_t<std::complex<double>>(S_c, K, r, q, sigma, T);
    double C                 = bs_price_call_t<double>(S, K, r, q, sigma, T);

    return -2.0 * (C_c.real() - C) / (h * h);
}

inline double calculate_gamma_cs_45(
   double S, double K, 
   double r, double q,
   double sigma, double T,
   double h) {
    
    std::complex<double> omega(1.0/std::sqrt(2.0), 1.0/std::sqrt(2.0));

    std::complex<double> S_plus  = std::complex<double>(S, 0.0) + h * omega;
    std::complex<double> S_minus = std::complex<double>(S, 0.0) - h * omega;

    std::complex<double> C_plus  = bs_price_call_t<std::complex<double>>(S_plus, K, r, q, sigma, T);
    std::complex<double> C_minus = bs_price_call_t<std::complex<double>>(S_minus, K, r, q, sigma, T);

    return (C_plus.imag() + C_minus.imag()) / (h * h);
}
