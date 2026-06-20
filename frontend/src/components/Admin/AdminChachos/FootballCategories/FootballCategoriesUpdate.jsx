//Import React & Hooks
import React, { useEffect } from "react";
import { Navigate, useParams, Link } from "react-router-dom";

//Import Formik & Yup
import { useFormik } from "formik";
import * as Yup from "yup";

//Import CSS & styles
import "../TournamentRounds/TournamentRoundsFormStyle.css";

//Import redux
import { useDispatch, useSelector } from "react-redux";
import {
  getCategoryAction,
  updateCategoryAction,
} from "../../../../redux/slices/football-categories/footballCategoriesSlices";

//Form schema
const formSchema = Yup.object({
  name: Yup.string().required("Ingresá el nombre de la categoría"),
});

//----------------------------------------
//COMPONENT
//----------------------------------------

const FootballCategoriesUpdate = () => {
  const { id } = useParams();

  //Dispatch const creation
  const dispatch = useDispatch();

  //Get category information from database every time the component renders
  useEffect(() => {
    dispatch(getCategoryAction(id));
  }, [dispatch, id]);

  //Select state from store
  const storeData = useSelector((store) => store.categories);
  const { appError, serverError } = storeData;
  const categoryName = storeData.footballCategory?.footballCategory?.name;

  //Formik configuration
  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      name: categoryName,
    },
    onSubmit: (values) => {
      //Dispatch the action
      dispatch(updateCategoryAction({ name: values.name, id }));
    },
    validationSchema: formSchema,
  });

  //Navigate to index in case there is an updated category
  if (storeData?.isEdited)
    return <Navigate to="/admin/chachos/football-categories" />;

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

      {appError || serverError ? (
        <p className="ctr-form-error-banner">{appError}</p>
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
