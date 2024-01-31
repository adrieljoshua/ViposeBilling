import { useState, useEffect,useRef } from 'react';
import './App.css';
import { getGroceries, addBill } from './firebase-service';

interface Item {
  id: number;
  name: string;
  price: number;
}

function App(): JSX.Element {
  const [items, setItems] = useState<Item[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [numberOfProducts, setNumberOfProducts] = useState<number>(0);
  const [mobileNumber, setMobileNumber] = useState<string>("");
  const [isUpiPaymentSuccessful, setIsUpiPaymentSuccessful] = useState<boolean>(false);
  const [selectedItemIndex, setSelectedItemIndex] = useState<number | null>(null);
// Fetch grocery items on mount and update state with the result
  const itemsContainerRef = useRef<HTMLDivElement | null>(null);

// Load saved state from localStorage on component mount
useEffect(() => {
  const savedState = localStorage.getItem('billState');
  if (savedState) {
    const { items, total, numberOfProducts, mobileNumber } = JSON.parse(savedState);
    
    // Check if values are not undefined or null before updating the state
    if (items !== undefined && total !== undefined && numberOfProducts !== undefined && mobileNumber !== undefined) {
      setItems(items);
      setTotal(total);
      setNumberOfProducts(numberOfProducts);
      setMobileNumber(mobileNumber);
    }
  }
}, []);


// Save the current state to localStorage whenever it changes
useEffect(() => {
  localStorage.setItem('billState', JSON.stringify({ items, total, numberOfProducts, mobileNumber }));
}, [items, total, numberOfProducts, mobileNumber]);



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
          key: "rzp_test_C5gIVKuikWVtvc",
          key_secret: "5QgPlbdUEGRoogpiaPAnFQnT",
          amount: total * 100,
          currency: "INR",
          name: "VIPOSE_Payments",
          description: "for testing purpose",
          handler: function (response: { razorpay_payment_id: any }) {
            alert(response.razorpay_payment_id);
          },
          prefill: {
            name: "Fathima Zulaikha",
            email: "fathima3891@gmail.com",
            contact: "9384843005"
          },
          notes: {
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
        // Check if mobileNumber is filled
        if (mobileNumber) {
          // Create an object representing the bill
          const billData = {
            mobileNumber,
            totalAmount: total,
            items: items.map((item) => ({ name: item.name, price: item.price })),
            timestamp: new Date(),
          };

          // Add the generated bill data to Firestore
          await addBill(billData);

          // Clear the mobileNumber state
          setMobileNumber("");

          // Clear the items and reset the total after completing the payment
          setItems([]);
          setTotal(0);
          setNumberOfProducts(0);

          console.log("Bill added to Firestore successfully");
        } else {
          console.error('Mobile number is required.');
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
        break;
      case 'c':
        generateBill();
        const PaymentCompletedText = "Payment completed. Bill is added to Database";
        break;
      case 'r':
        // Read aloud total price and number of items
        const totalPriceText = `${numberOfProducts} items are added, Total is ${total} Rupees.`;
        break;
      case 'u':
        handleUPI({
          preventDefault: () => { },
        } as React.MouseEvent<HTMLButtonElement>);
        const UpiPaymentText = "UPI Payment window opened.";
        break;
      case 'm':
        // Move focus to the mobile number input field
        const mobileNumberInput = document.getElementById("mobileNumber") as HTMLInputElement | null;
        if (mobileNumberInput) {
          mobileNumberInput.focus();
          const MobileNumberFocusedText = "Mobile number field focused.";
        }
        break;
        
        case 'arrowup':
        event.preventDefault();
        navigateItems('up');
        break;

      case 'arrowdown':
        event.preventDefault();
        navigateItems('down');
        break;
      // Add more cases for additional shortcuts as needed
      default:
        break;
    }
  };
  
   const navigateItems = (direction: 'up' | 'down') => {
    if (items.length === 0) {
      return;
    }

    let newIndex = selectedItemIndex !== null ? selectedItemIndex : -1;

    if (direction === 'up') {
      newIndex = newIndex > 0 ? newIndex - 1 : items.length - 1;
    } else {
      newIndex = newIndex < items.length - 1 ? newIndex + 1 : 0;
    }

    setSelectedItemIndex(newIndex);


  };


  useEffect(() => {
    // Attach event listener when the component mounts
    window.addEventListener('keydown', handleKeyPress);

    // Remove event listener when the component unmounts
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [total, items, selectedItemIndex, handleKeyPress]); // Include any dependencies that should trigger re-creation of the event listener

  return (
    <>
      <div className="container">
        <button className="add-btn" onClick={addItem}>
          ADD PRODUCT
        </button>
        <div className="items-container" ref={itemsContainerRef}>
          <ul className="list-none">
            {items.map((item, index) => (
              <li
                key={item.id}
                className={selectedItemIndex === index ? 'selected' : ''}
              >{`${item.name}: ₹${item.price}`}</li>
            ))}
            <li className={selectedItemIndex === items.length ? 'selected' : ''}>End of List</li>
          </ul>
        </div>
        <div className="customer-info-container">
          <div className='customer-info-input'>
            <label htmlFor="mobileNumber" className="input-label">Customer's Mobile Number:</label>
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
