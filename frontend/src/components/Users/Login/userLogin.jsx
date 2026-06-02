import React, { useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useFormik } from "formik";
import * as Yup from "yup";

import "./userLoginStyles.css";
import { loginUserAction, resetAllUsersErrorsAction } from "../../../redux/slices/users/usersSlices";
import { IconUsers, IconLayers, IconBars, IconOpenBook } from "../../Layout/Icons/SectionIcons";

const formSchema = Yup.object({
  email:    Yup.string().required("El email es requerido"),
  password: Yup.string().required("La contraseña es requerida"),
});

const SECTIONS = [
  { label: "Chachos",  Icon: IconUsers,    color: "var(--color-chachos)"  },
  { label: "Podrida",  Icon: IconLayers,   color: "var(--color-podrida)"  },
  { label: "Prode",    Icon: IconBars,     color: "var(--color-prode)"    },
  { label: "Crónicas", Icon: IconOpenBook, color: "var(--color-cronicas)" },
];

const UserLogin = () => {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const location  = useLocation();

  const formik = useFormik({
    initialValues: { email: "", password: "" },
    onSubmit: (values) => dispatch(loginUserAction(values)),
    validationSchema: formSchema,
  });

  const { appError, serverError, userAuth } = useSelector((s) => s.users);

  useEffect(() => {
    if (userAuth) {
      const redirectTo = location.state?.from?.pathname || "/home";
      navigate(redirectTo, { replace: true });
    }
  }, [userAuth, navigate, location.state?.from?.pathname]);

  useEffect(() => {
    dispatch(resetAllUsersErrorsAction());
  }, [dispatch]);

  return (
    <div className="lp">

      {/* Glow decorativo */}
      <div className="lp-bg-glow" aria-hidden="true" />
      <div className="lp-vline"   aria-hidden="true" />

      {/* Barra inferior */}
      <div className="lp-bottom-bar" aria-hidden="true">
        <span className="lp-bottom-bar-text">amigos · fútbol · apuestas · memoria</span>
        <span className="lp-bottom-bar-year">{new Date().getFullYear()}</span>
      </div>

      {/* ── Panel izquierdo: marca ── */}
      <div className="lp-brand">
        <p className="lp-eyebrow">
          <span className="lp-eyebrow-dot" />
          Plataforma privada
        </p>

        <h1 className="lp-title">
          <span className="lp-title-line lp-title-line--1">El Rincón</span>
          <span className="lp-title-line lp-title-line--2">de</span>
          <span className="lp-title-line lp-title-line--3">Chacho</span>
        </h1>

        <p className="lp-tagline">
          El punto de encuentro entre amigos,<br />
          fútbol y apuestas.
        </p>

        <div className="lp-sections">
          {SECTIONS.map(({ label, Icon, color }) => (
            <div key={label} className="lp-section-chip">
              <span className="lp-section-chip-ico"><Icon color={color} /></span>
              <span className="lp-section-chip-label">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Panel derecho: formulario ── */}
      <div className="lp-form-wrap">
        <div className="lp-card">

          <div className="lp-card-header">
            <h2 className="lp-card-title">Bienvenido de vuelta</h2>
            <p className="lp-card-subtitle">Ingresá para acceder al Rincón de Chacho</p>
          </div>

          <form onSubmit={formik.handleSubmit} className="lp-form" noValidate>

            <div className="lp-field">
              <label htmlFor="email" className="lp-label">Email</label>
              <input
                id="email"
                type="email"
                name="email"
                className={`lp-input${formik.touched.email && formik.errors.email ? " lp-input--error" : ""}`}
                placeholder="tu@email.com"
                value={formik.values.email}
                onChange={formik.handleChange("email")}
                onBlur={formik.handleBlur("email")}
                autoComplete="email"
              />
              {formik.touched.email && formik.errors.email && (
                <span className="lp-field-error">{formik.errors.email}</span>
              )}
            </div>

            <div className="lp-field">
              <div className="lp-label-row">
                <label htmlFor="password" className="lp-label">Contraseña</label>
                <Link to="/forgot-password" className="lp-forgot">¿Olvidaste tu contraseña?</Link>
              </div>
              <input
                id="password"
                type="password"
                name="password"
                className={`lp-input${formik.touched.password && formik.errors.password ? " lp-input--error" : ""}`}
                placeholder="••••••••"
                value={formik.values.password}
                onChange={formik.handleChange("password")}
                onBlur={formik.handleBlur("password")}
                autoComplete="current-password"
              />
              {formik.touched.password && formik.errors.password && (
                <span className="lp-field-error">{formik.errors.password}</span>
              )}
            </div>

            {(appError || serverError) && (
              <div className="lp-server-error">{appError || serverError}</div>
            )}

            <button type="submit" className="lp-submit">
              Ingresar
            </button>

          </form>
        </div>
      </div>

    </div>
  );
};

export default UserLogin;
