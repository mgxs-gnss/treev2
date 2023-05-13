import React, { useEffect, useState, useRef } from 'react';
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

const ZoomPanComponent = () => {
  const [jpgFiles, setJpgFiles] = useState([]);
  const [imagesCount, setImagesCount] = useState(0);
  const [jsonData, setJsonData] = useState(null);  // Added this line
  const imageRefs = useRef([]);
  const [highlightedIndex, setHighlightedIndex] = useState(null); // New state for the highlighted index

  useEffect(() => {
    const fetchImages = async () => {
      const response = await fetch('https://api.mgxs.co/mem/list');
      const data = await response.json();

      //const jpgFiles = data.filter(file => file.endsWith('low.jpg'));
      const jpgFiles = data.filter(file => !file.endsWith('low.jpg') && !file.endsWith('.json'));

      setImagesCount(jpgFiles.length);
      setJpgFiles(jpgFiles);

      console.log(`Number of Jpg files: ${jpgFiles.length}`);
    };

    fetchImages();
    const intervalId = setInterval(fetchImages, 10000);  // 10000 ms = 10 seconds

    return () => clearInterval(intervalId); // Clear interval on unmount
  }, []);

  const highlightClosestImage = () => {
    const center = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    let minDistance = Infinity;
    let closestIndex = 0;

    imageRefs.current.forEach((ref, index) => {
      if (ref) {
        const rect = ref.getBoundingClientRect();
        const imageCenter = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
        const dx = center.x - imageCenter.x;
        const dy = center.y - imageCenter.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < minDistance) {
          minDistance = distance;
          closestIndex = index;
        }
      }
    });

    setHighlightedIndex(closestIndex); // Set the highlighted index

    imageRefs.current.forEach((ref) => {
      if (ref) {
        const isHighlighted = ref === imageRefs.current[closestIndex];
        ref.style.transform = isHighlighted ? 'scale(1.4)' : 'scale(1)';
        ref.style.boxShadow = isHighlighted ? '50px 50px 50px black' : '0px 0px 0px black';
        ref.style.zIndex = isHighlighted ? '1' : '0';
        ref.style.transition = 'transform, boxShadow 0.1s ease-in-out';
        ref.style.opacity = isHighlighted ? '1' : '.9';
        ref.style.outline = isHighlighted ? '1rem solid gray' : 'none';
      }
    });
  };

  // New useEffect hook to print the image address whenever the highlighted image changes
useEffect(() => {
  const fetchJSON = async () => {
    if (highlightedIndex !== null && jpgFiles[highlightedIndex]) {
      const jsonURL = jpgFiles[highlightedIndex].replace('.jpg', '.json');
      console.log(jsonURL);

      try {
        const response = await fetch(jsonURL);
        const data = await response.json();
        setJsonData(data);
      } catch (error) {
        console.error('Error fetching JSON file:', error);
      }
    }
  };

  fetchJSON();
}, [highlightedIndex, jpgFiles]);



  useEffect(() => {
    document.body.style.backgroundColor = 'black';
    document.body.style.margin = '0';

    return () => { // Cleanup function
      document.body.style.backgroundColor = null;
    };
  }, []);


  return (
    <>
  <div style={{ backgroundColor: 'gray', color: 'black', width: '20%', padding: '20px', position: 'absolute', top: '0px', left: '0px', zIndex: 2}}>
    Number of MEMs: {imagesCount}
    {jsonData && (
      <>
        <p>Name: {jsonData.name}</p>
        <p>Description: {jsonData.description}</p>
        <h3>Attributes:</h3>
        {jsonData.attributes.map((attr, index) => (
          <div key={index}>
            <strong>{attr.trait_type}:</strong> {JSON.stringify(attr.value)}
          </div>
        ))}
      </>
    )}
  </div>

      <TransformWrapper
        initialScale={2}
        maxScale={10}
        minScale={0.1}
        limitToBounds={0}
        initialPositionX={20}
        initialPositionY={20}
        onInit={highlightClosestImage}
        onPanning={highlightClosestImage}
        onZoom={highlightClosestImage}
      >
        {({ zoomIn, zoomOut, resetTransform, ...rest }) => (
          <React.Fragment>
            <TransformComponent>
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(16, 1fr)`, gap: '20px', width: '100%', height: '100vh', backgroundColor: 'black' }}>
                {jpgFiles.length > 0 &&
                  <img loading="lazy" key={0} src={jpgFiles[0]} alt={`Example 0`} style={{ objectFit: 'cover', width: '100%' }} ref={el => imageRefs.current[0] = el}/>
                }
                {jpgFiles.slice(1).map((src, index) => (
                  <img loading="lazy" key={index + 1} src={src} alt={`Example ${index + 1}`} style={{ objectFit: 'cover', width: '100%' }} ref={el => imageRefs.current[index + 1] = el}/>
                ))}
              </div>
            </TransformComponent>
          </React.Fragment>
        )}
      </TransformWrapper>
    </>
  );
};

export default ZoomPanComponent;