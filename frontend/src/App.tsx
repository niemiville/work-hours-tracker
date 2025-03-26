import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './components/AuthContext';
import SignIn from './components/SignIn';
import SignUp from './components/SignUp';
import WorkHoursMaintenance from './components/WorkHoursMaintenance';

function App() {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    <Route path="/" element={<SignIn />} />
                    <Route path="/signin" element={<SignIn />} />
                    <Route path="/signup" element={<SignUp />} />
                    <Route path="/workhours" element={<WorkHoursMaintenance />} />
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;
