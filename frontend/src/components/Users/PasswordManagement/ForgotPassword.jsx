import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useFormik } from "formik";
import * as Yup from "yup";

import "./ForgotPasswordStyles.css";
import { resetAllUsersErrorsAction, resetPasswordTokenGeneratorAction } from "../../../redux/slices/users/usersSlices";

const formSchema = Yup.object({
  email: Yup.string().email("Ingresá un email válido").required("El email es requerido"),
});

const ForgotPassword = () => {
  const dispatch = useDispatch();

  const formik = useFormik({
    initialValues: { email: "" },
    onSubmit: (values) => dispatch(resetPasswordTokenGeneratorAction(values)),
    validationSchema: formSchema,
  });

  const { appError, serverError, resetTokenCreated } = useSelector((s) => s.users);

  useEffect(() => {
    dispatch(resetAllUsersErrorsAction());
  }, [dispatch]);

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
            <span className="material-symbols-outlined">lock_reset</span>
          </div>

          {/* Header */}
          <h2 className="fp-card-title">¿Problemas para ingresar?</h2>
          <p className="fp-card-subtitle">
            Ingresá tu email y te enviamos un link para recuperar tu acceso al Rincón de Chacho.
          </p>

          {/* Form o estado de éxito */}
          {resetTokenCreated ? (
            <div className="fp-success">
              <span className="material-symbols-outlined fp-success-icon">mark_email_read</span>
              <p className="fp-success-title">Email enviado</p>
              <p className="fp-success-desc">{resetTokenCreated.message}</p>
            </div>
          ) : (
            <form onSubmit={formik.handleSubmit} className="fp-form" noValidate>
              <div className="fp-field">
                <label htmlFor="fp-email" className="fp-label">Email</label>
                <input
                  id="fp-email"
                  type="email"
                  name="email"
                  className={`fp-input${formik.touched.email && formik.errors.email ? " fp-input--error" : ""}`}
                  placeholder="tu@email.com"
                  value={formik.values.email}
                  onChange={formik.handleChange("email")}
                  onBlur={formik.handleBlur("email")}
                  autoComplete="email"
                />
                {formik.touched.email && formik.errors.email && (
                  <span className="fp-field-error">{formik.errors.email}</span>
                )}
              </div>

              {(appError || serverError) && (
                <div className="fp-server-error">{appError || serverError}</div>
              )}

              <button type="submit" className="fp-submit">
                Enviar link de recuperación
              </button>
            </form>
          )}

          <Link to="/" className="fp-back-link">
            <span className="material-symbols-outlined">arrow_back</span>
            Volver al login
          </Link>

        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
