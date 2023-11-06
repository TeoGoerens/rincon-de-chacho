import React from "react";
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import "./ItemDetailContainerStyle.css";
import ItemDetail from "../ItemDetail/ItemDetail";
import { doc, getDoc } from "firebase/firestore";
import { database } from "../../firebase/firebase";

function ItemDetailContainer() {
  const [product, setProduct] = useState([]);
  const { id } = useParams();

  useEffect(() => {
    const productFromDatabase = doc(database, "products", id);
    getDoc(productFromDatabase).then((resp) => {
      const productObject = { ...resp.data(), id: resp.id };

      setProduct(productObject);
    });
  }, [id]);

  return (
    <div className="ItemDetailContainer">
      {product.length !== 0 && <ItemDetail product={product} />}
    </div>
  );
}

export default ItemDetailContainer;
