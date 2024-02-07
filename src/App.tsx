import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import { getGroceries, addBill } from './firebase-service';
import { useSpeechSynthesis } from 'react-speech-kit';

interface Item {
  id: number;
  name: string;
  price: number;
  quantity: number;
}

function App(): JSX.Element {
  const [items, setItems] = useState<Item[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [numberOfProducts, setNumberOfProducts] = useState<number>(0);
  const [mobileNumber, setMobileNumber] = useState<string>("");
  const [isUpiPaymentSuccessful, setIsUpiPaymentSuccessful] = useState<boolean>(false);
  const [selectedItemIndex, setSelectedItemIndex] = useState<number | null>(null);
  const itemsContainerRef = useRef<HTMLDivElement | null>(null);
  const [isCashPayment, setIsCashPayment] = useState(false);

  const {speak, cancel} = useSpeechSynthesis();

  useEffect(() => {
    const savedState = localStorage.getItem('billState');
    if (savedState) {
      const { items, total, numberOfProducts, mobileNumber } = JSON.parse(savedState);

      if (items !== undefined && total !== undefined && numberOfProducts !== undefined && mobileNumber !== undefined) {
        setItems(items);
        setTotal(total);
        setNumberOfProducts(numberOfProducts);
        setMobileNumber(mobileNumber);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('billState', JSON.stringify({ items, total, numberOfProducts, mobileNumber }));
  }, [items, total, numberOfProducts, mobileNumber]);

  const addItem = async () => {
    try {
      const groceriesData = await getGroceries();
      const randomIndex = Math.floor(Math.random() * groceriesData.length);
      const randomGrocery = groceriesData[randomIndex];

      const existingItemIndex = items.findIndex(item => item.name === randomGrocery.ProdName);
      if (existingItemIndex !== -1) {
        const updatedItems = [...items];
        updatedItems[existingItemIndex].quantity++;
        setItems(updatedItems);
        setTotal(total + randomGrocery.Price);
        var ItemAddedText = `${randomGrocery.ProdName}'s quantity is incremented to ${updatedItems[existingItemIndex].quantity}`;
        speak({text:ItemAddedText});

      } else {
        const newItem: Item = {
          id: items.length + 1,
          name: randomGrocery.ProdName,
          price: randomGrocery.Price,
          quantity: 1,
        };
        setItems([...items, newItem]);
        setTotal(total + randomGrocery.Price);
        setNumberOfProducts(items.length + 1);
        var ItemAddedText = `one ${newItem.name} added: ${newItem.price} rupees`;
        speak({text:ItemAddedText});
      }

    } catch (error) {
      console.error('Error fetching data from Firestore', error);
    }
  };

  const handleUPI = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();

    if (total === 0) {
      const ZeroItemsText = "Please add items to pay.";
      speak({ text: ZeroItemsText });
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

        //alert the user that payment window is opened
        const UpiPaymentText = "UPI Payment window opened. Scan the QR code to pay";
        speak({ text: UpiPaymentText });

        // Create a Razorpay instance
        var pay = new (window as any).Razorpay({
          ...options,
          handler: function (response: { razorpay_payment_id: any }) {
            alert(response.razorpay_payment_id);
            speak({ text: "UPI Payment Received." });

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
        speak({ text: "Error: UPI Payment Failed" });
      }
    }
  };

const generateBill = async () => {
  try {
    // Check if UPI payment was successful before generating the bill
    if (isUpiPaymentSuccessful || isCashPayment) {
      // Check if mobileNumber is filled
      if (mobileNumber) {
        // Create an object representing the bill
        const billData = {
          mobileNumber,
          totalAmount: total,
          items: items.map((item) => ({ name: item.name, price: item.price, quantity: item.quantity })),
          timestamp: new Date().toISOString(), // Convert timestamp to string
        };

        // Add the generated bill data to Firestore
        await addBill(billData);

        // Generate HTML content for the bill page
        const billHTML = `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Bill Details</title>
          </head>
          <body>
            <h1>Bill Details</h1>
            <p>Customer's Mobile Number: ${billData.mobileNumber}</p>
            <p>Total Amount: ₹${billData.totalAmount}</p>
            <p>Items Purchased:</p>
            <ul>
              ${billData.items.map((item) => `<li>${item.name} - Price: ₹${item.price}, Quantity: ${item.quantity}</li>`).join('')}
            </ul>
            <p>Timestamp: ${billData.timestamp}</p>
          </body>
          </html>
        `;

        // Create a Blob object with the HTML content
        const blob = new Blob([billHTML], { type: 'text/html' });

        // Create a URL for the Blob object
        const url = URL.createObjectURL(blob);

        // Redirect the user to the bill page
        window.location.href = url;
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
        if(isUpiPaymentSuccessful){
          if(mobileNumber){
            const PaymentCompletedText = "Payment completed. Bill is added to Database";
            speak({ text: PaymentCompletedText });
          }else{
            const mobileNumberText = "Please fill in the mobile number";
            speak({ text: mobileNumberText });
          }
        }else{
          const paymentIncompleteText = "Please complete UPI payment";
          speak({ text: paymentIncompleteText });
        }
        break;
      case 'r':
        const totalPriceText = `${numberOfProducts} items are added, Total is ${total} Rupees.`;
        speak({ text: totalPriceText });
        break; 
      case 'u':
        handleUPI({
          preventDefault: () => { },
        } as React.MouseEvent<HTMLButtonElement>);
        break;
      case 'm':
        // Move focus to the mobile number input field
        const mobileNumberInput = document.getElementById("mobileNumber") as HTMLInputElement | null;
        if (mobileNumberInput) {
          mobileNumberInput.focus();
          const MobileNumberFocusedText = "Mobile number field focused.";
          speak({ text: MobileNumberFocusedText });
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
    // Read aloud the name of the currently selected item
    const selectedText = newIndex === items.length
      ? 'End of List'
      : ` ${items[newIndex].name} Selected: ${items[newIndex].price} rupees`;
    speak({ text: selectedText });

  };

  const handleQuantityChange = (index: number, action: 'increment' | 'decrement') => {
    const updatedItems = [...items];
    const selectedItem = updatedItems[index];
  
    if (action === 'increment') {
      selectedItem.quantity++;
      setTotal(total + selectedItem.price);
      const quantityIncrementedText = ` ${selectedItem.name}'s quantity is incremented to ${selectedItem.quantity}`;
      speak({text:quantityIncrementedText, rate: 1.3 });
    } else if (action === 'decrement') {
      if (selectedItem.quantity > 1) {
        selectedItem.quantity--;
        setTotal(total - selectedItem.price);
        const quantityDecrementedText = ` ${selectedItem.name}'s quantity is decremented to ${selectedItem.quantity}`;
        speak({text:quantityDecrementedText, rate: 1.3 });
      } else {
        // If quantity becomes 0, remove the item from the list
        updatedItems.splice(index, 1);
        setTotal(total - selectedItem.price);
        setNumberOfProducts(numberOfProducts - 1);
        const itemRemovedText = `Removed ${selectedItem.name}`;
        speak({text:itemRemovedText});
      }
    }
  
    setItems(updatedItems);
  };  


  useEffect(() => {
    // Attach event listener when the component mounts
    window.addEventListener('keydown', handleKeyPress);

    // Remove event listener when the component unmounts
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [total, items, selectedItemIndex, handleKeyPress]); // Include any dependencies that should trigger re-creation of the event listener

  const handleFocus = (event: React.FocusEvent<HTMLInputElement>) => {
    const focusedElement = event.target;
    const elementName = focusedElement.getAttribute('data-name');
    
    cancel();

    if (elementName) {
        speak({ text: `${elementName}`, rate: 1.3 })
        console.log(`Element with name '${elementName}' is focused!`);
        // You can display the name or perform any other action here
    }
};

useEffect(() => {
    document.addEventListener('focusin', handleFocus as unknown as EventListener);
    
    return () => {
        document.removeEventListener('focusin', handleFocus as unknown as EventListener);
    };
}, [speak, cancel]);

const handleCashPayment = () => {
  setIsCashPayment(true);
  speak({text: 'Cash Collected. Bill is ready to be generated.', rate: 1.5 });
}
  
  
  return (
    <>
      <div className="container">
        <button className="add-btn" data-name='Add Items Button' onClick={addItem}>
          ADD PRODUCT
        </button>
        <div className="items-container" ref={itemsContainerRef}>
          <ul className="list-none">



              <table>
  <thead>
    <tr>
      <th tabIndex={0} data-name="Serial Number">S.No</th>
      <th tabIndex={0} data-name="Item Name">Item Name</th>
      <th tabIndex={0} data-name="Item Price">Item Price</th>
      <th tabIndex={0} data-name="Quantity">Quantity</th>
      <th tabIndex={0} data-name="Total Price">Total Price</th>
      <th></th>
    </tr>
  </thead>
  <tbody>
    {items.map((item, index) => (
      <tr key={item.id} className={selectedItemIndex === index ? 'selected' : ''}>
        <td tabIndex={0} data-name={`Serial Number ${index + 1}`}>{index + 1}</td>
        <td tabIndex={0} data-name={`${item.name}`}>{item.name}</td>
        <td tabIndex={0} data-name={`Item Price ${item.price} rupees`}>₹{item.price}</td>
        <td tabIndex={0} data-name={`Quantity ${item.quantity}`}>{item.quantity}</td>
        <td tabIndex={0} data-name={`Total Price ${item.price * item.quantity}rupees`}>₹{item.price * item.quantity}</td>
        <td>
          <button data-name={`${item.name} quantity decrement`} onClick={() => handleQuantityChange(index, 'decrement')}>-</button>
          <button data-name={`${item.name} quantity increment`} onClick={() => handleQuantityChange(index, 'increment')}>+</button>
        </td>
      </tr>
    ))}
  </tbody>
</table>
              <li tabIndex={0}  className={selectedItemIndex === items.length ? 'selected' : ''} data-name="End of List">End of List</li>


          </ul>
        </div>
        <div className="customer-info-container">
          <div className='customer-info-input'>
            <label htmlFor="mobileNumber" className="input-label">Customer's Mobile Number:</label>
            <input
            data-name='mobile number input'
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
            <input type="text" placeholder="For Total" data-name={`total is ${total} rupees`} value={`₹${total}`} readOnly />
            <input
              type="text"
              data-name={`${numberOfProducts} products added`}
              placeholder="For No. of Products"
              value={numberOfProducts}
              readOnly
            />
          </div>
          <div> 
            <button className="cash-btn" data-name='cash payment' onClick= {handleCashPayment}>For Cash Payment</button>
            <button className="upi-btn" data-name='upi payment' onClick={handleUPI}>
              For UPI Payment
            </button>
          </div>
          <div>
            <button className="completed-btn" data-name='complete payment and generate bill' onClick={generateBill}>
              Complete Payment
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default App;
