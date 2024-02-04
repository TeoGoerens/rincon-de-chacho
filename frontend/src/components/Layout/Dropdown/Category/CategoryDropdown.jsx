//Import React & Hooks
import React, { useEffect } from "react";

//Import CSS & styles
import "./CategoryDropdownStyle.css";

//Import Redux
import { useDispatch, useSelector } from "react-redux";
import { getAllCategoriesAction } from "../../../../redux/slices/football-categories/footballCategoriesSlices";

const CategoryDropdown = ({ field, form }) => {
  //Dispatch const creation
  const dispatch = useDispatch();

  //Select state from store
  const storeData = useSelector((store) => store.categories);
  const categories = storeData.footballCategories?.footballCategories;

  //Dispatch action from store with useEffect()
  useEffect(() => {
    dispatch(getAllCategoriesAction());
  }, [dispatch]);
  return (
    <>
      <label>Categoria</label>
      <select
        value={field.value}
        onChange={(e) => form.setFieldValue("category", e.target.value)}
        onBlur={field.onBlur}
        name="category"
      >
        <option value="" label="Selecciona una categoría" />
        {categories &&
          categories.map((category) => (
            <option key={category._id} value={category._id}>
              {category.name}
            </option>
          ))}
      </select>
      <div>{form.touched["category"] && form.errors["category"]}</div>
    </>
  );
};

export default CategoryDropdown;
