import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './components/AuthContext';
import Login from './components/Login';
import TimeEntryList from './components/TimeEntryList';
import SignUp from './components/SignUp';

function App() {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    <Route path="/" element={<Login />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<SignUp />} />
                    <Route path="/time-entries" element={<TimeEntryList />} />
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;
