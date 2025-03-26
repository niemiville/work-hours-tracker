import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth, AuthProvider } from './components/AuthContext';
import SignIn from './components/SignIn';
import SignUp from './components/SignUp';
import WorkHoursMaintenance from './components/WorkHoursMaintenance';

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactElement }) => {
    const { user } = useAuth();
    if (!user) {
        return <Navigate to="/signin" replace />;
    }
    return children;
};

function App() {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    <Route path="/" element={<Navigate to="/signin" replace />} />
                    <Route path="/signin" element={<SignIn />} />
                    <Route path="/signup" element={<SignUp />} />
                    <Route 
                        path="/workhours" 
                        element={
                            <ProtectedRoute>
                                <WorkHoursMaintenance />
                            </ProtectedRoute>
                        } 
                    />
                    <Route path="*" element={<Navigate to="/signin" replace />} />
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;
