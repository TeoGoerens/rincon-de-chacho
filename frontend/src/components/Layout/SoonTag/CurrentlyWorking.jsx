//Import React & Hooks

//Import helpers

//Import components
import workingImageSource from "../../../assets/images/web-development.png";

//Import CSS & styles
import "./CurrentlyWorkingStyles.css";

//Import Redux

//----------------------------------------
//COMPONENT
//----------------------------------------

const CurrentlyWorking = () => {
  return (
    <div className="container web-development-container">
      <h2>Estamos trabajando para vos, paciencia chacal</h2>
      <img src={workingImageSource} alt="Web Development" />
    </div>
  );
};

export default CurrentlyWorking;
