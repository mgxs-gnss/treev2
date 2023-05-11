// src/ZoomPanComponent.js
import React, { useEffect, useState, useRef } from 'react';
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

const ZoomPanComponent = () => {
  const [images, setImages] = useState({ jsonFiles: [], jpgFiles: [] });
    const [jsonCount, setJsonCount] = useState(0);  // New state variable for JSON count
  const [highlightedImageJson, setHighlightedImgJson] = useState(null);
  const imageRefs = useRef([]);


  useEffect(() => {
    const fetchImages = async () => {
      const response = await fetch('https://api.mgxs.co/mem/list');
      const data = await response.json();

      const jsonFiles = data.filter(file => file.endsWith('.json'));
      const jpgFiles = data.filter(file => file.endsWith('low.jpg'));

        const jsonPromises = jsonFiles.map(jsonFile =>
          fetch(jsonFile).then(response => response.json())
        );

      const jsonData = await Promise.all(jsonPromises);
      setImages({ jsonFiles: jsonData, jpgFiles });
      setJsonCount(jsonData.length);

      console.log(`Number of JSON files: ${jsonData[0]}`);  // Added this line
    };

    fetchImages();
    const intervalId = setInterval(fetchImages, 1000);  // 10000 ms = 10 seconds

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

if (closestIndex !== null) {
  const jsonFile = images.jsonFiles[closestIndex];
  if (jsonFile) {
    setHighlightedImgJson(jsonFile);
  } else {
    console.log(`No JSON file for image at index: ${closestIndex}`);
  }
} else {
  console.log(`No closest image found.`);
}

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
        Number of MEMs: {jsonCount}
      </div>
              <div
                style={{ backgroundColor: 'gray', color: 'black', width: '30%', height: '100%', padding: '20px', position: 'absolute', bottom: '0px', right: '0px', zIndex: 2}}

                // Assuming `name` uniquely identifies each JSON file
              >
                  {highlightedImageJson && highlightedImageJson.attributes && highlightedImageJson.attributes.length > 0 ? (
                    highlightedImageJson.attributes.map((attribute, index) => (
                      <p key={index}>{attribute.trait_type}: {attribute.value}</p>
                    ))
                  ) : (
                    <p>No highlighted JSON file</p>
                  )}
                </div>
            )}
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
                {images.jpgFiles.length > 0 &&
                  <img loading="lazy" key={0} src={images.jpgFiles[0]} alt={`Example 0`} style={{ objectFit: 'cover', width: '100%' }} ref={el => imageRefs.current[0] = el}/>
                }
                {images.jpgFiles.slice(1).map((src, index) => (
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
