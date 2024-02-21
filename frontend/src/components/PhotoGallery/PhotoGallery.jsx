//Import React & Hooks
import React from "react";
//import { Link } from "react-router-dom";

//Import CSS & styles
import "./PhotoGalleryStyles.css";

//Import helpers

//Import components
import ImageSlider from "../Layout/ImageSlider/ImageSlider";

//Import Redux

//----------------------------------------
//COMPONENT
//----------------------------------------

const PhotoGallery = () => {
  return (
    <div className="photo-gallery-slider">
      <ImageSlider />
    </div>
  );
};

export default PhotoGallery;
