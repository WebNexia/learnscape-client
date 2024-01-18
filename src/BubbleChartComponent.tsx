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
  Legend,
  ScriptableContext
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
ChartJS.register(ChartDataLabels);
interface CustomDataPoint {
    x: number;
    y: number;
    r: number;
    label: string;
}


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
                    { x: 20, y: 30, r: 25,label: 'Label 1' },
    
                    // ... other data points
                ] as CustomDataPoint[],
                backgroundColor: 'green',
                // ... other dataset properties
            },
            {
                label: 'Dataset 2',
                data: [
         
                    { x: 40, y: 10, r: 15,label: 'Label 2' },
                    // ... other data points
                ] as CustomDataPoint[],
                backgroundColor: 'blue',
                // ... other dataset properties
            },
            {
                label: 'Dataset 2',
                data: [
         
                    { x: 40, y: 50, r: 50,label: 'Label 3' },
                    // ... other data points
                ] as CustomDataPoint[],
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
        plugins: {
            datalabels: {
                color: '#000000',
                align:"end"  as const, // Correctly using one of the specific string literals
                anchor: "end"  as const,
                formatter: (value: any, context: any) => {
                    const dataPoint = context.chart.data.datasets[context.datasetIndex].data[context.dataIndex] as CustomDataPoint;
                    return dataPoint ? dataPoint.label : '';
                },
            },
        },
    };
    
    

    return <Bubble data={data} options={options} />;
};

export default BubbleChartComponent;
