import { useState, useEffect } from "react";

const App = () => {
  const [images, setImages] = useState<string[]>([]);

  useEffect(() => {
    fetch("http://localhost:8000/images")
      .then((response) => response.json())
      .then((data: string[]) => setImages(data))
      .catch((error) => console.error("Error loading images:", error));
  }, []);

  return (
    <div>
      <h1>Bruno's Gallery</h1>
      <div>
        {images.map((image, idx) => (
          <img
            key={`${image} ${idx}`}
            src={`http://localhost:8000/image/${image}`}
            alt={image}
            width={200}
            style={{ margin: "1rem", height: "auto", width: "16rem" }}
          />
        ))}
      </div>
    </div>
  );
};

export default App;
