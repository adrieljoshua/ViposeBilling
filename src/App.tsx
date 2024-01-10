import { useEffect, useState } from 'react';
import './App.css';
import { getGroceries } from './firebase-service'; // Import the getGroceries function

interface Item {
  id: number;
  name: string;
  price: number;
}

function App(): JSX.Element {
  const [items, setItems] = useState<Item[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [numberOfProducts, setNumberOfProducts] = useState<number>(0);

  // Modify the addItem function to fetch a random document from the 'Groceries' collection
  const addItem = async () => {
    try {
      const groceriesData = await getGroceries();
      const randomIndex = Math.floor(Math.random() * groceriesData.length);
      const randomGrocery = groceriesData[randomIndex];

      const newItem: Item = {
        id: items.length + 1,
        name: randomGrocery.ProdName,
        price: randomGrocery.Price,
      };

      setItems([...items, newItem]);
      setTotal(total + newItem.price);
      setNumberOfProducts(items.length + 1);
    } catch (error) {
      console.error('Error fetching data from Firestore', error);
    }
  };

  const handleUPI = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
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

  const handleKeyPress = (event: KeyboardEvent) => {
    // Define keyboard shortcuts and corresponding actions
    switch (event.key.toLowerCase()) {
      case 'a':
        addItem();
        break;
      case 'c':
        // Add logic for completing payment
        break;
      case 'r':
        // Read aloud total price
        alert(`Total: ₹${total}`);
        break;
        case 'u':
          handleUPI({
            preventDefault: () => {},
          } as React.MouseEvent<HTMLButtonElement>);
          break;
      // Add more cases for additional shortcuts as needed
      default:
        break;
    }
  };

  useEffect(() => {
    // Attach event listener when the component mounts
    window.addEventListener('keydown', handleKeyPress);

    // Remove event listener when the component unmounts
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [total, items]); // Include any dependencies that should trigger re-creation of the event listener

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
