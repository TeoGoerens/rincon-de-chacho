import "./ItemCountStyle.css";

const ItemCount = ({ quantity, handleSustract, handleAdd }) => {
  return (
    <div className="ItemDetail__ItemCount">
      <button disabled={quantity === 1 ? true : false} onClick={handleSustract}>
        -
      </button>
      <p>{quantity}</p>
      <button onClick={handleAdd}>+</button>
    </div>
  );
};

export default ItemCount;
