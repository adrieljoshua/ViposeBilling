import React, { useState } from 'react';
import './App.css';

interface Item {
  id: number;
  name: string;
  price: number;
}

function App(): JSX.Element {
  const [items, setItems] = useState<Item[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [numberOfProducts, setNumberOfProducts] = useState<number>(0);

  const addItem = () => {
    const newItem: Item = {
      id: items.length + 1,
      name: `Product ${items.length + 1}`,
      // Example Indian grocery prices (in Rupees)
      price: Math.floor(Math.random() * 100) + 50,
    };

    setItems([...items, newItem]);
    setTotal(total + newItem.price);
    setNumberOfProducts(items.length + 1);
  };

  return (
    <>
      <div className="container">
        <button className="add-btn" onClick={addItem}>
          ADD PRODUCT
        </button>
        <div className="items-container">
          <ul>
            {items.map((item) => (
              <li key={item.id}>{`${item.name}: ₹${item.price}`}</li>
            ))}
          </ul>
        </div>
        <div className="payment-container">
          <div>
            <input type="text" placeholder="For Total" value={`₹${total}`} readOnly />
            <input
              type="text"
              placeholder="For No. of Products"
              value={numberOfProducts}
              readOnly
            />
          </div>
          <div>
            <button className="cash-btn">For Cash Payment</button>
            <button className="upi-btn">For UPI Payment</button>
          </div>
          <div>
            <button className="completed-btn">Completed Payment</button>
          </div>
        </div>
      </div>
    </>
  );
}

export default App;
