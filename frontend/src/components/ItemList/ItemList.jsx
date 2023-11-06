import React from "react";
import "./ItemListStyle.css";
import Item from "../Item/Item";

const ItemList = ({ products }) => {
  return (
    <div className="itemList">
      {products.map((product) => (
        <Item key={product.id} product={product} />
      ))}
    </div>
  );
};

export default ItemList;
