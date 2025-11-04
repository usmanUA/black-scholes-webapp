import numpy as np
import matplotlib.pyplot as plt

def read_csv_simple(filename):
    """Read CSV without pandas"""
    data = {}
    with open(filename, 'r') as f:
        header = f.readline().strip().split(',')
        for col in header:
            data[col] = []
        
        for line in f:
            values = line.strip().split(',')
            for i, val in enumerate(values):
                try:
                    # Handle complex numbers in parentheses
                    if '(' in val:
                        val = val.split(',')[0].replace('(', '')
                    data[header[i]].append(float(val))
                except:
                    data[header[i]].append(np.nan)
    
    # Convert to numpy arrays
    for key in data:
        data[key] = np.array(data[key])
    
    return data

def analyze_and_plot(filename):
    data = read_csv_simple(filename)
    
    # Plot Delta errors
    plt.figure(figsize=(8, 5))
    
    # Filter finite values for each series independently
    mask_fd = np.isfinite(data['err_D_fd']) & np.isfinite(data['h_rel'])
    mask_cs = np.isfinite(data['err_D_cs']) & np.isfinite(data['h_rel'])
    
    if np.any(mask_fd):
        plt.loglog(data['h_rel'][mask_fd], data['err_D_fd'][mask_fd], 
                   'o-', label='Δ FD', markersize=5, linewidth=1.5)
    if np.any(mask_cs):
        plt.loglog(data['h_rel'][mask_cs], data['err_D_cs'][mask_cs], 
                   's-', label='Δ CS', markersize=5, linewidth=1.5)
    
    plt.xlabel('Relative step size (h_rel)', fontsize=11)
    plt.ylabel('Absolute error', fontsize=11)
    plt.title('Scenario 1: Delta Error vs Step Size', fontsize=12, fontweight='bold')
    plt.legend(fontsize=10)
    plt.grid(True, which='both', alpha=0.3, linestyle='--')
    plt.tight_layout()
    plt.savefig(f'/app/data/delta_plot.png', dpi=200, bbox_inches='tight')
    plt.close()
    print(f"✓ Saved /app/data/delta_plot.png")
    
    # Plot Gamma errors
    plt.figure(figsize=(8, 5))
    
    mask_fd = np.isfinite(data['err_G_fd']) & np.isfinite(data['h_rel'])
    mask_real = np.isfinite(data['err_G_cs_real']) & np.isfinite(data['h_rel'])
    mask_45 = np.isfinite(data['err_G_cs_45']) & np.isfinite(data['h_rel'])
    
    if np.any(mask_fd):
        plt.loglog(data['h_rel'][mask_fd], data['err_G_fd'][mask_fd], 
                   'o-', label='Γ FD', markersize=5, linewidth=1.5)
    if np.any(mask_real):
        plt.loglog(data['h_rel'][mask_real], data['err_G_cs_real'][mask_real], 
                   's-', label='Γ CS-real', markersize=5, linewidth=1.5)
    if np.any(mask_45):
        plt.loglog(data['h_rel'][mask_45], data['err_G_cs_45'][mask_45], 
                   '^-', label='Γ CS-45°', markersize=5, linewidth=1.5)
    
    plt.xlabel('Relative step size (h_rel)', fontsize=11)
    plt.ylabel('Absolute error', fontsize=11)
    plt.title('Scenario 2: Gamma Error vs Step Size', fontsize=12, fontweight='bold')
    plt.legend(fontsize=10)
    plt.grid(True, which='both', alpha=0.3, linestyle='--')
    plt.tight_layout()
    plt.savefig(f'/app/data/gamma_plot.png', dpi=200, bbox_inches='tight')
    plt.close()
    print(f"✓ Saved /app/data/gamma_plot.png")
    
    # Print summary statistics
    print(f"\n{'='*60}")
    print("Scenario 1 Error Summary")
    print(f"{'='*60}")
    
    errors = {
        'Δ FD': data['err_D_fd'],
        'Δ CS': data['err_D_cs'],
        'Γ FD': data['err_G_fd'],
        'Γ CS-real': data['err_G_cs_real'],
        'Γ CS-45°': data['err_G_cs_45']
    }
    
    print(f"\n{'Method':<15} {'Min':<15} {'Median':<15} {'Max':<15}")
    print('-' * 60)
    for name, err in errors.items():
        finite_err = err[np.isfinite(err)]
        if len(finite_err) > 0:
            print(f"{name:<15} {np.min(finite_err):<15.2e} {np.median(finite_err):<15.2e} {np.max(finite_err):<15.2e}")
        else:
            print(f"{name:<15} {'N/A':<15} {'N/A':<15} {'N/A':<15}")
    print()

# Run both scenarios
try:
    analyze_and_plot('/app/data/bs_fd_vs_complex.csv')
    print("\n✓ All plots generated successfully!")
except FileNotFoundError as e:
    print(f"Error: Could not find CSV file - {e}")
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
