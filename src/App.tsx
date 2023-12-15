import { useState } from 'react';
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

  const handleUPI = (e: { preventDefault: () => void; }) =>{
    e.preventDefault();
    if(total === 0){
      alert("PLease add the items to pay");
    }else{
      var options = {
        key:"rzp_test_C5gIVKuikWVtvc",
        key_secret:"5QgPlbdUEGRoogpiaPAnFQnT",
        amount: total * 100,
        currency:"INR",
        name:"VIPOSE_Payments",
        description:"for testing purpose",
        handler: function(response: { razorpay_payment_id: any; }){
          alert(response.razorpay_payment_id);
        },
        prefill: {
          name: "Fathima Zulaikha",
          email: "fathima3891@gmail.com",
          contact: "9384843005"
        },
        notes:{
          address: "Razorpay Corporate office",
        },
        theme: {
          color: "#3399cc"
        }
      };

      // Use 'any' type for window
      var pay = new (window as any).Razorpay(options);
      pay.open();
      
      
    }
  }

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
            <button className="upi-btn" onClick={handleUPI}>For UPI Payment</button>
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
