//Import React & Hooks
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

//Import Formik & Yup
import { useFormik } from "formik";
import * as Yup from "yup";

//Import CSS & styles
import "../TournamentRounds/TournamentRoundsFormStyle.css";

//Import React Query functions
import createFootballCategory from "../../../../reactquery/chachos/createFootballCategory";

//Form schema
const formSchema = Yup.object({
  name: Yup.string().required("Ingresá el nombre de la categoría"),
});

//----------------------------------------
//COMPONENT
//----------------------------------------

const FootballCategoriesCreate = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: createFootballCategory,
    onSuccess: () => {
      queryClient.invalidateQueries(["football-categories"]);
      navigate("/admin/chachos/football-categories");
    },
    onError: (error) => {
      toast.error(
        error?.response?.data?.message || "Error al crear la categoría"
      );
    },
  });

  //Formik configuration
  const formik = useFormik({
    initialValues: {
      name: "",
    },
    onSubmit: (values) => {
      mutation.mutate(values);
    },
    validationSchema: formSchema,
  });

  return (
    <div className="ctr-form-page">
      <div className="ctr-form-header">
        <div className="ctr-form-header-text">
          <div className="ctr-eyebrow">
            <span className="ctr-eyebrow-dot" />
            Chachos
          </div>
          <h1 className="ctr-form-title">Crear categoría</h1>
        </div>
        <Link className="ctr-back-link" to="/admin/chachos/football-categories">
          Volver
        </Link>
      </div>

      {mutation.isError ? (
        <p className="ctr-form-error-banner">
          {mutation.error?.response?.data?.message}
        </p>
      ) : null}

      <form className="ctr-form" onSubmit={formik.handleSubmit}>
        <div className="ctr-field">
          <label>Nombre</label>
          <input
            value={formik.values.name}
            onChange={formik.handleChange("name")}
            onBlur={formik.handleBlur("name")}
            type="text"
            name="name"
          />
          <div className="error-message">
            {formik.touched.name && formik.errors.name}
          </div>
        </div>

        <button className="ctr-submit-btn" type="submit">
          Crear categoría
        </button>
      </form>
    </div>
  );
};

export default FootballCategoriesCreate;
