import React from 'react';
import { supabase } from '../supabaseClient';

const AuthLogout = () => {
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      // Logout successful, redirect to login
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div>
      <h1>Logout</h1>
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
};

export default AuthLogout;
