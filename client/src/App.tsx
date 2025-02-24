import { useState, useEffect, useMemo } from "react";
import { File } from "./interfaces/file";

const App = () => {
  const currentYear = new Date().getFullYear();
  const [files, setFiles] = useState<File[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);

  useEffect(() => {
    async function fetchFiles() {
      try {
        const response = await fetch("http://localhost:8000/all-files");
        const data: File[] = await response.json();
        setFiles(data);
      } catch (error) {
        console.error("Error loading files:", error);
      }
    }
    fetchFiles();
  }, []);

  const filtered = useMemo(() => {
    if (!selectedYear) return files;

    return [...files].filter((file) => {
      const timestamp = Number(file.metadata?.photoTakenTime.timestamp);
      if (!timestamp) return false;
      const year = new Date(timestamp * 1000).getFullYear();
      return year === selectedYear;
    });
  }, [files, selectedYear]);

  const sortedByDate = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const aTimestamp = a.metadata?.photoTakenTime?.timestamp
        ? Number(a.metadata.photoTakenTime.timestamp)
        : null;
      const bTimestamp = b.metadata?.photoTakenTime?.timestamp
        ? Number(b.metadata.photoTakenTime.timestamp)
        : null;

      if (aTimestamp !== null && bTimestamp !== null) {
        return aTimestamp - bTimestamp;
      }
      if (aTimestamp !== null) return -1;
      if (bTimestamp !== null) return 1;
      return 0;
    });
  }, [filtered]);

  const years = useMemo(() => {
    return Array.from({ length: 11 }, (_, index) => currentYear - index);
  }, [currentYear]);

  return (
    <div>
      <h1>Bruno's Gallery</h1>

      <label>
        Year{" "}
        <select
          onChange={(e) => setSelectedYear(Number(e.target.value))}
          defaultValue=""
        >
          <option value="">All Years</option>
          {years.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </label>

      <div>
        {sortedByDate.map((data, idx) => (
          <img
            key={`${data} ${idx}`}
            src={data.fetch}
            alt={data.name}
            title={
              (data.metadata?.photoTakenTime.formatted || data.path) +
              " " +
              data.name
            }
            width={200}
            style={{ margin: "1rem", height: "auto", width: "16rem" }}
          />
        ))}
      </div>
    </div>
  );
};

export default App;
