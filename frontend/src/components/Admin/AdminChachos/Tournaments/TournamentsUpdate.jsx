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

//Import components
import CategoryDropdown from "../../../Layout/Dropdown/Category/CategoryDropdown";

//Import React Query functions
import fetchTournamentById from "../../../../reactquery/chachos/fetchTournamentById";
import updateTournament from "../../../../reactquery/chachos/updateTournament";

//Form schema
const formSchema = Yup.object({
  category: Yup.string().required("Seleccioná la categoría del torneo"),
  name: Yup.string().required("Ingresá el nombre del torneo"),
  year: Yup.number().required("Ingresá el año del torneo"),
});

//----------------------------------------
//COMPONENT
//----------------------------------------

const TournamentsUpdate = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: tournament } = useQuery({
    queryKey: ["tournament", id],
    queryFn: () => fetchTournamentById(id),
  });

  const categoryId = tournament?.category?._id ?? tournament?.category;

  const mutation = useMutation({
    mutationFn: updateTournament,
    onSuccess: () => {
      queryClient.invalidateQueries(["tournaments"]);
      queryClient.invalidateQueries(["tournament", id]);
      navigate("/admin/chachos/tournaments");
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || "Error al editar el torneo");
    },
  });

  //Formik configuration
  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      name: tournament?.name,
      year: tournament?.year,
      category: categoryId,
    },
    onSubmit: (values) => {
      mutation.mutate({
        id,
        name: values.name,
        year: values.year,
        category: values.category,
      });
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
          <h1 className="ctr-form-title">Editar torneo</h1>
        </div>
        <Link className="ctr-back-link" to="/admin/chachos/tournaments">
          Volver
        </Link>
      </div>

      {mutation.isError ? (
        <p className="ctr-form-error-banner">
          {mutation.error?.response?.data?.message}
        </p>
      ) : null}

      <form className="ctr-form" onSubmit={formik.handleSubmit}>
        <div className="ctr-form-row">
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

          <div className="ctr-field">
            <label>Año</label>
            <input
              value={formik.values.year ?? ""}
              onChange={formik.handleChange("year")}
              onBlur={formik.handleBlur("year")}
              type="number"
              name="year"
            />
            <div className="error-message">
              {formik.touched.year && formik.errors.year}
            </div>
          </div>
        </div>

        <div className="ctr-field">
          <CategoryDropdown
            field={{
              value: formik.values.category,
              onBlur: formik.handleBlur("category"),
            }}
            form={formik}
          />
        </div>

        <button className="ctr-submit-btn" type="submit">
          Guardar cambios
        </button>
      </form>
    </div>
  );
};

export default TournamentsUpdate;
