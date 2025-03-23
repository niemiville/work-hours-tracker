import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './components/AuthContext';
import SignIn from './components/SignIn';
import TimeEntryList from './components/TimeEntryList';
import SignUp from './components/SignUp';

function App() {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    <Route path="/" element={<SignIn />} />
                    <Route path="/signin" element={<SignIn />} />
                    <Route path="/signup" element={<SignUp />} />
                    <Route path="/workhours" element={<TimeEntryList />} />
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;
