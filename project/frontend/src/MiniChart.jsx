import { Line } from "react-chartjs-2";
import {
  Chart,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Filler,
} from "chart.js";

Chart.register(LineElement, PointElement, LinearScale, CategoryScale, Filler);

export default function MiniChart({ data = [], currentIndex = 0 }) {
  // Return an empty placeholder if the data array is invalid or empty to prevent crash
  if (!Array.isArray(data) || data.length === 0) {
    return <div style={{ height: 70 }}></div>;
  }

  // Ensure the currentIndex stays within the valid bounds of the data array
  const safeIndex = Math.min(
    Math.max(currentIndex, 0),
    data.length - 1
  );

  // Window size that chart show month
  const windowSize = 24;

  // Slice the data to include window size only up to the current index
  const startIndex = Math.max(0, safeIndex - windowSize + 1);
  const slicedData = data.slice(startIndex, safeIndex + 1);

  // Extract separate arrays for X-axis labels (months) and Y-axis values (prices)
  const labels = slicedData.map((d) => d.month || "");
  const values = slicedData.map((d) => d.close || 0);

  // Calculate the minimum and maximum values to dynamically scale the Y-axis
  const min = Math.min(...values);
  const max = Math.max(...values);

  const riseColor = "#54FF5A";
  const fallColor = "#FF4D4D";

  // Determine the trend direction based on the latest available change value
  const lastChange = slicedData[slicedData.length - 1]?.change ?? 0;

  const borderColor = lastChange >= 0 ? riseColor : fallColor;
  const fillColor =
    lastChange >= 0
      ? "rgba(84,255,90,0.50)"  
      : "rgba(255,77,77,0.50)"; 

  // Configure the dataset structure required by the Chart.js Line component
  const chartData = {
    labels,
    datasets: [
      {
        data: values,
        borderColor: borderColor, 
        backgroundColor: fillColor,
        borderWidth: 2,
        tension: 0.35,             
        pointRadius: 0,             
        fill: true,
      },
    ],
  };

  // Configure chart options to hide axes and legends for a minimal look
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { display: false },
      y: { display: false, min, max },
    },
    animation: { duration: 300 },
  };

  return (
    <div style={{ width: "100%", height: "75px" }}>
      <Line data={chartData} options={options} />
    </div>
  );
}