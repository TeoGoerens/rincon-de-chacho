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
import "./TeamsFormStyle.css";

//Import React Query functions
import fetchTeamById from "../../../../reactquery/chachos/fetchTeamById";
import updateTeam from "../../../../reactquery/chachos/updateTeam";

//Form schema
const formSchema = Yup.object({
  avatar: Yup.string(),
  name: Yup.string().required("Ingresá el nombre del equipo"),
});

//----------------------------------------
//COMPONENT
//----------------------------------------

const TeamsUpdate = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: team } = useQuery({
    queryKey: ["team", id],
    queryFn: () => fetchTeamById(id),
  });

  const mutation = useMutation({
    mutationFn: updateTeam,
    onSuccess: () => {
      queryClient.invalidateQueries(["teams"]);
      queryClient.invalidateQueries(["team", id]);
      navigate("/admin/chachos/teams");
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || "Error al editar el equipo");
    },
  });

  //Formik configuration
  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      avatar: team?.avatar,
      name: team?.name,
    },
    onSubmit: (values) => {
      mutation.mutate({ id, avatar: values.avatar, name: values.name });
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
          <h1 className="ctr-form-title">Editar equipo</h1>
        </div>
        <Link className="ctr-back-link" to="/admin/chachos/teams">
          Volver
        </Link>
      </div>

      {mutation.isError ? (
        <p className="ctr-form-error-banner">
          {mutation.error?.response?.data?.message}
        </p>
      ) : null}

      <form className="ctr-form" onSubmit={formik.handleSubmit}>
        <div className="tmf-avatar-preview-row">
          {formik.values.avatar ? (
            <img
              src={formik.values.avatar}
              className="tmf-avatar-preview"
              alt="Preview"
            />
          ) : (
            <span className="tmf-avatar-preview tmf-avatar-preview--empty">
              Sin logo
            </span>
          )}

          <div className="ctr-field tmf-avatar-field">
            <label>Avatar (URL)</label>
            <input
              value={formik.values.avatar ?? ""}
              onChange={formik.handleChange("avatar")}
              onBlur={formik.handleBlur("avatar")}
              type="text"
              name="avatar"
            />
            <div className="error-message">
              {formik.touched.avatar && formik.errors.avatar}
            </div>
          </div>
        </div>

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

export default TeamsUpdate;
