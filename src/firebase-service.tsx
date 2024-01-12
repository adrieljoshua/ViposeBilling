import { getFirestore, collection, getDocs, addDoc } from 'firebase/firestore';
import { firebaseApp } from './firebase-config';

const db = getFirestore(firebaseApp);

// Define the type for the documents in the 'Groceries' collection
interface Grocery {
  ProdName: string;
  Price: number;
  Stock: number;
}

// Function to get all groceries from Firestore
const getGroceries = async (): Promise<Grocery[]> => {
  const groceriesCollection = collection(db, 'Groceries');
  const snapshot = await getDocs(groceriesCollection);
  
  return snapshot.docs.map(doc => {
    const data = doc.data() as Grocery;
    return { id: doc.id, ...data };
  });
};

// Function to add a bill to Firestore
const addBill = async (billData: any): Promise<void> => {
  try {
    const billsCollection = collection(db, 'bills');
    await addDoc(billsCollection, billData);
  } catch (error) {
    console.error('Error adding bill to Firestore', error);
    throw error;
  }
};

export { getGroceries, addBill };
