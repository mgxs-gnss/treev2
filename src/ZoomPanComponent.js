// src/ZoomPanComponent.js
import React, { useEffect, useState, useRef } from 'react';
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

const ZoomPanComponent = () => {
  const [images, setImages] = useState([]);
  const [highlightedImageSrc, setHighlightedImgSrc] = useState(null);
  const [updatePending, setUpdatePending] = useState(false);  // new state variable
  const imageRefs = useRef([]);

  useEffect(() => {
    fetch('https://api.mgxs.co/mem/list')
      .then(response => response.json())
      .then(data => setImages(data));
  }, []);

// eslint-disable-next-line
  const highlightClosestImage = () => {
    const center = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    let minDistance = Infinity;
    let closestImage = null;

    imageRefs.current.forEach((ref, index) => {
      if (ref) {
        const rect = ref.getBoundingClientRect();
        const imageCenter = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
        const dx = center.x - imageCenter.x;
        const dy = center.y - imageCenter.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < minDistance) {
          minDistance = distance;
          closestImage = ref;
          setHighlightedImgSrc(images[index]);
          setUpdatePending(true);  // set updatePending to true

        }
      }
    });
    if (updatePending) {
      setUpdatePending(false);  // reset updatePending
    }

    imageRefs.current.forEach((ref) => {
      if (ref) {
        ref.style.transform = ref === closestImage ? 'scale(1.4)' : 'scale(1)'; // scale up the highlighted image
        ref.style.boxShadow = ref === closestImage ? '50px 50px 50px black' : '0px 0px 0px black';
        ref.style.zIndex = ref === closestImage ? '1' : '0'; // bring the highlighted image to the front
        ref.style.transition = 'transform, boxShadow 0.1s ease-in-out'; // add transition effect
        ref.style.opacity = ref === closestImage ? '1' : '.9';
        //ref.style.maxScale = ref === closestImage ? '100px' : '500px';
       // ref.style.objectFit = ref === closestImage ? 'scale-down' : 'none';
        ref.style.outline = ref === closestImage ? '1rem solid gray' : 'none'; // highlight the closest image
      }
    });
  };
  useEffect(() => {
    document.body.style.backgroundColor = 'black';
     document.body.style.margin = '0';// set the body background color to black
    return () => { // cleanup function
      document.body.style.backgroundColor = null; // reset the body background color when component unmounts
    };
  }, []);
// Add this useEffect hook
useEffect(() => {
  if (images.length > 0) {
    highlightClosestImage();
  }
// eslint-disable-next-line
}, [images, highlightClosestImage]); // Added highlightClosestImage
useEffect(() => {
  if (updatePending) {
    setUpdatePending(false); // reset updatePending, causing a re-render
  }
}, [updatePending]);

  return (
    <>
      {highlightedImageSrc && (
            <div style={{ backgroundColor:'gray', color: 'black',width:'30%', height:'20%', padding: '20px', position: 'absolute', bottom: '0px', right: '0px', zIndex: 2}}>{highlightedImageSrc}</div>
      )}
      <TransformWrapper
        initialScale={2}
        maxScale={10}
        minScale={0.1}
        limitToBounds={0}
        onPanning={highlightClosestImage}
        onZoom={highlightClosestImage}
      >
        {({ zoomIn, zoomOut, resetTransform, ...rest }) => (
          <React.Fragment>
            <TransformComponent>
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(16, 1fr)`, gap: '20px', width: '100%', height: '100vh', backgroundColor: 'black' }}>
                {images.map((src, index) => (
                  <img loading="lazy" key={index} src={src} alt={`Example ${index}`} style={{ objectFit: 'cover', width: '100%' }} ref={el => imageRefs.current[index] = el}/>
                ))}
              </div>
            </TransformComponent>
          </React.Fragment>
        )}
      </TransformWrapper>
    </>
  );
};

export default ZoomPanComponent
