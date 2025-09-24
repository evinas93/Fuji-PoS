import React from 'react';

export default function SimpleTest() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Simple Test Page</h1>
      <p>If you can see this, React is working.</p>
      <p>Environment: {process.env.NODE_ENV}</p>
    </div>
  );
}
