//Import React & Hooks
import React, { useState } from "react";
//import { Link } from "react-router-dom";

//Import CSS & styles
import "./ImageSliderStyles.css";

//Import helpers

//Import components
import sliderImages from "./ImageSliderSupport";

//Import Redux

//----------------------------------------
//COMPONENT
//----------------------------------------

const ImageSlider = () => {
  const [activeIndex, setActiveIndex] = useState(0);

  const handlePreviousImage = () => {
    setActiveIndex(
      (prevIndex) => (prevIndex - 1 + sliderImages.length) % sliderImages.length
    );
  };

  const handleNextImage = () => {
    setActiveIndex((prevIndex) => (prevIndex + 1) % sliderImages.length);
  };

  return (
    <>
      <div className="img-slider-list">
        {sliderImages.map((image, index) => (
          <div
            key={index}
            className={`img-slider-item ${
              index === activeIndex ? "img-slider-active" : ""
            }`}
          >
            <img src={image.img} alt={image.title} />
            <div className="img-slider-item-content">
              <p>{image.date}</p>
              <h2>{image.title}</h2>
              <p>{image.description}</p>
            </div>
          </div>
        ))}
      </div>

      <button id="prev-img" onClick={handlePreviousImage}>
        {"<"}
      </button>
      <button id="next-img" onClick={handleNextImage}>
        {">"}
      </button>
    </>
  );
};

export default ImageSlider;
