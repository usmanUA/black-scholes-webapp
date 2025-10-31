/**
 * @file bs_call_price.hpp
 * @brief Compact Black–Scholes helpers + call price.
 *
 * Exposes:
 *  - Phi_real(z): standard normal CDF Φ(z).
 *  - phi(z):      standard normal PDF φ(z).
 *  - bs_price_call(S,K,r,q,σ,T): European call price (with continuous yield q).
 *
 * Intended as the minimal building block for Greeks.
 */

#include <iostream>
#include <complex>
#include <complex>
#include <type_traits>

// φ(z): standard normal PDF
inline double phi(double z) {
    // 1/sqrt(2π)    
    static constexpr double INV_SQRT_2PI = 0.39894228040143267794; 
    return INV_SQRT_2PI * std::exp(-0.5 * z * z);
}

// d1: what is d1?
template<class T>
inline T calculate_d1(T F, double K, double sigma, double Tmat, double sigmaT) {

    // NOTE: it fucking does not matter if K = 0.0 when F is complex?
    T ln_F_over_K;
    if constexpr (std::is_same_v<T, std::complex<double>>) {
	ln_F_over_K = std::log(F / K);
    } else {
	if (K > 0.0) {
	    const T x = (F - K) / K;
	    ln_F_over_K = (std::abs(x) <= 1e-12) ? std::log1p(x) : std::log(F / K);
	} else {
	    ln_F_over_K = std::log(F / K);
	}
    }

    return (ln_F_over_K + 0.5 * sigma * sigma * Tmat) / sigmaT;
}

// Φ(z): templated normal CDF
template<class T>
inline T Phi_real_t(T z) {
    static constexpr double INV_SQRT_2 = 0.70710678118654752440;
    if constexpr (std::is_same_v<T, std::complex<double>>) {
	const double zr = z.real();
	const double zi = z.imag();
	const double Phi_re = 0.5 * std::erfc(-zr * INV_SQRT_2);
	const double phi_re = phi(zr);
	return std::complex<double>(Phi_re, zi * phi_re);
    } else {
	return 0.5 * std::erfc(-z * INV_SQRT_2);
    }
}


// Black-Scholes call-price
template<class T>
inline T bs_price_call_t(T S, double K, double r, double q, double sigma, double Tmat) {
    const double DF     = std::exp(-r * Tmat);
    const T F      = S * std::exp((r - q) * Tmat);
    const double sigmaT = sigma * std::sqrt(std::max(Tmat, 0.0));
    if (sigmaT == 0.0) {
	if constexpr (std::is_same_v<T, std::complex<double>>) {
	    return DF * (F - K);
	} else {
	    return DF * std::max(F - K, 0.0);
	}
    }

    const T d1 = calculate_d1(F, K, sigma, Tmat, sigmaT);
    const T d2 = d1 - sigmaT;

    return DF * (F * Phi_real_t(d1) - K * Phi_real_t(d2));
}
