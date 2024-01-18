import React from 'react';
import { Bubble } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  BubbleController,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend
} from 'chart.js';

// Register the components
ChartJS.register(
  BubbleController,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend
);

// ... your BubbleChartComponent and other code


const BubbleChartComponent: React.FC = () => {
    const data = {
        datasets: [
            {
                label: 'My First Dataset',
                data: [
                    { x: 20, y: 30, r: 50 },
                    { x: 25, y: 10, r: 30 },
                    // ... more data points
                ],
                backgroundColor: [
                    'rgba(255, 99, 132)',
                    'rgba(54, 162, 235)',
                    // ... more colors for each data point
                ],
                borderColor: [
                    'rgba(255, 99, 132)',
                    'rgba(54, 162, 235)',
                    // ... more border colors for each data point
                ],
                borderWidth: 1,
            },
            // ... more datasets if needed
        ],
    };
    

    const options = {
        scales: {
            x: {
                type: 'linear' as const,
                position: 'bottom' as const, // Explicitly setting as 'bottom'
                beginAtZero: true, 
                max: 100,
            },
            y: {
                type: 'linear' as const,
                position: 'left' as const, // Explicitly setting as 'left'
                beginAtZero: true, 
                max: 100,
            },
        },
    };
    
    

    return <Bubble data={data} options={options} />;
};

export default BubbleChartComponent;
