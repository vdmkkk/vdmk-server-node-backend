#!/bin/bash

# Function to get CPU usage
get_cpu_usage() {
    # Print CPU usage using mpstat from sysstat package
    mpstat 1 1 | awk '/Average/ {print prev} {prev=$0}'
}

# Function to get GPU usage (NVIDIA GPUs only)
get_gpu_usage() {
    if command -v nvidia-smi &> /dev/null; then
        echo "GPU Usage (NVIDIA):"
        nvidia-smi --query-gpu=utilization.gpu,utilization.memory --format=csv,noheader
    else
        echo "No NVIDIA GPU detected or nvidia-smi not installed."
    fi
}

# Function to get RAM usage
get_ram_usage() {
    free -h | awk '/Mem:/ {print $3 "/" $2}'
}

# Function to get network usage
get_network_usage() {
    vnstat --oneline | cut -d ';' -f 11
}

# Display the system information
display_system_info() {
    get_cpu_usage
    get_ram_usage
    get_network_usage
}

# Run the system monitor
display_system_info
