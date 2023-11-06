import React from "react";
import "./ItemStyle.css";
import { Link } from "react-router-dom";
import { numberFormatting } from "../../helpers/helpers";

function Item({ product }) {
  return (
    <div className="itemCard">
      <h4>{product.name}</h4>
      <img src={product.image} alt={product.name} />
      <h5>Price: ${numberFormatting(product.price)}</h5>
      <h6>Stock: {numberFormatting(product.stock)}</h6>
      <p>{product.description}</p>

      <Link className="itemCard__button" to={`/item/${product.id}`}>
        See more
      </Link>
    </div>
  );
}

export default Item;
