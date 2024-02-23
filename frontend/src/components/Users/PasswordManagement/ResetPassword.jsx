//Import React & Hooks
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

//Import CSS & styles
import "./ResetPasswordStyles.css";

//Import components
import newPasswordImageSource from "../../../assets/images/computer.png";

//Import Redux
import { useDispatch, useSelector } from "react-redux";
import {
  resetAllUsersErrorsAction,
  resetPasswordAction,
} from "../../../redux/slices/users/usersSlices";

//Import Formik & Yup
import { useFormik } from "formik";
import * as Yup from "yup";
const formSchema = Yup.object({
  newPassword: Yup.string().required(
    "Por favor chacal escribi tu nueva contraseña"
  ),
});

//----------------------------------------
//COMPONENT
//----------------------------------------

const ResetPassword = () => {
  //Define token from url
  const resetToken = useParams().resetToken;
  const navigate = useNavigate();
  const [redirect, setRedirect] = useState(false);

  //Dispatch const creation
  const dispatch = useDispatch();

  //Formik configuration
  const formik = useFormik({
    initialValues: {
      resetToken: "",
      newPassword: "",
    },
    onSubmit: (values) => {
      //Dispatch the action
      dispatch(
        resetPasswordAction({ resetToken, newPassword: values.newPassword })
      );
    },
    validationSchema: formSchema,
  });

  //Select state from store
  const storeData = useSelector((store) => store.users);
  const { appError, serverError, passwordReset } = storeData;

  //Reset all errors and success messages once the component is render to avoid carry forward from other components
  useEffect(() => {
    dispatch(resetAllUsersErrorsAction());
  }, [dispatch]);

  useEffect(() => {
    if (passwordReset) {
      // Si hay un passwordReset exitoso, esperar 2 segundos y redirigir
      const timeoutId = setTimeout(() => {
        setRedirect(true);
      }, 2000);

      // Limpiar el timeout al desmontar el componente
      return () => clearTimeout(timeoutId);
    }
  }, [passwordReset]);

  useEffect(() => {
    // Redirigir cuando redirect es true
    if (redirect) {
      navigate("/");
    }
  }, [redirect, navigate]);

  return (
    <div className="container reset-password-container">
      <div className="reset-password-content">
        <span className="reset-password-brand">
          El Rincón de <span>Chacho</span>
        </span>
        <img src={newPasswordImageSource} alt="New Password" />
        <h4>Preparate para actualizar tu contraseña</h4>
        <h6>
          El link que recibiste por correo expirará en menos de 10 minutos.
          Apurate e ingresá debajo tu nueva contraseña
        </h6>

        <form onSubmit={formik.handleSubmit}>
          <div>
            <label>Contraseña</label>
            <input
              value={formik.values.newPassword}
              onChange={formik.handleChange("newPassword")}
              onBlur={formik.handleBlur("newPassword")}
              type="newPassword"
              name="newPassword"
              id="newPassword"
            ></input>
          </div>
          <div className="message-error">
            {formik.touched.newPassword && formik.errors.newPassword}
          </div>
          {/*  Text corresponding to appError */}
          {appError || serverError ? (
            <h5 className="message-error">{appError}</h5>
          ) : null}
          {/*  Text corresponding to success */}
          {passwordReset ? (
            <h5 className="message-success">{passwordReset.message}</h5>
          ) : null}

          <button type="submit">Actualizar contraseña</button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
