//Import React & Hooks
import React, { useEffect } from "react";
import { Navigate, useParams, Link } from "react-router-dom";

//Import Formik & Yup
import { useFormik } from "formik";
import * as Yup from "yup";

//Import CSS & styles
import "../TournamentRounds/TournamentRoundsFormStyle.css";

//Import components
import CategoryDropdown from "../../../Layout/Dropdown/Category/CategoryDropdown";

//Import redux
import { useDispatch, useSelector } from "react-redux";
import {
  getTournamentAction,
  updateTournamentAction,
} from "../../../../redux/slices/tournaments/tournamentsSlices";

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

  //Dispatch const creation
  const dispatch = useDispatch();

  //Get tournament information from database every time the component renders
  useEffect(() => {
    dispatch(getTournamentAction(id));
  }, [dispatch, id]);

  //Select state from store
  const storeData = useSelector((store) => store.tournaments);
  const { appError, serverError } = storeData;
  const name = storeData?.tournament?.tournament?.name;
  const year = storeData?.tournament?.tournament?.year;
  const category = storeData?.tournament?.tournament?.category;
  const categoryId = category?._id ?? category;

  //Formik configuration
  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      name,
      year,
      category: categoryId,
    },
    onSubmit: (values) => {
      //Dispatch the action
      dispatch(
        updateTournamentAction({
          name: values.name,
          year: values.year,
          category: values.category,
          id,
        })
      );
    },
    validationSchema: formSchema,
  });

  //Navigate to index in case there is an updated tournament
  if (storeData?.isEdited) return <Navigate to="/admin/chachos/tournaments" />;

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

      {appError || serverError ? (
        <p className="ctr-form-error-banner">{appError}</p>
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
