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
                label: 'Dataset 1',
                data: [
                    { x: 20, y: 30, r: 25 },
    
                    // ... other data points
                ],
                backgroundColor: 'green',
                // ... other dataset properties
            },
            {
                label: 'Dataset 2',
                data: [
         
                    { x: 40, y: 10, r: 15 },
                    // ... other data points
                ],
                backgroundColor: 'blue',
                // ... other dataset properties
            },
            {
                label: 'Dataset 2',
                data: [
         
                    { x: 40, y: 50, r: 50 },
                    // ... other data points
                ],
                backgroundColor: 'pink',
                // ... other dataset properties
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
