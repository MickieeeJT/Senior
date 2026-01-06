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
  if (!Array.isArray(data) || data.length === 0) {
    return <div style={{ height: 35 }}></div>;
  }

  const safeIndex = Math.min(
    Math.max(currentIndex, 0),
    data.length - 1
  );

  // Window size that chart show month
  const windowSize = 24;

  const startIndex = Math.max(0, safeIndex - windowSize + 1);
  const slicedData = data.slice(startIndex, safeIndex + 1);

  const labels = slicedData.map((d) => d.month || "");
  const values = slicedData.map((d) => d.close || 0);

  const min = Math.min(...values);
  const max = Math.max(...values);

  const riseColor = "#54FF5A";
  const fallColor = "#FF4D4D";

  const lastChange = slicedData[slicedData.length - 1]?.change ?? 0;

  const borderColor = lastChange >= 0 ? riseColor : fallColor;
  const fillColor =
    lastChange >= 0
      ? "rgba(84,255,90,0.50)"  
      : "rgba(255,77,77,0.50)"; 

  const chartData = {
    labels,
    datasets: [
      {
        data: values,
        borderColor: borderColor, 
        backgroundColor: fillColor,
        borderWidth: 1.5,
        tension: 0.35,             
        pointRadius: 0,             
        fill: true,
      },
    ],
  };

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
    <div style={{ width: "100%", height: "100%" }}>
      <Line data={chartData} options={options} />
    </div>
  );
}