//Import React & Hooks
import React from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

//Import Formik & Yup
import { useFormik } from "formik";
import * as Yup from "yup";

//Import CSS & styles
import "../TournamentRounds/TournamentRoundsFormStyle.css";

//Import React Query functions
import fetchFootballCategoryById from "../../../../reactquery/chachos/fetchFootballCategoryById";
import updateFootballCategory from "../../../../reactquery/chachos/updateFootballCategory";

//Form schema
const formSchema = Yup.object({
  name: Yup.string().required("Ingresá el nombre de la categoría"),
});

//----------------------------------------
//COMPONENT
//----------------------------------------

const FootballCategoriesUpdate = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: category } = useQuery({
    queryKey: ["football-category", id],
    queryFn: () => fetchFootballCategoryById(id),
  });

  const mutation = useMutation({
    mutationFn: updateFootballCategory,
    onSuccess: () => {
      queryClient.invalidateQueries(["football-categories"]);
      queryClient.invalidateQueries(["football-category", id]);
      navigate("/admin/chachos/football-categories");
    },
    onError: (error) => {
      toast.error(
        error?.response?.data?.message || "Error al editar la categoría"
      );
    },
  });

  //Formik configuration
  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      name: category?.name,
    },
    onSubmit: (values) => {
      mutation.mutate({ id, name: values.name });
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
          <h1 className="ctr-form-title">Editar categoría</h1>
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
            value={formik.values.name ?? ""}
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
          Guardar cambios
        </button>
      </form>
    </div>
  );
};

export default FootballCategoriesUpdate;
