import { useState,useEffect } from 'react';
import './App.css';
import { getGroceries, addBill } from './firebase-service'; // Import the getGroceries function
import { useSpeechSynthesis } from 'react-speech-kit';

interface Item {
  id: number;
  name: string;
  price: number;
}

function App(): JSX.Element {
  const [items, setItems] = useState<Item[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [numberOfProducts, setNumberOfProducts] = useState<number>(0);
  const [customerName, setCustomerName] = useState<string>("");
  const [mobileNumber, setMobileNumber] = useState<string>("");
  const [isUpiPaymentSuccessful, setIsUpiPaymentSuccessful] = useState<boolean>(false);

  const {speak} = useSpeechSynthesis();

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

  const handleUPI = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();

    if (total === 0) {
      alert("Please add items to pay");
    } else {
      try {
        // Options for Razorpay
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

        // Create a Razorpay instance
        var pay = new (window as any).Razorpay({
          ...options,
          handler: function (response: { razorpay_payment_id: any }) {
            alert(response.razorpay_payment_id);

            // Set the UPI payment success state
            setIsUpiPaymentSuccessful(true);
          },
        });

        // Open the Razorpay payment form
        pay.open();
      } catch (error) {
        console.error('Error initiating UPI payment', error);
        // Set the UPI payment success state to false on error
        setIsUpiPaymentSuccessful(false);
      }
    }
  };

  const generateBill = async () => {
    try {
      // Check if UPI payment was successful before generating the bill
      if (isUpiPaymentSuccessful) {
        // Check if customerName and mobileNumber are filled
        if (customerName && mobileNumber) {
          // Create an object representing the bill
          const billData = {
            customerName,
            mobileNumber,
            totalAmount: total,
            items: items.map((item) => ({ name: item.name, price: item.price })),
            timestamp: new Date(),
          };
  
          // Add the generated bill data to Firestore
          await addBill(billData);
  
          // Clear the customerName and mobileNumber states
          setCustomerName("");
          setMobileNumber("");
  
          // Clear the items and reset the total after completing the payment
          setItems([]);
          setTotal(0);
          setNumberOfProducts(0);
  
          console.log("Bill added to Firestore successfully");
        }else{
          console.error('Customer details are incomplete. Please enter both customer name and mobile number.');
        }

      } else {
        console.error('UPI payment was not successful. Bill not generated.');
      }
    } catch (error) {
      console.error('Error storing bill data in Firestore', error);
    }
  };
  
  const handleKeyPress = (event: KeyboardEvent) => {
    // Define keyboard shortcuts and corresponding actions
    switch (event.key.toLowerCase()) {
      case 'a':
        addItem();
        const ItemAddedText = "Item Added";
        speak({text:ItemAddedText});
        break;
      case 'c':
        // Add logic for completing payment
        break;
      case 'r':
        
        // Read aloud total price
        const totalPriceText = `Total is ${total} Rupees`;
        speak({text:totalPriceText});
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
  }, [total, items, handleKeyPress]); // Include any dependencies that should trigger re-creation of the event listener


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
        <div className="customer-info-container">
          <div className='customer-info-input'>
            <label htmlFor="customerName" className="input-label">Customer Name:</label>
            <input
              type="text"
              id="customerName"
              placeholder="Enter name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />
          </div>
          <div className='customer-info-input'>
            <label htmlFor="mobileNumber" className="input-label">Mobile Number:</label>
            <input
              type="text"
              id="mobileNumber"
              placeholder="Enter mobile number"
              value={mobileNumber}
              onChange={(e) => setMobileNumber(e.target.value)}
            />
          </div>
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
            <button className="upi-btn" onClick={handleUPI}>
              For UPI Payment
            </button>
          </div>
          <div>
            <button className="completed-btn" onClick={generateBill}>
              Complete Payment
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default App;
