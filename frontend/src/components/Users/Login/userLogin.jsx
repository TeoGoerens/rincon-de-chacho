//Import React & Hooks
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

//Import CSS & styles
import "./userLoginStyles.css";

//Import components
import heroImageSource from "../../../assets/photos/chacho-hero.png";

//Import Redux
import { useDispatch, useSelector } from "react-redux";
import { loginUserAction } from "../../../redux/slices/users/usersSlices";

//Import Formik & Yup
import { useFormik } from "formik";
import * as Yup from "yup";
const formSchema = Yup.object({
  email: Yup.string().required("Por favor chacal escribi tu email"),
  password: Yup.string().required("Por favor chacal escribi tu contraseña"),
});

//----------------------------------------
//COMPONENT
//----------------------------------------

const UserLogin = () => {
  //Dispatch const creation
  const dispatch = useDispatch();

  //Navigate const creation
  const navigate = useNavigate();

  //Formik configuration
  const formik = useFormik({
    initialValues: {
      email: "",
      password: "",
    },
    onSubmit: (values) => {
      //Dispatch the action
      dispatch(loginUserAction(values));
    },
    validationSchema: formSchema,
  });

  //Select state from store
  const storeData = useSelector((store) => store.users);
  const { appError, serverError, userAuth } = storeData;

  useEffect(() => {
    if (userAuth) {
      navigate("/home");
    }
  }, [userAuth, navigate]);

  return (
    <div className="container login-page-container">
      <div className="hero-text">
        <h2>Hola chacal,</h2>
        <h1>
          Bienvenido a{" "}
          <span className="hero-text-brand">
            El Rincón de <span>Chacho</span>
          </span>
        </h1>
        <h4>
          El punto de encuentro entre <span>amigos</span>, <span>fútbol</span> y{" "}
          <span>apuestas</span>
        </h4>

        <form onSubmit={formik.handleSubmit}>
          <div>
            <label>Email</label>
            <input
              value={formik.values.email}
              onChange={formik.handleChange("email")}
              onBlur={formik.handleBlur("email")}
              type="email"
              name="email"
              id="email"
            ></input>
          </div>
          <div className="message-error">
            {formik.touched.email && formik.errors.email}
          </div>
          <div>
            <label>Password</label>
            <input
              value={formik.values.password}
              onChange={formik.handleChange("password")}
              onBlur={formik.handleBlur("password")}
              type="password"
              name="password"
            ></input>
          </div>
          <div className="message-error">
            {formik.touched.password && formik.errors.password}
          </div>

          {/*  Text corresponding to appError */}
          {appError || serverError ? (
            <h5 className="message-error">{appError}</h5>
          ) : null}

          <button type="submit">Login</button>
        </form>
      </div>
      <div className="hero-image-container">
        <img src={heroImageSource} alt="Hero" className="hero-image" />
      </div>
    </div>
  );
};

export default UserLogin;
