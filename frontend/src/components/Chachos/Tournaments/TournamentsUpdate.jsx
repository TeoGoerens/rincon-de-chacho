//Import React & Hooks
import React, { useEffect } from "react";
import { Navigate, useParams } from "react-router-dom";

//Import Formik & Yup
import { useFormik } from "formik";
import * as Yup from "yup";

//Import components
import CategoryDropdown from "../../Layout/Dropdown/Category/CategoryDropdown";

//Import redux
import { useDispatch, useSelector } from "react-redux";
import {
  getTournamentAction,
  updateTournamentAction,
} from "../../../redux/slices/tournaments/tournamentsSlices";

//Form schema
const formSchema = Yup.object({
  category: Yup.string().required(
    "Por favor chacal elegi la categoria del torneo"
  ),
  name: Yup.string().required("Por favor chacal escribi el nombre del torneo"),
  year: Yup.number().required("Por favor chacal escribi el año del torneo"),
});

//----------------------------------------
//COMPONENT
//----------------------------------------

const TournamentsUpdate = () => {
  const { id } = useParams();

  //Dispatch const creation
  const dispatch = useDispatch();

  //Get category information from database every time the component renders
  useEffect(() => {
    dispatch(getTournamentAction(id));
  }, [dispatch, id]);

  //Select state from store
  const storeData = useSelector((store) => store.tournaments);
  const { appError, serverError } = storeData;
  const name = storeData?.tournament?.tournament?.name;
  const year = storeData?.tournament?.tournament?.year;
  const category = storeData?.tournament?.tournament?.category;

  //Formik configuration
  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      name,
      year,
      category,
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

  //Navigate to index in case there is an updated category
  if (storeData?.isEdited) return <Navigate to="/admin/chachos/tournaments" />;

  return (
    <>
      <h2>Editar torneo</h2>
      {appError || serverError ? <h5>{appError}</h5> : null}

      <form onSubmit={formik.handleSubmit}>
        <label>Nombre</label>
        <input
          value={formik.values.name}
          onChange={formik.handleChange("name")}
          onBlur={formik.handleBlur("name")}
          type="text"
          name="name"
        ></input>
        <div>{formik.touched.name && formik.errors.name}</div>

        <CategoryDropdown
          field={{
            value: formik.values.category,
            onBlur: formik.handleBlur("category"),
          }}
          form={formik}
        />

        <label>Año</label>
        <input
          value={formik.values.year}
          onChange={formik.handleChange("year")}
          onBlur={formik.handleBlur("year")}
          type="text"
          name="year"
        ></input>
        <div>{formik.touched.year && formik.errors.year}</div>

        <button type="submit">Editar torneo</button>
      </form>
    </>
  );
};

export default TournamentsUpdate;
