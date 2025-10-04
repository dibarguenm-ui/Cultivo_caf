// frontend/src/modules/clima/GraficoTemperatura.js
import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const GraficoTemperatura = ({ datos }) => {
  // Datos de ejemplo - en producción vendrían del API
  const data = {
    labels: ['6:00', '9:00', '12:00', '15:00', '18:00', '21:00'],
    datasets: [
      {
        label: 'Temperatura (°C)',
        data: [22, 28, 32, 34, 30, 26],
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: false,
        min: 20,
        max: 40,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          callback: function(value) {
            return value + '°C';
          }
        }
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  };

  return (
    <div style={{ height: '250px', marginTop: '15px' }}>
      <Line data={data} options={options} />
    </div>
  );
};

export default GraficoTemperatura;