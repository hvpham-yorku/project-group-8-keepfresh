'use client';
import { use, useEffect } from "react";
import { useState } from "react";

type Item = {
  id: string;
  itemName: string;
  expiryDate: string; //YYYY-MM-DD format
};


export default function UserHome() {
  const [username, setUsername] = useState<string>('');
  const [items, setItems] = useState<Item[]>([
    { id: '1', itemName: 'Milk', expiryDate: '2026-02-14' },
    { id: '2', itemName: 'Lettuce', expiryDate: '2026-02-15' },
    { id: '3', itemName: 'Chicken', expiryDate: '2026-02-16' },
  ]);

    const [error, setError] = useState<string>('');

    useEffect(() => {
      const storedUsername = localStorage.getItem('username');
      if (storedUsername) {
        setUsername(storedUsername);
      }
    }, []);

    const handleAdd = () => {
    const itemName = prompt('Enter Food Name: ');

    if(!itemName|| itemName.trim() === ''){
      setError('Food name is required');
      return;
    }

    const expiryDate = prompt('Enter expiry date (YYYY-MM-DD):');
    if(!expiryDate|| expiryDate.trim() === ''){ 
      setError('Date is required'); //going to revisit to see if i can add a formatter to force date format
      return;
    }

    const newItem: Item = {
      id: Date.now().toString(),
      itemName: itemName.trim(),
      expiryDate: expiryDate.trim(),
    };
    setItems((prev) => [...prev, newItem]);
    setUsername
    setError('');
  }

    const handleDelete = (id: string) => {
      setItems((prev) => prev.filter((item) => item.id !== id));
  };

  return (
  <div className="min-h-screen bg-green-50">
    <div className="px-10 py-12">
      <div className="max-w-3xl space-y-8">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold text-gray-900">
            Welcome back, <span className="font-bold">{username}!</span>
          </h1>
          <p className="text-gray-600">
            Here’s your current fridge!
          </p>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-green-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Your Fridge
            </h2>
            <button
              onClick={handleAdd}
              className="rounded-xl bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
            >
              + Add Food
            </button>
          </div>

          {error && (
            <p className="mb-3 text-sm font-medium text-red-600">
              {error}
            </p>
          )}

          {items.length === 0 ? (
            <p className="text-gray-600 text-sm">
              No items yet. Add your first food item!
            </p>
          ) : (
            <ul className="divide-y divide-gray-200">
              {items.map((item) => (
                <li key={item.id} className="py-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="text-base font-medium text-gray-900">
                        {item.itemName}
                      </p>
                      <p className="text-sm text-gray-600">
                        Expires {item.expiryDate}
                      </p>
                    </div>

                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-sm font-semibold text-gray-500 hover:text-red-600"
                      aria-label={`Delete ${item.itemName}`}
                    >
                      ✕
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  </div>
);

}