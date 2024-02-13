//Import React & Hooks
import React, { useEffect } from "react";
import { Navigate, useParams } from "react-router-dom";

//Import Formik & Yup
import { useFormik } from "formik";
import * as Yup from "yup";

//Import redux
import { useDispatch, useSelector } from "react-redux";
import {
  getCategoryAction,
  updateCategoryAction,
} from "../../../../redux/slices/football-categories/footballCategoriesSlices";

//Form schema
const formSchema = Yup.object({
  name: Yup.string().required(
    "Por favor chacal escribi el nombre de la categoria"
  ),
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
    <>
      <h2>Editar categoria</h2>
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

        <button type="submit">Editar categoria</button>
      </form>
    </>
  );
};

export default FootballCategoriesUpdate;
