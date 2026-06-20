//Import React & Hooks
import React from "react";
import { useQuery } from "@tanstack/react-query";

//Import CSS & styles
import "./CategoryDropdownStyle.css";

//Import React Query functions
import fetchAllFootballCategories from "../../../../reactquery/chachos/fetchAllFootballCategories";

const CategoryDropdown = ({ field, form }) => {
  const { data: categories } = useQuery({
    queryKey: ["football-categories"],
    queryFn: fetchAllFootballCategories,
  });

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
      <div className="error-message">
        {form.touched["category"] && form.errors["category"]}
      </div>
    </>
  );
};

export default CategoryDropdown;
