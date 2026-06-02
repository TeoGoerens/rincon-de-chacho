import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useFormik } from "formik";
import * as Yup from "yup";

import "./ForgotPasswordStyles.css";
import { resetAllUsersErrorsAction, resetPasswordAction } from "../../../redux/slices/users/usersSlices";

const formSchema = Yup.object({
  newPassword: Yup.string().required("La nueva contraseña es requerida"),
});

const ResetPassword = () => {
  const resetToken = useParams().resetToken;
  const navigate   = useNavigate();
  const dispatch   = useDispatch();
  const [redirect, setRedirect] = useState(false);

  const formik = useFormik({
    initialValues: { newPassword: "" },
    onSubmit: (values) => dispatch(resetPasswordAction({ resetToken, newPassword: values.newPassword })),
    validationSchema: formSchema,
  });

  const { appError, serverError, passwordReset } = useSelector((s) => s.users);

  useEffect(() => {
    dispatch(resetAllUsersErrorsAction());
  }, [dispatch]);

  useEffect(() => {
    if (passwordReset) {
      const t = setTimeout(() => setRedirect(true), 2000);
      return () => clearTimeout(t);
    }
  }, [passwordReset]);

  useEffect(() => {
    if (redirect) navigate("/");
  }, [redirect, navigate]);

  return (
    <div className="fp">
      <div className="fp-bg-glow" aria-hidden="true" />

      <div className="fp-bottom-bar" aria-hidden="true">
        <span className="fp-bottom-bar-text">amigos · fútbol · apuestas · memoria</span>
        <span className="fp-bottom-bar-year">{new Date().getFullYear()}</span>
      </div>

      <div className="fp-center">
        <div className="fp-card">

          {/* Ícono */}
          <div className="fp-card-icon">
            <span className="material-symbols-outlined">lock_open</span>
          </div>

          {/* Header */}
          <h2 className="fp-card-title">Actualizá tu contraseña</h2>
          <p className="fp-card-subtitle">
            El link expira en 10 minutos. Ingresá tu nueva contraseña para recuperar el acceso al Rincón de Chacho.
          </p>

          {/* Form o estado de éxito */}
          {passwordReset ? (
            <div className="fp-success">
              <span className="material-symbols-outlined fp-success-icon">check_circle</span>
              <p className="fp-success-title">¡Contraseña actualizada!</p>
              <p className="fp-success-desc">{passwordReset.message} Redirigiendo al login...</p>
            </div>
          ) : (
            <form onSubmit={formik.handleSubmit} className="fp-form" noValidate>
              <div className="fp-field">
                <label htmlFor="rsp-password" className="fp-label">Nueva contraseña</label>
                <input
                  id="rsp-password"
                  type="password"
                  name="newPassword"
                  className={`fp-input${formik.touched.newPassword && formik.errors.newPassword ? " fp-input--error" : ""}`}
                  placeholder="••••••••"
                  value={formik.values.newPassword}
                  onChange={formik.handleChange("newPassword")}
                  onBlur={formik.handleBlur("newPassword")}
                  autoComplete="new-password"
                />
                {formik.touched.newPassword && formik.errors.newPassword && (
                  <span className="fp-field-error">{formik.errors.newPassword}</span>
                )}
              </div>

              {(appError || serverError) && (
                <div className="fp-server-error">{appError || serverError}</div>
              )}

              <button type="submit" className="fp-submit">
                Actualizar contraseña
              </button>
            </form>
          )}

          <a href="/" className="fp-back-link">
            <span className="material-symbols-outlined">arrow_back</span>
            Volver al login
          </a>

        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
