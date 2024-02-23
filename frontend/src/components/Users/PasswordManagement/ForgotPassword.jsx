//Import React & Hooks
import React, { useEffect } from "react";

//Import CSS & styles
import "./ForgotPasswordStyles.css";

//Import components
import passwordImageSource from "../../../assets/images/password.png";

//Import Redux
import { useDispatch, useSelector } from "react-redux";
import {
  resetAllUsersErrorsAction,
  resetPasswordTokenGeneratorAction,
} from "../../../redux/slices/users/usersSlices";

//Import Formik & Yup
import { useFormik } from "formik";
import * as Yup from "yup";
const formSchema = Yup.object({
  email: Yup.string().required("Por favor chacal escribi tu email"),
});

//----------------------------------------
//COMPONENT
//----------------------------------------

const ForgotPassword = () => {
  //Dispatch const creation
  const dispatch = useDispatch();

  //Formik configuration
  const formik = useFormik({
    initialValues: {
      email: "",
    },
    onSubmit: (values) => {
      //Dispatch the action
      dispatch(resetPasswordTokenGeneratorAction(values));
    },
    validationSchema: formSchema,
  });

  //Select state from store
  const storeData = useSelector((store) => store.users);
  const { appError, serverError, resetTokenCreated } = storeData;

  //Reset all errors and success messages once the component is render to avoid carry forward from other components
  useEffect(() => {
    dispatch(resetAllUsersErrorsAction());
  }, [dispatch]);

  return (
    <div className="container forgot-password-container">
      <div className="forgot-password-content">
        <span className="forgot-password-brand">
          El Rincón de <span>Chacho</span>
        </span>
        <img src={passwordImageSource} alt="Password" />
        <h4>¿Tenés problemas para ingresar?</h4>
        <h6>
          Introducí tu correo electrónico y te enviaremos un link para que
          vuelvas a entrar en tu cuenta.
        </h6>

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
          {/*  Text corresponding to appError */}
          {appError || serverError ? (
            <h5 className="message-error">{appError}</h5>
          ) : null}
          {/*  Text corresponding to success */}
          {resetTokenCreated ? (
            <h5 className="message-success">{resetTokenCreated.message}</h5>
          ) : null}

          <button type="submit">Enviar</button>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;
