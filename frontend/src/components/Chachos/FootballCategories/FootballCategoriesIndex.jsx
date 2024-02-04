//Import React & Hooks
import React, { useEffect } from "react";
import { Link } from "react-router-dom";

//Import CSS & styles
import "./FootballCategoriesStyle.css";

//Import components
import DeleteButton from "../../Layout/Buttons/DeleteButton";
import EditButton from "../../Layout/Buttons/EditButton";
import ViewButton from "../../Layout/Buttons/ViewButton";

//Import Redux
import { useDispatch, useSelector } from "react-redux";
import {
  deleteCategoryAction,
  getAllCategoriesAction,
} from "../../../redux/slices/football-categories/footballCategoriesSlices";

//----------------------------------------
//COMPONENT
//----------------------------------------

const FootballCategoriesIndex = () => {
  //Dispatch const creation
  const dispatch = useDispatch();

  //Select state from store
  const storeData = useSelector((store) => store.categories);
  const footballCategories = storeData.footballCategories?.footballCategories;
  const { appError, serverError, isDeleted } = storeData;

  //Dispatch action from store with useEffect()
  useEffect(() => {
    dispatch(getAllCategoriesAction());
  }, [dispatch, isDeleted]);

  const handleDelete = (id) => {
    dispatch(deleteCategoryAction(id));
  };

  return (
    <>
      <Link to="/admin/chachos/football-categories/create">
        Crear categoria
      </Link>

      {appError || serverError ? (
        <h3>
          {appError} {serverError}
        </h3>
      ) : footballCategories?.length <= 0 ? (
        <h3>No se encontraron categorias en la base de datos</h3>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Categoría</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {footballCategories?.map((category) => (
              <tr key={category.name}>
                <td>
                  <p>{category.name}</p>
                </td>
                <td className="icon-container">
                  <ViewButton
                    to={`/admin/chachos/football-categories/view/${category._id}`}
                  />
                  <EditButton
                    to={`/admin/chachos/football-categories/update/${category._id}`}
                  />
                  <DeleteButton onClick={handleDelete} id={category._id} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
};

export default FootballCategoriesIndex;
