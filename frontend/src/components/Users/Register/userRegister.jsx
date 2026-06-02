import React, { useEffect } from "react";
import { Navigate, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useFormik } from "formik";
import * as Yup from "yup";

import "./userRegisterStyles.css";
import { registerUserAction, resetAllUsersErrorsAction } from "../../../redux/slices/users/usersSlices";

const formSchema = Yup.object({
  first_name: Yup.string().required("El nombre es requerido"),
  last_name:  Yup.string().required("El apellido es requerido"),
  email:      Yup.string().required("El email es requerido"),
  password:   Yup.string().required("La contraseña es requerida"),
});

const UserRegister = () => {
  const dispatch = useDispatch();

  const formik = useFormik({
    initialValues: { first_name: "", last_name: "", email: "", password: "" },
    onSubmit: (values) => dispatch(registerUserAction(values)),
    validationSchema: formSchema,
  });

  const { appError, serverError, registered } = useSelector((s) => s.users);

  useEffect(() => {
    dispatch(resetAllUsersErrorsAction());
  }, [dispatch]);

  if (registered) return <Navigate to="/" />;

  return (
    <div className="rp">

      {/* Decoraciones */}
      <div className="rp-bg-glow" aria-hidden="true" />
      <div className="rp-vline"   aria-hidden="true" />

      {/* Barra inferior */}
      <div className="rp-bottom-bar" aria-hidden="true">
        <span className="rp-bottom-bar-text">amigos · fútbol · apuestas · memoria</span>
        <span className="rp-bottom-bar-year">{new Date().getFullYear()}</span>
      </div>

      {/* ── Panel izquierdo: marca ── */}
      <div className="rp-brand">
        <p className="rp-eyebrow">
          <span className="rp-eyebrow-dot" />
          Nueva cuenta
        </p>

        <h1 className="rp-title">
          <span className="rp-title-line rp-title-line--1">Unite al</span>
          <span className="rp-title-line rp-title-line--2">Rincón de</span>
          <span className="rp-title-line rp-title-line--3">Chacho</span>
        </h1>

        <p className="rp-tagline">
          El punto de encuentro entre amigos,<br />
          fútbol y apuestas.
        </p>

        <div className="rp-perks">
          {[
            { icon: "check_circle", text: "Acceso a estadísticas del equipo" },
            { icon: "check_circle", text: "Rankings de Podrida en tiempo real" },
            { icon: "check_circle", text: "Prode y crónicas del grupo" },
          ].map(({ icon, text }) => (
            <div key={text} className="rp-perk">
              <span className="material-symbols-outlined rp-perk-icon">{icon}</span>
              <span className="rp-perk-text">{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Panel derecho: formulario ── */}
      <div className="rp-form-wrap">
        <div className="rp-card">

          <div className="rp-card-header">
            <h2 className="rp-card-title">Creá tu cuenta</h2>
            <p className="rp-card-subtitle">Completá los datos para unirte al Rincón de Chacho</p>
          </div>

          <form onSubmit={formik.handleSubmit} className="rp-form" noValidate>

            {/* Nombre + Apellido en fila */}
            <div className="rp-field-row">
              <div className="rp-field">
                <label htmlFor="first_name" className="rp-label">Nombre</label>
                <input
                  id="first_name"
                  type="text"
                  name="first_name"
                  className={`rp-input${formik.touched.first_name && formik.errors.first_name ? " rp-input--error" : ""}`}
                  placeholder="Rafael"
                  value={formik.values.first_name}
                  onChange={formik.handleChange("first_name")}
                  onBlur={formik.handleBlur("first_name")}
                  autoComplete="given-name"
                />
                {formik.touched.first_name && formik.errors.first_name && (
                  <span className="rp-field-error">{formik.errors.first_name}</span>
                )}
              </div>

              <div className="rp-field">
                <label htmlFor="last_name" className="rp-label">Apellido</label>
                <input
                  id="last_name"
                  type="text"
                  name="last_name"
                  className={`rp-input${formik.touched.last_name && formik.errors.last_name ? " rp-input--error" : ""}`}
                  placeholder="Giaccio"
                  value={formik.values.last_name}
                  onChange={formik.handleChange("last_name")}
                  onBlur={formik.handleBlur("last_name")}
                  autoComplete="family-name"
                />
                {formik.touched.last_name && formik.errors.last_name && (
                  <span className="rp-field-error">{formik.errors.last_name}</span>
                )}
              </div>
            </div>

            <div className="rp-field">
              <label htmlFor="reg-email" className="rp-label">Email</label>
              <input
                id="reg-email"
                type="email"
                name="email"
                className={`rp-input${formik.touched.email && formik.errors.email ? " rp-input--error" : ""}`}
                placeholder="tu@email.com"
                value={formik.values.email}
                onChange={formik.handleChange("email")}
                onBlur={formik.handleBlur("email")}
                autoComplete="email"
              />
              {formik.touched.email && formik.errors.email && (
                <span className="rp-field-error">{formik.errors.email}</span>
              )}
            </div>

            <div className="rp-field">
              <label htmlFor="reg-password" className="rp-label">Contraseña</label>
              <input
                id="reg-password"
                type="password"
                name="password"
                className={`rp-input${formik.touched.password && formik.errors.password ? " rp-input--error" : ""}`}
                placeholder="••••••••"
                value={formik.values.password}
                onChange={formik.handleChange("password")}
                onBlur={formik.handleBlur("password")}
                autoComplete="new-password"
              />
              {formik.touched.password && formik.errors.password && (
                <span className="rp-field-error">{formik.errors.password}</span>
              )}
            </div>

            {(appError || serverError) && (
              <div className="rp-server-error">{appError || serverError}</div>
            )}

            <button type="submit" className="rp-submit">
              Crear cuenta
            </button>

            <p className="rp-login-link">
              ¿Ya tenés cuenta?{" "}
              <Link to="/">Ingresá al Rincón de Chacho</Link>
            </p>

          </form>
        </div>
      </div>

    </div>
  );
};

export default UserRegister;
